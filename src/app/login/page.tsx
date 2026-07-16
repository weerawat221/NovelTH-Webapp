import React from "react";
import type { Metadata } from "next";
import AuthLayout from "@/components/auth/AuthLayout";
import LoginForm from "@/components/auth/LoginForm";

export const metadata: Metadata = {
  title: "เข้าสู่ระบบ — NovelTH",
  description: "เข้าสู่ระบบเพื่ออ่านและติดตามนิยายที่คุณชื่นชอบ",
};

export default function LoginPage() {
  return (
    <AuthLayout
      title="เข้าสู่ระบบ"
      subtitle="ยินดีต้อนรับกลับมา! กรุณาเข้าสู่ระบบเพื่อใช้งานต่อ"
      footerText="ยังไม่มีบัญชี?"
      footerLinkText="สมัครสมาชิก"
      footerLinkHref="/register"
    >
      <LoginForm />
    </AuthLayout>
  );
}
