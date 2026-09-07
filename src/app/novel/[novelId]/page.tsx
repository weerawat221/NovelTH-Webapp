import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import type { NovelWithDetails, ChapterListItem } from "@/types/novel";
import { syncScheduledChapters, isChapterPublished } from "@/lib/utils/chapterPublish";

import Header from "@/components/layout/Header";
import SubNavigation from "@/components/layout/SubNavigation";
import Footer from "@/components/layout/Footer";
import NovelDetailPage from "@/components/novel/NovelDetailPage";


interface PageProps {
  params: Promise<{
    novelId: string;
  }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { novelId } = await params;
  const nid = parseInt(novelId, 10);
  if (isNaN(nid)) {
    return { title: "ไม่พบนิยาย — NovelTH" };
  }

  const supabase = await createClient();
  const { data: novel } = await supabase
    .from("novel")
    .select("novel_name, synopsis")
    .eq("novel_id", nid)
    .maybeSingle();

  if (!novel) {
    return { title: "ไม่พบนิยาย — NovelTH" };
  }

  return {
    title: `${novel.novel_name} | อ่านนิยายออนไลน์ฟรีที่ NovelTH`,
    description: novel.synopsis?.slice(0, 150) || `อ่านนิยาย ${novel.novel_name} ออนไลน์ฟรีที่ NovelTH`,
  };
}

export default async function Page({ params }: PageProps) {
  const { novelId } = await params;
  const nid = parseInt(novelId, 10);
  if (isNaN(nid)) notFound();

  const supabase = await createClient();

  // 1. Fetch novel with author + category details
  const { data: novelData, error: novelError } = await supabase
    .from("novel")
    .select(`
      *,
      author:author_id (author_id, username, pen_name, full_name, bio, profile_image, status, created_at, auth_user_id),
      category:category_id (category_id, category_name, description)
    `)
    .eq("novel_id", nid)
    .maybeSingle();

  if (novelError || !novelData) notFound();

  // Block suspended novels or suspended authors from public details view
  if (novelData.status === "suspended" || novelData.author?.status === "suspended") {
    notFound();
  }

  // Cast properly
  const novel = novelData as NovelWithDetails;

  // 2. Auth, Favorite and Reading History
  const { data: { user } } = await supabase.auth.getUser();
  let isNovelAuthor = false;
  let isSystemAdmin = false;

  if (user) {
    // Check admin
    const { data: adminRole } = await supabase
      .from("admin")
      .select("admin_id")
      .eq("auth_user_id", user.id)
      .maybeSingle();
    if (adminRole) isSystemAdmin = true;

    // Check author
    const { data: authorProfile } = await supabase
      .from("author")
      .select("author_id")
      .eq("auth_user_id", user.id)
      .maybeSingle();
    if (authorProfile && authorProfile.author_id === novel.author_id) {
      isNovelAuthor = true;
    }
  }

  // Ensure scheduled chapters that reached their time are updated in DB
  await syncScheduledChapters(supabase);

  // 3. Fetch chapters for this novel
  const { data: chaptersData } = await supabase
    .from("chapter")
    .select("chapter_id, chapter_no, chapter_title, published_at, status, scheduled_at")
    .eq("novel_id", nid)
    .order("chapter_no", { ascending: true });

  const rawChapters = chaptersData || [];
  const chapters: ChapterListItem[] = rawChapters
    .filter((c: any) => {
      if (isNovelAuthor || isSystemAdmin) return true;
      return isChapterPublished(c);
    })
    .map((c: any) => ({
      ...c,
      published_at: c.published_at || c.scheduled_at || "",
      status: isChapterPublished(c) ? "published" : c.status,
    }));

  let initialFavorited = false;
  let lastReadChapterNo: number | null = null;

  if (user) {
    // Get corresponding public.users.user_id
    const { data: userData } = await supabase
      .from("users")
      .select("user_id")
      .eq("auth_user_id", user.id)
      .maybeSingle();

    if (userData) {
      // Check if favorited
      const { data: favoriteData } = await supabase
        .from("favorite")
        .select("favorite_id")
        .eq("user_id", userData.user_id)
        .eq("novel_id", nid)
        .maybeSingle();

      initialFavorited = !!favoriteData;

      // Check reading history if there are chapters
      if (chapters.length > 0) {
        const chapterIds = chapters.map((c) => c.chapter_id);
        const { data: historyData } = await supabase
          .from("reading_history")
          .select("chapter_id, read_date")
          .eq("user_id", userData.user_id)
          .in("chapter_id", chapterIds)
          .order("read_date", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (historyData) {
          const matched = chapters.find((c) => c.chapter_id === historyData.chapter_id);
          if (matched) {
            lastReadChapterNo = matched.chapter_no;
          }
        }
      }
    }
  }

  return (
    <>
      <Header />
      <SubNavigation />
      <main className="flex-1 min-h-screen bg-[#141210]">
        <NovelDetailPage
          novel={novel}
          chapters={chapters}
          initialFavorited={initialFavorited}
          lastReadChapterNo={lastReadChapterNo}
        />
      </main>
      <Footer />
    </>
  );
}
