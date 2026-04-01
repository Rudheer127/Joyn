export const maxDuration = 30;

import { groq } from "@ai-sdk/groq";
import { streamText, convertToModelMessages, tool } from "ai";
import type { UIMessage } from "ai";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { z } from "zod";

const CONSULTATION_MODEL = groq("llama-3.1-8b-instant");

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
  return `You are Jo, a warm, empathetic listener and guide for Joyn.
Joyn is a companionship platform for older adults (60+) in Arizona.
The user's name is ${userName}.

YOUR ROLE:
You are having an initial consultation with the user. Your main goal is to understand how they are feeling in terms of loneliness, social isolation, and what kind of companionship they are looking for (e.g., someone to talk to on the phone, coffee meetups, walking buddies).

STRICT RULES:
1. Speak with deep empathy and warmth. Use simple language (Grade 6 level) and short sentences.
2. Ask ONE question at a time. Never overwhelm. Never use bullet points or numbered lists; weave everything gently into conversation.
3. Once you understand their story and goals, call the 'updateSupabaseProfile' tool silently to save their preferences.
4. When events feel relevant, mention 2-3 specific ones from the list below — warmly and naturally, NO XML tags, NO code, just plain conversational text.
5. This platform is about friendship and combating loneliness through any shared interest — fitness, hobbies, errands, anything. Be accepting, calm, and sweet.
6. If the user mentions extreme distress, gently recommend 988.
7. NEVER output XML, angle brackets, tool names, or code in your reply. Just speak naturally.

YOUR FIRST MESSAGE: "Hi ${userName}, I'm so glad you're here. 🌻 Can you tell me a little bit about what brings you to Joyn today?"

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

    const userName = profile?.full_name?.split(" ")[0] || "Friend";
    const userCity = profile?.city || "Phoenix";

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
            const { error } = await supabase.from("profiles").update({
              health_goals: [lonelinessReason],
              connection_preference: preferredConnection,
              onboarding_completed: true,
            }).eq("id", user.id);

            if (error) {
              console.error("Failed to update profile", error);
            }

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
