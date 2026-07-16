import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  /** Base URL path, e.g. "/novels" */
  basePath: string;
  /** Existing search params to preserve (sort, category, etc.) */
  searchParams?: Record<string, string>;
}

export default function Pagination({
  currentPage,
  totalPages,
  basePath,
  searchParams = {},
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const buildHref = (page: number) => {
    const params = new URLSearchParams(searchParams);
    if (page > 1) {
      params.set("page", String(page));
    } else {
      params.delete("page");
    }
    const qs = params.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  };

  // Generate page numbers to display: [1] [...] [pages around current] [...] [last]
  const pages = generatePageNumbers(currentPage, totalPages);

  return (
    <nav
      className="flex items-center justify-center gap-1 py-8"
      aria-label="Pagination"
    >
      {/* ─── Previous ─── */}
      {currentPage > 1 ? (
        <Link
          href={buildHref(currentPage - 1)}
          className="h-9 w-9 rounded-full flex items-center justify-center text-muted hover:text-foreground hover:bg-surface-hover transition-colors"
          aria-label="หน้าก่อน"
        >
          <ChevronLeft className="h-4 w-4" />
        </Link>
      ) : (
        <span className="h-9 w-9 rounded-full flex items-center justify-center text-muted/30 cursor-not-allowed">
          <ChevronLeft className="h-4 w-4" />
        </span>
      )}

      {/* ─── Page numbers ─── */}
      {pages.map((page, idx) => {
        if (page === "...") {
          return (
            <span
              key={`ellipsis-${idx}`}
              className="h-9 w-9 flex items-center justify-center text-sm text-muted"
            >
              …
            </span>
          );
        }

        const pageNum = page as number;
        const isActive = pageNum === currentPage;

        return (
          <Link
            key={pageNum}
            href={buildHref(pageNum)}
            className={`
              h-9 w-9 rounded-full flex items-center justify-center text-sm font-medium transition-colors
              ${
                isActive
                  ? "bg-accent text-white shadow-sm"
                  : "text-muted hover:text-foreground hover:bg-surface-hover"
              }
            `}
            aria-current={isActive ? "page" : undefined}
          >
            {pageNum}
          </Link>
        );
      })}

      {/* ─── Next ─── */}
      {currentPage < totalPages ? (
        <Link
          href={buildHref(currentPage + 1)}
          className="h-9 w-9 rounded-full flex items-center justify-center text-muted hover:text-foreground hover:bg-surface-hover transition-colors"
          aria-label="หน้าถัดไป"
        >
          <ChevronRight className="h-4 w-4" />
        </Link>
      ) : (
        <span className="h-9 w-9 rounded-full flex items-center justify-center text-muted/30 cursor-not-allowed">
          <ChevronRight className="h-4 w-4" />
        </span>
      )}
    </nav>
  );
}

/**
 * Generate an array of page numbers and "..." ellipsis markers.
 * Pattern: [1] [...] [current-1, current, current+1] [...] [last]
 */
function generatePageNumbers(
  current: number,
  total: number
): (number | "...")[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const pages: (number | "...")[] = [];

  // Always show page 1
  pages.push(1);

  if (current > 3) {
    pages.push("...");
  }

  // Pages around current
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);

  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  if (current < total - 2) {
    pages.push("...");
  }

  // Always show last page
  if (total > 1) {
    pages.push(total);
  }

  return pages;
}
