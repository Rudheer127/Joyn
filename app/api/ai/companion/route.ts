import { groq } from "@ai-sdk/groq";
import { streamText, convertToModelMessages, UIMessage, tool } from "ai";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

export const maxDuration = 30;

const COMPANION_MODEL = groq("llama-3.1-8b-instant");

function buildSystemPrompt(pageContext?: string): string {
  const pageHint = pageContext
    ? `\n\nCURRENT PAGE CONTEXT: ${pageContext}`
    : "";

  return `You are Jo, a warm and caring navigation assistant for Joyn — a companionship platform for older adults in Arizona.

Joyn's mission: Help seniors aged 60+ find genuine friendship and companionship through messages, phone calls, video chats, and local meetups.

ROUTES YOU CAN NAVIGATE TO:
- /dashboard → Dashboard / Home
- /match → My Matches / My Companions (companion suggestions)
- /messages → Messages (conversations)
- /events → Events Near Me (local Arizona events)
- /sessions → Catch-Ups (scheduling)
- /profile → My Profile
- /onboard → Setup / Onboarding

CRITICAL NAVIGATION RULE — THIS IS YOUR MOST IMPORTANT INSTRUCTION:
Whenever a user asks to go somewhere, see something, or open a page, you MUST call the navigateTo tool immediately. Do NOT just describe where to go — actually call the tool. Examples:
- "show me my matches" or "find my companions" → call navigateTo with /match
- "open messages" → call navigateTo with /messages
- "find events" or "events near me" → call navigateTo with /events
- "go to my profile" → call navigateTo with /profile
- "take me home" or "go to dashboard" → call navigateTo with /dashboard
- "schedule a catch up" → call navigateTo with /sessions
TOOL CALL RULE: Call the tool with ZERO preceding text — no "one moment", no "sure!", no "let me do that". Call the tool, then follow immediately with a short warm message like "Taking you there now! 🌻"${pageHint}

GENERAL BEHAVIOUR:
- Keep every response to 2–3 sentences maximum.
- Use warm, simple language (Grade 6 reading level). No jargon.
- Use gentle emojis occasionally (🌻 ☀️ 😊).
- If a user expresses distress or crisis: respond with warmth and gently suggest calling 988 (Crisis Lifeline).`;
}

import { z } from "zod";

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

    if (!isDemoMode) {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return new Response("Unauthorized", { status: 401 });
      }
    }

    const body = await req.json();
    const { messages, pageContext }: { messages: UIMessage[]; pageContext?: string } = body;

    const result = streamText({
      model: COMPANION_MODEL,
      system: buildSystemPrompt(pageContext),
      messages: await convertToModelMessages(messages),
      tools: {
        navigateTo: tool({
          description: "Navigates the user to a specific page within the Joyn app when they ask to go somewhere.",
          inputSchema: z.object({
            route: z.enum(["/dashboard", "/match", "/messages", "/profile", "/events", "/sessions", "/onboard"])
              .describe("The route to navigate the user to based on their request.")
          }),
          execute: async ({ route }) => {
            return `Redirecting user to ${route}... Tell them you're taking them there now.`;
          }
        })
      }
    });

    return result.toUIMessageStreamResponse();
  } catch (err) {
    console.error("[/api/ai/companion] Error:", err);
    return NextResponse.json(
      { error: "AI service unavailable. Please try again in a moment." },
      { status: 503 }
    );
  }
}
