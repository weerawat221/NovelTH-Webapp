import type { Metadata } from "next";
import ReportsClient from "@/components/admin/ReportsClient";
import { Suspense } from "react";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "รายงานสถิติ — NovelTH Admin",
  description: "รายงานวิเคราะห์ยอดผู้เข้าใช้งานและสถิติต่างๆ ในระบบ",
};

export default function AdminReportsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#141210] flex items-center justify-center text-white/50 text-xs">
        กำลังโหลดหน้ารายงาน...
      </div>
    }>
      <ReportsClient />
    </Suspense>
  );
}
