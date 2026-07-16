"use client";

import { useState, useEffect } from "react";
import type { Chapter, ChapterListItem, Author, ReadingTheme } from "@/types/novel";
import ReaderHeader from "./ReaderHeader";
import AuthorLink from "@/components/common/AuthorLink";
import NextChapterCTA from "./NextChapterCTA";
import CommentSection from "./CommentSection";
import { trackChapterView } from "@/lib/viewTracking";


interface ThemeConfig {
  bg: string;
  text: string;
  mutedText: string;
}

const themeConfigs: Record<ReadingTheme, ThemeConfig> = {
  dark: { bg: "#1a1a1a", text: "#d4d0c8", mutedText: "#8c8278" },
  light: { bg: "#ffffff", text: "#1a1a1a", mutedText: "#6b6b6b" },
  warm: { bg: "#f5f0e8", text: "#3d3529", mutedText: "#8c7a64" },
};

// ─── localStorage keys ───
const LS_FONT_SIZE = "reader-font-size";
const LS_LINE_HEIGHT = "reader-line-height";
const LS_THEME = "reader-theme";

interface ChapterReaderProps {
  chapter: Chapter;
  novelId: number;
  novelName: string;
  authorName: string;
  authorId: number;
  authorUsername?: string;
  authorAvatar?: string | null;
  chapters: ChapterListItem[];
  prevChapterNo: number | null;
  nextChapterNo: number | null;
  nextChapterTitle: string | null;
}

export default function ChapterReader({
  chapter,
  novelId,
  novelName,
  authorName,
  authorId,
  authorUsername = "",
  authorAvatar = null,
  chapters,
  prevChapterNo,
  nextChapterNo,
  nextChapterTitle,
}: ChapterReaderProps) {
  // ─── Reading settings (from localStorage) ───
  const [fontSize, setFontSize] = useState(18);
  const [lineHeight, setLineHeight] = useState(1.8);
  const [theme, setTheme] = useState<ReadingTheme>("dark");
  const [mounted, setMounted] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const savedFont = localStorage.getItem(LS_FONT_SIZE);
      const savedLine = localStorage.getItem(LS_LINE_HEIGHT);
      const savedTheme = localStorage.getItem(LS_THEME);
      if (savedFont) setFontSize(Number(savedFont));
      if (savedLine) setLineHeight(Number(savedLine));
      if (savedTheme && ["dark", "light", "warm"].includes(savedTheme)) {
        setTheme(savedTheme as ReadingTheme);
      }
    } catch {}
    setMounted(true);
    
    // Track chapter view with cookie deduplication
    trackChapterView(chapter.chapter_id, novelId);
  }, [chapter.chapter_id, novelId]);

  // Persist changes
  const handleFontSizeChange = (v: number) => {
    setFontSize(v);
    try { localStorage.setItem(LS_FONT_SIZE, String(v)); } catch {}
  };
  const handleLineHeightChange = (v: number) => {
    setLineHeight(v);
    try { localStorage.setItem(LS_LINE_HEIGHT, String(v)); } catch {}
  };
  const handleThemeChange = (v: ReadingTheme) => {
    setTheme(v);
    try { localStorage.setItem(LS_THEME, v); } catch {}
  };

  const tc = themeConfigs[theme];

  // Don't render until localStorage is read (prevents flash)
  if (!mounted) {
    return (
      <div className="min-h-screen bg-[#1a1a1a]">
        <div className="sticky top-0 z-50 bg-[#141210]/95 backdrop-blur-md border-b border-white/5 h-12" />
        <div className="mx-auto max-w-2xl px-6 py-12">
          <div className="space-y-4 animate-pulse">
            <div className="h-6 w-2/3 mx-auto rounded bg-white/10" />
            <div className="h-4 w-1/3 mx-auto rounded bg-white/5" />
            <div className="h-px bg-white/10 my-8" />
            {["75%", "85%", "65%", "90%", "80%", "70%", "88%", "72%"].map((width, i) => (
              <div key={i} className="h-4 rounded bg-white/5" style={{ width }} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: tc.bg }}>
      {/* ─── Sticky Header (always dark) ─── */}
      <ReaderHeader
        novelId={novelId}
        novelName={novelName}
        chapterTitle={chapter.chapter_title}
        currentChapterNo={chapter.chapter_no}
        chapters={chapters}
        prevChapterNo={prevChapterNo}
        nextChapterNo={nextChapterNo}
        fontSize={fontSize}
        lineHeight={lineHeight}
        theme={theme}
        onFontSizeChange={handleFontSizeChange}
        onLineHeightChange={handleLineHeightChange}
        onThemeChange={handleThemeChange}
      />

      {/* ─── Reading Content ─── */}
      <div className="mx-auto max-w-2xl px-6 py-10">
        {/* Chapter title */}
        <h2
          className="text-2xl font-bold text-center mb-2"
          style={{ color: tc.text }}
        >
          {chapter.chapter_title}
        </h2>

        {/* Author */}
        <div className="flex justify-center mb-8">
          {authorUsername ? (
            <AuthorLink
              username={authorUsername}
              displayName={authorName}
              avatarUrl={authorAvatar}
              showAvatar={false}
              size="md"
              theme={theme}
              className="font-medium hover:underline text-sm"
            />
          ) : (
            <span
              className="text-sm font-medium"
              style={{ color: themeConfigs[theme === "dark" ? "dark" : theme].mutedText === tc.mutedText ? "#e09050" : "#c97c3a" }}
            >
              {authorName}
            </span>
          )}
        </div>

        {/* Divider */}
        <div
          className="h-px mb-8"
          style={{
            backgroundColor:
              theme === "dark"
                ? "rgba(255,255,255,0.08)"
                : theme === "warm"
                ? "rgba(61,53,41,0.12)"
                : "rgba(0,0,0,0.08)",
          }}
        />

        {/* Content */}
        <article
          className="whitespace-pre-wrap break-words leading-relaxed"
          style={{
            fontSize: `${fontSize}px`,
            lineHeight: lineHeight,
            color: tc.text,
          }}
        >
          {chapter.content || "ไม่มีเนื้อหา"}
        </article>

        {/* ─── Next chapter CTA ─── */}
        <div className="mt-12">
          <NextChapterCTA
            novelId={novelId}
            nextChapterNo={nextChapterNo}
            nextChapterTitle={nextChapterTitle}
            theme={theme}
          />
        </div>

        {/* ─── Comment Section ─── */}
        <CommentSection chapterId={chapter.chapter_id} theme={theme} novelAuthorId={authorId} />
      </div>
    </div>
  );
}
