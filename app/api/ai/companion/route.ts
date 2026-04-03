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
    let realUserProfile: UserProfile | undefined = undefined;

    if (!isDemo) {
      supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return new Response("Unauthorized", { status: 401 });
      }

      // ── Fetch real user profile so Jo can greet them by name ──
      try {
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name, age, city, gender, interests, health_goals")
          .eq("id", user.id)
          .single();

        if (profile) {
          realUserProfile = {
            full_name: profile.full_name || "Friend",
            age: profile.age || 0,
            city: profile.city || "",
            gender: profile.gender || "",
            interests: Array.isArray(profile.interests) ? profile.interests : [],
            health_goals: Array.isArray(profile.health_goals) ? profile.health_goals : [],
          };
        }
      } catch (err) {
        console.error("[companion] Could not fetch user profile:", err);
        // Non-fatal — Jo will still work, just without personalization
      }
    }

    // Fetch conversation state (database source of truth)
    let statePhase = "greeting";
    let lastIntent: string | undefined = undefined;
    let lastTopic: string | undefined = undefined;
    let intentConfidence = 0;
    if (conversationId && !isDemo && supabase) {
      try {
        const state = await getConversationState(conversationId);
        if (state) {
          statePhase = state.state_phase || "greeting";
          lastIntent = state.last_intent || undefined;
          lastTopic = state.last_topic || undefined;
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

    // Resolve user profile: real profile for authenticated users, demo data for demo mode
    const activeUserProfile: UserProfile | undefined = isDemo
      ? (DEMO_USER as UserProfile)
      : realUserProfile;

    // Build system prompt with unified orchestration + real user profile
    const systemPromptContext = {
      pageContext,
      userProfile: activeUserProfile,
      events: isDemo ? DEMO_EVENTS : undefined,
      statePhase,
      lastIntent,
      lastTopic,
      intentConfidence: currentIntentConfidence,
    };

    const systemPrompt = buildJoSystemPrompt(systemPromptContext);

    const result = streamText({
      model: COMPANION_MODEL,
      system: systemPrompt,
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
