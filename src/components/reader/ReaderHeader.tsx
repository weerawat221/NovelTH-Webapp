"use client";

import { useState } from "react";
import { List, Type, ChevronLeft, ChevronRight, ArrowLeft } from "lucide-react";
import Link from "next/link";
import type { ChapterListItem, ReadingTheme } from "@/types/novel";
import ChapterListSheet from "./ChapterListSheet";
import ReadingSettingsPanel from "./ReadingSettingsPanel";


interface ReaderHeaderProps {
  novelId: number;
  novelName: string;
  chapterTitle: string;
  currentChapterNo: number;
  chapters: ChapterListItem[];
  prevChapterNo: number | null;
  nextChapterNo: number | null;
  fontSize: number;
  lineHeight: number;
  theme: ReadingTheme;
  onFontSizeChange: (v: number) => void;
  onLineHeightChange: (v: number) => void;
  onThemeChange: (v: ReadingTheme) => void;
}

export default function ReaderHeader({
  novelId,
  novelName,
  chapterTitle,
  currentChapterNo,
  chapters,
  prevChapterNo,
  nextChapterNo,
  fontSize,
  lineHeight,
  theme,
  onFontSizeChange,
  onLineHeightChange,
  onThemeChange,
}: ReaderHeaderProps) {
  const [listOpen, setListOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-50 bg-[#141210]/95 backdrop-blur-md border-b border-white/5">
        <div className="mx-auto max-w-4xl px-4 flex items-center justify-between h-12 gap-2">
          {/* Left — Back & Chapter List */}
          <div className="flex items-center gap-1 shrink-0">
            <Link
              href={`/novel/${novelId}`}
              className="p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors cursor-pointer flex items-center gap-1.5"
              title={`กลับหน้าหลักเรื่อง ${novelName}`}
            >
              <ArrowLeft className="h-5 w-5" />
              <span className="hidden sm:inline text-xs font-bold">หน้าหลักนิยาย</span>
            </Link>
            <button
              onClick={() => setListOpen(true)}
              className="p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              aria-label="รายการตอน"
            >
              <List className="h-5 w-5" />
            </button>
          </div>

          {/* Center — Chapter title */}
          <h1 className="flex-1 text-sm font-medium text-white/90 truncate text-center px-2">
            {chapterTitle}
          </h1>

          {/* Right — Settings + Nav */}
          <div className="flex items-center gap-1 shrink-0">
            {/* Settings */}
            <div className="relative">
              <button
                onClick={() => setSettingsOpen(!settingsOpen)}
                className={`p-2 rounded-lg transition-colors cursor-pointer text-sm font-bold ${
                  settingsOpen
                    ? "text-[#e09050] bg-[#e09050]/10"
                    : "text-white/60 hover:text-white hover:bg-white/10"
                }`}
                aria-label="ตั้งค่าการอ่าน"
              >
                Aa
              </button>
              <ReadingSettingsPanel
                isOpen={settingsOpen}
                onClose={() => setSettingsOpen(false)}
                fontSize={fontSize}
                lineHeight={lineHeight}
                theme={theme}
                onFontSizeChange={onFontSizeChange}
                onLineHeightChange={onLineHeightChange}
                onThemeChange={onThemeChange}
              />
            </div>

            {/* Prev chapter */}
            {prevChapterNo !== null ? (
              <Link
                href={`/novel/${novelId}/chapter/${prevChapterNo}`}
                className="p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
                aria-label="ตอนก่อนหน้า"
              >
                <ChevronLeft className="h-5 w-5" />
              </Link>
            ) : (
              <span className="p-2 rounded-lg text-white/20 cursor-not-allowed">
                <ChevronLeft className="h-5 w-5" />
              </span>
            )}

            {/* Next chapter */}
            {nextChapterNo !== null ? (
              <Link
                href={`/novel/${novelId}/chapter/${nextChapterNo}`}
                className="p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
                aria-label="ตอนถัดไป"
              >
                <ChevronRight className="h-5 w-5" />
              </Link>
            ) : (
              <span className="p-2 rounded-lg text-white/20 cursor-not-allowed">
                <ChevronRight className="h-5 w-5" />
              </span>
            )}
          </div>
        </div>
      </header>

      {/* Chapter list sheet */}
      <ChapterListSheet
        novelId={novelId}
        novelName={novelName}
        chapters={chapters}
        currentChapterNo={currentChapterNo}
        isOpen={listOpen}
        onClose={() => setListOpen(false)}
      />
    </>
  );
}
