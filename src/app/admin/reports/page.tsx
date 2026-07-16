import type { Metadata } from "next";
import ReportsClient from "@/components/admin/ReportsClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "รายงานสถิติ — NovelTH Admin",
  description: "รายงานวิเคราะห์ยอดผู้เข้าใช้งานและสถิติต่างๆ ในระบบ",
};

export default function AdminReportsPage() {
  return <ReportsClient />;
}
