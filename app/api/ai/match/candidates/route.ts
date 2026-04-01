/**
 * GET /api/ai/match/candidates
 *
 * Returns the top semantically matched profiles for the authenticated user.
 *
 * Algorithm:
 *  1. Load the current user's profile + stored embedding from Supabase.
 *  2. If embedding is missing, generate one on-the-fly and store it.
 *  3. Load all other completed profiles with their stored embeddings.
 *  4. For candidates missing embeddings, generate them (and store for next time).
 *  5. Compute cosine similarity between the user and each candidate.
 *  6. Return top 10 matches ranked by similarity.
 *
 * Fallback: if there are fewer than 1 real candidate in Supabase,
 * the mock profiles are returned so the UI is never empty.
 */

import { createClient } from "@/lib/supabase/server";
import {
  buildProfileText,
  generateEmbedding,
  cosineSimilarity,
  similarityToMatchPct,
  profileInitials,
  MOCK_MATCHES,
  type MatchCandidate,
} from "@/lib/ai/matching";

export const maxDuration = 60;

type SupabaseProfile = {
  id: string;
  full_name: string | null;
  age: number | null;
  city: string | null;
  fitness_level: string | null;
  health_goals: string[] | null;
  bio: string | null;
  embedding: number[] | null;
  user_interests: Array<{ interests: { name: string } }>;
};

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  // ── 1. Load current user's profile ──────────────────────────────────────
  const { data: me, error: meError } = await supabase
    .from("profiles")
    .select("*, user_interests(interests(name))")
    .eq("id", user.id)
    .single();

  if (meError || !me) {
    // No profile yet — return mock data so the UI works during dev
    return Response.json({ matches: MOCK_MATCHES, source: "mock" });
  }

  // ── 2. Ensure current user has an embedding ──────────────────────────────
  let myEmbedding: number[] = me.embedding ?? [];

  if (myEmbedding.length === 0) {
    const interests =
      (me.user_interests as SupabaseProfile["user_interests"])?.map(
        (ui) => ui.interests.name
      ) ?? [];

    try {
      myEmbedding = await generateEmbedding(
        buildProfileText({ ...me, interests })
      );
      await supabase
        .from("profiles")
        .update({ embedding: myEmbedding, embedding_updated_at: new Date().toISOString() })
        .eq("id", user.id);
    } catch (err) {
      console.error("[match/candidates] Failed to generate user embedding:", err);
      return Response.json({ matches: MOCK_MATCHES, source: "mock_embedding_error" });
    }
  }

  // ── 3. Load other completed profiles ────────────────────────────────────
  const { data: candidates, error: candError } = await supabase
    .from("profiles")
    .select("*, user_interests(interests(name))")
    .neq("id", user.id)
    .eq("onboarding_completed", true);

  if (candError || !candidates || candidates.length === 0) {
    return Response.json({ matches: MOCK_MATCHES, source: "mock_no_candidates" });
  }

  // ── 4 & 5. Compute similarity for each candidate ─────────────────────────
  const ranked: MatchCandidate[] = [];

  for (const candidate of candidates as SupabaseProfile[]) {
    let candEmbedding = candidate.embedding ?? [];

    // Generate + cache embedding if missing
    if (candEmbedding.length === 0) {
      const interests =
        candidate.user_interests?.map((ui) => ui.interests.name) ?? [];

      try {
        candEmbedding = await generateEmbedding(
          buildProfileText({ ...candidate, interests })
        );
        await supabase
          .from("profiles")
          .update({ embedding: candEmbedding, embedding_updated_at: new Date().toISOString() })
          .eq("id", candidate.id);
      } catch {
        // Skip this candidate if embedding generation fails
        continue;
      }
    }

    const similarity = cosineSimilarity(myEmbedding, candEmbedding);
    const interests =
      candidate.user_interests?.map((ui) => ui.interests.name) ?? [];

    ranked.push({
      id: candidate.id,
      name: candidate.full_name ?? "Member",
      age: candidate.age ?? 0,
      city: candidate.city ?? "Arizona",
      fitness: candidate.fitness_level ?? "Beginner",
      interests,
      bio: candidate.bio ?? "",
      initials: profileInitials(candidate.full_name),
      matchPct: similarityToMatchPct(similarity),
    });
  }

  // ── 6. Sort descending by match percentage ───────────────────────────────
  ranked.sort((a, b) => b.matchPct - a.matchPct);

  const matches = ranked.length > 0 ? ranked.slice(0, 10) : MOCK_MATCHES;
  const source = ranked.length > 0 ? "real" : "mock_fallback";

  return Response.json({ matches, source });
}
