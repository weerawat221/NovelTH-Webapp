import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import type { NovelWithDetails, Category, TopAuthor, TopReader } from "@/types/novel";

import Header from "@/components/layout/Header";
import SubNavigation from "@/components/layout/SubNavigation";
import Footer from "@/components/layout/Footer";
import HeroCarousel from "@/components/home/HeroCarousel";
import NovelCarouselSection from "@/components/novel/NovelCarouselSection";
import HomeLeaderboard from "@/components/home/HomeLeaderboard";
import { NovelSectionSkeleton } from "@/components/novel/NovelCardSkeleton";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFire, faBolt, faBook } from "@fortawesome/free-solid-svg-icons";

export const dynamic = "force-dynamic";

// ─── Data fetching ───

async function fetchNovelsWithDetails(): Promise<NovelWithDetails[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("novel")
    .select(
      `
      novel_id, novel_name, author_id, category_id, synopsis, cover_image, status, view_count, created_at, updated_at,
      author:author_id!inner (author_id, pen_name, profile_image, username, status),
      category:category_id (category_id, category_name)
    `
    )
    .neq("status", "suspended")
    .neq("author.status", "suspended")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching novels:", error);
    return [];
  }

  return (data as unknown as NovelWithDetails[]) ?? [];
}

async function fetchCategories(): Promise<Category[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("category")
    .select("*")
    .order("category_id");

  if (error) {
    console.error("Error fetching categories:", error);
    return [];
  }

  return data ?? [];
}

async function fetchTopAuthors(): Promise<TopAuthor[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_top_authors", { limit_count: 5 });
  if (error) {
    console.error("Error fetching top authors:", error);
    return [];
  }
  return (data as TopAuthor[]) ?? [];
}

async function fetchTopReaders(): Promise<TopReader[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_top_readers", { limit_count: 5 });
  if (error) {
    console.error("Error fetching top readers:", error);
    return [];
  }
  return (data as TopReader[]) ?? [];
}

async function fetchCompletedNovelIds(): Promise<Set<number>> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return new Set();

    const { data, error } = await supabase.rpc("get_my_completed_novels");
    if (error) {
      console.error("Error fetching completed novels:", error);
      return new Set();
    }
    return new Set((data ?? []).map((r: { novel_id: number | string }) => Number(r.novel_id)));
  } catch (err) {
    console.error("Error fetching completed novels:", err);
    return new Set();
  }
}

// ─── Novel sections (async server component) ───

async function NovelSections() {
  const [novels, categories, topAuthors, topReaders, completedNovelIds] = await Promise.all([
    fetchNovelsWithDetails(),
    fetchCategories(),
    fetchTopAuthors(),
    fetchTopReaders(),
    fetchCompletedNovelIds(),
  ]);

  // Section 1: Latest novels (all, sorted by newest)
  const latestNovels = novels.slice(0, 10);

  // Section 2: Popular novels (sorted by view_count)
  const popularNovels = [...novels].sort((a, b) => b.view_count - a.view_count).slice(0, 10);

  // Section 3+: Per-category sections
  const categoryNovelMap = new Map<number, NovelWithDetails[]>();
  for (const novel of novels) {
    const catId = novel.category_id;
    if (!categoryNovelMap.has(catId)) {
      categoryNovelMap.set(catId, []);
    }
    categoryNovelMap.get(catId)!.push(novel);
  }

  return (
    <>
      <NovelCarouselSection
        title="นิยายยอดนิยม"
        icon={<FontAwesomeIcon icon={faFire} className="text-orange-500 text-base" />}
        novels={popularNovels}
        completedNovelIds={completedNovelIds}
        viewAllHref="/novels?sort=popular"
      />

      {/* ─── Leaderboard Section (Top Authors & Readers) ─── */}
      {(topAuthors.length > 0 || topReaders.length > 0) && (
        <>
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <hr className="border-border" />
          </div>
          <HomeLeaderboard topAuthors={topAuthors} topReaders={topReaders} />
        </>
      )}

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <hr className="border-border" />
      </div>

      <NovelCarouselSection
        title="มาใหม่"
        icon={<FontAwesomeIcon icon={faBolt} className="text-amber-400 text-base" />}
        novels={latestNovels}
        completedNovelIds={completedNovelIds}
        viewAllHref="/novels?sort=latest"
      />

      {categories.map((category) => {
        const categoryNovels = categoryNovelMap.get(category.category_id) ?? [];
        if (categoryNovels.length === 0) return null;

        return (
          <div key={category.category_id}>
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <hr className="border-border" />
            </div>
            <NovelCarouselSection
              title={category.category_name}
              icon={<FontAwesomeIcon icon={faBook} className="text-accent text-sm" />}
              novels={categoryNovels}
              completedNovelIds={completedNovelIds}
              viewAllHref={`/novels?category=${category.category_id}`}
            />
          </div>
        );
      })}
    </>
  );
}

// ─── Page ───

export default function HomePage() {
  return (
    <>
      <Header />
      <SubNavigation />

      <main className="flex-1">
        <HeroCarousel />

        <Suspense
          fallback={
            <>
              <NovelSectionSkeleton />
              <NovelSectionSkeleton />
              <NovelSectionSkeleton />
            </>
          }
        >
          <NovelSections />
        </Suspense>
      </main>

      <Footer />
    </>
  );
}
