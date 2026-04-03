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
  avatarUrl?: string;
  photoPublic?: boolean;
  gender?: string;
}

// ---------------------------------------------------------------------------
// Mock data — companionship-first framing
// ---------------------------------------------------------------------------

export const MOCK_MATCHES: MatchCandidate[] = [
  {
    id: "1", name: "Margaret", age: 71, city: "Phoenix", fitness: "Gentle", gender: "female",
    interests: ["Gardening", "Reading", "Morning walks", "Card games"],
    bio: "Retired schoolteacher who loves being in the garden and sitting with a good book. I moved here after my husband passed and I'm still building my circle of friends.",
    initials: "MW", matchPct: 97, phone: "6025550101",
    whyFit: "You both enjoy quiet mornings, love reading, and are looking for someone who truly listens. Margaret is nearby — coffee catch-ups would be a natural first step.",
    connectionSuggestion: "coffee", distanceLabel: "15 min away · Phoenix",
    avatarUrl: "/avatars/mock-1-margaret.jpg", photoPublic: false,
  },
  {
    id: "2", name: "Robert", age: 68, city: "Scottsdale", fitness: "Active", gender: "male",
    interests: ["Music", "Cooking", "Photography", "Travel stories"],
    bio: "Former engineer who retired three years ago. I play guitar most evenings and love cooking new recipes. I lost my closest friend last year and realized how important real connection is.",
    initials: "RJ", matchPct: 91, phone: "6025550202",
    whyFit: "Robert loves music and swapping stories — just like you. He's a great listener and prefers one-on-one connection. Nearby in Scottsdale, or happy to call first.",
    connectionSuggestion: "phone", distanceLabel: "25 min away · Scottsdale",
    avatarUrl: "/avatars/mock-2-robert.jpg", photoPublic: false,
  },
  {
    id: "3", name: "Dorothy", age: 74, city: "Tucson", fitness: "Gentle", gender: "female",
    interests: ["Watercolor painting", "Birdwatching", "Cooking", "Crosswords"],
    bio: "I moved to Tucson for the sunshine and slower pace. I paint watercolors in the mornings and do crosswords in the evenings. Looking for a pen pal or someone to share stories with.",
    initials: "DL", matchPct: 88, phone: "6025550303",
    whyFit: "Dorothy shares a love of quiet creative hobbies. She's in Tucson — ideal for weekly video calls and heartfelt correspondence.",
    connectionSuggestion: "video", distanceLabel: "~2 hours · Tucson",
    avatarUrl: "/avatars/mock-3-dorothy.jpg", photoPublic: false,
  },
  {
    id: "4", name: "Frank", age: 76, city: "Mesa", fitness: "Moderate", gender: "male",
    interests: ["Chess", "History", "Woodworking", "Walking"],
    bio: "Retired history teacher who loves a good chess match and building things in my workshop. My wife passed two years ago and I've been looking for a friend to talk to over coffee.",
    initials: "FK", matchPct: 85, phone: "6025550404",
    whyFit: "Frank is thoughtful, patient, and loves deep conversation — you'd have plenty to talk about. He's in Mesa, close enough for regular meet-ups.",
    connectionSuggestion: "coffee", distanceLabel: "20 min away · Mesa",
    avatarUrl: "/avatars/mock-4-frank.jpg", photoPublic: false,
  },
  {
    id: "5", name: "Evelyn", age: 65, city: "Chandler", fitness: "Active", gender: "female",
    interests: ["Yoga", "Hiking", "Book clubs", "Volunteering"],
    bio: "Recently retired nurse who stays active with yoga and weekend hikes. I love giving back to the community and I'm looking for a walking buddy or someone to join me at local events.",
    initials: "EH", matchPct: 92, phone: "6025550505",
    whyFit: "Evelyn is warm, energetic, and passionate about community — a perfect activity buddy for walks, yoga, or local events in Chandler.",
    connectionSuggestion: "events", distanceLabel: "18 min away · Chandler",
    avatarUrl: "/avatars/mock-5-evelyn.jpg", photoPublic: false,
  },
  {
    id: "6", name: "Harold", age: 79, city: "Sun City", fitness: "Gentle", gender: "male",
    interests: ["Fishing", "Baseball", "Storytelling", "Classic films"],
    bio: "Spent 35 years as a mail carrier and know every neighborhood in the Valley. I love telling stories and watching old movies. Looking for a friend — maybe someone to watch the game with.",
    initials: "HM", matchPct: 82, phone: "6025550606",
    whyFit: "Harold has decades of stories and a warm laugh. He's gentle, easygoing, and loves the kind of friendship built over shared quiet time.",
    connectionSuggestion: "phone", distanceLabel: "30 min away · Sun City",
    avatarUrl: "/avatars/mock-6-harold.jpg", photoPublic: false,
  },
  {
    id: "7", name: "Patricia", age: 62, city: "Tempe", fitness: "Active", gender: "female",
    interests: ["Swimming", "Cooking", "Volunteering", "Travel"],
    bio: "Just retired from 30 years as an accountant. I swim every morning at the community pool and love cooking for friends. I'm just beginning this next chapter and excited to meet people.",
    initials: "PW", matchPct: 89, phone: "6025550707",
    whyFit: "Patricia is fresh into retirement and brimming with energy. You'd both enjoy shared activities and she's wonderful company at community events.",
    connectionSuggestion: "events", distanceLabel: "22 min away · Tempe",
    avatarUrl: "/avatars/mock-7-patricia.jpg", photoPublic: false,
  },
  {
    id: "8", name: "George", age: 82, city: "Peoria", fitness: "Gentle", gender: "male",
    interests: ["Gardening", "Radio", "Puzzles", "Bird watching"],
    bio: "Former radio technician who still tinkers in the garage. My family is out of state and I'd love someone to share the garden with or just brighten a slow afternoon with conversation.",
    initials: "GC", matchPct: 78, phone: "6025550808",
    whyFit: "George is gentle, curious, and would treasure a consistent friendship. Afternoon visits or a weekly phone call would mean the world to him.",
    connectionSuggestion: "phone", distanceLabel: "35 min away · Peoria",
    avatarUrl: "/avatars/mock-8-george.jpg", photoPublic: false,
  },
  {
    id: "9", name: "Linda", age: 69, city: "Gilbert", fitness: "Moderate", gender: "female",
    interests: ["Dancing", "Quilting", "Coffee chats", "Grandchildren"],
    bio: "Widowed three years ago after 42 years of marriage. I stay busy quilting and take a dance class on Thursdays. I'm ready to laugh again and make a real friend.",
    initials: "LR", matchPct: 94, phone: "6025550909",
    whyFit: "Linda is warm, funny, and ready for genuine friendship. She loves coffee chats and shared creative time — you'd be wonderful together.",
    connectionSuggestion: "coffee", distanceLabel: "28 min away · Gilbert",
    avatarUrl: "/avatars/mock-9-linda.jpg", photoPublic: false,
  },
  {
    id: "10", name: "James", age: 73, city: "Glendale", fitness: "Moderate", gender: "male",
    interests: ["Cycling", "Reading", "Baseball", "DIY home projects"],
    bio: "Retired firefighter now enjoying a slower pace. I cycle on the canal trails on weekends and love fixing things around the house. Looking for a buddy to share adventures with.",
    initials: "JT", matchPct: 86, phone: "6025551010",
    whyFit: "James is dependable, active, and great company. You'd enjoy weekend rides or just sitting on the porch sharing a good story.",
    connectionSuggestion: "events", distanceLabel: "32 min away · Glendale",
    avatarUrl: "/avatars/mock-10-james.jpg", photoPublic: false,
  },
  {
    id: "11", name: "Betty", age: 77, city: "Fountain Hills", fitness: "Gentle", gender: "female",
    interests: ["Painting", "Poetry", "Scripture", "Tea time"],
    bio: "A retired librarian who paints watercolors and writes poetry. I believe every person has a beautiful story to tell. Seeking a quiet, thoughtful companion to share tea and conversation.",
    initials: "BN", matchPct: 83, phone: "6025551111",
    whyFit: "Betty is thoughtful, creative and deeply empathetic. Your conversations would be warm, meaningful, and something to look forward to each week.",
    connectionSuggestion: "phone", distanceLabel: "40 min away · Fountain Hills",
    avatarUrl: "/avatars/mock-11-betty.jpg", photoPublic: false,
  },
  {
    id: "12", name: "Carlos", age: 66, city: "Scottsdale", fitness: "Active", gender: "male",
    interests: ["Golf", "Cooking", "Family history", "Walking"],
    bio: "Originally from New Mexico, retired to Scottsdale five years ago. I love golf, cooking traditional recipes, and learning about family histories. My partner passed and I'm rebuilding life.",
    initials: "CM", matchPct: 87, phone: "6025551212",
    whyFit: "Carlos is warm, curious, and adventurous. He'd love a golf buddy or someone to swap recipes with — and he's a wonderful storyteller.",
    connectionSuggestion: "coffee", distanceLabel: "26 min away · Scottsdale",
    avatarUrl: "/avatars/mock-12-carlos.jpg", photoPublic: false,
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
