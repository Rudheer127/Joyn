import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST() {
  try {
    const supabase = await createClient();

    // Run the migration SQL
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: e1 } = await supabase.rpc("exec_sql" as any, {
      sql: `
        ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
        ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS gender TEXT;
        ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS photo_public BOOLEAN NOT NULL DEFAULT TRUE;
      `,
    });

    // Seed demo profile (ignore if user doesn't exist)
    const { data: userData } = await supabase.auth.admin.listUsers();
    const demoUser = userData?.users?.find((u) => u.email === "demo@joyn.app");

    if (demoUser) {
      await supabase.from("profiles").upsert({
        id: demoUser.id,
        full_name: "Dorothy",
        city: "Scottsdale",
        connection_preference: "phone,coffee",
        onboarding_completed: true,
        photo_public: true,
        gender: "female",
        updated_at: new Date().toISOString(),
      });
    }

    return NextResponse.json({ ok: true, migrationError: e1?.message, demoUser: demoUser?.id });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ hint: "POST to /api/admin/seed to run migration and seed demo data" });
}
