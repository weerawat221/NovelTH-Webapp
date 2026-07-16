import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import AuthorPublicProfile from "@/components/profile/AuthorPublicProfile";
import type { NovelWithDetails } from "@/types/novel";

// NOTE: Next.js App Router gives static segments priority over dynamic ones.
// So /author/dashboard, /author/novel etc. route to their static directories
// and only unmatched paths fall through to this [username] dynamic segment.

interface PageProps {
  params: Promise<{ username: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { username } = await params;
  const supabase = await createClient();

  const { data } = await supabase
    .from("public_author_profile")
    .select("pen_name, bio")
    .eq("username", username)
    .maybeSingle();

  if (!data) {
    return { title: "ไม่พบนักเขียน — NovelTH" };
  }

  return {
    title: `${data.pen_name} — นักเขียน NovelTH`,
    description:
      data.bio?.slice(0, 160) ||
      `อ่านผลงานนิยายของ ${data.pen_name} บน NovelTH`,
  };
}

export default async function AuthorProfilePage({ params }: PageProps) {
  const { username } = await params;
  const supabase = await createClient();

  // Fetch author profile
  const { data: author } = await supabase
    .from("public_author_profile")
    .select(
      "author_id, username, pen_name, full_name, bio, profile_image, status, created_at"
    )
    .eq("username", username)
    .maybeSingle();

  if (!author) notFound();

  // Fetch published novels (exclude drafts) ordered by popularity
  const { data: novelsRaw } = await supabase
    .from("novel")
    .select(
      `
      novel_id, novel_name, author_id, category_id,
      synopsis, cover_image, status, view_count, created_at, updated_at,
      author:author_id (author_id, pen_name, profile_image),
      category:category_id (category_id, category_name)
    `
    )
    .eq("author_id", author.author_id)
    .neq("status", "draft")
    .order("view_count", { ascending: false });

  const novels = (novelsRaw || []) as unknown as NovelWithDetails[];

  return (
    <>
      <Header />
      <main className="flex-1 min-h-screen bg-[#141210]">
        <AuthorPublicProfile profile={author} novels={novels} />
      </main>
      <Footer />
    </>
  );
}
