import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import ReadingHistoryClient from "@/components/profile/ReadingHistoryClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ประวัติการอ่าน — NovelTH",
  description: "จัดการประวัติการอ่านนิยายของคุณและอ่านต่อตอนล่าสุดได้อย่างง่ายดาย",
};

export const dynamic = "force-dynamic";

export default async function ReadingHistoryPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch reading history using PostgreSQL RPC function
  const { data: historyData, error } = await supabase.rpc("get_user_reading_history");

  if (error) {
    console.error("Error loading reading history:", error);
  }

  const rawHistory = historyData || [];
  
  // Sort by read_date DESC as distinct on orders by novel_id initially
  const sortedHistory = [...rawHistory].sort((a: any, b: any) => {
    const dateA = new Date(a.read_date).getTime();
    const dateB = new Date(b.read_date).getTime();
    return dateB - dateA;
  });

  return (
    <>
      <Header />
      <main className="flex-1 min-h-screen bg-[#0f0d0b] py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <ReadingHistoryClient initialHistory={sortedHistory} />
        </div>
      </main>
      <Footer />
    </>
  );
}
