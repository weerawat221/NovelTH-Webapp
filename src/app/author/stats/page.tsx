import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import AuthorSidebar from "@/components/author/AuthorSidebar";
import AuthorStatsClient from "@/components/author/AuthorStatsClient";

export const dynamic = "force-dynamic";

export default async function StatsPage() {
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

  // Fetch novels with view_count and chapters
  const { data: novelsData, error: novelsError } = await supabase
    .from("novel")
    .select(`
      novel_id,
      novel_name,
      cover_image,
      view_count,
      chapter (chapter_id)
    `)
    .eq("author_id", author.author_id)
    .order("view_count", { ascending: false });

  if (novelsError) {
    console.error("Error loading author novels stats:", novelsError);
  }

  // Fetch chapters for the author's novels with comments
  const { data: chaptersData, error: chaptersError } = await supabase
    .from("chapter")
    .select(`
      chapter_id,
      chapter_no,
      chapter_title,
      novel_id,
      view_count,
      novel:novel_id!inner (novel_name, author_id),
      comment (comment_id)
    `)
    .eq("novel.author_id", author.author_id);

  if (chaptersError) {
    console.error("Error loading author chapters stats:", chaptersError);
  }

  const novels = (novelsData || []).map((n: any) => ({
    novel_id: n.novel_id,
    novel_name: n.novel_name,
    cover_image: n.cover_image,
    view_count: n.view_count || 0,
    total_chapters: n.chapter?.length || 0,
  }));

  const chapters = (chaptersData || []).map((c: any) => ({
    chapter_id: c.chapter_id,
    chapter_no: c.chapter_no,
    chapter_title: c.chapter_title,
    novel_id: c.novel_id,
    novel_name: c.novel?.novel_name || "",
    comment_count: c.comment?.length || 0,
    view_count: c.view_count || 0,
  }));

  return (
    <>
      <Header />
      <div className="flex flex-col md:flex-row min-h-screen bg-[#141210]">
        <AuthorSidebar activeTab="stats" />
        <main className="flex-1 p-6 md:p-8">
          <AuthorStatsClient novels={novels} chapters={chapters} />
        </main>
      </div>
      <Footer />
    </>
  );
}
