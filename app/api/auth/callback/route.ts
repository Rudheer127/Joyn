import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  // if "next" is in param, use it as the redirect URL
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {
              // The `setAll` method was called from a Server Component.
              // This can be ignored if you have middleware refreshing
              // user sessions.
            }
          },
        },
      }
    );
    
    const { data: { session }, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error && session) {
      // Check if user has completed onboarding
      let nextPath = next;
      try {
        const { data: profile } = await supabase
          .from("profiles")
          .select("onboarding_completed")
          .eq("id", session.user.id)
          .single();
        
        if (!profile || !profile.onboarding_completed) {
          nextPath = "/onboard";
        }
      } catch (err) {
        console.error("Error fetching profile on callback:", err);
      }
      
      return NextResponse.redirect(`${origin}${nextPath}`);
    }
  }

  // return the user to an error page with some instructions
  return NextResponse.redirect(`${origin}/sign-in?error=Could not authenticate user`);
}
