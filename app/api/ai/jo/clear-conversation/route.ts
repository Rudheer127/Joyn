import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { clearConversation } from "@/lib/supabase/jo";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { conversationId } = body;

    if (!conversationId) {
      return NextResponse.json(
        { error: "Missing conversationId" },
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

    // Clear conversation
    await clearConversation(conversationId);

    return NextResponse.json({
      success: true,
      message: "Conversation cleared",
    });
  } catch (error) {
    console.error("[/api/ai/jo/clear-conversation] Error:", error);
    return NextResponse.json(
      { error: "Failed to clear conversation" },
      { status: 500 }
    );
  }
}
