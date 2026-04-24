// prodify-layer/routes/api/auth/signout/route.ts
// Drop into app/api/auth/signout/route.ts
import { createSupabaseServerClient } from '@/prodify-layer/supabase/server';
import { NextResponse } from 'next/server';

export async function POST() {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signOut();
  if (error) {
    console.error('[auth/signout] signOut failed:', error.message);
  }
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
  return NextResponse.redirect(new URL('/login', appUrl));
}
