"use client";

import { useState, useEffect } from "react";
import { Plus, Edit, Trash2, ArrowLeft, Eye, Clock, BookOpen, ChevronRight, Calendar } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import { relativeTime } from "@/lib/utils/relativeTime";
import { isChapterPublished, normalizeUtcTimestamp, syncScheduledChapters } from "@/lib/utils/chapterPublish";

interface ChapterItem {
  chapter_id: number;
  chapter_no: number;
  chapter_title: string;
  status: "draft" | "published" | "scheduled";
  published_at: string | null;
  scheduled_at: string | null;
  view_count: number;
}

interface ChapterManagerProps {
  initialChapters: ChapterItem[];
  novel: {
    novel_id: number;
    novel_name: string;
  };
}

export default function ChapterManager({ initialChapters, novel }: ChapterManagerProps) {
  const [chapters, setChapters] = useState<ChapterItem[]>(initialChapters);
  const [chapterToDelete, setChapterToDelete] = useState<ChapterItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const supabase = createClient();

  // Background sync for any due scheduled chapters
  useEffect(() => {
    const hasScheduled = chapters.some((c) => c.status === "scheduled");
    if (hasScheduled) {
      syncScheduledChapters(supabase);
    }
  }, [chapters, supabase]);

  // Handle Delete Chapter
  const handleDeleteConfirm = async () => {
    if (!chapterToDelete) return;
    setIsDeleting(true);

    try {
      const { error } = await supabase
        .from("chapter")
        .delete()
        .eq("chapter_id", chapterToDelete.chapter_id);

      if (error) throw error;

      // Bump novel updated_at so the dashboard reflects the change
      await supabase
        .from("novel")
        .update({ updated_at: new Date().toISOString() })
        .eq("novel_id", novel.novel_id);

      toast.success(`ลบตอนที่ ${chapterToDelete.chapter_no} "${chapterToDelete.chapter_title}" สำเร็จแล้ว`);
      setChapters((prev) => prev.filter((c) => c.chapter_id !== chapterToDelete.chapter_id));
    } catch (err) {
      console.error(err);
      toast.error("ลบตอนไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
    } finally {
      setIsDeleting(false);
      setChapterToDelete(null);
    }
  };

  // Status badges config
  const statusConfig = {
    published: { label: "เผยแพร่แล้ว", classes: "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" },
    scheduled: { label: "ตั้งเวลา", classes: "bg-blue-500/10 text-blue-400 border border-blue-500/20" },
    draft: { label: "ฉบับร่าง", classes: "bg-gray-500/10 text-gray-400 border border-gray-500/20" },
  };

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
      {/* ─── Back Link ─── */}
      <div className="mb-6">
        <Link
          href="/author/dashboard"
          className="inline-flex items-center gap-1.5 text-xs text-white/40 hover:text-white/80 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>กลับไปแดชบอร์ด</span>
        </Link>
      </div>

      {/* ─── Header ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-white/5 mb-8">
        <div>
          <span className="text-xs text-accent font-semibold uppercase tracking-wider block">
            การจัดการตอน
          </span>
          <h1 className="text-xl sm:text-2xl font-extrabold text-white/90 mt-1">
            {novel.novel_name}
          </h1>
          <p className="text-xs text-white/40 mt-1">
            มีทั้งหมด {chapters.length} ตอน
          </p>
        </div>
        <Link
          href={`/author/novel/${novel.novel_id}/chapter/new`}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-accent to-[#e59b5d] hover:from-accent-hover hover:to-[#d08546] text-white font-semibold text-xs sm:text-sm shadow-md hover:shadow-lg transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
        >
          <Plus className="h-4.5 w-4.5" />
          <span>เขียนตอนใหม่</span>
        </Link>
      </div>

      {/* ─── Chapter List ─── */}
      {chapters.length > 0 ? (
        <div className="bg-[#171513]/40 border border-white/5 rounded-2xl overflow-hidden backdrop-blur-md divide-y divide-white/5">
          {chapters.map((chapter) => {
            const isPublished = isChapterPublished(chapter);
            const displayStatus: "draft" | "published" | "scheduled" = isPublished ? "published" : chapter.status;
            const status = statusConfig[displayStatus] || {
              label: displayStatus,
              classes: "bg-gray-500/10 text-gray-500",
            };
            return (
              <div 
                key={chapter.chapter_id} 
                className="p-4 sm:p-5 flex items-center justify-between gap-4 hover:bg-white/[0.01] transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="text-xs font-bold text-accent">
                      ตอนที่ {chapter.chapter_no}
                    </span>
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${status.classes}`}>
                      {status.label}
                    </span>
                  </div>
                  
                  <h3 className="font-bold text-white/90 text-sm sm:text-base mt-1 truncate">
                    {chapter.chapter_title}
                  </h3>

                  <div className="flex items-center gap-4 mt-2 text-[11px] text-white/40">
                    <span className="flex items-center gap-1">
                      <Eye className="h-3.5 w-3.5" />
                      {chapter.view_count.toLocaleString("th-TH")} วิว
                    </span>
                    {displayStatus === "published" && (chapter.published_at || chapter.scheduled_at) && (
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        เผยแพร่ {relativeTime(chapter.published_at || chapter.scheduled_at!)}
                      </span>
                    )}
                    {displayStatus === "scheduled" && chapter.scheduled_at && (
                      <span className="flex items-center gap-1 text-blue-400/80">
                        <Calendar className="h-3.5 w-3.5" />
                        จะเผยแพร่ {new Date(normalizeUtcTimestamp(chapter.scheduled_at)).toLocaleString("th-TH")}
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <Link
                    href={`/author/novel/${novel.novel_id}/chapter/${chapter.chapter_id}/edit`}
                    className="p-2 rounded-xl border border-white/5 bg-white/5 text-white/75 hover:text-white hover:bg-white/10 transition-colors"
                    title="แก้ไขข้อมูลตอน"
                  >
                    <Edit className="h-4 w-4" />
                  </Link>
                  <button
                    onClick={() => setChapterToDelete(chapter)}
                    className="p-2 rounded-xl border border-white/5 bg-red-500/5 text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors cursor-pointer"
                    title="ลบตอน"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Empty State */
        <div className="text-center py-16 border border-dashed border-white/10 rounded-2xl bg-white/[0.01] max-w-md mx-auto">
          <BookOpen className="h-12 w-12 text-[#e09050]/40 mx-auto mb-4" />
          <h3 className="text-base font-bold text-white/80">ยังไม่มีตอนในระบบ</h3>
          <p className="text-xs text-white/40 mt-1 max-w-xs mx-auto px-4">
            นิยายเรื่องนี้ยังไม่มีตอนใดๆ เขียนตอนแรกเพื่อต้อนรับนักอ่านของคุณได้ทันที!
          </p>
          <div className="mt-6">
            <Link
              href={`/author/novel/${novel.novel_id}/chapter/new`}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-[#e09050] text-white hover:bg-[#c97c3a] transition-all duration-200"
            >
              <Plus className="h-4 w-4" />
              <span>เขียนตอนแรก</span>
            </Link>
          </div>
        </div>
      )}

      {/* Confirm Deletion Modal */}
      <ConfirmDialog
        isOpen={!!chapterToDelete}
        title="ยืนยันการลบตอนนิยาย?"
        message={`คุณกำลังจะลบตอนที่ ${chapterToDelete?.chapter_no} "${chapterToDelete?.chapter_title}" \n\n⚠️ การกระทำนี้จะไม่สามารถย้อนกลับได้ และเนื้อหาของตอนนี้รวมถึงความคิดเห็นทั้งหมดจะถูกลบอย่างถาวร`}
        confirmText={isDeleting ? "กำลังลบ..." : "ลบข้อมูลตอน"}
        cancelText="ยกเลิก"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setChapterToDelete(null)}
      />
    </div>
  );
}
