import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import ProfileSettingsForm from "@/components/profile/ProfileSettingsForm";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "ตั้งค่าโปรไฟล์ — NovelTH",
  description: "จัดการข้อมูลส่วนตัวและการตั้งค่าบัญชีของคุณบน NovelTH",
};

export default async function ProfilePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Detect OAuth provider (google vs email/password)
  const provider = (user.app_metadata?.provider as string) || "email";

  // Fetch both tables in parallel — one will be null
  const [{ data: author }, { data: userData }] = await Promise.all([
    supabase
      .from("author")
      .select("author_id, username, pen_name, full_name, phone, bio, profile_image, created_at, auth_user_id")
      .eq("auth_user_id", user.id)
      .maybeSingle(),
    supabase
      .from("users")
      .select("user_id, username, full_name, phone, profile_image, created_at, auth_user_id")
      .eq("auth_user_id", user.id)
      .maybeSingle(),
  ]);

  if (!author && !userData) {
    // Account exists in auth but has no profile yet — redirect to role selection
    redirect("/auth/select-role");
  }

  const role: "user" | "author" = author ? "author" : "user";
  const profile = author ?? userData!;

  return (
    <>
      <Header />
      <main className="flex-1 min-h-screen bg-[#141210] py-8">
        {/* Page heading */}
        <div className="mx-auto max-w-2xl px-4 mb-8">
          <h1 className="text-xl sm:text-2xl font-extrabold text-white/90">
            ตั้งค่าโปรไฟล์
          </h1>
          <p className="text-xs text-white/35 mt-1">
            จัดการข้อมูลส่วนตัวและการตั้งค่าบัญชีของคุณ
          </p>
        </div>

        <ProfileSettingsForm
          authId={user.id}
          userEmail={user.email ?? ""}
          provider={provider}
          role={role}
          profileData={{
            username: profile.username,
            full_name: profile.full_name ?? null,
            email: user.email ?? null,
            profile_image: profile.profile_image ?? null,
            created_at: profile.created_at,
            // User-specific
            user_id: userData?.user_id,
            phone: author ? (author.phone ?? null) : (userData?.phone ?? null),
            // Author-specific
            author_id: author?.author_id,
            pen_name: author?.pen_name,
            bio: author?.bio ?? null,
          }}
        />
      </main>
      <Footer />
    </>
  );
}
