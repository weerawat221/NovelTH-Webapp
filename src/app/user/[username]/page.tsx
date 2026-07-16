import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import UserPublicProfile from "@/components/profile/UserPublicProfile";

interface PageProps {
  params: Promise<{ username: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { username } = await params;
  const supabase = await createClient();

  const { data } = await supabase
    .from("public_user_profile")
    .select("full_name, username")
    .eq("username", username)
    .maybeSingle();

  if (!data) {
    return { title: "ไม่พบผู้ใช้ — NovelTH" };
  }

  const displayName = data.full_name || data.username;
  return {
    title: `${displayName} (@${data.username}) — NovelTH`,
    description: `โปรไฟล์ของ ${displayName} บน NovelTH`,
  };
}

export default async function UserProfilePage({ params }: PageProps) {
  const { username } = await params;
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("public_user_profile")
    .select("user_id, username, full_name, profile_image, status, created_at")
    .eq("username", username)
    .maybeSingle();

  if (!profile) notFound();

  return (
    <>
      <Header />
      <main className="flex-1 min-h-screen bg-[#141210]">
        <UserPublicProfile profile={profile} />
      </main>
      <Footer />
    </>
  );
}
