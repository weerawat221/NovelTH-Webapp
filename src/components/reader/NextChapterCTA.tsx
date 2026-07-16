"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { ReadingTheme } from "@/types/novel";

const ctaThemes = {
  dark: {
    border: "border-white/10",
    textStrong: "text-white/80",
    textMuted: "text-white/40",
  },
  light: {
    border: "border-gray-250",
    textStrong: "text-gray-800",
    textMuted: "text-gray-500",
  },
  warm: {
    border: "border-[#3d3529]/15",
    textStrong: "text-[#3d3529]",
    textMuted: "text-[#8c7a64]",
  }
};

interface NextChapterCTAProps {
  novelId: number;
  nextChapterNo: number | null;
  nextChapterTitle: string | null;
  theme?: ReadingTheme;
}

export default function NextChapterCTA({
  novelId,
  nextChapterNo,
  nextChapterTitle,
  theme = "dark",
}: NextChapterCTAProps) {
  const t = ctaThemes[theme];

  return (
    <div className={`border-t ${t.border} pt-8 pb-4 text-center`}>
      {nextChapterNo !== null && nextChapterTitle ? (
        <div className="space-y-3">
          <p className={`text-xs ${t.textMuted} uppercase tracking-wider font-medium`}>
            ตอนต่อไป
          </p>
          <p className={`text-base font-semibold ${t.textStrong}`}>
            {nextChapterTitle}
          </p>
          <Link
            href={`/novel/${novelId}/chapter/${nextChapterNo}`}
            className="inline-flex items-center gap-2 px-8 py-3 rounded-full bg-[#e09050] text-white font-semibold text-sm hover:bg-[#c97c3a] transition-colors shadow-lg shadow-[#e09050]/20"
          >
            อ่านต่อ
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      ) : (
        <div className="space-y-2 py-4">
          <p className="text-3xl">📖</p>
          <p className={`text-sm font-semibold ${t.textStrong}`}>
            จบตอนล่าสุดแล้ว
          </p>
          <p className={`text-xs ${t.textMuted}`}>
            รอตอนต่อไปนะ ♡
          </p>
        </div>
      )}
    </div>
  );
}
