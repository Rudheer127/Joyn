import { groq } from "@ai-sdk/groq";
import { streamText, convertToModelMessages, UIMessage, tool } from "ai";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { DEMO_USER, DEMO_EVENTS } from "@/lib/demo/demoData";
import { getConversationState } from "@/lib/supabase/jo";

export const maxDuration = 30;

const COMPANION_MODEL = groq("llama-3.1-8b-instant");

interface UserProfile {
  full_name: string;
  age: number;
  city: string;
  gender: string;
  interests: string[];
  health_goals: string[];
}

function buildSystemPrompt(pageContext?: string, userProfile?: UserProfile, events?: typeof DEMO_EVENTS, statePhase?: string): string {
  const pageHint = pageContext
    ? `\n\nCURRENT PAGE CONTEXT: ${pageContext}`
    : "";

  let userContext = "";
  if (userProfile) {
    userContext = `\n\nUSER PROFILE:
You are talking to ${userProfile.full_name}, a ${userProfile.age}-year-old from ${userProfile.city}.
They identify as ${userProfile.gender}.
Their interests: ${userProfile.interests.join(", ")}.
Their goals on Joyn: ${userProfile.health_goals.join(", ")}.

IMPORTANT: When greeting them, use their first name warmly. If they ask about events, matches, or activities, reference their specific interests. If they ask you to summarize events, use the event data you know about.`;
  }

  let eventsContext = "";
  if (events && events.length > 0) {
    const eventsList = events
      .map(e => `- ${e.title} on ${e.date} at ${e.time} (${e.location})`)
      .join("\n");
    eventsContext = `\n\nAVAILABLE EVENTS IN THEIR AREA:\n${eventsList}`;
  }

  let stateInstructions = "";
  if (statePhase) {
    stateInstructions = `\n\nCONVERSATION STATE: ${statePhase}
${statePhase === "greeting" ? "You are in the greeting phase. Welcome them warmly and ask how you can help." : ""}
${statePhase === "clarifying" ? "You are clarifying their intent. Ask follow-up questions to understand what they need." : ""}
${statePhase === "active" ? "You are in active conversation. Help them with their request, provide context-aware suggestions, and be ready to navigate them." : ""}
${statePhase === "awaiting_action" ? "You are waiting for them to act on a suggestion or navigate. Keep responses brief and supportive." : ""}`;
  }

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
Always call the tool first, then respond with a short warm message like "Taking you there now! 🌻"${pageHint}

GENERAL BEHAVIOUR:
- Keep every response to 2–3 sentences maximum.
- Use warm, simple language (Grade 6 reading level). No jargon.
- Use gentle emojis occasionally (🌻 ☀️ 😊).
- If a user expresses distress or crisis: respond with warmth and gently suggest calling 988 (Crisis Lifeline).${userContext}${eventsContext}${stateInstructions}`;
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

    const body = await req.json();
    const { messages, pageContext, isDemo, conversationId }: { messages: UIMessage[]; pageContext?: string; isDemo?: boolean; conversationId?: string } = body;

    // Skip auth for demo mode
    let supabase: any = null;
    if (!isDemo) {
      supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return new Response("Unauthorized", { status: 401 });
      }
    }

    // Fetch conversation state
    let statePhase = "greeting";
    if (conversationId && !isDemo && supabase) {
      try {
        const state = await getConversationState(conversationId);
        if (state) {
          statePhase = state.state_phase || "greeting";
        }
      } catch (error) {
        console.error("Error fetching conversation state:", error);
      }
    }

    // Build system prompt with user profile context if in demo mode
    let systemPrompt = buildSystemPrompt(pageContext, undefined, undefined, statePhase);
    if (isDemo) {
      systemPrompt = buildSystemPrompt(pageContext, DEMO_USER as UserProfile, DEMO_EVENTS, statePhase);
    }

    const result = streamText({
      model: COMPANION_MODEL,
      system: systemPrompt,
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
