"use client";

import { useRef, useState, useEffect } from "react";
import { ChevronRight, ChevronLeft } from "lucide-react";
import type { NovelWithDetails } from "@/types/novel";
import NovelCard from "./NovelCard";

interface NovelCarouselSectionProps {
  title: string;
  icon?: React.ReactNode;
  novels: NovelWithDetails[];
  viewAllHref?: string;
  completedNovelIds?: Set<number> | number[];
}

export default function NovelCarouselSection({
  title,
  icon,
  novels,
  viewAllHref,
  completedNovelIds,
}: NovelCarouselSectionProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  };

  useEffect(() => {
    checkScroll();
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener("scroll", checkScroll, { passive: true });
    window.addEventListener("resize", checkScroll);
    return () => {
      el.removeEventListener("scroll", checkScroll);
      window.removeEventListener("resize", checkScroll);
    };
  }, [novels]);

  const scroll = (direction: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;
    const amount = el.clientWidth * 0.75;
    el.scrollBy({
      left: direction === "right" ? amount : -amount,
      behavior: "smooth",
    });
  };

  if (novels.length === 0) return null;

  return (
    <section className="py-5">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* ─── Section header ─── */}
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            {icon && <span className="inline-flex shrink-0 items-center justify-center">{icon}</span>}
            <span>{title}</span>
          </h2>
          {viewAllHref && (
            <a
              href={viewAllHref}
              className="text-sm text-accent hover:text-accent-hover font-medium transition-colors"
            >
              ดูทั้งหมด →
            </a>
          )}
        </div>

        {/* ─── Scroll container ─── */}
        <div className="relative group/carousel">
          <div
            ref={scrollRef}
            className="flex gap-3 overflow-x-auto scroll-smooth snap-x snap-mandatory scrollbar-hide py-2.5 px-0.5"
          >
            {novels.map((novel) => {
              const isCompleted =
                completedNovelIds instanceof Set
                  ? completedNovelIds.has(novel.novel_id)
                  : Array.isArray(completedNovelIds)
                  ? completedNovelIds.includes(novel.novel_id)
                  : false;
              return (
                <NovelCard
                  key={novel.novel_id}
                  novel={novel}
                  isCompleted={isCompleted}
                />
              );
            })}
          </div>

          {/* ─── Scroll arrows (desktop) ─── */}
          {canScrollLeft && (
            <button
              onClick={() => scroll("left")}
              className="
                absolute left-0 top-1/3 -translate-y-1/2 -translate-x-3 z-10
                h-10 w-10 rounded-full bg-surface shadow-lg border border-border
                text-foreground flex items-center justify-center
                hover:bg-surface-hover transition-all duration-300
                opacity-0 group-hover/carousel:opacity-100
                hidden md:flex
              "
              aria-label="Scroll left"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
          )}
          {canScrollRight && (
            <button
              onClick={() => scroll("right")}
              className="
                absolute right-0 top-1/3 -translate-y-1/2 translate-x-3 z-10
                h-10 w-10 rounded-full bg-surface shadow-lg border border-border
                text-foreground flex items-center justify-center
                hover:bg-surface-hover transition-all duration-300
                opacity-0 group-hover/carousel:opacity-100
                hidden md:flex
              "
              aria-label="Scroll right"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
