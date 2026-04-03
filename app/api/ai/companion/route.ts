import { groq } from "@ai-sdk/groq";
import { streamText, convertToModelMessages, UIMessage, tool } from "ai";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { DEMO_USER, DEMO_EVENTS } from "@/lib/demo/demoData";
import { getConversationState } from "@/lib/supabase/jo";
import { buildJoSystemPrompt } from "@/lib/ai/jo-system-prompt";
import { classifyIntent, extractNavigationIntent, shouldGateIntent } from "@/lib/ai/intent-classifier";
import { isIntentConfident } from "@/lib/supabase/jo-types";

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

import { z } from "zod";

/**
 * Unified orchestration route for Jo
 *
 * Implements strict intent classification, action gating, and state machine
 */
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

    // Fetch conversation state (database source of truth)
    let statePhase = "greeting";
    let lastIntent = null;
    let lastTopic = null;
    let intentConfidence = 0;
    if (conversationId && !isDemo && supabase) {
      try {
        const state = await getConversationState(conversationId);
        if (state) {
          statePhase = state.state_phase || "greeting";
          lastIntent = state.last_intent || null;
          lastTopic = state.last_topic || null;
          intentConfidence = state.intent_confidence || 0;
        }
      } catch (error) {
        console.error("Error fetching conversation state:", error);
      }
    }

    // Classify intent from the latest user message
    const lastUserMessage = [...messages].reverse().find((m: any) => m.role === "user");
    let userMessageText = "";
    if (lastUserMessage && lastUserMessage.parts) {
      const textPart = lastUserMessage.parts.find((p: any) => p.type === "text");
      if (textPart) {
        userMessageText = (textPart as any).text;
      }
    }

    const intentClassification = classifyIntent(userMessageText);
    const currentIntent = intentClassification.intent;
    const currentIntentConfidence = intentClassification.confidence;

    // Build system prompt with new unified orchestration
    const systemPromptContext = {
      pageContext,
      userProfile: isDemo ? (DEMO_USER as UserProfile) : undefined,
      events: isDemo ? DEMO_EVENTS : undefined,
      statePhase,
      lastIntent,
      lastTopic,
      intentConfidence: currentIntentConfidence,
    };

    const systemPrompt = buildJoSystemPrompt(systemPromptContext);

    // Determine if navigate action should be gated
    const shouldGate = shouldGateIntent(currentIntent, currentIntentConfidence);
    const canNavigate = currentIntent === "navigate_page" && !shouldGate;

    // Prepare tools: only enable navigateTo if intent is clear AND confident
    const tools: Record<string, any> = {};

    if (canNavigate) {
      const navigationRoute = extractNavigationIntent(userMessageText);

      tools.navigateTo = tool({
        description: "Navigates the user to a specific page within the Joyn app when they explicitly ask to go somewhere.",
        inputSchema: z.object({
          route: z.enum(["/dashboard", "/match", "/messages", "/profile", "/events", "/sessions", "/onboard"])
            .describe("The route to navigate the user to based on their request.")
        }),
        execute: async ({ route }) => {
          // Log this action for regression testing
          console.log(`[Action] navigateTo(${route}) - intent: ${currentIntent}, confidence: ${currentIntentConfidence}`);
          return `Redirecting user to ${route}. Respond briefly with "Taking you there now! 🌻"`;
        }
      });
    }

    const result = streamText({
      model: COMPANION_MODEL,
      system: systemPrompt,
      messages: await convertToModelMessages(messages),
      tools,
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
