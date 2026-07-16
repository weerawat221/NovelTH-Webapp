import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ChapterEditor from "@/components/author/ChapterEditor";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function Page({ params }: PageProps) {
  const { id } = await params;
  const nid = parseInt(id, 10);
  if (isNaN(nid)) {
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

  // Find the next chapter_no (max chapter_no + 1)
  const { data: lastChapter } = await supabase
    .from("chapter")
    .select("chapter_no")
    .eq("novel_id", nid)
    .order("chapter_no", { ascending: false })
    .limit(1)
    .maybeSingle();

  const nextChapterNo = lastChapter ? lastChapter.chapter_no + 1 : 1;

  return (
    <ChapterEditor 
      novelId={novel.novel_id} 
      novelName={novel.novel_name} 
      chapterNo={nextChapterNo} 
    />
  );
}
