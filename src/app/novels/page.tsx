import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { Heart } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import type { NovelWithDetails } from "@/types/novel";

import Header from "@/components/layout/Header";
import SubNavigation from "@/components/layout/SubNavigation";
import Footer from "@/components/layout/Footer";
import CatalogToolbar from "@/components/novel/CatalogToolbar";
import CatalogNovelCard from "@/components/novel/CatalogNovelCard";
import CatalogGridSkeleton from "@/components/novel/CatalogGridSkeleton";
import Pagination from "@/components/novel/Pagination";
import EmptyState from "@/components/novel/EmptyState";

export const metadata: Metadata = {
  title: "รายการนิยาย — NovelTH",
  description:
    "เลือกอ่านนิยายจากทุกหมวดหมู่ แฟนตาซี โรแมนติก สืบสวน สยองขวัญ และอีกมากมาย",
};

const PER_PAGE = 60;

type SortOption = "latest" | "popular" | "name_asc";

interface PageProps {
  searchParams: Promise<{
    page?: string;
    sort?: string;
    category?: string;
    search?: string;
    view?: string;
    filter?: string;
  }>;
}

// ─── Data fetching ───

async function fetchNovels(params: {
  page: number;
  sort: SortOption;
  categoryIds: number[];
  search?: string;
  favoriteNovelIds?: number[];
}): Promise<{ novels: NovelWithDetails[]; totalCount: number }> {
  const supabase = await createClient();

  let query = supabase
    .from("novel")
    .select(
      `
      novel_id, novel_name, author_id, category_id, synopsis, cover_image, status, view_count, created_at, updated_at,
      author:author_id!inner (author_id, pen_name, profile_image, username, status),
      category:category_id (category_id, category_name)
    `,
      { count: "exact" }
    )
    .neq("status", "suspended")
    .neq("author.status", "suspended");

  // ─── Filters ───
  if (params.categoryIds && params.categoryIds.length > 0) {
    query = query.in("category_id", params.categoryIds);
  }

  if (params.search) {
    query = query.ilike("novel_name", `%${params.search}%`);
  }

  if (params.favoriteNovelIds) {
    query = query.in("novel_id", params.favoriteNovelIds);
  }

  // ─── Sort ───
  switch (params.sort) {
    case "name_asc":
      query = query.order("novel_name", { ascending: true });
      break;
    case "popular":
      query = query.order("view_count", { ascending: false });
      break;
    case "latest":
    default:
      query = query.order("created_at", { ascending: false });
      break;
  }

  // ─── Pagination ───
  const from = (params.page - 1) * PER_PAGE;
  const to = from + PER_PAGE - 1;
  query = query.range(from, to);

  const { data, error, count } = await query;

  if (error) {
    console.error("Error fetching novels:", error);
    return { novels: [], totalCount: 0 };
  }

  return {
    novels: (data as unknown as NovelWithDetails[]) ?? [],
    totalCount: count ?? 0,
  };
}

// ─── Novel grid (async server component for Suspense) ───

