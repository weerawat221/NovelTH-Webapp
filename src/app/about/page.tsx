import React from "react";
import type { Metadata } from "next";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { BookOpen, Users, Compass, ShieldCheck } from "lucide-react";

export const metadata: Metadata = {
  title: "เกี่ยวกับเรา — NovelTH",
  description: "ทำความรู้จักกับ NovelTH แพลตฟอร์มการอ่านและลงนิยายออนไลน์สำหรับคนรุ่นใหม่",
};

export default function AboutPage() {
  return (
    <>
      <Header />
      <main className="flex-1 bg-[#141210] text-stone-300 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto space-y-12">
          {/* Hero Section */}
          <div className="text-center space-y-4">
            <span className="text-xs font-bold text-orange-500 uppercase tracking-widest px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20">
              Welcome to NovelTH
            </span>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-stone-100 tracking-tight">
              พื้นที่รวมจินตนาการของคนรักนิยาย
            </h1>
            <p className="text-stone-400 max-w-2xl mx-auto text-sm sm:text-base leading-relaxed">
              เรามุ่งมั่นสร้างสรรค์แพลตฟอร์มที่ดีที่สุดสำหรับนักอ่านและนักเขียน เพื่อเชื่อมต่อจินตนาการ ความสนุก และสังคมรักนิยายออนไลน์ให้เติบโตไปด้วยกัน
            </p>
          </div>

          <hr className="border-stone-900" />

          {/* Grid Features */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-stone-900/30 border border-stone-850 p-6 rounded-2xl space-y-3">
              <div className="h-10 w-10 rounded-xl bg-orange-500/10 text-orange-400 flex items-center justify-center shrink-0">
                <BookOpen className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-bold text-stone-100">คลังนิยายหลากหลาย</h3>
              <p className="text-xs sm:text-sm text-stone-450 leading-relaxed">
                รวบรวมนิยายจากทุกหมวดหมู่ อาทิ แฟนตาซี, โรแมนติก, สืบสวน, และสยองขวัญ เพื่อตอบสนองความชอบและไลฟ์สไตล์การอ่านของทุกคนอย่างตรงจุด
              </p>
            </div>

            <div className="bg-stone-900/30 border border-stone-850 p-6 rounded-2xl space-y-3">
              <div className="h-10 w-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0">
                <Users className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-bold text-stone-100">ชุมชนการแลกเปลี่ยน</h3>
              <p className="text-xs sm:text-sm text-stone-450 leading-relaxed">
                สร้างพื้นที่ที่ให้ผู้อ่านและนักเขียนได้แลกเปลี่ยนความคิดเห็น คอมเมนต์ ติชม และสนับสนุนผลงานของกันและกันได้อย่างสร้างสรรค์
              </p>
            </div>

            <div className="bg-stone-900/30 border border-stone-850 p-6 rounded-2xl space-y-3">
              <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
                <Compass className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-bold text-stone-100">ค้นหาง่าย รวดเร็ว</h3>
              <p className="text-xs sm:text-sm text-stone-450 leading-relaxed">
                ระบบจัดการแคตตาล็อกและตัวกรองการค้นหาอัจฉริยะ ช่วยให้คุณพบนิยายเล่มโปรดเล่มถัดไปได้อย่างสะดวก รวดเร็ว และแม่นยำ
              </p>
            </div>

            <div className="bg-stone-900/30 border border-stone-850 p-6 rounded-2xl space-y-3">
              <div className="h-10 w-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center shrink-0">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-bold text-stone-100">ความปลอดภัยและลิขสิทธิ์</h3>
              <p className="text-xs sm:text-sm text-stone-450 leading-relaxed">
                เราให้ความสำคัญและเคารพทรัพย์สินทางปัญญาของนักเขียน พร้อมมีระบบแอดมินช่วยคัดกรองเนื้อหาไม่ให้ขัดต่อศีลธรรมและความปลอดภัย
              </p>
            </div>
          </div>

          {/* Details Section */}
          <div className="bg-stone-900/10 border border-stone-900/60 rounded-3xl p-6 sm:p-8 space-y-6">
            <h2 className="text-xl font-bold text-stone-100">วิสัยทัศน์ของเรา (Our Vision)</h2>
            <p className="text-xs sm:text-sm leading-relaxed text-stone-400">
              วิสัยทัศน์ของ NovelTH คือการเป็นสื่อกลางชั้นนำในการส่งต่อผลงานนิยายที่ดีที่สุดสู่ผู้อ่าน และเป็นก้าวแรกที่สำคัญสำหรับนักเขียนหน้าใหม่ที่ต้องการมีพื้นที่แสดงความสามารถเพื่อต่อยอดสู่ความสำเร็จเชิงพาณิชย์
            </p>

            <h2 className="text-xl font-bold text-stone-100">พันธกิจหลัก (Our Mission)</h2>
            <ul className="list-disc pl-5 space-y-2 text-xs sm:text-sm text-stone-400 leading-relaxed">
              <li>พัฒนาเครื่องมือและระบบควบคุมสำหรับนักเขียน (Author Dashboard) เพื่อให้ใช้งานและติดตามข้อมูลสถิติได้อย่างโปร่งใส</li>
              <li>ปรับปรุงคุณภาพประสบการณ์การอ่าน (Reader UI/UX) ให้สามารถอ่านได้อย่างสบายตา ปรับแต่งขนาด อุณหภูมิสี และฟอนต์ได้ตามใจชอบ</li>
              <li>รักษามาตรฐานชุมชนออนไลน์ให้ปลอดภัย สร้างสรรค์ ปราศจากการกลั่นแกล้งและละเมิดสิทธิ์</li>
            </ul>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
