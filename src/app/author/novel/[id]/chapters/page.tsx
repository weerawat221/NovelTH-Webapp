import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import ChapterManager from "@/components/author/ChapterManager";

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

  // Fetch all chapters of this novel
  const { data: chaptersData } = await supabase
    .from("chapter")
    .select("chapter_id, chapter_no, chapter_title, status, published_at, scheduled_at, view_count")
    .eq("novel_id", nid)
    .order("chapter_no", { ascending: true });

  const chapters = (chaptersData || []).map((c: any) => ({
    chapter_id: c.chapter_id,
    chapter_no: c.chapter_no,
    chapter_title: c.chapter_title,
    status: c.status as "draft" | "published" | "scheduled",
    published_at: c.published_at,
    scheduled_at: c.scheduled_at,
    view_count: c.view_count || 0,
  }));

  return (
    <>
      <Header />
      <main className="flex-1 min-h-screen bg-[#141210] py-8">
        <ChapterManager 
          initialChapters={chapters} 
          novel={{ novel_id: novel.novel_id, novel_name: novel.novel_name }} 
        />
      </main>
      <Footer />
    </>
  );
}
