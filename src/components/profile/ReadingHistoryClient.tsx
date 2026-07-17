"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  Trash2, 
  X, 
  ArrowRight, 
  History, 
  Search, 
  ArrowUpDown, 
  BookOpen,
  ArrowLeft
} from "lucide-react";
import { relativeTime } from "@/lib/utils/relativeTime";
import AuthorLink from "@/components/common/AuthorLink";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import { clearAllReadingHistory, deleteNovelReadingHistory } from "@/app/reading-history/actions";
import { toast } from "sonner";

export interface ReadingHistoryItem {
  novel_id: number;
  novel_name: string;
  cover_image: string | null;
  pen_name: string;
  author_username: string;
  chapter_id: number;
  chapter_no: number;
  chapter_title: string;
  read_date: string;
  chapters_read: number;
  total_chapters: number;
}

interface ReadingHistoryClientProps {
  initialHistory: ReadingHistoryItem[];
}

const ITEMS_PER_PAGE = 10;

export default function ReadingHistoryClient({ initialHistory }: ReadingHistoryClientProps) {
  const router = useRouter();
  
  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"latest" | "az">("latest");
  const [currentPage, setCurrentPage] = useState(1);
  
  // Delete / Clear All Dialog States
  const [isClearingAll, setIsClearingAll] = useState(false);
  const [novelToDelete, setNovelToDelete] = useState<ReadingHistoryItem | null>(null);
  
  // Loading status to disable double clicks
  const [isActionPending, setIsActionPending] = useState(false);

  // 1. Filter history based on search query
  const filteredHistory = useMemo(() => {
    return initialHistory.filter((item) =>
      item.novel_name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [initialHistory, searchQuery]);

  // 2. Sort history
  const sortedHistory = useMemo(() => {
    return [...filteredHistory].sort((a, b) => {
      if (sortBy === "latest") {
        const dateA = new Date(a.read_date).getTime();
        const dateB = new Date(b.read_date).getTime();
        return dateB - dateA; // Newest first
      } else {
        return a.novel_name.localeCompare(b.novel_name, "th"); // Alphabetical A-Z
      }
    });
  }, [filteredHistory, sortBy]);

  // 3. Pagination calculation
  const paginatedHistory = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return sortedHistory.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [sortedHistory, currentPage]);

  const totalPages = Math.ceil(sortedHistory.length / ITEMS_PER_PAGE);

  // Reset page to 1 when search or sort changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, sortBy]);

  // Handle Clear All Action
  const handleClearAll = async () => {
    setIsActionPending(true);
    try {
      await clearAllReadingHistory();
      toast.success("ล้างประวัติการอ่านทั้งหมดสำเร็จแล้ว");
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "เกิดข้อผิดพลาดในการล้างประวัติ");
    } finally {
      setIsActionPending(false);
      setIsClearingAll(false);
    }
  };

  // Handle Delete Single Novel Action
  const handleDeleteNovel = async () => {
    if (!novelToDelete) return;
    setIsActionPending(true);
    try {
      await deleteNovelReadingHistory(novelToDelete.novel_id);
      toast.success(`ลบประวัติเรื่อง "${novelToDelete.novel_name}" เรียบร้อยแล้ว`);
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "เกิดข้อผิดพลาดในการลบประวัติ");
    } finally {
      setIsActionPending(false);
      setNovelToDelete(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* A) Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-stone-900/10 border border-stone-850 p-5 rounded-2xl">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="p-2 rounded-xl bg-stone-900 border border-stone-800 text-stone-400 hover:text-stone-100 hover:bg-stone-850 transition-colors"
            title="กลับหน้าหลัก"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-stone-100 flex items-center gap-2">
              <History className="h-5 w-5 text-orange-500" />
              ประวัติการอ่าน
            </h1>
            <p className="text-xs text-stone-400 mt-0.5">
              ติดตามนิยายที่คุณเข้าชมและอ่านค้างไว้
            </p>
          </div>
        </div>

        {initialHistory.length > 0 && (
          <button
            onClick={() => setIsClearingAll(true)}
            className="w-full sm:w-auto px-4 py-2 text-xs font-semibold rounded-xl border border-red-500/20 text-red-400 bg-red-500/5 hover:bg-red-500/10 transition-colors cursor-pointer text-center"
          >
            ล้างประวัติทั้งหมด
          </button>
        )}
      </div>

      {/* Empty State */}
      {initialHistory.length === 0 ? (
        <div className="bg-stone-900/10 border border-stone-850 rounded-2xl p-12 text-center max-w-lg mx-auto space-y-5 mt-8">
          <div className="h-12 w-12 rounded-2xl bg-orange-500/10 text-orange-400 flex items-center justify-center mx-auto">
            <BookOpen className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-stone-200">ยังไม่มีประวัติการอ่าน</h3>
            <p className="text-xs text-stone-500 mt-1 leading-relaxed">
              เมื่อคุณอ่านตอนนิยายต่าง ๆ ข้อมูลประวัติการอ่านล่าสุดจะปรากฏขึ้นที่หน้านี้เพื่อความสะดวกในการอ่านต่อ
            </p>
          </div>
          <Link
            href="/novels"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-orange-500 text-white text-xs font-bold hover:bg-orange-600 transition-colors shadow-lg shadow-orange-500/10"
          >
            <span>ไปสำรวจนิยาย</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      ) : (
        <>
          {/* B) Filter/Search Bar */}
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ค้นหาชื่อนิยายในประวัติ..."
                className="w-full bg-stone-900/40 border border-stone-850 rounded-xl pl-9 pr-4 py-2 text-xs text-stone-200 placeholder:text-stone-550 focus:outline-none focus:border-orange-500/40 transition-colors"
              />
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-stone-500" />
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-2 bg-stone-900/40 border border-stone-850 rounded-xl px-3 py-2 text-xs text-stone-300">
              <ArrowUpDown className="h-3.5 w-3.5 text-stone-500" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as "latest" | "az")}
                className="bg-transparent border-none focus:outline-none cursor-pointer text-stone-300 pr-1 text-xs"
              >
                <option value="latest" className="bg-stone-900">อ่านล่าสุด</option>
                <option value="az" className="bg-stone-900">ชื่อเรื่อง A-Z</option>
              </select>
            </div>
          </div>

          {/* C) Reading History Cards List */}
          {sortedHistory.length === 0 ? (
            <div className="text-center py-12 text-stone-500 text-xs">
              ไม่พบรายการที่ตรงกับการค้นหา
            </div>
          ) : (
            <div className="space-y-4">
              {paginatedHistory.map((item) => {
                const readPct = item.total_chapters > 0 
                  ? (item.chapters_read / item.total_chapters) * 100 
                  : 0;

                return (
                  <div 
                    key={item.novel_id} 
                    className="relative bg-stone-900/20 border border-stone-850 hover:border-stone-800 rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row gap-4 items-start md:items-center transition-all duration-300 group"
                  >
                    {/* Delete button (top-right absolute for easy click) */}
                    <button
                      onClick={() => setNovelToDelete(item)}
                      className="absolute top-4 right-4 p-1.5 rounded-lg text-stone-500 hover:text-red-400 hover:bg-red-500/5 transition-colors cursor-pointer"
                      title="ลบออกจากประวัติ"
                    >
                      <X className="h-4 w-4" />
                    </button>

                    {/* Novel Cover Thumbnail */}
                    <div className="relative h-20 w-14 shrink-0 rounded-lg overflow-hidden bg-stone-850 border border-stone-800">
                      {item.cover_image ? (
                        <img 
                          src={item.cover_image} 
                          alt={item.novel_name} 
                          className="w-full h-full object-cover" 
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[8px] text-stone-600 font-bold p-1 text-center">
                          NO COVER
                        </div>
                      )}
                    </div>

                    {/* Novel details */}
                    <div className="flex-1 min-w-0 pr-8">
                      <div className="flex flex-col gap-1">
                        <Link 
                          href={`/novel/${item.novel_id}`}
                          className="font-bold text-stone-200 hover:text-orange-400 transition-colors truncate text-sm sm:text-base"
                        >
                          {item.novel_name}
                        </Link>
                        
                        <div className="text-xs">
                          <span className="text-stone-500">ผู้เขียน: </span>
                          <AuthorLink 
                            username={item.author_username} 
                            displayName={item.pen_name} 
                            showAvatar={false}
                            size="sm"
                          />
                        </div>
                      </div>

                      {/* Last Read Chapter Information */}
                      <div className="mt-3 text-xs flex flex-wrap items-center gap-x-2 gap-y-1">
                        <span className="text-stone-300 font-medium">
                          อ่านล่าสุด: <span className="text-orange-400">ตอนที่ {item.chapter_no}</span> {item.chapter_title}
                        </span>
                        <span className="text-[10px] text-stone-500">•</span>
                        <span className="text-stone-500 text-[11px]">
                          {relativeTime(item.read_date)}
                        </span>
                      </div>

                      {/* Progress Bar & Chapters Read Status */}
                      <div className="mt-4 max-w-xs flex items-center gap-3">
                        <div className="flex-1 bg-stone-900 h-1.5 rounded-full overflow-hidden border border-stone-850">
                          <div 
                            className="bg-gradient-to-r from-orange-500 to-amber-400 h-full rounded-full transition-all duration-300"
                            style={{ width: `${readPct}%` }}
                          />
                        </div>
                        <span className="text-[10px] font-bold text-stone-400 whitespace-nowrap">
                          อ่านแล้ว {item.chapters_read}/{item.total_chapters} ตอน
                        </span>
                      </div>
                    </div>

                    {/* Continue Reading Action Button */}
                    <div className="w-full md:w-auto shrink-0 mt-2 md:mt-0 pt-3 md:pt-0 border-t md:border-t-0 border-stone-850 flex md:block">
                      <Link
                        href={`/novel/${item.novel_id}/chapter/${item.chapter_no}`}
                        className="w-full md:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-stone-900 border border-stone-800 text-xs font-bold text-stone-200 hover:text-white hover:bg-stone-800 transition-colors shadow-sm"
                      >
                        <span>อ่านต่อ</span>
                        <ArrowRight className="h-3 w-3" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* D) Pagination Control */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-1.5 pt-4">
              <button
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-3 py-1.5 rounded-xl border border-stone-850 bg-stone-900/40 text-xs text-stone-400 hover:text-stone-100 disabled:opacity-30 disabled:pointer-events-none transition-colors"
              >
                ก่อนหน้า
              </button>
              
              <div className="px-3 text-xs text-stone-500 font-semibold">
                หน้า {currentPage} จาก {totalPages}
              </div>

              <button
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 rounded-xl border border-stone-850 bg-stone-900/40 text-xs text-stone-400 hover:text-stone-100 disabled:opacity-30 disabled:pointer-events-none transition-colors"
              >
                ถัดไป
              </button>
            </div>
          )}
        </>
      )}

      {/* Confirmation Dialogs */}
      <ConfirmDialog
        isOpen={isClearingAll}
        title="ล้างประวัติการอ่านทั้งหมด"
        message="คุณแน่ใจหรือไม่ว่าต้องการล้างประวัติการอ่านทั้งหมด? การกระทำนี้ไม่สามารถย้อนกลับได้"
        confirmText={isActionPending ? "กำลังลบ..." : "ล้างทั้งหมด"}
        cancelText="ยกเลิก"
        onConfirm={handleClearAll}
        onCancel={() => !isActionPending && setIsClearingAll(false)}
      />

      <ConfirmDialog
        isOpen={!!novelToDelete}
        title="ลบประวัติการอ่านนิยาย"
        message={`คุณแน่ใจหรือไม่ว่าต้องการลบประวัติการอ่านของเรื่อง "${novelToDelete?.novel_name}" ออกจากระบบ?`}
        confirmText={isActionPending ? "กำลังลบ..." : "ลบออก"}
        cancelText="ยกเลิก"
        onConfirm={handleDeleteNovel}
        onCancel={() => !isActionPending && setNovelToDelete(null)}
      />
    </div>
  );
}
