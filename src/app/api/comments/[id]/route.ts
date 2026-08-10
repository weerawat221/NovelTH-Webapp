import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

// ─── Helper: check if the logged-in user owns this comment ───
async function checkOwnership(
  supabase: any,
  commentId: number,
  authUserId: string
): Promise<{ isOwner: boolean; comment: any | null }> {
  // Fetch the comment with its ownership fields
  const { data: comment, error } = await supabase
    .from("comment")
    .select("comment_id, commenter_type, user_id, author_id, admin_id, parent_comment_id")
    .eq("comment_id", commentId)
    .maybeSingle();

  if (error || !comment) {
    return { isOwner: false, comment: null };
  }

  // Determine the owner based on commenter_type
  if (comment.commenter_type === "admin" && comment.admin_id) {
    const { data: adminData } = await supabase
      .from("admin")
      .select("admin_id")
      .eq("auth_user_id", authUserId)
      .maybeSingle();
    return { isOwner: adminData?.admin_id === comment.admin_id, comment };
  }

  if (comment.commenter_type === "author" && comment.author_id) {
    const { data: authorData } = await supabase
      .from("author")
      .select("author_id")
      .eq("auth_user_id", authUserId)
      .maybeSingle();
    return { isOwner: authorData?.author_id === comment.author_id, comment };
  }

  if (comment.commenter_type === "user" && comment.user_id) {
    const { data: userData } = await supabase
      .from("users")
      .select("user_id")
      .eq("auth_user_id", authUserId)
      .maybeSingle();
    return { isOwner: userData?.user_id === comment.user_id, comment };
  }

  return { isOwner: false, comment };
}

// ─── Helper: check if the logged-in user is the novel's author ───
async function checkNovelAuthor(
  supabase: any,
  commentId: number,
  authUserId: string
): Promise<boolean> {
  const { data: commentData } = await supabase
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

  if (!commentData) return false;
  const novelAuthorAuthId = (commentData as any).chapter?.novel?.author?.auth_user_id;
  return novelAuthorAuthId === authUserId;
}

// ═══════════════════════════════════════════════
// PATCH — Edit comment text/spoiler OR change status (hide/unhide)
// ═══════════════════════════════════════════════
export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const commentId = parseInt(id, 10);

    if (isNaN(commentId)) {
      return NextResponse.json({ error: "Invalid comment ID" }, { status: 400 });
    }

    const body = await request.json().catch(() => ({}));
    const { status, comment_text, is_spoiler } = body;

    // Must provide at least one field to update
    const hasStatusUpdate = status === "visible" || status === "hidden";
    const hasTextUpdate = typeof comment_text === "string" && comment_text.trim().length > 0;
    const hasSpoilerUpdate = typeof is_spoiler === "boolean";

    if (!hasStatusUpdate && !hasTextUpdate && !hasSpoilerUpdate) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
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

    // 3. Check ownership
    const { isOwner } = await checkOwnership(supabase, commentId, user.id);

    // 4. Determine authorization
    // - Owner can: edit text, toggle spoiler, hide/unhide their own comment
    // - Novel author can: hide/unhide any comment on their novel
    // - Admin can: hide/unhide any comment
    let canEditContent = isOwner;
    let canChangeStatus = isOwner; // Owner can hide/unhide their own

    if (role === "admin") {
      canChangeStatus = true; // Admin can change status on any comment
    } else if (role === "author" && !isOwner) {
      // Check if they're the novel author
      const isNovelAuthor = await checkNovelAuthor(supabase, commentId, user.id);
      if (isNovelAuthor) {
        canChangeStatus = true; // Novel author can change status
      }
    }

    // Validate permissions
    if ((hasTextUpdate || hasSpoilerUpdate) && !canEditContent) {
      return NextResponse.json({ error: "Forbidden: You can only edit your own comments" }, { status: 403 });
    }

    if (hasStatusUpdate && !canChangeStatus) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // 5. Build update object
    const updateData: Record<string, any> = {};
    if (hasStatusUpdate) updateData.status = status;
    if (hasTextUpdate) updateData.comment_text = comment_text.trim();
    if (hasSpoilerUpdate) updateData.is_spoiler = is_spoiler;

    // 6. Update in database
    const { error: updateError } = await supabase
      .from("comment")
      .update(updateData)
      .eq("comment_id", commentId);

    if (updateError) {
      console.error("[Comments API] Error updating comment:", updateError);
      return NextResponse.json({ error: "Failed to update comment" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("[Comments PATCH API] Unexpected error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ═══════════════════════════════════════════════
// DELETE — Owner deletes their own comment, or Admin deletes any comment
// ═══════════════════════════════════════════════
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

    // 2. Fetch role
    const { data: role, error: roleError } = await supabase.rpc("get_user_role", {
      check_auth_id: user.id,
    });

    if (roleError) {
      console.error("[Comments API] Error checking user role:", roleError);
      return NextResponse.json({ error: "Failed to verify role" }, { status: 500 });
    }

    // 3. Check ownership
    const { isOwner } = await checkOwnership(supabase, commentId, user.id);

    // Admin can delete any; otherwise must be owner
    if (role !== "admin" && !isOwner) {
      return NextResponse.json({ error: "Forbidden: You can only delete your own comments" }, { status: 403 });
    }

    // 4. Count replies before deleting (for response info)
    const { count } = await supabase
      .from("comment")
      .select("comment_id", { count: "exact", head: true })
      .eq("parent_comment_id", commentId);

    const repliesCount = count || 0;

    // 5. Delete the comment (DB handles cascading to replies)
    const { error: deleteError } = await supabase
      .from("comment")
      .delete()
      .eq("comment_id", commentId);

    if (deleteError) {
      console.error("[Comments API] Error deleting comment:", deleteError);
      return NextResponse.json({ error: "Failed to delete comment" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      deletedCount: repliesCount + 1,
    });
  } catch (err: any) {
    console.error("[Comments DELETE API] Unexpected error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
