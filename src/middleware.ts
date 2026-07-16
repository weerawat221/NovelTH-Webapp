import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  // Safety net: block GET requests containing sensitive credential query parameters
  if (request.method === "GET") {
    const searchParams = request.nextUrl.searchParams;
    const hasSensitiveParams =
      searchParams.has("email") ||
      searchParams.has("password") ||
      searchParams.has("token") ||
      searchParams.has("reset_password_code");

    const isCallbackPath = request.nextUrl.pathname === "/auth/callback";
    const hasCodeParam = searchParams.has("code") && !isCallbackPath;

    if (hasSensitiveParams || hasCodeParam) {
      return new NextResponse(
        "Bad Request: Credentials must not be passed via GET query parameters.",
        { status: 400 }
      );
    }
  }

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options });
          response = NextResponse.next({
            request: { headers: request.headers },
          });
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: "", ...options });
          response = NextResponse.next({
            request: { headers: request.headers },
          });
          response.cookies.set({ name, value: "", ...options });
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user && request.nextUrl.pathname !== "/login" && !request.nextUrl.pathname.startsWith("/api/auth")) {
    const { data: userData } = await supabase
      .from("users")
      .select("status")
      .eq("auth_user_id", user.id)
      .maybeSingle();

    let isSuspended = userData?.status === "suspended";

    if (!isSuspended) {
      const { data: authorData } = await supabase
        .from("author")
        .select("status")
        .eq("auth_user_id", user.id)
        .maybeSingle();

      isSuspended = authorData?.status === "suspended";
    }

    if (isSuspended) {
      await supabase.auth.signOut();
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("error", "suspended");
      const redirectResponse = NextResponse.redirect(url);
      redirectResponse.cookies.delete("sb-access-token");
      redirectResponse.cookies.delete("sb-refresh-token");
      return redirectResponse;
    }
  }

  // If path starts with /admin, verify admin privileges
  if (request.nextUrl.pathname.startsWith("/admin")) {
    if (!user) {
      // Redirect to login if not authenticated
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("next", request.nextUrl.pathname);
      return NextResponse.redirect(url);
    }

    try {
      // Check user role via SQL RPC function
      const { data: role, error } = await supabase.rpc("get_user_role", {
        check_auth_id: user.id,
      });

      if (error || role !== "admin") {
        // Redirect to home if not an admin
        const url = request.nextUrl.clone();
        url.pathname = "/";
        // Optionally pass error message
        url.searchParams.set("error", "unauthorized_admin");
        return NextResponse.redirect(url);
      }
    } catch (err) {
      console.error("Middleware role check error:", err);
      const url = request.nextUrl.clone();
      url.pathname = "/";
      return NextResponse.redirect(url);
    }
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, fonts, etc.)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
