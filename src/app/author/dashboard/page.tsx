import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import AuthorDashboard from "@/components/author/AuthorDashboard";

export const dynamic = "force-dynamic";

export default async function Page() {
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

  // Fetch novels with category, chapters, and visit_log
  const { data: novelsData, error } = await supabase
    .from("novel")
    .select(`
      novel_id,
      novel_name,
      cover_image,
      status,
      updated_at,
      category_id,
      category:category_id (category_name),
      chapter (chapter_id),
      visit_log (visit_id)
    `)
    .eq("author_id", author.author_id)
    .order("updated_at", { ascending: false });

  if (error) {
    console.error("Error loading author novels:", error);
  }

  const novels = (novelsData || []).map((n: any) => ({
    novel_id: n.novel_id,
    novel_name: n.novel_name,
    cover_image: n.cover_image,
    status: n.status,
    updated_at: n.updated_at,
    category_id: n.category_id,
    category_name: n.category?.category_name || "ทั่วไป",
    total_chapters: n.chapter?.length || 0,
    total_views: n.visit_log?.length || 0,
  }));

  return (
    <>
      <Header />
      <main className="flex-1 min-h-screen bg-[#141210] py-8">
        <AuthorDashboard initialNovels={novels} author={author} />
      </main>
      <Footer />
    </>
  );
}
