"use client";

import { useState } from "react";
import { X } from "lucide-react";
import Link from "next/link";
import type { ChapterListItem } from "@/types/novel";

interface ChapterListSheetProps {
  novelId: number;
  novelName: string;
  chapters: ChapterListItem[];
  currentChapterNo: number;
  isOpen: boolean;
  onClose: () => void;
}

export default function ChapterListSheet({
  novelId,
  novelName,
  chapters,
  currentChapterNo,
  isOpen,
  onClose,
}: ChapterListSheetProps) {
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 z-[100] animate-fadeIn"
        onClick={onClose}
      />

      {/* Sheet */}
      <div className="fixed inset-x-0 bottom-0 z-[101] max-h-[70vh] flex flex-col bg-[#1e1c1a] border-t border-white/10 rounded-t-2xl animate-slideUp">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 shrink-0">
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-white truncate">
              {novelName}
            </h3>
            <p className="text-[11px] text-white/50 mt-0.5">
              {chapters.length} ตอน
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors shrink-0 cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Chapter list */}
        <div className="flex-1 overflow-y-auto overscroll-contain py-2">
          {chapters.map((ch) => {
            const isCurrent = ch.chapter_no === currentChapterNo;
            return (
              <Link
                key={ch.chapter_id}
                href={`/novel/${novelId}/chapter/${ch.chapter_no}`}
                onClick={onClose}
                className={`flex items-center gap-3 px-5 py-3 transition-colors ${
                  isCurrent
                    ? "bg-[#e09050]/15 border-l-2 border-[#e09050]"
                    : "hover:bg-white/5 border-l-2 border-transparent"
                }`}
              >
                <span
                  className={`text-xs font-mono w-8 shrink-0 text-center ${
                    isCurrent ? "text-[#e09050] font-bold" : "text-white/40"
                  }`}
                >
                  {ch.chapter_no}
                </span>
                <span
                  className={`text-sm truncate ${
                    isCurrent
                      ? "text-[#e09050] font-semibold"
                      : "text-white/80"
                  }`}
                >
                  {ch.chapter_title}
                </span>
                {isCurrent && (
                  <span className="ml-auto text-[10px] font-semibold text-[#e09050] bg-[#e09050]/10 px-2 py-0.5 rounded-full shrink-0">
                    กำลังอ่าน
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </>
  );
}
