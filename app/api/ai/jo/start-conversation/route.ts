import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getOrCreateConversation } from "@/lib/supabase/jo";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { pageContext } = body;

    // Get or create active conversation
    const conversation = await getOrCreateConversation(user.id, pageContext);

    return NextResponse.json({
      conversation_id: conversation.id,
      status: conversation.status,
      current_page: conversation.current_page,
    });
  } catch (error) {
    console.error("[/api/ai/jo/start-conversation] Error:", error);
    return NextResponse.json(
      { error: "Failed to start conversation" },
      { status: 500 }
    );
  }
}
