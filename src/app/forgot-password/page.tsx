import React from "react";
import type { Metadata } from "next";
import AuthLayout from "@/components/auth/AuthLayout";
import ForgotPasswordForm from "@/components/auth/ForgotPasswordForm";

export const metadata: Metadata = {
  title: "ลืมรหัสผ่าน — NovelTH",
  description: "ขอรหัส OTP เพื่อรีเซ็ตรหัสผ่านบัญชีของคุณบน NovelTH",
};

export default function ForgotPasswordPage() {
  return (
    <AuthLayout
      title="กู้คืนรหัสผ่าน"
      subtitle="กรุณากรอกรหัสผ่านใหม่หลังกู้คืนรหัสผ่านด้วยรหัส OTP สำเร็จ"
      footerText="จำรหัสผ่านได้แล้ว?"
      footerLinkText="เข้าสู่ระบบ"
      footerLinkHref="/login"
    >
      <ForgotPasswordForm />
    </AuthLayout>
  );
}
