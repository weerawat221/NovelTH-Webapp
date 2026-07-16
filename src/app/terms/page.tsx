import React from "react";
import type { Metadata } from "next";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { FileWarning, CheckCircle, Scale, PenTool } from "lucide-react";

export const metadata: Metadata = {
  title: "ข้อกำหนดการใช้งาน — NovelTH",
  description: "ข้อกำหนดและเงื่อนไขในการใช้งานแพลตฟอร์มและพื้นที่บริการของ NovelTH",
};

export default function TermsPage() {
  return (
    <>
      <Header />
      <main className="flex-1 bg-[#141210] text-stone-300 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto space-y-10">
          {/* Header */}
          <div className="space-y-3">
            <h1 className="text-3xl font-extrabold text-stone-100 flex items-center gap-3">
              <Scale className="h-8 w-8 text-orange-500" />
              ข้อกำหนดการใช้งาน (Terms of Use)
            </h1>
            <p className="text-xs text-stone-500">
              อัปเดตล่าสุดเมื่อวันที่ 16 กรกฎาคม 2026
            </p>
            <p className="text-stone-400 text-sm leading-relaxed pt-2">
              ขอต้อนรับสู่แพลตฟอร์ม NovelTH การสมัครสมาชิกและการใช้งานเว็บไซต์นี้แสดงว่าคุณตกลงที่จะปฏิบัติตามข้อกำหนดและเงื่อนไขการใช้บริการฉบับนี้ หากคุณไม่ตกลงในเงื่อนไขเหล่านี้ โปรดงดเว้นการเข้าใช้งานเว็บไซต์
            </p>
          </div>

          <hr className="border-stone-900" />

          {/* Terms Content */}
          <div className="space-y-8 text-sm sm:text-base text-stone-400">
            {/* Section 1 */}
            <div className="space-y-3">
              <h2 className="text-lg font-bold text-stone-200 flex items-center gap-2">
                <CheckCircle className="h-4.5 w-4.5 text-orange-400/80" />
                1. การสมัครและการรักษาความปลอดภัยของบัญชี
              </h2>
              <ul className="list-disc pl-5 space-y-1 text-xs sm:text-sm text-stone-450 leading-relaxed">
                <li>ผู้ใช้ตกลงจะให้ข้อมูลที่เป็นจริง ถูกต้อง และเป็นปัจจุบันในระหว่างการสมัครสมาชิก</li>
                <li>คุณมีหน้าที่รับผิดชอบในการปกป้องรหัสผ่านบัญชีของคุณและกิจกรรมทั้งหมดที่เกิดขึ้นภายใต้บัญชีใช้งานของคุณ</li>
                <li>หากพบการเข้าถึงบัญชีโดยไม่ได้รับอนุญาต โปรดติดต่อทีมสนับสนุนแอดมินโดยทันที</li>
              </ul>
            </div>

            {/* Section 2 */}
            <div className="space-y-3">
              <h2 className="text-lg font-bold text-stone-200 flex items-center gap-2">
                <PenTool className="h-4.5 w-4.5 text-orange-400/80" />
                2. ทรัพย์สินทางปัญญาและลิขสิทธิ์ของนักเขียน
              </h2>
              <p className="text-xs sm:text-sm leading-relaxed text-stone-400">
                NovelTH ให้ความสำคัญและคุ้มครองผู้สร้างสรรค์ผลงานอย่างเข้มงวด:
              </p>
              <ul className="list-disc pl-5 space-y-1 text-xs sm:text-sm text-stone-450 leading-relaxed">
                <li>ลิขสิทธิ์ของนิยาย รูปภาพประกอบ และเนื้อหาตอนทั้งหมดที่นักเขียนอัปโหลดขึ้นระบบ จะยังคงเป็นของนักเขียนผู้สร้างสรรค์แต่เพียงผู้เดียว</li>
                <li>ห้ามมิให้ผู้ใดคัดลอก ดัดแปลง แจกจ่าย หรือดาวน์โหลดเนื้อหานิยายไปใช้นอกระบบโดยไม่ได้รับอนุญาตเป็นลายลักษณ์อักษรจากนักเขียน</li>
                <li>นักเขียนยืนยันว่าผลงานที่ลงในระบบเป็นความคิดสร้างสรรค์ของตนเอง ไม่ได้นำผลงานของบุคคลอื่นมาลอกเลียนแบบหรือดัดแปลงโดยมิชอบ</li>
              </ul>
            </div>

            {/* Section 3 */}
            <div className="space-y-3">
              <h2 className="text-lg font-bold text-stone-200 flex items-center gap-2">
                <FileWarning className="h-4.5 w-4.5 text-orange-400/80" />
                3. กฎระเบียบชุมชนและการเขียนความคิดเห็น
              </h2>
              <p className="text-xs sm:text-sm leading-relaxed text-stone-400">
                เพื่อสังคมการอ่านนิยายที่เป็นระเบียบเรียบร้อย ผู้ใช้งานทุกคนตกลงจะไม่:
              </p>
              <ul className="list-disc pl-5 space-y-1 text-xs sm:text-sm text-stone-450 leading-relaxed">
                <li>เขียนข้อความสแปม โฆษณาชวนเชื่อ หรือข้อความที่หยาบคาย แสดงความเกลียดชัง (Hate Speech) ในส่วนของคอมเมนต์</li>
                <li>สปอยล์เนื้อหาสำคัญของนิยายโดยไม่มีการเตือนล่วงหน้า อันสร้างความไม่พึงพอใจให้นักอ่านท่านอื่น</li>
                <li>แอบอ้างเป็นบุคคลอื่น หรือเป็นทีมงานดูแลระบบของ NovelTH</li>
                <li>
                  <span className="font-bold text-amber-500">สิทธิ์ในการควบคุม:</span> นักเขียนมีสิทธิ์ในการ "ซ่อน" ความคิดเห็นที่ไม่เหมาะสมในผลงานของตน และทีมผู้ดูแลระบบ (Admin) มีสิทธิ์ในการลบหรือระงับความคิดเห็นรวมถึงสิทธิ์การใช้งานของบัญชีที่ละเมิดข้อกำหนดโดยไม่ต้องแจ้งล่วงหน้า
                </li>
              </ul>
            </div>

            {/* Section 4 */}
            <div className="space-y-3">
              <h2 className="text-lg font-bold text-stone-200 flex items-center gap-2">
                <Scale className="h-4.5 w-4.5 text-orange-400/80" />
                4. ข้อจำกัดความรับผิดชอบ
              </h2>
              <p className="text-xs sm:text-sm leading-relaxed text-stone-400">
                ทางแพลตฟอร์ม NovelTH จัดหาสื่อกลางการลงเนื้อหานิยายและความคิดเห็นตามความรับผิดชอบของผู้ใช้ เราไม่ได้เป็นตัวการรับผิดชอบต่อความสูญเสียใด ๆ จากความเห็นหรือการกระทำผิดลิขสิทธิ์นอกแพลตฟอร์ม อย่างไรก็ตาม เราจะดำเนินมาตรการการจัดการและตรวจสอบตามกรอบเงื่อนไขทันทีเมื่อได้รับรายงานร้องเรียน
              </p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
