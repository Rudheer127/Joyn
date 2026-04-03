import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getConversationMessages, getConversationState } from "@/lib/supabase/jo";

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const conversationId = req.nextUrl.searchParams.get("conversationId");
    if (!conversationId) {
      return NextResponse.json(
        { error: "Missing conversationId parameter" },
        { status: 400 }
      );
    }

    // Verify conversation belongs to user
    const { data: conversation, error: convError } = await supabase
      .from("jo_conversations")
      .select("id, user_id, status, current_page, workflow_step")
      .eq("id", conversationId)
      .single();

    if (convError || !conversation || conversation.user_id !== user.id) {
      return NextResponse.json(
        { error: "Conversation not found or unauthorized" },
        { status: 403 }
      );
    }

    // Get conversation messages
    const messages = await getConversationMessages(conversationId);

    // Get conversation state
    const state = await getConversationState(conversationId);

    return NextResponse.json({
      conversation: {
        id: conversation.id,
        status: conversation.status,
        current_page: conversation.current_page,
        workflow_step: conversation.workflow_step,
      },
      messages: messages.map(m => ({
        id: m.id,
        sender: m.sender,
        message_text: m.message_text,
        message_type: m.message_type,
        metadata: m.metadata,
        created_at: m.created_at,
      })),
      state: state ? {
        state_phase: state.state_phase,
        last_intent: state.last_intent,
        last_topic: state.last_topic,
        suggested_options: state.suggested_options,
        context: state.context,
      } : null,
    });
  } catch (error) {
    console.error("[/api/ai/jo/get-conversation] Error:", error);
    return NextResponse.json(
      { error: "Failed to get conversation" },
      { status: 500 }
    );
  }
}
