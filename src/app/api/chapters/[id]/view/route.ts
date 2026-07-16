import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

export async function POST(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const chapterId = parseInt(id, 10);

    if (isNaN(chapterId)) {
      return NextResponse.json({ error: "Invalid chapter ID" }, { status: 400 });
    }

    const body = await request.json().catch(() => ({}));
    const novelId = parseInt(body.novelId, 10);

    if (isNaN(novelId)) {
      return NextResponse.json({ error: "Invalid or missing novel ID" }, { status: 400 });
    }

    const supabase = await createClient();

    // 1. Get client IP address
    const ipAddress = 
      request.headers.get("x-forwarded-for")?.split(",")[0].trim() || 
      request.headers.get("x-real-ip")?.trim() || 
      "127.0.0.1";

    // 2. Rate Limiting Check: Maximum 1 view per chapter per IP per minute
    const oneMinuteAgo = new Date(Date.now() - 60 * 1000).toISOString();
    const { count, error: countError } = await supabase
      .from("visit_log")
      .select("visit_id", { count: "exact", head: true })
      .eq("chapter_id", chapterId)
      .eq("ip_address", ipAddress)
      .gt("visit_date", oneMinuteAgo);

    if (countError) {
      console.error("[View Logging API] Error checking rate limits:", countError);
    } else if (count && count > 0) {
      // Return 429 Too Many Requests to prevent log spamming
      return NextResponse.json(
        { error: "Rate limit exceeded. Please wait before refreshing." },
        { status: 429 }
      );
    }

    // 3. Resolve authenticated user's dbUserId (if logged in)
    const { data: { user } } = await supabase.auth.getUser();
    let dbUserId: number | null = null;
    
    if (user) {
      const { data: userData } = await supabase
        .from("users")
        .select("user_id")
        .eq("auth_user_id", user.id)
        .maybeSingle();
      
      dbUserId = userData?.user_id || null;
    }

    // 4. Log raw view event in visit_log
    const { error: insertError } = await supabase
      .from("visit_log")
      .insert({
        user_id: dbUserId,
        novel_id: novelId,
        chapter_id: chapterId,
        ip_address: ipAddress,
      });

    if (insertError) {
      console.error("[View Logging API] Error inserting visit_log:", insertError);
      return NextResponse.json({ error: "Failed to record view" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("[View Logging API] Unexpected server error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
