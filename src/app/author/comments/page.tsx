import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import AuthorComments from "@/components/author/AuthorComments";

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

  // Fetch author's novels for filter dropdown
  const { data: novels } = await supabase
    .from("novel")
    .select("novel_id, novel_name")
    .eq("author_id", author.author_id)
    .order("updated_at", { ascending: false });

  // Get author's dbUserId (from public.users) to check if replies target their comments
  const { data: userData } = await supabase
    .from("users")
    .select("user_id")
    .eq("auth_user_id", user.id)
    .maybeSingle();
  const dbUserId = userData?.user_id || null;

  // Fetch comments notifications
  const { data: commentsData, error } = await supabase
    .from("comment")
    .select(`
      comment_id,
      comment_text,
      comment_date,
      is_spoiler,
      parent_comment_id,
      user:user_id (user_id, username, profile_image),
      parent:parent_comment_id (
        user_id
      ),
      notification_read_status (read_at),
      chapter!inner (
        chapter_id,
        chapter_no,
        chapter_title,
        novel!inner (
          novel_id,
          novel_name,
          author_id
        )
      )
    `)
    .eq("chapter.novel.author_id", author.author_id)
    .order("comment_date", { ascending: false });

  if (error) {
    console.error("Error loading notifications:", error);
  }

  const comments = (commentsData || []).map((c: any) => ({
    comment_id: c.comment_id,
    comment_text: c.comment_text,
    comment_date: c.comment_date,
    is_spoiler: c.is_spoiler,
    parent_comment_id: c.parent_comment_id,
    user_id: c.user?.user_id,
    username: c.user?.username || "ผู้ใช้",
    profile_image: c.user?.profile_image || null,
    parent_user_id: c.parent?.user_id || null,
    chapter_id: c.chapter?.chapter_id,
    chapter_no: c.chapter?.chapter_no,
    chapter_title: c.chapter?.chapter_title,
    novel_id: c.chapter?.novel?.novel_id,
    novel_name: c.chapter?.novel?.novel_name,
    is_read: c.notification_read_status && c.notification_read_status.length > 0,
  }));

  return (
    <>
      <Header />
      <main className="flex-1 min-h-screen bg-[#141210] py-8">
        <AuthorComments 
          initialComments={comments} 
          novels={novels || []} 
          authorId={author.author_id}
          dbUserId={dbUserId}
        />
      </main>
      <Footer />
    </>
  );
}
