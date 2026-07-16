"use client";

import { useState } from "react";
import { Plus, MoreVertical, Edit, Trash2, Eye, BookOpen, Clock, Calendar, List, ArrowUpDown } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import { relativeTime } from "@/lib/utils/relativeTime";

interface Novel {
  novel_id: number;
  novel_name: string;
  cover_image: string | null;
  status: "ongoing" | "completed" | "draft";
  updated_at: string;
  category_id: number;
  category_name: string;
  total_chapters: number;
  total_views: number;
}

interface AuthorDashboardProps {
  initialNovels: Novel[];
  author: any;
}

type FilterStatus = "all" | "ongoing" | "completed" | "draft";
type SortOption = "recent" | "views" | "title";

export default function AuthorDashboard({ initialNovels, author }: AuthorDashboardProps) {
  const [novels, setNovels] = useState<Novel[]>(initialNovels);
  const [filter, setFilter] = useState<FilterStatus>("all");
  const [sortBy, setSortBy] = useState<SortOption>("recent");
  
  // Dropdown state
  const [openDropdownId, setOpenDropdownId] = useState<number | null>(null);
  
  // Confirm delete state
  const [novelToDelete, setNovelToDelete] = useState<Novel | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const supabase = createClient();

  // Handle Delete
  const handleDeleteConfirm = async () => {
    if (!novelToDelete) return;
    setIsDeleting(true);

    try {
      // 1. Delete novel cover image from storage if it is stored in our bucket
      if (novelToDelete.cover_image && novelToDelete.cover_image.includes("/storage/v1/object/public/covers/")) {
        const fileUrlParts = novelToDelete.cover_image.split("/covers/");
        if (fileUrlParts.length > 1) {
          const filePath = fileUrlParts[1];
          await supabase.storage.from("covers").remove([filePath]);
        }
      }

      // 2. Delete from database
      const { error } = await supabase
        .from("novel")
        .delete()
        .eq("novel_id", novelToDelete.novel_id);

      if (error) throw error;

      toast.success(`ลบเรื่อง "${novelToDelete.novel_name}" สำเร็จแล้ว`);
      setNovels((prev) => prev.filter((n) => n.novel_id !== novelToDelete.novel_id));
    } catch (err) {
      console.error(err);
      toast.error("ลบข้อมูลไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
    } finally {
      setIsDeleting(false);
      setNovelToDelete(null);
      setOpenDropdownId(null);
    }
  };

  // Filter & Sort Logic
  const filteredNovels = novels.filter((n) => {
    if (filter === "all") return true;
    return n.status === filter;
  });

  const sortedNovels = [...filteredNovels].sort((a, b) => {
    if (sortBy === "recent") {
      const toUtc = (s: string) => new Date(s.endsWith("Z") || s.includes("+") ? s : s.replace(" ", "T") + "Z");
      return toUtc(b.updated_at).getTime() - toUtc(a.updated_at).getTime();
    }
    if (sortBy === "views") {
      return b.total_views - a.total_views;
    }
    if (sortBy === "title") {
      return a.novel_name.localeCompare(b.novel_name, "th");
    }
    return 0;
  });

  // Status badges config
  const statusConfig = {
    ongoing: { label: "กำลังแต่ง", classes: "bg-amber-500/10 text-amber-500 border border-amber-500/20" },
    completed: { label: "จบแล้ว", classes: "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" },
    draft: { label: "ฉบับร่าง", classes: "bg-gray-500/10 text-gray-400 border border-gray-500/20" },
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      
      {/* ─── Header ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-white/5 mb-8">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-white/90">
            นิยายของฉัน
          </h1>
          <p className="text-xs text-white/40 mt-1">
            มีทั้งหมด {novels.length} เรื่อง ({author.pen_name})
          </p>
        </div>
        <Link
          href="/author/novel/new"
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-accent to-[#e59b5d] hover:from-accent-hover hover:to-[#d08546] text-white font-semibold text-xs sm:text-sm shadow-md hover:shadow-lg transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
        >
          <Plus className="h-4.5 w-4.5" />
          <span>เขียนนิยายเรื่องใหม่</span>
        </Link>
      </div>

      {/* ─── Filters & Sort ─── */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center mb-6">
        {/* Status Tabs */}
        <div className="flex bg-[#1c1917] p-1 rounded-xl border border-white/5 w-full md:w-auto overflow-x-auto">
          {(["all", "ongoing", "completed", "draft"] as const).map((tab) => {
            const labelMap = {
              all: "ทั้งหมด",
              ongoing: "กำลังแต่ง",
              completed: "จบแล้ว",
              draft: "ฉบับร่าง",
            };
            return (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex-1 md:flex-none ${
                  filter === tab
                    ? "bg-[#e09050] text-white shadow-sm"
                    : "text-white/40 hover:text-white/80"
                }`}
              >
                {labelMap[tab]}
              </button>
            );
          })}
        </div>

        {/* Sort Dropdown */}
        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
          <span className="text-xs text-white/40 flex items-center gap-1">
            <ArrowUpDown className="h-3.5 w-3.5" />
            เรียงตาม:
          </span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="bg-[#1c1917] border border-white/5 text-white/80 text-xs font-semibold rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-accent/50 cursor-pointer"
          >
            <option value="recent">แก้ไขล่าสุด</option>
            <option value="views">ยอดเข้าชมมากสุด</option>
            <option value="title">ชื่อ A-Z</option>
          </select>
        </div>
      </div>

      {/* ─── Novel List ─── */}
      {sortedNovels.length > 0 ? (
        <>
          {/* Desktop Table View */}
          <div className="hidden md:block bg-[#171513]/40 border border-white/5 rounded-2xl backdrop-blur-md">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/5 text-white/40 text-[11px] font-bold uppercase tracking-wider bg-white/[0.01]">
                  <th className="py-4 px-6">เรื่อง</th>
                  <th className="py-4 px-6 text-center">สถานะ</th>
                  <th className="py-4 px-6 text-center">จำนวนตอน</th>
                  <th className="py-4 px-6 text-center">ยอดเข้าชม</th>
                  <th className="py-4 px-6">แก้ไขล่าสุด</th>
                  <th className="py-4 px-6 text-right">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-sm text-white/80">
                {sortedNovels.map((novel) => {
                  const status = statusConfig[novel.status] || {
                    label: novel.status,
                    classes: "bg-gray-500/10 text-gray-500",
                  };
                  return (
                    <tr key={novel.novel_id} className="hover:bg-white/[0.01] transition-colors group">
                      {/* Novel Title & Cover */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-4">
                          <Link 
                            href={`/author/novel/${novel.novel_id}/chapters`}
                            className="relative h-14 w-10 shrink-0 rounded-lg overflow-hidden bg-white/5 border border-white/10 shadow-md group-hover:scale-105 transition-transform"
                          >
                            {novel.cover_image ? (
                              <img
                                src={novel.cover_image}
                                alt={novel.novel_name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full bg-gradient-to-br from-neutral-800 to-neutral-900 flex items-center justify-center text-[10px] text-white/30 font-semibold p-1 text-center">
                                Cover
                              </div>
                            )}
                          </Link>
                          <div className="min-w-0">
                            <Link
                              href={`/author/novel/${novel.novel_id}/chapters`}
                              className="font-bold text-white/90 hover:text-accent transition-colors truncate block"
                            >
                              {novel.novel_name}
                            </Link>
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-white/5 text-white/40 mt-1 border border-white/5">
                              {novel.category_name}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-4 px-6 text-center">
                        <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-bold ${status.classes}`}>
                          {status.label}
                        </span>
                      </td>

                      {/* Chapters */}
                      <td className="py-4 px-6 text-center font-semibold">
                        {novel.total_chapters.toLocaleString("th-TH")} ตอน
                      </td>

                      {/* Views */}
                      <td className="py-4 px-6 text-center text-white/60">
                        <span className="inline-flex items-center gap-1">
                          <Eye className="h-3.5 w-3.5 text-accent" />
                          {novel.total_views.toLocaleString("th-TH")}
                        </span>
                      </td>

                      {/* Last Modified */}
                      <td className="py-4 px-6 text-xs text-white/40">
                        {relativeTime(novel.updated_at)}
                      </td>

                      {/* Action Menu */}
                      <td className="py-4 px-6 text-right relative">
                        <button
                          onClick={() => setOpenDropdownId(openDropdownId === novel.novel_id ? null : novel.novel_id)}
                          className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
                        >
                          <MoreVertical className="h-4.5 w-4.5" />
                        </button>
                        {openDropdownId === novel.novel_id && (
                          <>
                            <div 
                              className="fixed inset-0 z-25" 
                              onClick={() => setOpenDropdownId(null)}
                            />
                            <div className="absolute right-6 top-12 bg-[#1c1917] border border-white/10 rounded-xl py-1.5 w-44 shadow-2xl z-30 animate-in fade-in slide-in-from-top-1 duration-100">
                              <Link
                                href={`/author/novel/${novel.novel_id}/edit`}
                                className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white/70 hover:text-white hover:bg-white/5 transition-colors"
                              >
                                <Edit className="h-3.5 w-3.5 text-blue-400" />
                                แก้ไขข้อมูลเรื่อง
                              </Link>
                              <Link
                                href={`/author/novel/${novel.novel_id}/chapters`}
                                className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white/70 hover:text-white hover:bg-white/5 transition-colors"
                              >
                                <BookOpen className="h-3.5 w-3.5 text-emerald-400" />
                                จัดการตอน
                              </Link>
                              <hr className="my-1 border-white/5" />
                              <button
                                onClick={() => {
                                  setNovelToDelete(novel);
                                  setOpenDropdownId(null);
                                }}
                                className="w-full flex items-center gap-2 px-4 py-2 text-xs font-semibold text-red-400 hover:text-red-300 hover:bg-red-500/5 transition-colors text-left cursor-pointer"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                                ลบเรื่อง
                              </button>
                            </div>
                          </>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="grid grid-cols-1 gap-4 md:hidden">
            {sortedNovels.map((novel) => {
              const status = statusConfig[novel.status] || {
                label: novel.status,
                classes: "bg-gray-500/10 text-gray-500",
              };
              return (
                <div 
                  key={novel.novel_id} 
                  className="bg-[#171513]/40 border border-white/5 rounded-2xl p-4 flex gap-4 backdrop-blur-md relative"
                >
                  <Link 
                    href={`/author/novel/${novel.novel_id}/chapters`}
                    className="relative h-20 w-14 shrink-0 rounded-lg overflow-hidden bg-white/5 border border-white/10 shadow-sm"
                  >
                    {novel.cover_image ? (
                      <img
                        src={novel.cover_image}
                        alt={novel.novel_name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-neutral-800 to-neutral-900 flex items-center justify-center text-[10px] text-white/30 font-semibold p-1 text-center">
                        Cover
                      </div>
                    )}
                  </Link>

                  <div className="flex-1 min-w-0 flex flex-col justify-between pr-6">
                    <div>
                      <Link
                        href={`/author/novel/${novel.novel_id}/chapters`}
                        className="font-bold text-white/90 hover:text-accent transition-colors block text-sm line-clamp-1"
                      >
                        {novel.novel_name}
                      </Link>
                      <div className="flex flex-wrap items-center gap-2 mt-1.5">
                        <span className="inline-flex px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-white/5 text-white/40 border border-white/5">
                          {novel.category_name}
                        </span>
                        <span className={`inline-flex px-1.5 py-0.5 rounded-full text-[9px] font-bold ${status.classes}`}>
                          {status.label}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 mt-2.5 text-xs text-white/40">
                      <span className="flex items-center gap-1 font-semibold text-white/60">
                        <BookOpen className="h-3.5 w-3.5 text-white/40" />
                        {novel.total_chapters} ตอน
                      </span>
                      <span className="flex items-center gap-1">
                        <Eye className="h-3.5 w-3.5 text-accent" />
                        {novel.total_views} วิว
                      </span>
                    </div>
                  </div>

                  {/* Actions Dropdown for Mobile */}
                  <div className="absolute right-3 top-3">
                    <button
                      onClick={() => setOpenDropdownId(openDropdownId === novel.novel_id ? null : novel.novel_id)}
                      className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </button>
                    {openDropdownId === novel.novel_id && (
                      <>
                        <div 
                          className="fixed inset-0 z-25" 
                          onClick={() => setOpenDropdownId(null)}
                        />
                        <div className="absolute right-0 top-8 bg-[#1c1917] border border-white/10 rounded-xl py-1.5 w-40 shadow-2xl z-30 animate-in fade-in slide-in-from-top-1 duration-100">
                          <Link
                            href={`/author/novel/${novel.novel_id}/edit`}
                            className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-white/70 hover:text-white hover:bg-white/5"
                          >
                            <Edit className="h-3.5 w-3.5 text-blue-400" />
                            แก้ไขข้อมูล
                          </Link>
                          <Link
                            href={`/author/novel/${novel.novel_id}/chapters`}
                            className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-white/70 hover:text-white hover:bg-white/5"
                          >
                            <BookOpen className="h-3.5 w-3.5 text-emerald-400" />
                            จัดการตอน
                          </Link>
                          <hr className="my-1 border-white/5" />
                          <button
                            onClick={() => {
                              setNovelToDelete(novel);
                              setOpenDropdownId(null);
                            }}
                            className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-red-400 hover:text-red-300 hover:bg-red-500/5 text-left cursor-pointer"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            ลบเรื่อง
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      ) : (
        /* ─── Empty State ─── */
        <div className="text-center py-16 border border-dashed border-white/10 rounded-2xl bg-white/[0.01] max-w-md mx-auto">
          <BookOpen className="h-12 w-12 text-[#e09050]/40 mx-auto mb-4" />
          <h3 className="text-base font-bold text-white/80">ยังไม่มีนิยายในระบบ</h3>
          <p className="text-xs text-white/40 mt-1 max-w-xs mx-auto px-4">
            เริ่มต้นจินตนาการของคุณด้วยการสร้างนิยายเรื่องแรกได้ทันที!
          </p>
          <div className="mt-6">
            <Link
              href="/author/novel/new"
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-[#e09050] text-white hover:bg-[#c97c3a] transition-all duration-200"
            >
              <Plus className="h-4 w-4" />
              <span>สร้างนิยายเรื่องแรก</span>
            </Link>
          </div>
        </div>
      )}

      {/* ─── Custom Confirm Delete Dialog ─── */}
      <ConfirmDialog
        isOpen={!!novelToDelete}
        title="ยืนยันการลบนิยาย?"
        message={`คุณกำลังจะลบนิยายเรื่อง "${novelToDelete?.novel_name}" \n\n⚠️ การกระทำนี้จะไม่สามารถย้อนกลับได้ และตอนนิยายทั้งหมดรวมถึงความคิดเห็นจะถูกลบออกอย่างถาวร`}
        confirmText={isDeleting ? "กำลังลบ..." : "ลบข้อมูลนิยาย"}
        cancelText="ยกเลิก"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setNovelToDelete(null)}
      />
    </div>
  );
}
