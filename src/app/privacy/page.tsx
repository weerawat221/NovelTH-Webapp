import React from "react";
import type { Metadata } from "next";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Shield, Eye, Lock, FileText } from "lucide-react";

export const metadata: Metadata = {
  title: "นโยบายความเป็นส่วนตัว — NovelTH",
  description: "นโยบายความเป็นส่วนตัวและมาตรฐานการคุ้มครองข้อมูลส่วนบุคคลสำหรับผู้เข้าใช้งานแพลตฟอร์ม NovelTH",
};

export default function PrivacyPage() {
  return (
    <>
      <Header />
      <main className="flex-1 bg-[#141210] text-stone-300 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto space-y-10">
          {/* Header */}
          <div className="space-y-3">
            <h1 className="text-3xl font-extrabold text-stone-100 flex items-center gap-3">
              <Shield className="h-8 w-8 text-orange-500" />
              นโยบายความเป็นส่วนตัว (Privacy Policy)
            </h1>
            <p className="text-xs text-stone-500">
              อัปเดตล่าสุดเมื่อวันที่ 16 กรกฎาคม 2026
            </p>
            <p className="text-stone-400 text-sm leading-relaxed pt-2">
              ที่ NovelTH เราถือว่าความเป็นส่วนตัวของข้อมูลส่วนบุคคลของคุณมีความสำคัญเป็นอันดับแรก นโยบายฉบับนี้อธิบายถึงขั้นตอนการเก็บรวบรวม การใช้งาน การเปิดเผย และการคุ้มครองรักษาความปลอดภัยในข้อมูลที่คุณให้ไว้กับเราในระหว่างเข้าใช้บริการแพลตฟอร์ม
            </p>
          </div>

          <hr className="border-stone-900" />

          {/* Policy Sections */}
          <div className="space-y-8 text-sm sm:text-base text-stone-400">
            {/* Section 1 */}
            <div className="space-y-3">
              <h2 className="text-lg font-bold text-stone-200 flex items-center gap-2">
                <FileText className="h-4.5 w-4.5 text-orange-400/80" />
                1. ข้อมูลที่เราจัดเก็บและรวบรวม
              </h2>
              <p className="text-xs sm:text-sm leading-relaxed text-stone-400">
                เมื่อคุณสมัครใช้งานบัญชีสมาชิกกับทางแพลตฟอร์ม เราจะทำการขอข้อมูลส่วนบุคคลบางประการที่จำเป็นต่อการให้บริการ เช่น:
              </p>
              <ul className="list-disc pl-5 space-y-1 text-xs sm:text-sm text-stone-450">
                <li>ข้อมูลการระบุตัวตน: ชื่อผู้ใช้งาน (Username), อีเมล (Email), รหัสผ่าน และข้อมูลโปรไฟล์ส่วนตัว</li>
                <li>ข้อมูลสถานะนักเขียน: นามปากกา (Pen name) และประวัติส่วนตัวย่อ (Bio)</li>
                <li>ข้อมูลการใช้งานระบบ: ประวัติการอ่านนิยาย, รายการนิยายที่ชื่นชอบ (Favorites), ยอดวิว และความคิดเห็นที่คุณตอบโต้ในหน้าอ่านนิยาย</li>
                <li>ข้อมูลทางเทคนิค: ที่อยู่ IP Address, ข้อมูลเบราว์เซอร์, และข้อมูลคุ้กกี้สำหรับการบันทึกการใช้งาน</li>
              </ul>
            </div>

            {/* Section 2 */}
            <div className="space-y-3">
              <h2 className="text-lg font-bold text-stone-200 flex items-center gap-2">
                <Eye className="h-4.5 w-4.5 text-orange-400/80" />
                2. วัตถุประสงค์ในการนำข้อมูลไปใช้งาน
              </h2>
              <p className="text-xs sm:text-sm leading-relaxed text-stone-400">
                ข้อมูลทั้งหมดที่เราเก็บรวบรวมจะถูกนำมาใช้เพื่อวัตถุประสงค์ต่าง ๆ ดังต่อไปนี้เท่านั้น:
              </p>
              <ul className="list-disc pl-5 space-y-1 text-xs sm:text-sm text-stone-450">
                <li>เพื่อสร้างและจัดการบัญชีผู้ใช้งาน และปรับเปลี่ยนเนื้อหาให้เหมาะสมกับคุณ</li>
                <li>เพื่อจัดเก็บบันทึกประวัติการอ่านนิยาย และการตั้งค่าโหมดการอ่าน (Reading Settings)</li>
                <li>เพื่อรวบรวมรายงานสถิติยอดผู้เข้าเข้าชมและจำนวนความเห็นส่งไปแสดงผลหลังบ้านสำหรับนักเขียน</li>
                <li>เพื่อปรับปรุง ป้องกัน และดูแลรักษาระบบให้พ้นจากการถูกคุกคามทางไซเบอร์ หรือการกระทำที่ส่อละเมิดกฎหมาย</li>
              </ul>
            </div>

            {/* Section 3 */}
            <div className="space-y-3">
              <h2 className="text-lg font-bold text-stone-200 flex items-center gap-2">
                <Lock className="h-4.5 w-4.5 text-orange-400/80" />
                3. การป้องกันความปลอดภัยของข้อมูล
              </h2>
              <p className="text-xs sm:text-sm leading-relaxed text-stone-400">
                เราเลือกใช้มาตรการทางเทคนิคและทางกายภาพที่ได้มาตรฐานสากล ร่วมกับบริการคลาวด์จากผู้ให้บริการชั้นนำอย่าง Supabase เพื่อให้มั่นใจได้ว่าข้อมูลของคุณจะได้รับการปกป้องอย่างปลอดภัยจากการเข้าถึงโดยไม่ได้รับอนุญาต การสูญหาย หรือการเปิดเผยข้อมูลโดยมิชอบ
              </p>
            </div>

            {/* Section 4 */}
            <div className="space-y-3">
              <h2 className="text-lg font-bold text-stone-200 flex items-center gap-2">
                <Shield className="h-4.5 w-4.5 text-orange-400/80" />
                4. สิทธิ์ของคุณในฐานะเจ้าของข้อมูล
              </h2>
              <p className="text-xs sm:text-sm leading-relaxed text-stone-400">
                ตามกฎหมายคุ้มครองข้อมูลส่วนบุคคล (PDPA) คุณมีสิทธิ์ที่จะขอตรวจสอบ เข้าถึง แก้ไข อัปเดต หรือขอลบข้อมูลส่วนตัวของคุณออกจากระบบของเราเมื่อใดก็ได้ โดยสามารถดำเนินการได้ด้วยตนเองผ่านเมนู "ตั้งค่าโปรไฟล์" หรือส่งคำร้องหาทีมแอดมินของเรา
              </p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
