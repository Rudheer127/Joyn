import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const context = req.nextUrl.searchParams.get("context") || "greeting";
    const contextTags = context.split(",").map(t => t.trim());

    // Fetch suggested options from database
    const { data: options, error } = await supabase
      .from("jo_suggested_options")
      .select("*")
      .eq("active", true)
      .order("priority", { ascending: true })
      .limit(6);

    if (error) throw error;

    // Filter options by context match
    const filteredOptions = (options || []).filter((opt: any) => {
      const contextMatch = opt.context_match || [];
      return contextMatch.length === 0 || contextMatch.some((tag: string) => contextTags.includes(tag));
    });

    return NextResponse.json({
      options: filteredOptions,
    });
  } catch (error) {
    console.error("[/api/ai/jo/get-options] Error:", error);
    return NextResponse.json(
      { error: "Failed to get options" },
      { status: 500 }
    );
  }
}
