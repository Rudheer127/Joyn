import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { addMessage, getConversationState, updateConversationState } from "@/lib/supabase/jo";
import { classifyIntent, extractTopic } from "@/lib/ai/intent-classifier";
import { validateStateTransition, INTENT_TO_STATE } from "@/lib/supabase/jo-types";
import type { IntentClass, JoState } from "@/lib/supabase/jo-types";

/**
 * Send-message endpoint with state transition validation
 *
 * Implements strict state machine:
 * - Validates state transitions per defined rules
 * - Classifies user intent into 8 classes
 * - Tracks intent confidence for action gating
 * - Logs all state changes for regression testing
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { conversationId, sender, messageText, metadata } = body;

    if (!conversationId || !sender || !messageText) {
      return NextResponse.json(
        { error: "Missing required fields: conversationId, sender, messageText" },
        { status: 400 }
      );
    }

    // Verify conversation belongs to user
    const { data: conversation, error: convError } = await supabase
      .from("jo_conversations")
      .select("id, user_id")
      .eq("id", conversationId)
      .single();

    if (convError || !conversation || conversation.user_id !== user.id) {
      return NextResponse.json(
        { error: "Conversation not found or unauthorized" },
        { status: 403 }
      );
    }

    // Add message to database
    const message = await addMessage(conversationId, sender, messageText, metadata);

    // Update conversation state if this is a user message
    if (sender === "user") {
      const state = await getConversationState(conversationId);
      if (state) {
        // Classify intent from user message (strict intent classification)
        const intentClassification = classifyIntent(messageText);
        const newIntent = intentClassification.intent as IntentClass;
        const newIntentConfidence = intentClassification.confidence;

        // Determine new state based on intent class
        const suggestedNextState = INTENT_TO_STATE[newIntent];

        // Validate state transition
        const currentState = state.state_phase as JoState;
        const isTransitionValid = validateStateTransition(currentState, suggestedNextState);

        // Extract topic
        const newTopic = extractTopic(messageText);

        // Update state with intent classification and state transition
        const stateUpdate = {
          last_intent: newIntent,
          last_topic: newTopic,
          state_phase: isTransitionValid ? suggestedNextState : currentState,
          intent_class: newIntent,
          intent_confidence: newIntentConfidence,
          state_transition_valid: isTransitionValid,
        };

        await updateConversationState(conversationId, stateUpdate);

        // Log state transition for debugging and regression testing
        console.log(`[State Transition] ${currentState} → ${suggestedNextState} (valid: ${isTransitionValid})`, {
          intent: newIntent,
          confidence: newIntentConfidence,
          topic: newTopic,
        });
      }
    }

    return NextResponse.json({
      message_id: message.id,
      conversation_id: message.conversation_id,
      sender: message.sender,
      created_at: message.created_at,
    });
  } catch (error) {
    console.error("[/api/ai/jo/send-message] Error:", error);
    return NextResponse.json(
      { error: "Failed to send message" },
      { status: 500 }
    );
  }
}
