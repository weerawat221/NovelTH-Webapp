import React from "react";
import type { Metadata } from "next";
import AuthLayout from "@/components/auth/AuthLayout";
import RegisterForm from "@/components/auth/RegisterForm";

export const metadata: Metadata = {
  title: "สมัครสมาชิก — NovelTH",
  description: "สร้างบัญชีใหม่เพื่อเริ่มอ่าน หรือเผยแพร่นิยายของคุณกับ NovelTH",
};

export default function RegisterPage() {
  return (
    <AuthLayout
      title="สมัครสมาชิก"
      subtitle="เลือกประเภทบัญชีและกรอกข้อมูลเพื่อเริ่มต้นใช้งาน NovelTH"
      footerText="มีบัญชีอยู่แล้ว?"
      footerLinkText="เข้าสู่ระบบ"
      footerLinkHref="/login"
    >
      <RegisterForm />
    </AuthLayout>
  );
}
