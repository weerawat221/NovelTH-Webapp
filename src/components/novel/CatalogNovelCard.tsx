"use client";

import Link from "next/link";
import { useRouter } from "nextjs-toploader/app";
import { Eye } from "lucide-react";
import type { NovelWithDetails } from "@/types/novel";
import FavoriteButton from "@/components/novel/FavoriteButton";
import AuthorLink from "@/components/common/AuthorLink";

// ─── Placeholder gradient colors based on novel_id ───
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

/** Number of days within which a novel is considered "NEW" */
const NEW_THRESHOLD_DAYS = 30;

interface CatalogNovelCardProps {
  novel: NovelWithDetails;
  isFavorited?: boolean;
  viewMode?: "grid" | "list";
}

function isNew(createdAt: string): boolean {
  const created = new Date(createdAt);
  const now = new Date();
  const diffMs = now.getTime() - created.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  return diffDays <= NEW_THRESHOLD_DAYS;
}

export default function CatalogNovelCard({
  novel,
  isFavorited = false,
  viewMode = "grid",
}: CatalogNovelCardProps) {
  const router = useRouter();
  const gradientIdx = (novel.novel_id - 1) % placeholderGradients.length;
  const gradient = placeholderGradients[gradientIdx];
  const showNew = isNew(novel.created_at);

  if (viewMode === "list") {
    return (
      <div className="group relative flex gap-4 p-4 rounded-xl border border-border bg-surface hover:bg-surface-hover hover:border-accent/30 transition-all duration-300">
        {/* ─── Clickable wrapper for cover and content ─── */}
        <div
          onClick={() => router.push(`/novel/${novel.novel_id}`)}
          className="flex gap-4 flex-1 min-w-0 cursor-pointer animate-fadeIn"
        >
          {/* ─── Cover Image ─── */}
          <div className="relative w-20 sm:w-24 aspect-[2/3] rounded-lg overflow-hidden bg-surface flex-shrink-0 shadow-sm transition-transform duration-300 group-hover:scale-[1.02] group-hover:shadow-md">
            {novel.cover_image ? (
              <img
                src={novel.cover_image}
                alt={novel.novel_name}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            ) : (
              /* Styled placeholder */
              <div
                className={`w-full h-full bg-gradient-to-br ${gradient} flex flex-col items-center justify-center p-2 text-center`}
              >
                <span className="text-white/90 text-[10px] font-medium leading-tight line-clamp-2">
                  {novel.novel_name}
                </span>
                <span className="text-white/50 text-[8px] mt-1">
                  {novel.author?.pen_name || "ไม่ทราบชื่อผู้แต่ง"}
                </span>
              </div>
            )}

            {/* ─── NEW ribbon badge (top-right corner) ─── */}
            {showNew && (
              <div className="absolute top-0 right-0 overflow-hidden w-12 h-12 pointer-events-none">
                <div className="absolute top-[4px] right-[-16px] w-[60px] text-center rotate-45 bg-red-500 text-white text-[8px] font-bold py-0.5 shadow-md">
                  NEW
                </div>
              </div>
            )}
          </div>

          {/* ─── Details Info ─── */}
          <div className="flex flex-col flex-1 min-w-0 justify-between py-0.5">
            <div>
              {/* Title & Author */}
              <h3 className="text-sm sm:text-base font-semibold text-foreground line-clamp-1 group-hover:text-accent transition-colors leading-snug">
                {novel.novel_name}
              </h3>
              <div className="text-xs text-muted mt-0.5 flex items-center gap-1">
                <span>โดย</span>
                {novel.author?.username ? (
                  <AuthorLink
                    username={novel.author.username}
                    displayName={novel.author.pen_name}
                    avatarUrl={novel.author.profile_image}
                    showAvatar={false}
                    size="sm"
                    className="font-semibold text-muted hover:text-accent"
                  />
                ) : (
                  <span className="hover:text-accent transition-colors">
                    {novel.author?.pen_name || "ไม่ทราบชื่อผู้แต่ง"}
                  </span>
                )}
              </div>

              {/* Synopsis */}
              {novel.synopsis && (
                <p className="text-xs text-muted-foreground line-clamp-2 mt-2 leading-relaxed">
                  {novel.synopsis}
                </p>
              )}
            </div>

            {/* Badges and Update Date */}
            <div className="flex flex-wrap items-center gap-2 mt-3 text-[10px]">
              {/* Category Badge */}
              <span className="px-2 py-0.5 rounded-full font-medium bg-accent/10 text-accent border border-accent/20">
                {novel.category.category_name}
              </span>

              {/* Status Badge */}
              {novel.status === "ongoing" && (
                <span className="px-2 py-0.5 rounded-full font-medium bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                  กำลังเขียน
                </span>
              )}
              {novel.status === "completed" && (
                <span className="px-2 py-0.5 rounded-full font-medium bg-blue-500/10 text-blue-500 border border-blue-500/20">
                  จบแล้ว
                </span>
              )}
              {novel.status === "hiatus" && (
                <span className="px-2 py-0.5 rounded-full font-medium bg-amber-500/10 text-amber-500 border border-amber-500/20">
                  งดอัปเดต
                </span>
              )}

              {/* View Count Badge */}
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full font-medium bg-muted text-muted-foreground border border-border">
                <Eye className="h-3 w-3" />
                <span>{novel.view_count.toLocaleString("th-TH")} วิว</span>
              </span>

              {/* Update Time */}
              <span className="text-muted ml-auto sm:ml-0">
                อัปเดตเมื่อ {new Date(novel.updated_at).toLocaleDateString("th-TH", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </span>
            </div>
          </div>
        </div>

        {/* ─── Favorite button (top-right of the card) ─── */}
        <div className="absolute top-4 right-4 z-10">
          <FavoriteButton
            novelId={novel.novel_id}
            initialFavorited={isFavorited}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="group relative">
      <Link href={`/novel/${novel.novel_id}`} className="block">
        {/* ─── Cover image ─── */}
        <div className="relative aspect-[2/3] rounded-lg overflow-hidden bg-surface transition-transform duration-300 group-hover:scale-[1.02] group-hover:shadow-xl">
          {novel.cover_image ? (
            <img
              src={novel.cover_image}
              alt={novel.novel_name}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            /* Styled placeholder */
            <div
              className={`w-full h-full bg-gradient-to-br ${gradient} flex flex-col items-center justify-center p-3 text-center`}
            >
              <span className="text-white/90 text-xs font-medium leading-tight line-clamp-2">
                {novel.novel_name}
              </span>
              <span className="text-white/50 text-[10px] mt-1.5">
                {novel.author?.pen_name || "ไม่ทราบชื่อผู้แต่ง"}
              </span>
            </div>
          )}

          {/* ─── Category badge (top-left) ─── */}
          <span className="absolute top-2 left-2 px-1.5 py-0.5 bg-black/50 backdrop-blur-sm text-white text-[10px] rounded-md z-10">
            {novel.category.category_name}
          </span>

          {/* ─── NEW ribbon badge (top-right corner) ─── */}
          {showNew && (
            <div className="absolute top-0 right-0 overflow-hidden w-16 h-16 pointer-events-none z-10">
              <div className="absolute top-[6px] right-[-20px] w-[80px] text-center rotate-45 bg-red-500 text-white text-[9px] font-bold py-0.5 shadow-md">
                NEW
              </div>
            </div>
          )}

          {/* ─── View count badge (bottom-left corner) ─── */}
          <span className="absolute bottom-2 left-2 flex items-center gap-1 px-1.5 py-0.5 bg-black/50 backdrop-blur-sm text-white text-[9px] rounded-md z-10">
            <Eye className="h-3 w-3 text-white/80" />
            <span>{novel.view_count.toLocaleString("th-TH")}</span>
          </span>

          {/* ─── Hover overlay ─── */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300 pointer-events-none" />
        </div>

        {/* ─── Title ─── */}
        <h3 className="mt-2 text-sm font-medium text-foreground line-clamp-2 group-hover:text-accent transition-colors leading-snug">
          {novel.novel_name}
        </h3>
      </Link>

      {/* ─── Favorite button (floating, bottom-right of cover) ─── */}
      <div className="absolute bottom-[calc(2.5rem+8px)] right-1.5 z-10">
        <FavoriteButton
          novelId={novel.novel_id}
          initialFavorited={isFavorited}
        />
      </div>
    </div>
  );
}
