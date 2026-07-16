import React from "react";
import type { Metadata } from "next";
import AuthLayout from "@/components/auth/AuthLayout";
import SelectRoleForm from "@/components/auth/SelectRoleForm";

export const metadata: Metadata = {
  title: "เลือกประเภทบัญชี — NovelTH",
  description: "ตั้งค่าโปรไฟล์และเลือกประเภทบัญชีสำหรับใช้งาน NovelTH",
};

export default function SelectRolePage() {
  return (
    <AuthLayout
      title="ตั้งค่าโปรไฟล์ของคุณ"
      subtitle="ยินดีต้อนรับสู่ NovelTH กรุณาเลือกประเภทบัญชีและตั้งชื่อผู้ใช้ก่อนเริ่มใช้งาน"
    >
      <SelectRoleForm />
    </AuthLayout>
  );
}
