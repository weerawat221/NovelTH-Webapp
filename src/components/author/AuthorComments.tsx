"use client";

import { useState } from "react";
import { Bell, MessageCircle, ArrowLeft, ArrowUpDown, ChevronRight, User, CheckCheck, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { relativeTime } from "@/lib/utils/relativeTime";

interface CommentNotification {
  comment_id: number;
  comment_text: string;
  comment_date: string;
  is_spoiler: boolean;
  parent_comment_id: number | null;
  user_id: number;
  username: string;
  profile_image: string | null;
  parent_user_id: number | null;
  chapter_id: number;
  chapter_no: number;
  chapter_title: string;
  novel_id: number;
  novel_name: string;
  is_read: boolean;
}

interface Novel {
  novel_id: number;
  novel_name: string;
}

interface AuthorCommentsProps {
  initialComments: CommentNotification[];
  novels: Novel[];
  authorId: number;
  dbUserId: number | null;
}

const COMMENTS_PER_PAGE = 10;

export default function AuthorComments({ initialComments, novels, authorId, dbUserId }: AuthorCommentsProps) {
  const [comments, setComments] = useState<CommentNotification[]>(initialComments);
  const [selectedNovelId, setSelectedNovelId] = useState<string>("all");
  const [displayCount, setDisplayCount] = useState(COMMENTS_PER_PAGE);
  const [markingAll, setMarkingAll] = useState(false);

  const supabase = createClient();
  const router = useRouter();

  // Filter Comments
  const filteredComments = comments.filter((c) => {
    if (selectedNovelId === "all") return true;
    return c.novel_id === parseInt(selectedNovelId, 10);
  });

  const unreadCount = filteredComments.filter((c) => !c.is_read).length;

  // Mark all as read
  const handleMarkAllAsRead = async () => {
    const unread = filteredComments.filter((c) => !c.is_read);
    if (unread.length === 0) return;

    setMarkingAll(true);
    try {
      const inserts = unread.map((c) => ({
        author_id: authorId,
        comment_id: c.comment_id,
      }));

      const { error } = await supabase
        .from("notification_read_status")
        .insert(inserts);

      if (error) throw error;

      // Update state local
      setComments((prev) =>
        prev.map((c) => {
          const isTargeted = unread.some((u) => u.comment_id === c.comment_id);
          if (isTargeted) {
            return { ...c, is_read: true };
          }
          return c;
        })
      );
      toast.success("ทำเครื่องหมายว่าอ่านแล้วทั้งหมดเรียบร้อย");
      router.refresh();
    } catch (err) {
      console.error(err);
      toast.error("ดำเนินการไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
    } finally {
      setMarkingAll(false);
    }
  };

  // Mark single as read and navigate
  const handleCommentClick = async (c: CommentNotification) => {
    if (!c.is_read) {
      try {
        await supabase
          .from("notification_read_status")
          .insert({
            author_id: authorId,
            comment_id: c.comment_id,
          });

        setComments((prev) =>
          prev.map((item) =>
            item.comment_id === c.comment_id ? { ...item, is_read: true } : item
          )
        );
        router.refresh();
      } catch (err) {
        console.error("Error marking comment as read:", err);
      }
    }

    // Navigate to chapter page with comment hash
    router.push(`/novel/${c.novel_id}/chapter/${c.chapter_no}?comment_id=${c.comment_id}`);
  };

  // Pagination
  const visibleComments = filteredComments.slice(0, displayCount);
  const hasMore = filteredComments.length > displayCount;

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
      {/* ─── Back Link ─── */}
      <div className="mb-6">
        <Link
          href="/author/dashboard"
          className="inline-flex items-center gap-1.5 text-xs text-white/40 hover:text-white/80 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>กลับไปหน้าแดชบอร์ด</span>
        </Link>
      </div>

      {/* ─── Header ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-white/5 mb-8">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-[#e09050]/10 flex items-center justify-center text-[#e09050]">
            <Bell className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-extrabold text-white/90">
                ความคิดเห็นล่าสุด
              </h1>
              {unreadCount > 0 && (
                <span className="inline-flex px-2 py-0.5 rounded-full bg-red-500 text-white text-[10px] font-bold">
                  ใหม่ {unreadCount}
                </span>
              )}
            </div>
            <p className="text-xs text-white/40 mt-1">
              ติดตามและตอบกลับความคิดเห็นจากนักอ่านของคุณ
            </p>
          </div>
        </div>

        {/* Mark All as Read Button */}
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllAsRead}
            disabled={markingAll}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl border border-[#e09050]/30 hover:border-[#e09050]/50 text-[#e09050] hover:text-[#c97c3a] disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
          >
            {markingAll ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <CheckCheck className="h-3.5 w-3.5" />
            )}
            <span>ทำเครื่องหมายว่าอ่านแล้วทั้งหมด</span>
          </button>
        )}
      </div>

      {/* ─── Filters Bar ─── */}
      <div className="flex items-center gap-2 mb-6 bg-[#171513]/40 border border-white/5 rounded-2xl p-4 backdrop-blur-md">
        <span className="text-xs text-white/40 flex items-center gap-1 shrink-0">
          <MessageCircle className="h-3.5 w-3.5" />
          กรองตามนิยาย:
        </span>
        <select
          value={selectedNovelId}
          onChange={(e) => {
            setSelectedNovelId(e.target.value);
            setDisplayCount(COMMENTS_PER_PAGE);
          }}
          className="bg-[#1c1917] border border-white/5 text-white/80 text-xs font-semibold rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-accent/50 cursor-pointer max-w-xs"
        >
          <option value="all">ทุกเรื่อง</option>
          {novels.map((novel) => (
            <option key={novel.novel_id} value={novel.novel_id}>
              {novel.novel_name}
            </option>
          ))}
        </select>
      </div>

      {/* ─── Feed List ─── */}
      {visibleComments.length > 0 ? (
        <div className="space-y-4">
          {visibleComments.map((c) => {
            const isReplyToAuthor = c.parent_comment_id !== null && c.parent_user_id === dbUserId;
            return (
              <div
                key={c.comment_id}
                onClick={() => handleCommentClick(c)}
                className={`bg-[#171513]/40 hover:bg-white/[0.02] border rounded-2xl p-4 flex gap-4 backdrop-blur-md cursor-pointer transition-all duration-200 ${
                  !c.is_read ? "border-l-4 border-l-[#e09050] border-white/10" : "border-white/5"
                }`}
              >
                {/* Avatar */}
                <div className="shrink-0 mt-0.5">
                  {c.profile_image ? (
                    <img
                      src={c.profile_image}
                      alt=""
                      className="h-9 w-9 rounded-full object-cover"
                    />
                  ) : (
                    <div className="h-9 w-9 rounded-full bg-white/5 flex items-center justify-center border border-white/10">
                      <User className="h-4.5 w-4.5 text-white/30" />
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-sm font-bold text-white/90">
                        {c.username}
                      </span>
                      {isReplyToAuthor && (
                        <span className="inline-flex px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-500 text-[9px] font-semibold border border-amber-500/20">
                          ตอบกลับความคิดเห็นของคุณ
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-white/30 shrink-0">
                      {relativeTime(c.comment_date)}
                    </span>
                  </div>

                  <p className="text-xs text-white/50 mt-1 leading-relaxed">
                    แสดงความคิดเห็นใน{" "}
                    <span className="text-white/80 font-bold">{c.novel_name}</span>{" "}
                    ตอนที่ {c.chapter_no} {c.chapter_title ? `: ${c.chapter_title}` : ""}
                  </p>

                  <p className="text-sm text-white/70 mt-2.5 leading-relaxed bg-[#141210]/40 p-3 rounded-xl border border-white/5 line-clamp-2 break-words">
                    {c.is_spoiler ? "⚠️ ข้อความนี้มีสปอยล์ (คลิกเพื่อเปิดดูในบทอ่าน)" : c.comment_text}
                  </p>
                </div>

                {/* Chevron icon */}
                <div className="shrink-0 flex items-center self-center text-white/20 hover:text-white/60 transition-colors">
                  <ChevronRight className="h-5 w-5" />
                </div>
              </div>
            );
          })}

          {/* Load More Button */}
          {hasMore && (
            <button
              onClick={() => setDisplayCount((prev) => prev + COMMENTS_PER_PAGE)}
              className="w-full py-3 text-xs text-white/40 hover:text-[#e09050] border border-white/5 rounded-xl hover:bg-white/[0.01] transition-colors cursor-pointer"
            >
              แสดงความคิดเห็นเพิ่มเติม
            </button>
          )}
        </div>
      ) : (
        /* ─── Empty State ─── */
        <div className="text-center py-16 border border-dashed border-white/10 rounded-2xl bg-white/[0.01] max-w-md mx-auto">
          <MessageCircle className="h-12 w-12 text-[#e09050]/40 mx-auto mb-4" />
          <h3 className="text-base font-bold text-white/80">ยังไม่มีความคิดเห็นใหม่</h3>
          <p className="text-xs text-white/40 mt-1 max-w-xs mx-auto px-4">
            หากมีนักอ่านแสดงความคิดเห็นในผลงานของคุณ การแจ้งเตือนจะแสดงผลขึ้นที่นี่ทันที!
          </p>
        </div>
      )}
    </div>
  );
}
