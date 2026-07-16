"use client";

import React, { useState, useMemo } from "react";
import { 
  Eye, 
  MessageSquare, 
  BookOpen, 
  Layers, 
  Search, 
  ArrowUpDown, 
  ChevronRight, 
  TrendingUp, 
  Filter 
} from "lucide-react";
import Image from "next/image";

interface NovelStats {
  novel_id: number;
  novel_name: string;
  cover_image: string | null;
  view_count: number;
  total_chapters: number;
}

interface ChapterStats {
  chapter_id: number;
  chapter_no: number;
  chapter_title: string;
  novel_id: number;
  novel_name: string;
  comment_count: number;
  view_count: number;
}

interface AuthorStatsClientProps {
  novels: NovelStats[];
  chapters: ChapterStats[];
}

export default function AuthorStatsClient({ novels, chapters }: AuthorStatsClientProps) {
  const [selectedNovelId, setSelectedNovelId] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<"no" | "views" | "comments">("no");
  const [sortAscending, setSortAscending] = useState(true);

  // 1. Calculate general stats summaries
  const totalViews = useMemo(() => novels.reduce((acc, n) => acc + n.view_count, 0), [novels]);
  const totalChapters = useMemo(() => novels.reduce((acc, n) => acc + n.total_chapters, 0), [novels]);
  const totalComments = useMemo(() => chapters.reduce((acc, c) => acc + c.comment_count, 0), [chapters]);

  // 2. Filter chapters by selected novel and search query
  const filteredChapters = useMemo(() => {
    return chapters.filter((c) => {
      const matchesNovel = selectedNovelId === "all" || c.novel_id.toString() === selectedNovelId;
      const matchesSearch = 
        c.chapter_title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.chapter_no.toString().includes(searchQuery);
      return matchesNovel && matchesSearch;
    });
  }, [chapters, selectedNovelId, searchQuery]);

  // 3. Sort chapters
  const sortedChapters = useMemo(() => {
    return [...filteredChapters].sort((a, b) => {
      let comparison = 0;
      if (sortField === "no") {
        comparison = a.chapter_no - b.chapter_no;
      } else if (sortField === "views") {
        comparison = a.view_count - b.view_count;
      } else if (sortField === "comments") {
        comparison = a.comment_count - b.comment_count;
      }
      return sortAscending ? comparison : -comparison;
    });
  }, [filteredChapters, sortField, sortAscending]);

  // Toggle sort order
  const handleSort = (field: "no" | "views" | "comments") => {
    if (sortField === field) {
      setSortAscending(!sortAscending);
    } else {
      setSortField(field);
      setSortAscending(true);
    }
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl font-bold text-stone-100 flex items-center gap-2">
          <TrendingUp className="h-6 w-6 text-orange-500" />
          สถิติและรายงานเชิงลึก
        </h1>
        <p className="text-sm text-stone-400 mt-1">
          วิเคราะห์ยอดผู้เข้าชมและฟีดแบ็กความคิดเห็นจากนิยายของคุณ
        </p>
      </div>

      {/* Summary Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Stat 1 */}
        <div className="bg-stone-900/40 backdrop-blur-sm border border-stone-800/60 rounded-2xl p-4 md:p-6 flex items-center gap-4 hover:border-orange-500/20 transition-all duration-300 group">
          <div className="p-3 rounded-xl bg-orange-500/10 text-orange-400 group-hover:bg-orange-500/20 transition-colors">
            <BookOpen className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-stone-500 uppercase tracking-wider">นิยายทั้งหมด</p>
            <h3 className="text-xl md:text-2xl font-bold text-stone-100 mt-1">{novels.length} เรื่อง</h3>
          </div>
        </div>

        {/* Stat 2 */}
        <div className="bg-stone-900/40 backdrop-blur-sm border border-stone-800/60 rounded-2xl p-4 md:p-6 flex items-center gap-4 hover:border-orange-500/20 transition-all duration-300 group">
          <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400 group-hover:bg-amber-500/20 transition-colors">
            <Layers className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-stone-500 uppercase tracking-wider">จำนวนตอนทั้งหมด</p>
            <h3 className="text-xl md:text-2xl font-bold text-stone-100 mt-1">{totalChapters} ตอน</h3>
          </div>
        </div>

        {/* Stat 3 */}
        <div className="bg-stone-900/40 backdrop-blur-sm border border-stone-800/60 rounded-2xl p-4 md:p-6 flex items-center gap-4 hover:border-orange-500/20 transition-all duration-300 group">
          <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500/20 transition-colors">
            <Eye className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-stone-500 uppercase tracking-wider">ยอดผู้เข้าชมรวม</p>
            <h3 className="text-xl md:text-2xl font-bold text-stone-100 mt-1">
              {totalViews.toLocaleString("th-TH")} ครั้ง
            </h3>
          </div>
        </div>

        {/* Stat 4 */}
        <div className="bg-stone-900/40 backdrop-blur-sm border border-stone-800/60 rounded-2xl p-4 md:p-6 flex items-center gap-4 hover:border-orange-500/20 transition-all duration-300 group">
          <div className="p-3 rounded-xl bg-blue-500/10 text-blue-400 group-hover:bg-blue-500/20 transition-colors">
            <MessageSquare className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-stone-500 uppercase tracking-wider">ความคิดเห็นรวม</p>
            <h3 className="text-xl md:text-2xl font-bold text-stone-100 mt-1">
              {totalComments.toLocaleString("th-TH")} ข้อความ
            </h3>
          </div>
        </div>
      </div>

      {/* Grid: 2.1) Novel Views Report */}
      <section className="bg-stone-900/20 border border-stone-900/60 rounded-2xl p-5 md:p-6">
        <h2 className="text-base font-bold text-stone-200 mb-5 flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-orange-500" />
          รายงานยอดเข้าชมของแต่ละเรื่อง (Novel Views Report)
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-stone-300 border-collapse">
            <thead>
              <tr className="border-b border-stone-800/80 text-stone-400 text-xs uppercase font-semibold">
                <th className="py-3 px-4">ชื่อเรื่อง</th>
                <th className="py-3 px-4 text-center">จำนวนตอน</th>
                <th className="py-3 px-4 text-right">ยอดเข้าชมสะสม</th>
                <th className="py-3 px-4 text-center">สัดส่วนยอดชม</th>
              </tr>
            </thead>
            <tbody>
              {novels.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-10 text-center text-stone-500 text-xs">
                    ยังไม่มีข้อมูลนิยายสำหรับประมวลผลสถิติ
                  </td>
                </tr>
              ) : (
                novels.map((novel) => {
                  const percentage = totalViews > 0 ? (novel.view_count / totalViews) * 100 : 0;
                  return (
                    <tr 
                      key={novel.novel_id} 
                      className="border-b border-stone-900/60 hover:bg-stone-900/30 transition-colors"
                    >
                      <td className="py-3.5 px-4 font-medium text-stone-100 flex items-center gap-3">
                        <div className="relative h-10 w-8 rounded overflow-hidden bg-stone-800 shrink-0 border border-stone-800/40">
                          {novel.cover_image ? (
                            <Image
                              src={novel.cover_image}
                              alt={novel.novel_name}
                              fill
                              sizes="32px"
                              className="object-cover"
                            />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center text-[8px] text-stone-500">
                              No image
                            </div>
                          )}
                        </div>
                        <span className="truncate max-w-[200px] md:max-w-xs">{novel.novel_name}</span>
                      </td>
                      <td className="py-3.5 px-4 text-center text-stone-300 font-medium">
                        {novel.total_chapters} ตอน
                      </td>
                      <td className="py-3.5 px-4 text-right text-orange-400 font-semibold">
                        {novel.view_count.toLocaleString("th-TH")}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3 justify-center min-w-[120px]">
                          <div className="w-full bg-stone-800 h-1.5 rounded-full overflow-hidden">
                            <div 
                              className="bg-gradient-to-r from-orange-500 to-amber-400 h-full rounded-full" 
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                          <span className="text-[11px] font-bold text-stone-400 w-10 text-right">
                            {percentage.toFixed(1)}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Grid: 2.2) Chapter Comments & Feedback Report */}
      <section className="bg-stone-900/20 border border-stone-900/60 rounded-2xl p-5 md:p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-base font-bold text-stone-200 flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-amber-500" />
              รายงานคำถามและฟีดแบ็กความคิดเห็นรายตอน (Chapter Comments Report)
            </h2>
            <p className="text-xs text-stone-500 mt-0.5">
              ตรวจสอบการโต้ตอบของผู้แสดงความคิดเห็นในแต่ละตอน
            </p>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Novel Filter Dropdown */}
            <div className="flex items-center gap-2 bg-stone-950/40 border border-stone-800/80 rounded-xl px-3 py-1.5 text-xs text-stone-300">
              <Filter className="h-3.5 w-3.5 text-stone-500" />
              <select
                value={selectedNovelId}
                onChange={(e) => setSelectedNovelId(e.target.value)}
                className="bg-transparent border-none focus:outline-none cursor-pointer text-stone-300 pr-1 text-xs"
              >
                <option value="all" className="bg-stone-900">นิยายทั้งหมด</option>
                {novels.map((novel) => (
                  <option 
                    key={novel.novel_id} 
                    value={novel.novel_id.toString()}
                    className="bg-stone-900"
                  >
                    {novel.novel_name}
                  </option>
                ))}
              </select>
            </div>

            {/* Search Input */}
            <div className="relative">
              <input
                type="text"
                placeholder="ค้นหาตามชื่อหรือเลขตอน..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-stone-950/40 border border-stone-800/80 rounded-xl pl-8 pr-3 py-1.5 text-xs text-stone-300 focus:outline-none focus:border-orange-500/40 transition-colors w-44 md:w-56"
              />
              <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-stone-600" />
            </div>
          </div>
        </div>

        {/* Table of Chapter Comments */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-stone-300 border-collapse">
            <thead>
              <tr className="border-b border-stone-800/80 text-stone-400 text-xs uppercase font-semibold">
                {selectedNovelId === "all" && <th className="py-3 px-4">นิยายเรื่อง</th>}
                <th 
                  className="py-3 px-4 cursor-pointer hover:text-stone-200 transition-colors select-none"
                  onClick={() => handleSort("no")}
                >
                  <div className="flex items-center gap-1">
                    ตอนที่ / ชื่อตอน
                    <ArrowUpDown className="h-3 w-3 text-stone-500" />
                  </div>
                </th>
                <th 
                  className="py-3 px-4 text-right cursor-pointer hover:text-stone-200 transition-colors select-none"
                  onClick={() => handleSort("views")}
                >
                  <div className="flex items-center gap-1 justify-end">
                    จำนวนเข้าชม
                    <ArrowUpDown className="h-3 w-3 text-stone-500" />
                  </div>
                </th>
                <th 
                  className="py-3 px-4 text-right cursor-pointer hover:text-stone-200 transition-colors select-none"
                  onClick={() => handleSort("comments")}
                >
                  <div className="flex items-center gap-1 justify-end">
                    ความคิดเห็น
                    <ArrowUpDown className="h-3 w-3 text-stone-500" />
                  </div>
                </th>
                <th className="py-3 px-4 text-center">ประสิทธิภาพ (การเข้ามีส่วนร่วม)</th>
              </tr>
            </thead>
            <tbody>
              {sortedChapters.length === 0 ? (
                <tr>
                  <td 
                    colSpan={selectedNovelId === "all" ? 5 : 4} 
                    className="py-10 text-center text-stone-500 text-xs"
                  >
                    ไม่พบข้อมูลประวัติสถิติของตอนนิยายที่ตรงตามเงื่อนไข
                  </td>
                </tr>
              ) : (
                sortedChapters.map((chapter) => {
                  // Engagement score (Comments per 100 views)
                  const engagement = chapter.view_count > 0 
                    ? (chapter.comment_count / chapter.view_count) * 100 
                    : 0;

                  return (
                    <tr 
                      key={chapter.chapter_id} 
                      className="border-b border-stone-900/60 hover:bg-stone-900/30 transition-colors"
                    >
                      {selectedNovelId === "all" && (
                        <td className="py-3.5 px-4 font-semibold text-stone-400 text-xs truncate max-w-[150px]">
                          {chapter.novel_name}
                        </td>
                      )}
                      <td className="py-3.5 px-4">
                        <span className="text-orange-400/90 font-bold mr-1">ตอนที่ {chapter.chapter_no}</span>
                        <span className="text-stone-200 font-medium">{chapter.chapter_title}</span>
                      </td>
                      <td className="py-3.5 px-4 text-right font-medium text-stone-300">
                        {chapter.view_count.toLocaleString("th-TH")}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <span className={`font-semibold ${
                          chapter.comment_count > 0 ? "text-amber-400" : "text-stone-500"
                        }`}>
                          {chapter.comment_count}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center justify-center">
                          {chapter.comment_count === 0 ? (
                            <span className="text-[10px] text-stone-600 px-2 py-0.5 rounded-full bg-stone-900 border border-stone-850">
                              ไม่มีการตอบกลับ
                            </span>
                          ) : (
                            <span className={`text-[10px] px-2.5 py-0.5 rounded-full border ${
                              engagement >= 5 
                                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" 
                                : engagement >= 1
                                ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                                : "bg-stone-500/10 text-stone-400 border-stone-500/20"
                            }`}>
                              {engagement.toFixed(1)}% Engagement
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
