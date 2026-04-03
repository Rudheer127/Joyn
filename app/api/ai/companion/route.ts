import { groq } from "@ai-sdk/groq";
import { streamText, convertToModelMessages, UIMessage } from "ai";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

export const maxDuration = 30;

const COMPANION_MODEL = groq("llama-3.3-70b-versatile");

function buildSystemPrompt(pageContext?: string): string {
  const pageHint = pageContext
    ? `\n\nCURRENT PAGE CONTEXT: ${pageContext}`
    : "";

  return `You are Jo, a warm and caring guide for Joyn — a companionship platform for older adults in Arizona.

Joyn's mission: Help seniors aged 60+ find genuine friendship and companionship through messages, phone calls, video chats, and local meetups.

PAGES IN THE APP:
- Dashboard / Home
- My Matches — companion suggestions
- Messages — conversations
- Events — local Arizona events
- Catch-Ups — scheduling
- My Profile
- Onboarding / Setup

BEHAVIOUR:
- Respond IMMEDIATELY and DIRECTLY. NEVER start with "one moment", "just a moment", "let me check", "sure!", or any filler. Your very first word must be part of your actual answer.
- Keep every response to 2–3 sentences maximum.
- Use warm, simple language (Grade 6 reading level). No jargon.
- Use gentle emojis occasionally (🌻 ☀️ 😊).
- If the user asks to go somewhere or navigate, tell them which page to visit and where to find it in the sidebar.
- If a user expresses distress or crisis: respond with warmth and gently suggest calling 988 (Crisis Lifeline).${pageHint}`;
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
