"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import {
  LayoutGrid,
  List,
  ChevronDown,
} from "lucide-react";
import { useState, useCallback } from "react";

const sortOptions = [
  { value: "latest", label: "วันที่วางจำหน่าย" },
  { value: "popular", label: "ยอดนิยม" },
  { value: "name_asc", label: "ชื่อเรื่อง A-Z" },
] as const;

type SortValue = (typeof sortOptions)[number]["value"];
type ViewMode = "grid" | "list";

interface CatalogToolbarProps {
  totalCount: number;
  currentPage: number;
  perPage: number;
}

export default function CatalogToolbar({
  totalCount,
  currentPage,
  perPage,
}: CatalogToolbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentSort = (searchParams.get("sort") as SortValue) || "latest";
  const viewMode = (searchParams.get("view") as ViewMode) || "grid";

  const start = totalCount === 0 ? 0 : (currentPage - 1) * perPage + 1;
  const end = Math.min(currentPage * perPage, totalCount);

  const updateParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set(key, value);
      // Reset to page 1 when changing sort
      if (key === "sort") {
        params.delete("page");
      }
      router.push(`${pathname}?${params.toString()}`);
    },
    [router, pathname, searchParams]
  );

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 py-4">
      {/* ─── Left: Sort dropdown ─── */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted whitespace-nowrap">เรียงตาม</span>
        <div className="relative">
          <select
            value={currentSort}
            onChange={(e) => updateParam("sort", e.target.value)}
            className="appearance-none bg-surface border border-border rounded-lg pl-3 pr-8 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent cursor-pointer transition-colors"
          >
            {sortOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted pointer-events-none" />
        </div>
      </div>

      {/* ─── Right: Result count + View toggle ─── */}
      <div className="flex items-center gap-3">
        <span className="text-sm text-muted">
          {totalCount > 0
            ? `แสดง ${start}-${end} จาก ${totalCount} เรื่อง`
            : "ไม่พบนิยาย"}
        </span>

        <div className="flex items-center border border-border rounded-lg overflow-hidden">
          <button
            onClick={() => updateParam("view", "grid")}
            className={`p-2 transition-colors ${
              viewMode === "grid"
                ? "bg-accent text-white"
                : "bg-surface text-muted hover:text-foreground hover:bg-surface-hover"
            }`}
            aria-label="มุมมองกริด"
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
          <button
            onClick={() => updateParam("view", "list")}
            className={`p-2 transition-colors ${
              viewMode === "list"
                ? "bg-accent text-white"
                : "bg-surface text-muted hover:text-foreground hover:bg-surface-hover"
            }`}
            aria-label="มุมมองลิสต์"
          >
            <List className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
