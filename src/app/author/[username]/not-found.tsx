import Link from "next/link";
import { UserX } from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

export default function AuthorNotFound() {
  return (
    <>
      <Header />
      <main className="flex-1 min-h-screen bg-[#141210] flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <div className="mx-auto w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-6">
            <UserX className="h-8 w-8 text-white/25" />
          </div>
          <h1 className="text-xl font-extrabold text-white/80 mb-2">
            ไม่พบนักเขียนคนนี้
          </h1>
          <p className="text-sm text-white/40 leading-relaxed">
            นักเขียนที่คุณค้นหาไม่มีในระบบ
            อาจถูกเปลี่ยนชื่อหรือไม่เคยมีตั้งแต่ต้น
          </p>
          <Link
            href="/novels"
            className="inline-flex items-center gap-1.5 mt-6 px-5 py-2.5 rounded-xl bg-[#e09050] text-white text-xs font-bold hover:bg-[#c97c3a] transition-colors"
          >
            ดูนิยายทั้งหมด
          </Link>
        </div>
      </main>
      <Footer />
    </>
  );
}
