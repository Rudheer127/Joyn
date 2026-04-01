export const maxDuration = 30;

import { groq } from "@ai-sdk/groq";
import { streamText, convertToModelMessages, tool } from "ai";
import type { UIMessage } from "ai";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { z } from "zod";

const CONSULTATION_MODEL = groq("llama-3.1-8b-instant");

function buildSystemPrompt(userName: string): string {
  return `You are Jo, a warm, empathetic listener and guide for Joyn.
Joyn is a companionship platform for older adults (60+) in Arizona.
The user's name is ${userName}.

YOUR ROLE:
You are having an initial consultation with the user. Your main goal is to understand how they are feeling in terms of loneliness, social isolation, and what kind of companionship they are looking for (e.g., someone to talk to on the phone, coffee meetups, walking buddies).

STRICT RULES:
1. Speak with deep empathy and warmth. Use simple language (Grade 6 level) and short sentences.
2. Ask ONE question at a time to keep them from feeling overwhelmed.
3. Once you feel you understand their story and goals, you MUST call the 'updateSupabaseProfile' tool to save those goals into their profile.
4. After saving their profile, suggest a local real-world event/activity using the 'suggestLocalEvents' tool, or suggest that they can now view their matches.
5. Do NOT list out all things they can do; let the conversation flow naturally.
6. Important: This platform has nothing to do with fitness. Focus on friendship and combating loneliness.
7. If the user mentions health crises or extreme distress, gently recommend 988.

YOUR FIRST MESSAGE should usually be: "Hi ${userName}, it's wonderful to meet you. Can you tell me a little bit about what brings you to Joyn today?"
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

    const { data: profile } = await supabase.from("profiles").select("full_name").eq("id", user.id).single();
    const userName = profile?.full_name?.split(" ")[0] || "Friend";

    const body = await req.json();
    const { messages }: { messages: UIMessage[] } = body;

    const result = streamText({
      model: CONSULTATION_MODEL,
      system: buildSystemPrompt(userName),
      messages: await convertToModelMessages(messages),
      tools: {
        updateSupabaseProfile: tool({
          description: "Saves the user's loneliness reason and preferred connection style to their Joyn profile in Supabase.",
          inputSchema: z.object({
            lonelinessReason: z.string().describe("A brief summary of why the user feels lonely or why they joined."),
            preferredConnection: z.string().describe("What the user wants to do (e.g., 'phone calls', 'coffee', 'walking').")
          }),
          execute: async ({ lonelinessReason, preferredConnection }) => {
            const { error } = await supabase.from("profiles").update({
              health_goals: [lonelinessReason],
              connection_preference: preferredConnection,
              onboarding_completed: true,
            }).eq("id", user.id);

            if (error) {
              console.error("Failed to update profile", error);
              return "Error updating profile. But tell the user you noted it down anyway.";
            }

            return `Successfully updated profile. Tell the user their preferences are saved and suggest local events using the suggestLocalEvents tool if they seem interested, or tell them they can view their matches on the dashboard.`;
          }
        }),
        suggestLocalEvents: tool({
          description: "Suggests 2-3 local community events in Arizona for seniors.",
          inputSchema: z.object({
            city: z.string().optional().describe("The user's city in Arizona, if known.")
          }),
          execute: async ({ city }) => {
            const loc = city || "Phoenix";
            return `Here are some mock events in ${loc}:\n1. ${loc} Senior Center Morning Coffee\n2. ${loc} Library Book Club for Seniors\n3. Sun City Walking Group.\n\nPresent these warmly to the user.`;
          }
        })
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
