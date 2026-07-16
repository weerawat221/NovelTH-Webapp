import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const commentId = parseInt(id, 10);

    if (isNaN(commentId)) {
      return NextResponse.json({ error: "Invalid comment ID" }, { status: 400 });
    }

    const supabase = await createClient();

    // 1. Authenticate user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Fetch role & check if admin
    const { data: role, error: roleError } = await supabase.rpc("get_user_role", {
      check_auth_id: user.id,
    });

    if (roleError) {
      console.error("[Admin Comments API] Error checking user role:", roleError);
      return NextResponse.json({ error: "Failed to verify role" }, { status: 500 });
    }

    if (role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // 3. Count replies before deleting (for logging/response)
    const { count, error: countError } = await supabase
      .from("comment")
      .select("comment_id", { count: "exact", head: true })
      .eq("parent_comment_id", commentId);

    if (countError) {
      console.error("[Admin Comments API] Error counting replies:", countError);
    }

    const repliesCount = count || 0;

    // 4. Delete the comment (DB handles cascading to replies automatically)
    const { error: deleteError } = await supabase
      .from("comment")
      .delete()
      .eq("comment_id", commentId);

    if (deleteError) {
      console.error("[Admin Comments API] Error deleting comment:", deleteError);
      return NextResponse.json({ error: "Failed to delete comment" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      deletedCount: repliesCount + 1,
    });
  } catch (err: any) {
    console.error("[Admin Comments DELETE API] Unexpected error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
