/**
 * POST /api/ai/match/embed
 *
 * Generates a semantic embedding for the authenticated user's profile
 * using sentence-transformers/all-MiniLM-L6-v2 (384 dims) and stores
 * it in the `profiles.embedding` column for future similarity lookups.
 *
 * Call this once after onboarding completes, and again after profile edits.
 */

import { createClient } from "@/lib/supabase/server";
import { buildProfileText, generateEmbedding } from "@/lib/ai/matching";

export const maxDuration = 30;

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  // Fetch the user's profile with their interests joined
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*, user_interests(interests(name))")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    return Response.json(
      { error: "Profile not found. Complete onboarding first." },
      { status: 404 }
    );
  }

  // Build a rich text representation of the profile for embedding
  const interests: string[] =
    (profile.user_interests as Array<{ interests: { name: string } }>)?.map(
      (ui) => ui.interests.name
    ) ?? [];

  const profileText = buildProfileText({
    full_name: profile.full_name,
    age: profile.age,
    city: profile.city,
    fitness_level: profile.fitness_level,
    health_goals: profile.health_goals,
    bio: profile.bio,
    interests,
  });

  // Generate embedding via HuggingFace Inference API
  let embedding: number[];
  try {
    embedding = await generateEmbedding(profileText);
  } catch (err) {
    console.error("[match/embed] Embedding generation failed:", err);
    return Response.json(
      { error: "Failed to generate embedding. Check GOOGLE_GENERATIVE_AI_API_KEY." },
      { status: 500 }
    );
  }

  // Store the embedding in Supabase
  const { error: updateError } = await supabase
    .from("profiles")
    .update({ embedding, embedding_updated_at: new Date().toISOString() })
    .eq("id", user.id);

  if (updateError) {
    console.error("[match/embed] Failed to store embedding:", updateError);
    return Response.json({ error: "Failed to save embedding." }, { status: 500 });
  }

  return Response.json({ success: true, dims: embedding.length });
}
