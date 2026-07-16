import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import NovelForm from "@/components/author/NovelForm";

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
    redirect("/author/dashboard");
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
  const { data: novel, error } = await supabase
    .from("novel")
    .select("novel_id, novel_name, author_id, category_id, synopsis, cover_image, status, view_count, created_at, updated_at")
    .eq("novel_id", nid)
    .maybeSingle();

  if (error || !novel) {
    notFound();
  }

  // Ensure author owns this novel
  if (novel.author_id !== author.author_id) {
    redirect("/author/dashboard");
  }

  // Fetch categories
  const { data: categories } = await supabase
    .from("category")
    .select("category_id, category_name")
    .order("category_id");

  // Format to match form expectations
  const initialData = {
    novel_id: novel.novel_id,
    novel_name: novel.novel_name,
    category_id: novel.category_id,
    synopsis: novel.synopsis,
    cover_image: novel.cover_image,
    status: novel.status as "ongoing" | "completed" | "draft",
  };

  return (
    <>
      <Header />
      <main className="flex-1 min-h-screen bg-[#141210] py-8">
        <NovelForm 
          categories={categories || []} 
          initialData={initialData} 
          authorId={author.author_id} 
        />
      </main>
      <Footer />
    </>
  );
}
