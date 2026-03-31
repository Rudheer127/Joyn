/**
 * AI Matching Utilities
 *
 * Embedding model: sentence-transformers/all-MiniLM-L6-v2 (384-dimensional vectors)
 * Match reason model: Groq llama-3.1-8b-instant
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ProfileForEmbedding {
  full_name?: string | null;
  age?: number | null;
  city?: string | null;
  fitness_level?: string | null;
  health_goals?: string[] | null;
  bio?: string | null;
  interests?: string[];
}

export interface MatchCandidate {
  id: string;
  name: string;
  age: number;
  city: string;
  fitness: string;
  interests: string[];
  bio: string;
  initials: string;
  matchPct: number;
  phone?: string;
  /** Plain-language explanation of why this pair is a great fit */
  whyFit?: string;
  /** Suggested best first connection mode */
  connectionSuggestion?: "coffee" | "phone" | "video" | "events" | "message";
  /** Distance context label */
  distanceLabel?: string;
}

// ---------------------------------------------------------------------------
// Mock data — companionship-first framing
// ---------------------------------------------------------------------------

export const MOCK_MATCHES: MatchCandidate[] = [
  {
    id: "1",
    name: "Margaret",
    age: 71,
    city: "Phoenix",
    fitness: "Gentle",
    interests: ["Gardening", "Reading", "Morning walks", "Card games"],
    bio: "Retired schoolteacher who loves being in the garden and sitting with a good book. I moved here after my husband passed and I'm still building my circle of friends. I love long conversations over tea.",
    initials: "MW",
    matchPct: 97,
    phone: "6025550101",
    whyFit: "You both enjoy quiet mornings, love reading, and are looking for someone who truly listens. Margaret is in Phoenix — a short drive away — making coffee catch-ups a natural first step.",
    connectionSuggestion: "coffee",
    distanceLabel: "15 min away · Phoenix",
  },
  {
    id: "2",
    name: "Robert",
    age: 68,
    city: "Scottsdale",
    fitness: "Active",
    interests: ["Music", "Cooking", "Photography", "Travel stories"],
    bio: "Former engineer who retired three years ago. I play guitar most evenings and love cooking new recipes on weekends. I lost my closest friend last year and realized how important real connection is.",
    initials: "RJ",
    matchPct: 91,
    phone: "6025550202",
    whyFit: "Robert loves music and swapping stories — just like you. He's a great listener and prefers one-on-one connection over group settings. His Scottsdale location is nearby, but he's also happy to connect by phone first.",
    connectionSuggestion: "phone",
    distanceLabel: "25 min away · Scottsdale",
  },
  {
    id: "3",
    name: "Dorothy",
    age: 74,
    city: "Tucson",
    fitness: "Gentle",
    interests: ["Watercolor painting", "Birdwatching", "Cooking", "Crosswords"],
    bio: "I moved to Tucson for the sunshine and slower pace. I paint watercolors in the mornings and do crosswords in the evenings. I'm looking for a pen pal or someone to share stories with — distance doesn't matter to me.",
    initials: "DL",
    matchPct: 88,
    phone: "6025550303",
    whyFit: "Dorothy is a wonderful match for regular calls and virtual catch-ups. You share a love of quiet creative hobbies and both appreciate meaningful conversation over small talk. She's in Tucson — ideal for weekly video calls.",
    connectionSuggestion: "video",
    distanceLabel: "~2 hours · Tucson",
  },
];

export const MOCK_PROFILES: Record<string, MatchCandidate> = Object.fromEntries(
  MOCK_MATCHES.map((m) => [m.id, m])
);

// ---------------------------------------------------------------------------
// Profile text builder
// ---------------------------------------------------------------------------

export function buildProfileText(profile: ProfileForEmbedding): string {
  const parts: string[] = [];

  if (profile.full_name) parts.push(`${profile.full_name}`);
  if (profile.age) parts.push(`${profile.age} years old`);
  if (profile.city) parts.push(`from ${profile.city}, Arizona`);
  if (profile.interests?.length) parts.push(`enjoys ${profile.interests.join(", ")}`);
  if (profile.health_goals?.length) parts.push(`looking for: ${profile.health_goals.join(", ")}`);
  if (profile.bio) parts.push(profile.bio);

  return parts.join(". ");
}

// ---------------------------------------------------------------------------
// Embedding generation via Hugging Face
// ---------------------------------------------------------------------------

export async function generateEmbedding(text: string): Promise<number[]> {
  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    console.warn("[matching] No GROQ_API_KEY — using fallback hash embedding");
    return hashEmbedding(text, 384);
  }

  try {
    const response = await fetch(
      "https://api-inference.huggingface.co/models/sentence-transformers/all-MiniLM-L6-v2",
      {
        method: "POST",
        headers: {
          ...(process.env.HUGGINGFACE_API_KEY
            ? { Authorization: `Bearer ${process.env.HUGGINGFACE_API_KEY}` }
            : {}),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ inputs: text, options: { wait_for_model: true } }),
      }
    );

    if (response.ok) {
      const data: number[] | number[][] = await response.json();
      return Array.isArray(data[0]) ? (data[0] as number[]) : (data as number[]);
    }
  } catch {
    // fall through
  }

  console.warn("[matching] Embedding API unavailable — using fallback hash embedding");
  return hashEmbedding(text, 384);
}

function hashEmbedding(text: string, dims: number): number[] {
  const vec = new Float64Array(dims);
  const words = text.toLowerCase().split(/\W+/);
  for (const word of words) {
    for (let i = 0; i < word.length; i++) {
      vec[(word.charCodeAt(i) * 31 + i * 17) % dims] += 1;
    }
  }
  const mag = Math.sqrt(vec.reduce((s, v) => s + v * v, 0)) || 1;
  return Array.from(vec).map((v) => v / mag);
}

// ---------------------------------------------------------------------------
// Cosine similarity
// ---------------------------------------------------------------------------

export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length === 0) return 0;

  let dot = 0;
  let magA = 0;
  let magB = 0;

  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }

  const denom = Math.sqrt(magA) * Math.sqrt(magB);
  return denom === 0 ? 0 : dot / denom;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export function profileInitials(fullName: string | null | undefined): string {
  if (!fullName) return "?";
  return fullName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function similarityToMatchPct(similarity: number): number {
  const scaled = Math.round(60 + similarity * 39);
  return Math.min(99, Math.max(60, scaled));
}

/** Return a human-readable label for the suggested connection type */
export function connectionLabel(suggestion: MatchCandidate["connectionSuggestion"]): string {
  switch (suggestion) {
    case "coffee": return "☕ Best for coffee catch-ups";
    case "phone":  return "📞 Great for regular phone calls";
    case "video":  return "📹 Ideal for weekly video chats";
    case "events": return "📍 Perfect for local events";
    default:       return "💬 Start with a message";
  }
}
