import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const commentId = parseInt(id, 10);

    if (isNaN(commentId)) {
      return NextResponse.json({ error: "Invalid comment ID" }, { status: 400 });
    }

    const body = await request.json().catch(() => ({}));
    const { status } = body;

    if (status !== "visible" && status !== "hidden") {
      return NextResponse.json({ error: "Invalid status value" }, { status: 400 });
    }

    const supabase = await createClient();

    // 1. Authenticate user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Fetch role
    const { data: role, error: roleError } = await supabase.rpc("get_user_role", {
      check_auth_id: user.id,
    });

    if (roleError) {
      console.error("[Comments API] Error checking user role:", roleError);
      return NextResponse.json({ error: "Failed to verify role" }, { status: 500 });
    }

    let isAuthorized = false;

    if (role === "admin") {
      isAuthorized = true;
    } else if (role === "author") {
      // Fetch comment's novel author to check if it's their novel
      const { data: commentData, error: commentError } = await supabase
        .from("comment")
        .select(`
          chapter_id,
          chapter:chapter_id (
            novel:novel_id (
              author_id,
              author:author_id (auth_user_id)
            )
          )
        `)
        .eq("comment_id", commentId)
        .maybeSingle();

      if (commentError) {
        console.error("[Comments API] Error fetching comment details:", commentError);
      } else if (commentData) {
        const commentAuthorAuthId = (commentData as any).chapter?.novel?.author?.auth_user_id;
        if (commentAuthorAuthId === user.id) {
          isAuthorized = true;
        }
      }
    }

    if (!isAuthorized) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // 3. Update status in database
    const { error: updateError } = await supabase
      .from("comment")
      .update({ status })
      .eq("comment_id", commentId);

    if (updateError) {
      console.error("[Comments API] Error updating status:", updateError);
      return NextResponse.json({ error: "Failed to update comment" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("[Comments PATCH API] Unexpected error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
