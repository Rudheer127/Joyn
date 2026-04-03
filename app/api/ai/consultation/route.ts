export const maxDuration = 30;

import { groq } from "@ai-sdk/groq";
import { streamText, convertToModelMessages, tool } from "ai";
import type { UIMessage } from "ai";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { z } from "zod";

const CONSULTATION_MODEL = groq("llama-3.3-70b-versatile");

// ─── Real community events embedded in the prompt ─────────────────────────────
const ARIZONA_EVENTS = `
REAL COMMUNITY EVENTS HAPPENING IN ARIZONA THIS MONTH:
- "Chandler Senior Center Yoga" — Thursday April 3, 9:00 AM, Chandler Community Center
- "Desert Botanical Garden Morning Walk" — Monday April 7, 7:30 AM, Phoenix (easy 1.5-mile walk)
- "Sun City Card & Board Games" — Wednesday April 9, 1:00 PM, Sun City Recreation Center
- "Tempe Town Lake Walk & Coffee" — Saturday April 12, 8:00 AM, Tempe Town Lake (walk + coffee after)
- "Mesa Senior Nutrition & Health Talk" — Tuesday April 15, 11:00 AM, Mesa Senior Center (free)
- "Widows & Widowers Support Circle" — Monday April 21, 2:00 PM, Mesa Senior Center
- "Morning Coffee & Conversation" — Wednesday April 23, 9:00 AM, Old Town Coffee House, Scottsdale
- "Gilbert Community Potluck Dinner" — Saturday April 19, 5:30 PM, Gilbert Heritage District (free, live music)
- "Volunteer: Read to Kids at Library" — Saturday April 26, 10:00 AM, Phoenix Public Library
- "Intergenerational Cooking Class" — Tuesday April 29, 5:30 PM, Tempe Community Center

When the user expresses interest in events or activities, pick 2-3 from the list above that best match their interests and mention them warmly and naturally in your reply. Do NOT output any XML tags, tool calls, or code. Just speak naturally.
`;

function buildSystemPrompt(userName: string): string {
  return `You are Jo, a friendly and welcoming guide for Joyn.
Joyn is a companionship platform for older adults (60+) in Arizona.
The user's name is ${userName}.

YOUR ROLE:
You are having a warm, upbeat getting-to-know-you chat. Your goal is to find out what kind of companionship or connection ${userName} is looking for — whether that is making new friends, having someone to walk or chat with, joining local events, or staying in touch with people near or far.

CRITICAL TONE RULE:
DO NOT assume the user is sad, lonely, or going through a hard time. Many people join Joyn simply because they want more friends, want to be active, or are excited about a new chapter. Match the user's energy. If they are cheerful, be cheerful. If they share something difficult, then respond with warmth and empathy. Let THEM set the emotional tone — never project sadness or consolation onto them.

STRICT RULES:
1. Be friendly, warm, and light — like chatting with a kind neighbour. Use simple language (Grade 6 level) and short sentences.
2. Ask ONE question at a time. Never overwhelm. Never use bullet points or numbered lists.
3. Separate distinct thoughts with a BLANK LINE so your message is easy to read.
4. Once you understand their story and goals, call the 'updateSupabaseProfile' tool. TOOL CALL RULE: When calling any tool, output ZERO text — no "one moment", no "let me save that", no "just a second", nothing at all. Call the tool and immediately continue the conversation naturally in your next turn.
5. When events feel relevant, mention 2-3 specific ones warmly — NO XML tags, NO code, just plain text.
6. Be accepting, calm, and positive about whatever brings them here.
7. If the user mentions extreme distress, gently recommend 988.
8. NEVER output XML, angle brackets, tool names, or code in your reply.
9. NEVER say "one moment", "just a moment", "let me check", or any filler phrase. Respond directly.

YOUR FIRST MESSAGE: "Hi ${userName}! 🌻 Welcome to Joyn — I'm Jo. I'd love to hear a little about you. What brings you here today?"

${ARIZONA_EVENTS}
`;
}

export async function POST(req: NextRequest) {
  try {
    const rl = checkRateLimit(getClientIp(req));
    if (!rl.allowed) {
      return NextResponse.json({ error: rl.reason }, {
        status: 429,
        headers: { "Retry-After": String(rl.retryAfter) },
      });
    }

    const isDemoMode = req.cookies.get("joyn_demo_mode")?.value === "true";

    let userName = "Friend";
    let userCity = "Phoenix";

    if (isDemoMode) {
      userName = "Margaret";
      userCity = "Scottsdale";
    } else {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        return new Response("Unauthorized", { status: 401 });
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, city")
        .eq("id", user.id)
        .single();

      userName = profile?.full_name?.split(" ")[0] || "Friend";
      userCity = profile?.city || "Phoenix";
    }

    const body = await req.json();
    const { messages }: { messages: UIMessage[] } = body;

    const result = streamText({
      model: CONSULTATION_MODEL,
      system: buildSystemPrompt(userName) + `\nThe user's city is: ${userCity}. Prioritize events near ${userCity} when suggesting.`,
      messages: await convertToModelMessages(messages),
      tools: {
        updateSupabaseProfile: tool({
          description: "Saves the user's loneliness reason and preferred connection style to their Joyn profile.",
          inputSchema: z.object({
            lonelinessReason: z.string().describe("A brief summary of why the user feels lonely or why they joined."),
            preferredConnection: z.string().describe("What the user wants: e.g. 'phone calls', 'coffee meetups', 'walking buddy'.")
          }),
          execute: async ({ lonelinessReason, preferredConnection }) => {
            if (isDemoMode) return "Profile saved (demo).";
            const supabase = await createClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return "Could not save — no session.";
            const { error } = await supabase.from("profiles").update({
              health_goals: [lonelinessReason],
              connection_preference: preferredConnection,
              onboarding_completed: true,
            }).eq("id", user.id);
            if (error) console.error("Failed to update profile", error);
            return "Profile saved successfully.";
          }
        }),
      }
    });

    return result.toUIMessageStreamResponse();
  } catch (err) {
    console.error("[/api/ai/consultation] Error:", err);
    return NextResponse.json(
      { error: "AI service unavailable. Please try again in a moment." },
      { status: 503 }
    );
  }
}
