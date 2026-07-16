"use client";

import { BookOpen, Eye, Clock, ChevronRight, Calendar, User, Tag } from "lucide-react";
import Link from "next/link";
import type { NovelWithDetails, ChapterListItem } from "@/types/novel";
import FavoriteButton from "@/components/novel/FavoriteButton";
import { relativeTime } from "@/lib/utils/relativeTime";
import AuthorLink from "@/components/common/AuthorLink";

// Placeholder gradients based on novel_id
const placeholderGradients = [
  "from-violet-500 to-purple-700",
  "from-rose-400 to-pink-600",
  "from-sky-400 to-blue-600",
  "from-emerald-400 to-teal-600",
  "from-amber-400 to-orange-600",
  "from-indigo-400 to-violet-600",
  "from-fuchsia-400 to-pink-600",
  "from-cyan-400 to-blue-600",
];

interface NovelDetailPageProps {
  novel: NovelWithDetails;
  chapters: ChapterListItem[];
  initialFavorited?: boolean;
  lastReadChapterNo?: number | null;
}

function formatThaiDate(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString("th-TH", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

export default function NovelDetailPage({
  novel,
  chapters,
  initialFavorited = false,
  lastReadChapterNo = null,
}: NovelDetailPageProps) {
  const gradientIdx = (novel.novel_id - 1) % placeholderGradients.length;
  const gradient = placeholderGradients[gradientIdx];
  const firstChapterNo = chapters.length > 0 ? chapters[0].chapter_no : null;

  // Status Badge configurations
  const statusConfig = {
    ongoing: {
      label: "กำลังแต่ง",
      classes: "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20",
    },
    completed: {
      label: "จบแล้ว",
      classes: "bg-blue-500/10 text-blue-500 border border-blue-500/20",
    },
    hiatus: {
      label: "พักชั่วคราว",
      classes: "bg-amber-500/10 text-amber-500 border border-amber-500/20",
    },
  };

  const currentStatus = statusConfig[novel.status as keyof typeof statusConfig] || {
    label: novel.status,
    classes: "bg-gray-500/10 text-gray-500 border border-gray-500/20",
  };

  return (
    <div className="relative min-h-screen pb-16">
      {/* ─── Blurred Banner Backdrop ─── */}
      <div className="absolute top-0 left-0 right-0 h-[340px] overflow-hidden pointer-events-none z-0">
        {novel.cover_image ? (
          <img
            src={novel.cover_image}
            alt=""
            className="w-full h-full object-cover blur-3xl opacity-[0.07] scale-110"
          />
        ) : (
          <div className={`w-full h-full bg-gradient-to-b ${gradient} blur-3xl opacity-[0.06]`} />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background" />
      </div>

      <div className="relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 pt-8 md:pt-12 z-10">
        <div className="flex flex-col md:flex-row gap-8 md:gap-12 items-start">
          
          {/* ─── Left Column: Cover Image & Favorite ─── */}
          <div className="w-full md:w-60 lg:w-64 shrink-0 flex flex-col items-center md:items-start mx-auto md:mx-0">
            <div className="relative aspect-[2/3] w-48 sm:w-56 md:w-full rounded-2xl overflow-hidden bg-surface border border-border/40 shadow-2xl transition-transform duration-300 hover:scale-[1.02]">
              {novel.cover_image ? (
                <img
                  src={novel.cover_image}
                  alt={novel.novel_name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div
                  className={`w-full h-full bg-gradient-to-br ${gradient} flex flex-col items-center justify-center p-4 text-center`}
                >
                  <span className="text-white/90 text-sm font-semibold leading-snug line-clamp-3">
                    {novel.novel_name}
                  </span>
                  <span className="text-white/50 text-xs mt-2 line-clamp-1">
                    {novel.author?.pen_name || "ไม่ทราบชื่อผู้แต่ง"}
                  </span>
                </div>
              )}

              {/* Floating Favorite Button */}
              <div className="absolute top-3 right-3 z-20">
                <FavoriteButton novelId={novel.novel_id} initialFavorited={initialFavorited} />
              </div>
            </div>
          </div>

          {/* ─── Right Column: Novel Info & Chapter Link ─── */}
          <div className="flex-1 w-full">
            {/* Title */}
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-foreground text-center md:text-left leading-tight">
              {novel.novel_name}
            </h1>

            {/* Author and Category Link */}
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mt-3 text-sm">
              {novel.author?.username ? (
                <AuthorLink
                  username={novel.author.username}
                  displayName={novel.author.pen_name}
                  avatarUrl={novel.author.profile_image}
                  size="md"
                  theme="dark"
                  className="hover:underline"
                />
              ) : (
                <span className="text-muted-foreground font-medium">{novel.author?.pen_name || "ไม่ทราบชื่อผู้แต่ง"}</span>
              )}
              <span className="text-border">|</span>
              <Link
                href={`/novels?category=${novel.category_id}`}
                className={`inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-semibold ${currentStatus.classes}`}
              >
                <Tag className="h-3 w-3" />
                <span>{novel.category?.category_name || "ไม่มีหมวดหมู่"}</span>
              </Link>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 mb-8">
              <div className="bg-surface/50 border border-border/40 backdrop-blur-sm rounded-xl p-3 flex flex-col items-center md:items-start">
                <span className="text-[10px] text-muted font-medium uppercase tracking-wider mb-1 flex items-center gap-1">
                  <Eye className="h-3.5 w-3.5 text-accent" />
                  ยอดเข้าชม
                </span>
                <span className="text-base font-bold text-foreground">
                  {novel.view_count.toLocaleString("th-TH")}
                </span>
              </div>

              <div className="bg-surface/50 border border-border/40 backdrop-blur-sm rounded-xl p-3 flex flex-col items-center md:items-start">
                <span className="text-[10px] text-muted font-medium uppercase tracking-wider mb-1 flex items-center gap-1">
                  <BookOpen className="h-3.5 w-3.5 text-accent" />
                  จำนวนตอน
                </span>
                <span className="text-base font-bold text-foreground">
                  {chapters.length.toLocaleString("th-TH")}
                </span>
              </div>

              <div className="bg-surface/50 border border-border/40 backdrop-blur-sm rounded-xl p-3 flex flex-col items-center md:items-start">
                <span className="text-[10px] text-muted font-medium uppercase tracking-wider mb-1 flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5 text-accent" />
                  สถานะ
                </span>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${currentStatus.classes}`}>
                  {currentStatus.label}
                </span>
              </div>

              <div className="bg-surface/50 border border-border/40 backdrop-blur-sm rounded-xl p-3 flex flex-col items-center md:items-start">
                <span className="text-[10px] text-muted font-medium uppercase tracking-wider mb-1 flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5 text-accent" />
                  อัปเดตล่าสุด
                </span>
                <span className="text-sm font-bold text-foreground truncate max-w-full">
                  {relativeTime(novel.updated_at)}
                </span>
              </div>
            </div>

            {/* Action CTAs */}
            <div className="flex flex-col sm:flex-row gap-3 w-full mb-8">
              {firstChapterNo !== null ? (
                <Link
                  href={`/novel/${novel.novel_id}/chapter/${firstChapterNo}`}
                  className="bg-gradient-to-r from-accent to-[#e59b5d] hover:from-accent-hover hover:to-[#d08546] text-white font-semibold px-8 py-3.5 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 flex-1"
                >
                  <BookOpen className="h-5 w-5" />
                  <span>อ่านตอนแรก</span>
                </Link>
              ) : (
                <button
                  disabled
                  className="bg-surface-hover border border-border/50 text-muted font-semibold px-8 py-3.5 rounded-xl flex items-center justify-center gap-2 flex-1 cursor-not-allowed"
                >
                  <BookOpen className="h-5 w-5 opacity-50" />
                  <span>ยังไม่มีตอนให้อ่าน</span>
                </button>
              )}

              {lastReadChapterNo !== null && (
                <Link
                  href={`/novel/${novel.novel_id}/chapter/${lastReadChapterNo}`}
                  className="border border-accent/30 text-accent hover:text-accent-hover hover:bg-accent-light/10 font-semibold px-8 py-3.5 rounded-xl transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 flex-1 bg-surface/30 backdrop-blur-sm"
                >
                  <span>อ่านต่อ (ตอนที่ {lastReadChapterNo})</span>
                  <ChevronRight className="h-4 w-4" />
                </Link>
              )}
            </div>

            {/* Synopsis */}
            <div className="border border-border/40 bg-surface/20 backdrop-blur-sm rounded-2xl p-5 md:p-6">
              <h2 className="text-base font-bold text-foreground mb-3 flex items-center gap-2 border-b border-border/20 pb-2">
                <span>เรื่องย่อ</span>
              </h2>
              <p className="text-foreground/80 text-sm leading-relaxed whitespace-pre-wrap break-words">
                {novel.synopsis || "ไม่มีเรื่องย่อ"}
              </p>
            </div>
          </div>
        </div>

        {/* Divider */}
        <hr className="my-10 border-border/50" />

        {/* ─── Chapters List ─── */}
        <div>
          <h2 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-accent" />
            <span>รายชื่อตอน ({chapters.length})</span>
          </h2>

          {chapters.length > 0 ? (
            <div className="bg-surface/30 backdrop-blur-sm rounded-2xl border border-border/40 overflow-hidden divide-y divide-border/20">
              {chapters.map((chapter) => (
                <Link
                  key={chapter.chapter_id}
                  href={`/novel/${novel.novel_id}/chapter/${chapter.chapter_no}`}
                  className="group flex items-center justify-between p-4 hover:bg-surface-hover/50 transition-colors duration-200"
                >
                  <div className="flex-1 pr-4">
                    <span className="text-sm font-semibold text-foreground group-hover:text-accent transition-colors duration-200 line-clamp-1">
                      ตอนที่ {chapter.chapter_no} {chapter.chapter_title ? `: ${chapter.chapter_title}` : ""}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 shrink-0 text-xs text-muted">
                    {chapter.published_at && (
                      <span className="hidden sm:inline">
                        {formatThaiDate(chapter.published_at)}
                      </span>
                    )}
                    <ChevronRight className="h-4 w-4 text-muted/40 group-hover:text-accent group-hover:translate-x-1 transition-all duration-200" />
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 border border-dashed border-border/60 rounded-2xl bg-surface/10">
              <BookOpen className="h-10 w-10 text-muted/30 mx-auto mb-3" />
              <p className="text-sm text-muted">ยังไม่มีตอนในนิยายเรื่องนี้</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
