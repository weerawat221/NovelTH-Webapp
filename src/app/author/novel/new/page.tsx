import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import NovelForm from "@/components/author/NovelForm";

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

  // Fetch all categories for select options
  const { data: categories } = await supabase
    .from("category")
    .select("category_id, category_name")
    .order("category_id");

  return (
    <>
      <Header />
      <main className="flex-1 min-h-screen bg-[#141210] py-8">
        <NovelForm categories={categories || []} authorId={author.author_id} />
      </main>
      <Footer />
    </>
  );
}
