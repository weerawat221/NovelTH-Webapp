"use client";

import { useState, useEffect, useCallback } from "react";
import { Send, Smile, User, MessageCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import type { CommentWithUser, ReadingTheme } from "@/types/novel";
import CommentCard from "./CommentCard";
import ConfirmDialog from "@/components/common/ConfirmDialog";

const COMMENTS_PER_PAGE = 4;
const MAX_COMMENT_LENGTH = 1000;

const commentThemes = {
  dark: {
    text: "text-white/90",
    body: "text-white/75",
    muted: "text-white/30",
    border: "border-white/10",
    borderStrong: "border-white/20",
    bgInput: "bg-white/5 text-white/80 placeholder:text-white/25",
    buttonBg: "bg-white/5 hover:bg-white/10 border-white/10 text-white/30 hover:text-white/50",
    buttonBgActive: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    replyBorder: "border-white/5",
    textareaBorder: "border-white/10 focus:ring-[#e09050]/50",
    replyInputIconBg: "bg-[#e09050]/20 text-[#e09050]",
    avatarFallbackBg: "bg-white/10 text-white/40",
  },
  light: {
    text: "text-gray-900",
    body: "text-gray-800",
    muted: "text-gray-500",
    border: "border-gray-200",
    borderStrong: "border-gray-300",
    bgInput: "bg-gray-50 text-gray-900 placeholder:text-gray-400",
    buttonBg: "bg-gray-100 hover:bg-gray-200 border-gray-200 text-gray-500 hover:text-gray-750",
    buttonBgActive: "bg-amber-500/20 text-amber-600 border-amber-500/30",
    replyBorder: "border-gray-200",
    textareaBorder: "border-gray-200 focus:ring-[#e09050]/50",
    replyInputIconBg: "bg-[#e09050]/20 text-[#e09050]",
    avatarFallbackBg: "bg-gray-200 text-gray-500",
  },
  warm: {
    text: "text-[#3d3529]",
    body: "text-[#4a3f31]",
    muted: "text-[#8c7a64]",
    border: "border-[#3d3529]/15",
    borderStrong: "border-[#3d3529]/25",
    bgInput: "bg-[#eaddcd]/40 text-[#3d3529] placeholder:text-[#8c7a64]/60",
    buttonBg: "bg-[#eaddcd]/30 hover:bg-[#eaddcd]/60 border-[#3d3529]/15 text-[#8c7a64] hover:text-[#3d3529]",
    buttonBgActive: "bg-amber-500/20 text-amber-700 border-amber-500/30",
    replyBorder: "border-[#3d3529]/10",
    textareaBorder: "border-[#3d3529]/15 focus:ring-[#e09050]/50",
    replyInputIconBg: "bg-[#e09050]/20 text-[#e09050]",
    avatarFallbackBg: "bg-[#eaddcd]/40 text-[#8c7a64]",
  }
};

interface CommentSectionProps {
  chapterId: number;
  theme?: ReadingTheme;
  novelAuthorId?: number;
}

export default function CommentSection({ chapterId, theme = "dark", novelAuthorId }: CommentSectionProps) {
  const supabase = createClient();
  const router = useRouter();

  const [comments, setComments] = useState<CommentWithUser[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [displayCount, setDisplayCount] = useState(COMMENTS_PER_PAGE);
  const [loading, setLoading] = useState(true);

  // Auth state
  const [authUser, setAuthUser] = useState<any>(null);
  const [dbUserId, setDbUserId] = useState<number | null>(null);
  const [commenterType, setCommenterType] = useState<"user" | "author" | "admin">("user");
  const [loggedInAuthorId, setLoggedInAuthorId] = useState<number | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  const isNovelAuthor = loggedInAuthorId !== null && loggedInAuthorId === novelAuthorId;

  // Delete dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [commentToDelete, setCommentToDelete] = useState<{ id: number; replyCount: number } | null>(null);

  // Comment input
  const [commentText, setCommentText] = useState("");
  const [isSpoiler, setIsSpoiler] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Reply
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [replyText, setReplyText] = useState("");
  const [replySpoiler, setReplySpoiler] = useState(false);
  const [replySubmitting, setReplySubmitting] = useState(false);

  // Auth check
  useEffect(() => {
    async function checkAuth() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setAuthUser(user);

      if (user) {
        // 0. Fetch user role to check if admin
        const { data: role } = await supabase.rpc("get_user_role", {
          check_auth_id: user.id,
        });
        const userIsAdmin = role === "admin";
        setIsAdmin(userIsAdmin);

        if (userIsAdmin) {
          // Fetch admin profile to get admin_id
          const { data: adminData } = await supabase
            .from("admin")
            .select("admin_id")
            .eq("auth_user_id", user.id)
            .maybeSingle();

          if (adminData) {
            setDbUserId(adminData.admin_id);
            setCommenterType("admin");
          }
        } else {
          // 1. Try author profile first (if they are an author)
          const { data: authorData } = await supabase
            .from("author")
            .select("author_id")
            .eq("auth_user_id", user.id)
            .maybeSingle();

          if (authorData) {
            setLoggedInAuthorId(authorData.author_id);
            setDbUserId(authorData.author_id);
            setCommenterType("author");
          } else {
            // 2. If not an author, try reader/user profile
            const { data: userData } = await supabase
              .from("users")
              .select("user_id")
              .eq("auth_user_id", user.id)
              .maybeSingle();
            
            if (userData) {
              setDbUserId(userData.user_id);
              setCommenterType("user");
            }
          }
        }
      }
    }
    checkAuth();
  }, [supabase]);

  // ─── Helper: check if a comment is owned by the current user ───
  const isOwnComment = useCallback((c: CommentWithUser) => {
    if (!dbUserId) return false;
    if (c.commenter_type !== commenterType) return false;
    switch (commenterType) {
      case "admin": return c.admin_id === dbUserId;
      case "author": return c.author_id === dbUserId;
      case "user": return c.user_id === dbUserId;
      default: return false;
    }
  }, [dbUserId, commenterType]);

  // Fetch comments — always fetch visible + hidden, filter on client side
  const fetchComments = useCallback(async () => {
    setLoading(true);

    const commentSelect = `
      comment_id,
      user_id,
      author_id,
      admin_id,
      commenter_type,
      chapter_id,
      parent_comment_id,
      comment_text,
      is_spoiler,
      comment_date,
      status,
      user:user_id (user_id, username, profile_image),
      author:author_id (author_id, username, pen_name, profile_image),
      admin:admin_id (admin_id, username, full_name)
    `;

    // Fetch top-level comments (visible + hidden)
    const { data: topLevel, count } = await supabase
      .from("comment")
      .select(commentSelect, { count: "exact" })
      .eq("chapter_id", chapterId)
      .is("parent_comment_id", null)
      .in("status", ["visible", "hidden"])
      .order("comment_date", { ascending: true });

    // Fetch all replies for this chapter (visible + hidden)
    const { data: replies } = await supabase
      .from("comment")
      .select(commentSelect)
      .eq("chapter_id", chapterId)
      .not("parent_comment_id", "is", null)
      .in("status", ["visible", "hidden"])
      .order("comment_date", { ascending: true });

    const isAuthorOrAdmin = isAdmin || (loggedInAuthorId !== null && loggedInAuthorId === novelAuthorId);

    // Client-side filter: show hidden comments only to (owner / novel author / admin)
    const canSeeHidden = (c: any): boolean => {
      if (c.status === "visible") return true;
      // Hidden comment: visible to moderators or owner
      if (isAuthorOrAdmin) return true;
      // Check if the logged-in user owns this hidden comment
      if (!dbUserId) return false;
      if (c.commenter_type === commenterType) {
        if (commenterType === "admin" && c.admin_id === dbUserId) return true;
        if (commenterType === "author" && c.author_id === dbUserId) return true;
        if (commenterType === "user" && c.user_id === dbUserId) return true;
      }
      return false;
    };

    const filteredTop = (topLevel || []).filter(canSeeHidden);
    const filteredReplies = (replies || []).filter(canSeeHidden);

    // Group replies by parent_comment_id
    const replyMap = new Map<number, CommentWithUser[]>();
    for (const r of filteredReplies) {
      const parentId = r.parent_comment_id!;
      if (!replyMap.has(parentId)) replyMap.set(parentId, []);
      replyMap.get(parentId)!.push({
        ...(r as any),
        replies: [],
      });
    }

    // Attach replies to top-level comments
    const structured: CommentWithUser[] = filteredTop.map((c: any) => ({
      ...c,
      replies: replyMap.get(c.comment_id) || [],
    }));

    setComments(structured);
    setTotalCount(count || 0);
    setLoading(false);
  }, [chapterId, supabase, loggedInAuthorId, novelAuthorId, isAdmin, dbUserId, commenterType]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  // Scroll to comment if comment_id query param is present
  useEffect(() => {
    if (loading || comments.length === 0) return;

    const urlParams = new URLSearchParams(window.location.search);
    const commentId = urlParams.get("comment_id");
    if (commentId) {
      setTimeout(() => {
        const element = document.getElementById(`comment-${commentId}`);
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "center" });
          element.classList.add("ring-2", "ring-[#e09050]", "rounded-xl", "p-2", "transition-all", "duration-1000");
          setTimeout(() => {
            element.classList.remove("ring-2", "ring-[#e09050]");
          }, 3000);
        }
      }, 500);
    }
  }, [loading, comments]);

  // Hide comment (Author/Admin moderation action)
  const handleHideComment = async (commentId: number) => {
    if (!window.confirm("คุณต้องการซ่อนความคิดเห็นนี้ใช่หรือไม่? การซ่อนจะทำให้ความคิดเห็นนี้และข้อความตอบกลับทั้งหมดไม่แสดงผลต่อสาธารณะ")) {
      return;
    }

    try {
      const res = await fetch(`/api/comments/${commentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "hidden" }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast.success("ซ่อนความคิดเห็นเรียบร้อยแล้ว");
      await fetchComments();
    } catch (err: any) {
      toast.error(err.message || "ซ่อนความคิดเห็นไม่สำเร็จ");
      console.error(err);
    }
  };

  // Unhide comment (Author/Admin moderation action)
  const handleUnhideComment = async (commentId: number) => {
    if (!window.confirm("คุณต้องการแสดงความคิดเห็นนี้อีกครั้งใช่หรือไม่?")) {
      return;
    }

    try {
      const res = await fetch(`/api/comments/${commentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "visible" }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast.success("แสดงความคิดเห็นเรียบร้อยแล้ว");
      await fetchComments();
    } catch (err: any) {
      toast.error(err.message || "ยกเลิกการซ่อนไม่สำเร็จ");
      console.error(err);
    }
  };

  // ─── Own-comment actions ───

  // Edit comment (Owner action)
  const handleEditComment = async (commentId: number, newText: string, isSpoiler: boolean): Promise<boolean> => {
    try {
      const res = await fetch(`/api/comments/${commentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ comment_text: newText, is_spoiler: isSpoiler }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast.success("แก้ไขความคิดเห็นเรียบร้อยแล้ว");
      await fetchComments();
      return true;
    } catch (err: any) {
      toast.error(err.message || "แก้ไขความคิดเห็นไม่สำเร็จ");
      console.error(err);
      return false;
    }
  };

  // Hide own comment (Owner action)
  const handleOwnHideComment = async (commentId: number) => {
    if (!window.confirm("คุณต้องการซ่อนความคิดเห็นนี้ใช่หรือไม่?")) {
      return;
    }

    try {
      const res = await fetch(`/api/comments/${commentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "hidden" }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast.success("ซ่อนความคิดเห็นของคุณเรียบร้อยแล้ว");
      await fetchComments();
    } catch (err: any) {
      toast.error(err.message || "ซ่อนความคิดเห็นไม่สำเร็จ");
      console.error(err);
    }
  };

  // Unhide own comment (Owner action)
  const handleOwnUnhideComment = async (commentId: number) => {
    if (!window.confirm("คุณต้องการแสดงความคิดเห็นนี้อีกครั้งใช่หรือไม่?")) {
      return;
    }

    try {
      const res = await fetch(`/api/comments/${commentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "visible" }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast.success("แสดงความคิดเห็นของคุณเรียบร้อยแล้ว");
      await fetchComments();
    } catch (err: any) {
      toast.error(err.message || "ยกเลิกการซ่อนไม่สำเร็จ");
      console.error(err);
    }
  };

  // Trigger own-delete dialog (Owner action)
  const triggerOwnDelete = (commentId: number, replyCount: number) => {
    setCommentToDelete({ id: commentId, replyCount });
    setDeleteDialogOpen(true);
  };

  // Trigger admin-delete dialog (Admin action)
  const triggerDelete = (commentId: number, replyCount: number) => {
    setCommentToDelete({ id: commentId, replyCount });
    setDeleteDialogOpen(true);
  };

  // Hard delete comment (shared handler for owner or admin)
  const handleDeleteComment = async () => {
    if (!commentToDelete) return;
    const commentId = commentToDelete.id;

    setDeleteDialogOpen(false);
    setLoading(true);

    try {
      // Use the unified /api/comments/[id] DELETE endpoint which checks ownership + admin
      const res = await fetch(`/api/comments/${commentId}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast.success(`ลบความคิดเห็นสำเร็จ (ลบทั้งหมด ${data.deletedCount} รายการ)`);
      await fetchComments();
    } catch (err: any) {
      toast.error(err.message || "ลบความคิดเห็นไม่สำเร็จ");
      console.error(err);
    } finally {
      setLoading(false);
      setCommentToDelete(null);
    }
  };

  // Submit comment
  const handleSubmit = async () => {
    if (!authUser) {
      toast.warning("กรุณาเข้าสู่ระบบก่อนแสดงความคิดเห็น");
      router.push("/login");
      return;
    }
    if (!commentText.trim() || !dbUserId) return;

    setSubmitting(true);
    const insertData: any = {
      chapter_id: chapterId,
      comment_text: commentText.trim(),
      is_spoiler: isSpoiler,
      commenter_type: commenterType,
    };

    if (commenterType === "admin") {
      insertData.admin_id = dbUserId;
    } else if (commenterType === "author") {
      insertData.author_id = dbUserId;
    } else {
      insertData.user_id = dbUserId;
    }

    const { error } = await supabase.from("comment").insert(insertData);

    if (error) {
      toast.error("ส่งความคิดเห็นไม่สำเร็จ");
      console.error(error);
    } else {
      toast.success("ส่งความคิดเห็นเรียบร้อย");
      setCommentText("");
      setIsSpoiler(false);
      await fetchComments();
    }
    setSubmitting(false);
  };

  // Submit reply
  const handleReplySubmit = async (parentId: number) => {
    if (!authUser) {
      toast.warning("กรุณาเข้าสู่ระบบก่อนตอบกลับ");
      router.push("/login");
      return;
    }
    if (!replyText.trim() || !dbUserId) return;

    setReplySubmitting(true);
    const insertData: any = {
      chapter_id: chapterId,
      parent_comment_id: parentId,
      comment_text: replyText.trim(),
      is_spoiler: replySpoiler,
      commenter_type: commenterType,
    };

    if (commenterType === "admin") {
      insertData.admin_id = dbUserId;
    } else if (commenterType === "author") {
      insertData.author_id = dbUserId;
    } else {
      insertData.user_id = dbUserId;
    }

    const { error } = await supabase.from("comment").insert(insertData);

    if (error) {
      toast.error("ส่งการตอบกลับไม่สำเร็จ");
      console.error(error);
    } else {
      toast.success("ตอบกลับเรียบร้อย");
      setReplyText("");
      setReplySpoiler(false);
      setReplyingTo(null);
      await fetchComments();
    }
    setReplySubmitting(false);
  };

  // Determine which comments to show (load-more from the END, since sorted ASC)
  const hiddenCount = Math.max(0, comments.length - displayCount);
  const visibleComments = comments.slice(hiddenCount);

  const t = commentThemes[theme];

  return (
    <div className={`mt-10 border-t ${t.border} pt-8`}>
      {/* Header */}
      <div className="flex items-center gap-2 mb-6">
        <MessageCircle className="h-5 w-5 text-[#e09050]" />
        <h2 className={`text-base font-bold ${t.text}`}>
          ความคิดเห็น ({totalCount})
        </h2>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex gap-3 animate-pulse">
              <div className={`h-8 w-8 rounded-full ${theme === "dark" ? "bg-white/10" : "bg-black/10"}`} />
              <div className="flex-1 space-y-2">
                <div className={`h-3 w-24 rounded ${theme === "dark" ? "bg-white/10" : "bg-black/10"}`} />
                <div className={`h-3 w-full rounded ${theme === "dark" ? "bg-white/5" : "bg-black/5"}`} />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <>
          {/* Load earlier comments */}
          {hiddenCount > 0 && (
            <button
              onClick={() =>
                setDisplayCount((prev) =>
                  Math.min(prev + COMMENTS_PER_PAGE, comments.length)
                )
              }
              className={`w-full mb-4 py-2 text-xs border rounded-lg transition-colors cursor-pointer ${t.muted} ${t.border} hover:text-[#e09050] hover:border-[#e09050]/30`}
            >
              อ่านความคิดเห็นก่อนหน้า ({hiddenCount} รายการ)
            </button>
          )}

          {/* Comments */}
          <div className="space-y-5">
            {visibleComments.map((comment) => (
              <div key={comment.comment_id} id={`comment-${comment.comment_id}`}>
                <CommentCard
                  comment={comment}
                  theme={theme}
                  isNovelAuthor={isNovelAuthor || isAdmin}
                  isAdmin={isAdmin}
                  currentUserId={dbUserId}
                  currentCommenterType={commenterType}
                  onHide={handleHideComment}
                  onUnhide={handleUnhideComment}
                  onDelete={triggerDelete}
                  onEdit={handleEditComment}
                  onOwnHide={handleOwnHideComment}
                  onOwnUnhide={handleOwnUnhideComment}
                  onOwnDelete={triggerOwnDelete}
                  onReply={(parentId) => {
                    setReplyingTo(
                      replyingTo === parentId ? null : parentId
                    );
                    setReplyText("");
                    setReplySpoiler(false);
                  }}
                />

                {/* Inline reply input */}
                {replyingTo === comment.comment_id && (
                  <div className="ml-11 mt-3 pl-4 border-l-2 border-[#e09050]/30">
                    <div className="flex gap-2">
                      <div className="shrink-0 mt-1">
                        <div className="h-6 w-6 rounded-full bg-[#e09050]/20 flex items-center justify-center">
                          <User className="h-3 w-3 text-[#e09050]" />
                        </div>
                      </div>
                      <div className="flex-1 space-y-2">
                        <textarea
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value.slice(0, MAX_COMMENT_LENGTH))}
                          placeholder="ตอบกลับ..."
                          rows={2}
                          className={`w-full border rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 resize-none ${t.bgInput} ${t.border} ${t.textareaBorder}`}
                        />
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setReplySpoiler(!replySpoiler)}
                              className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] transition-colors cursor-pointer ${
                                replySpoiler ? t.buttonBgActive : t.buttonBg
                              }`}
                            >
                              <Smile className="h-3 w-3" />
                              สปอยล์
                            </button>
                            <span className={`text-[10px] ${t.muted} opacity-70`}>
                              {replyText.length}/{MAX_COMMENT_LENGTH}
                            </span>
                          </div>
                          <button
                            onClick={() => handleReplySubmit(comment.comment_id)}
                            disabled={
                              !replyText.trim() || replySubmitting
                            }
                            className="p-1.5 rounded-full bg-[#e09050] text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[#c97c3a] transition-colors cursor-pointer"
                          >
                            <Send className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {comments.length === 0 && (
            <p className={`text-center text-xs py-8 ${t.muted}`}>
              ยังไม่มีความคิดเห็น — เป็นคนแรกที่แสดงความคิดเห็นสิ!
            </p>
          )}
        </>
      )}

      {/* ─── Comment input box ─── */}
      <div className={`mt-8 border-t ${t.border} pt-6`}>
        <div className="flex gap-3">
          <div className="shrink-0 mt-1">
            <div className="h-8 w-8 rounded-full bg-[#e09050]/20 flex items-center justify-center">
              <User className="h-4 w-4 text-[#e09050]" />
            </div>
          </div>
          <div className="flex-1 space-y-2">
            <textarea
              value={commentText}
              onChange={(e) => setCommentText(e.target.value.slice(0, MAX_COMMENT_LENGTH))}
              placeholder={
                authUser
                  ? "แสดงความคิดเห็น..."
                  : "เข้าสู่ระบบเพื่อแสดงความคิดเห็น"
              }
              rows={3}
              className={`w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 resize-none ${t.bgInput} ${t.border} ${t.textareaBorder}`}
              onFocus={() => {
                if (!authUser) {
                  toast.warning("กรุณาเข้าสู่ระบบก่อนแสดงความคิดเห็น");
                  router.push("/login");
                }
              }}
            />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setIsSpoiler(!isSpoiler)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs transition-colors cursor-pointer ${
                    isSpoiler ? t.buttonBgActive : t.buttonBg
                  }`}
                >
                  <Smile className="h-3.5 w-3.5" />
                  สปอยล์
                </button>
                <span className={`text-[11px] ${t.muted} opacity-70`}>
                  {commentText.length}/{MAX_COMMENT_LENGTH}
                </span>
              </div>
              <button
                onClick={handleSubmit}
                disabled={!commentText.trim() || submitting}
                className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#e09050] text-white text-xs font-semibold disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[#c97c3a] transition-colors cursor-pointer"
              >
                <Send className="h-3.5 w-3.5" />
                ส่ง
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Comment Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteDialogOpen}
        title="ยืนยันการลบความคิดเห็น"
        message={
          commentToDelete && commentToDelete.replyCount > 0
            ? `ต้องการลบความคิดเห็นนี้ใช่หรือไม่?\nการลบจะลบข้อความตอบกลับทั้งหมด ${commentToDelete.replyCount} รายการไปด้วยอย่างถาวรและไม่สามารถกู้คืนได้`
            : "ต้องการลบความคิดเห็นนี้ใช่หรือไม่?\nการลบนี้เป็นแบบถาวรและไม่สามารถกู้คืนได้"
        }
        confirmText="ลบความคิดเห็น"
        cancelText="ยกเลิก"
        onConfirm={handleDeleteComment}
        onCancel={() => {
          setDeleteDialogOpen(false);
          setCommentToDelete(null);
        }}
      />
    </div>
  );
}
