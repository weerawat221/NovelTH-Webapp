"use client";

import { useRouter } from "next/navigation";
import { Eye } from "lucide-react";
import type { NovelWithDetails } from "@/types/novel";
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

interface NovelCardProps {
  novel: NovelWithDetails;
}

function isNew(createdAt: string): boolean {
  const created = new Date(createdAt);
  const now = new Date();
  const diffMs = now.getTime() - created.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  return diffDays <= NEW_THRESHOLD_DAYS;
}

export default function NovelCard({ novel }: NovelCardProps) {
  const router = useRouter();
  const gradientIdx = (novel.novel_id - 1) % placeholderGradients.length;
  const gradient = placeholderGradients[gradientIdx];
  const showNew = isNew(novel.created_at);

  const handleCardClick = () => {
    router.push(`/novel/${novel.novel_id}`);
  };

  return (
    <div
      onClick={handleCardClick}
      className="group block flex-shrink-0 w-[calc(50%-6px)] sm:w-[calc(33.333%-8px)] md:w-[calc(20%-10px)] lg:w-[calc(16.666%-10px)] cursor-pointer"
    >
      {/* ─── Cover image ─── */}
      <div className="relative aspect-[2/3] rounded-xl overflow-hidden bg-surface transition-transform duration-300 group-hover:scale-[1.03] group-hover:shadow-xl">
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

        {/* ─── Category badge ─── */}
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
        <span className="absolute bottom-2 left-2 flex items-center gap-1 px-1.5 py-0.5 bg-black/50 backdrop-blur-sm text-white text-[10px] rounded-md z-10">
          <Eye className="h-3 w-3 text-white/80" />
          <span>{novel.view_count.toLocaleString("th-TH")}</span>
        </span>

        {/* ─── Hover overlay ─── */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
      </div>

      {/* ─── Title ─── */}
      <h3 className="mt-1.5 px-1 text-sm font-medium text-foreground line-clamp-1 group-hover:text-accent transition-colors">
        {novel.novel_name}
      </h3>

      {/* ─── Author ─── */}
      <div className="px-1 text-xs text-muted line-clamp-1 mt-0.5">
        {novel.author?.username ? (
          <AuthorLink
            username={novel.author.username}
            displayName={novel.author.pen_name}
            avatarUrl={novel.author.profile_image}
            showAvatar={false}
            size="sm"
            theme="dark"
            className="hover:underline font-normal text-muted"
          />
        ) : (
          <span>{novel.author?.pen_name || "ไม่ทราบชื่อผู้แต่ง"}</span>
        )}
      </div>
    </div>
  );
}
