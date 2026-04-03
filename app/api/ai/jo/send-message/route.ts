import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { addMessage, getConversationState, updateConversationState } from "@/lib/supabase/jo";

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

    // Add message
    const message = await addMessage(conversationId, sender, messageText, metadata);

    // Update conversation state if this is a user message
    if (sender === "user") {
      const state = await getConversationState(conversationId);
      if (state) {
        // Extract intent or topic from message (simple heuristic)
        const lowerText = messageText.toLowerCase();
        let lastIntent = state.last_intent;
        let lastTopic = state.last_topic;

        if (lowerText.includes("navigate") || lowerText.includes("go to") || lowerText.includes("show")) {
          lastIntent = "navigate";
        } else if (lowerText.includes("match") || lowerText.includes("companion")) {
          lastIntent = "browse_matches";
          lastTopic = "matches";
        } else if (lowerText.includes("event")) {
          lastIntent = "browse_events";
          lastTopic = "events";
        } else if (lowerText.includes("message")) {
          lastIntent = "view_messages";
          lastTopic = "messages";
        }

        await updateConversationState(conversationId, {
          last_intent: lastIntent,
          last_topic: lastTopic,
          state_phase: "active",
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