async function NovelGrid({
  page,
  sort,
  categoryIds,
  search,
  view,
  filter,
}: {
  page: number;
  sort: SortOption;
  categoryIds: number[];
  search?: string;
  view: "grid" | "list";
  filter?: string;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let favoriteNovelIds: number[] = [];
  let novels: NovelWithDetails[] = [];
  let totalCount = 0;
  let isNotAuthenticated = false;

  if (filter === "favorites") {
    if (!user) {
      isNotAuthenticated = true;
    } else {
      const { data: userData } = await supabase
        .from("users")
        .select("user_id")
        .eq("auth_user_id", user.id)
        .maybeSingle();

      if (userData) {
        const { data: favs } = await supabase
          .from("favorite")
          .select("novel_id")
          .eq("user_id", userData.user_id);

        favoriteNovelIds = favs ? favs.map((f) => Number(f.novel_id)) : [];

        if (favoriteNovelIds.length > 0) {
          const result = await fetchNovels({
            page,
            sort,
            categoryIds,
            search,
            favoriteNovelIds,
          });
          novels = result.novels;
          totalCount = result.totalCount;
        }
      }
    }
  } else {
    // Normal flow
    if (user) {
      const { data: userData } = await supabase
        .from("users")
        .select("user_id")
        .eq("auth_user_id", user.id)
        .maybeSingle();

      if (userData) {
        const { data: favs } = await supabase
          .from("favorite")
          .select("novel_id")
          .eq("user_id", userData.user_id);

        if (favs) {
          favoriteNovelIds = favs.map((f) => Number(f.novel_id));
        }
      }
    }

    const result = await fetchNovels({
      page,
      sort,
      categoryIds,
      search,
    });
    novels = result.novels;
    totalCount = result.totalCount;
  }

  const totalPages = Math.ceil(totalCount / PER_PAGE);

  // Build searchParams to preserve in pagination links
  const preservedParams: Record<string, string> = {};
  if (sort && sort !== "latest") preservedParams.sort = sort;
  if (categoryIds && categoryIds.length > 0) preservedParams.category = categoryIds.join(",");
  if (search) preservedParams.search = search;
  if (view && view !== "grid") preservedParams.view = view;
  if (filter) preservedParams.filter = filter;

  if (isNotAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="h-16 w-16 rounded-full bg-accent/10 text-accent flex items-center justify-center mb-4">
          <Heart className="h-8 w-8 fill-accent text-accent animate-pulse" />
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-1">เข้าสู่ระบบเพื่อดูนิยายโปรด</h3>
        <p className="text-sm text-muted max-w-xs mb-6">
          บันทึกนิยายที่คุณชื่นชอบเพื่อเข้าอ่านได้สะดวกทุกเวลา
        </p>
        <Link
          href="/login"
          className="inline-flex items-center justify-center px-5 py-2.5 rounded-lg bg-accent text-white text-sm font-medium hover:bg-accent-hover transition-colors"
        >
          เข้าสู่ระบบเลย
        </Link>
      </div>
    );
  }

  return (
    <>
      {/* ─── Toolbar ─── */}
      <CatalogToolbar
        totalCount={totalCount}
        currentPage={page}
        perPage={PER_PAGE}
      />

      {/* ─── Grid/List or Empty ─── */}
      {novels.length === 0 ? (
        filter === "favorites" ? (
          <EmptyState
            title="ยังไม่มีนิยายโปรด"
            description="กดรูปหัวใจที่นิยายที่คุณชื่นชอบเพื่อบันทึกไว้ในหน้านี้"
          />
        ) : (
          <EmptyState />
        )
      ) : view === "list" ? (
        <div className="flex flex-col gap-4">
          {novels.map((novel) => (
            <CatalogNovelCard
              key={novel.novel_id}
              novel={novel}
              viewMode="list"
              isFavorited={favoriteNovelIds.includes(novel.novel_id)}
            />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {novels.map((novel) => (
            <CatalogNovelCard
              key={novel.novel_id}
              novel={novel}
              viewMode="grid"
              isFavorited={favoriteNovelIds.includes(novel.novel_id)}
            />
          ))}
        </div>
      )}

      {/* ─── Pagination ─── */}
      <Pagination
        currentPage={page}
        totalPages={totalPages}
        basePath="/novels"
        searchParams={preservedParams}
      />
    </>
  );
}

// ─── Page ───

export default async function NovelsPage({ searchParams }: PageProps) {
  const params = await searchParams;

  const page = Math.max(1, parseInt(params.page || "1", 10) || 1);
  const sort = (params.sort as SortOption) || "latest";
  const categoryIds = params.category
    ? params.category.split(",").map((id) => parseInt(id, 10)).filter(Boolean)
    : [];
  const search = params.search || undefined;
  const view = (params.view as "grid" | "list") || "grid";
  const filter = params.filter || undefined;

  // Build page title based on filters
  let pageTitle = "รายการนิยายทั้งหมด";
  if (filter === "favorites") {
    pageTitle = "นิยายโปรดของฉัน";
  } else if (categoryIds.length > 0) {
    const supabase = await createClient();
    const { data: cats } = await supabase
      .from("category")
      .select("category_name")
      .in("category_id", categoryIds);
    if (cats && cats.length > 0) {
      pageTitle = `หมวดหมู่: ${cats.map((c) => c.category_name).join(", ")}`;
    } else {
      pageTitle = "รายการนิยายทั้งหมด";
    }
  } else if (search) {
    pageTitle = `ผลการค้นหา "${search}"`;
  }

  return (
    <>
      <Header />
      <SubNavigation />

      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* ─── Page header ─── */}
          <div className="pt-6 pb-2">
            <h1 className="text-2xl font-bold text-foreground">{pageTitle}</h1>
          </div>

          {/* ─── Content with Suspense ─── */}
          <Suspense
            fallback={
              <>
                {/* Toolbar skeleton */}
                <div className="flex items-center justify-between py-4">
                  <div className="h-9 w-48 rounded-lg skeleton" />
                  <div className="h-9 w-64 rounded-lg skeleton" />
                </div>
                <CatalogGridSkeleton count={18} />
              </>
            }
          >
            <NovelGrid
              page={page}
              sort={sort}
              categoryIds={categoryIds}
              search={search}
              view={view}
              filter={filter}
            />
          </Suspense>
        </div>
      </main>

      <Footer />
    </>
  );
}
