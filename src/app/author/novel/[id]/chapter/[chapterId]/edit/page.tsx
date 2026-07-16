import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ChapterEditor from "@/components/author/ChapterEditor";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{
    id: string;
    chapterId: string;
  }>;
}

export default async function Page({ params }: PageProps) {
  const { id, chapterId } = await params;
  const nid = parseInt(id, 10);
  const cid = parseInt(chapterId, 10);
  if (isNaN(nid) || isNaN(cid)) {
    notFound();
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch author profile
  const { data: author } = await supabase
    .from("author")
    .select("author_id, pen_name, status, bio, profile_image, auth_user_id")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (!author) {
    redirect("/?error=author_unauthorized");
  }

  if (author.status === "pending") {
    redirect("/?error=author_pending");
  }

  // Fetch novel
  const { data: novel } = await supabase
    .from("novel")
    .select("novel_id, novel_name, author_id")
    .eq("novel_id", nid)
    .maybeSingle();

  if (!novel) {
    notFound();
  }

  // Ensure author owns this novel
  if (novel.author_id !== author.author_id) {
    redirect("/author/dashboard");
  }

  // Fetch chapter with content
  const { data: chapterData, error } = await supabase
    .from("chapter")
    .select(`
      *,
      chapter_content (content)
    `)
    .eq("chapter_id", cid)
    .maybeSingle();

  if (error || !chapterData) {
    notFound();
  }

  // Ensure chapter belongs to this novel
  if (chapterData.novel_id !== novel.novel_id) {
    redirect(`/author/novel/${novel.novel_id}/chapters`);
  }

  const initialData = {
    chapter_id: chapterData.chapter_id,
    chapter_no: chapterData.chapter_no,
    chapter_title: chapterData.chapter_title,
    content: (chapterData as any).chapter_content?.content || chapterData.content || "",
    status: chapterData.status as "draft" | "published" | "scheduled",
    scheduled_at: chapterData.scheduled_at,
  };

  return (
    <ChapterEditor 
      novelId={novel.novel_id} 
      novelName={novel.novel_name} 
      chapterNo={chapterData.chapter_no} 
      initialData={initialData}
    />
  );
}
