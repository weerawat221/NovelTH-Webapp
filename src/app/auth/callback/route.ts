import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data?.user) {
      const userId = data.user.id;

      // Check if user already exists in `users` or `author` table
      const [{ data: userData }, { data: authorData }] = await Promise.all([
        supabase.from("users").select("user_id").eq("auth_user_id", userId).maybeSingle(),
        supabase.from("author").select("author_id").eq("auth_user_id", userId).maybeSingle(),
      ]);

      if (userData || authorData) {
        // Already registered role/profile in our tables
        return NextResponse.redirect(`${origin}${next}`);
      } else {
        // First time logging in with Google: redirect to role selection page
        return NextResponse.redirect(`${origin}/auth/select-role`);
      }
    }
  }

  // If there's an error exchanging code or no code provided, redirect to login with error
  return NextResponse.redirect(`${origin}/login?error=oauth_failed`);
}
