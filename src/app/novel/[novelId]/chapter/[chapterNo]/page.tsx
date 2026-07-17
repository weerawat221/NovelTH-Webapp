import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import type { Chapter, ChapterListItem } from "@/types/novel";
import ChapterReader from "@/components/reader/ChapterReader";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{
    novelId: string;
    chapterNo: string;
  }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { novelId, chapterNo } = await params;
  const supabase = await createClient();

  const { data: chapter } = await supabase
    .from("chapter")
    .select("chapter_title, novel:novel_id (novel_name)")
    .eq("novel_id", parseInt(novelId, 10))
    .eq("chapter_no", parseInt(chapterNo, 10))
    .maybeSingle();

  if (!chapter) {
    return { title: "ไม่พบตอนที่ต้องการ — NovelTH" };
  }

  const novelName = (chapter.novel as any)?.novel_name || "นิยาย";

  return {
    title: `${chapter.chapter_title} — ${novelName} | NovelTH`,
    description: `อ่าน ${chapter.chapter_title} ของ ${novelName} ออนไลน์ฟรี`,
  };
}

export default async function ChapterPage({ params }: PageProps) {
  const { novelId, chapterNo } = await params;
  const nid = parseInt(novelId, 10);
  const cno = parseInt(chapterNo, 10);

  if (isNaN(nid) || isNaN(cno)) notFound();

  const supabase = await createClient();

  // 1. Fetch the current chapter with novel & author info
  const { data: chapterData, error: chapterError } = await supabase
    .from("chapter")
    .select(
      `
      *,
      novel:novel_id (
        novel_id,
        novel_name,
        status,
        author:author_id (
          author_id,
          pen_name,
          username,
          profile_image,
          status
        )
      )
    `
    )
    .eq("novel_id", nid)
    .eq("chapter_no", cno)
    .maybeSingle();

  if (chapterError || !chapterData) notFound();

  // Block reading chapters of suspended novels or suspended authors
  if (
    chapterData.novel?.status === "suspended" ||
    (chapterData.novel as any)?.author?.status === "suspended"
  ) {
    notFound();
  }

  const novel = chapterData.novel as any;
  const author = novel?.author;

  // 2. Fetch all chapters of this novel (lightweight)
  const { data: allChapters } = await supabase
    .from("chapter")
    .select("chapter_id, chapter_no, chapter_title")
    .eq("novel_id", nid)
    .order("chapter_no", { ascending: true });

  const chapters: ChapterListItem[] = allChapters || [];

  // 3. Determine prev/next
  const currentIdx = chapters.findIndex((c) => c.chapter_no === cno);
  const prevChapterNo = currentIdx > 0 ? chapters[currentIdx - 1].chapter_no : null;
  const nextChapterNo =
    currentIdx >= 0 && currentIdx < chapters.length - 1
      ? chapters[currentIdx + 1].chapter_no
      : null;
  const nextChapterTitle =
    nextChapterNo !== null ? chapters[currentIdx + 1].chapter_title : null;

  // 5. Log reading history (if user is logged in)
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const { data: userData } = await supabase
      .from("users")
      .select("user_id")
      .eq("auth_user_id", user.id)
      .maybeSingle();

    if (userData) {
      // Reading history (upsert: update read_date if exists)
      const { data: existingHistory } = await supabase
        .from("reading_history")
        .select("history_id")
        .eq("user_id", userData.user_id)
        .eq("chapter_id", chapterData.chapter_id)
        .maybeSingle();

      if (existingHistory) {
        await supabase
          .from("reading_history")
          .update({ read_date: new Date().toISOString() })
          .eq("history_id", existingHistory.history_id);
      } else {
        await supabase
          .from("reading_history")
          .insert({
            user_id: userData.user_id,
            chapter_id: chapterData.chapter_id,
          });
      }
    }
  }

  // 6. Build the chapter object
  const chapter: Chapter = {
    chapter_id: chapterData.chapter_id,
    novel_id: chapterData.novel_id,
    chapter_no: chapterData.chapter_no,
    chapter_title: chapterData.chapter_title,
    content: chapterData.content || "",
    view_count: chapterData.view_count,
    published_at: chapterData.published_at,
  };

  return (
    <ChapterReader
      chapter={chapter}
      novelId={nid}
      novelName={novel?.novel_name || "นิยาย"}
      authorName={author?.pen_name || "ไม่ทราบผู้แต่ง"}
      authorId={author?.author_id || 0}
      authorUsername={author?.username || ""}
      authorAvatar={author?.profile_image || null}
      chapters={chapters}
      prevChapterNo={prevChapterNo}
      nextChapterNo={nextChapterNo}
      nextChapterTitle={nextChapterTitle}
    />
  );
}
