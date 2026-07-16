"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Mail,
  KeyRound,
  Lock,
  ArrowLeft,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
} from "lucide-react";
import { toast } from "sonner";
import { sendOtpCode, verifyOtpCode, resetUserPassword } from "@/app/forgot-password/actions";

export default function ForgotPasswordForm() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [email, setEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resetSuccess, setResetSuccess] = useState(false);

  // STEP 1: Send OTP code
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError("กรุณากรอกอีเมล");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await sendOtpCode(email);
      toast.success("ส่งรหัสยืนยันไปยังอีเมลของคุณสำเร็จ (โปรดดูที่ Terminal ของระบบ)");
      setStep(2);
    } catch (err: any) {
      setError(err.message || "เกิดข้อผิดพลาดในการส่งรหัส");
    } finally {
      setLoading(false);
    }
  };

  // STEP 2: Verify OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otpCode.length !== 6 || isNaN(Number(otpCode))) {
      setError("กรุณากรอกรหัส OTP 6 หลัก");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await verifyOtpCode(email, otpCode);
      toast.success("ยืนยันรหัสสำเร็จ ตั้งรหัสผ่านใหม่ได้ทันที");
      setStep(3);
    } catch (err: any) {
      setError(err.message || "รหัส OTP ไม่ถูกต้อง");
    } finally {
      setLoading(false);
    }
  };

  // STEP 3: Reset Password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPassword.length < 8) {
      setError("รหัสผ่านใหม่ต้องมีอย่างน้อย 8 ตัวอักษร");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("รหัสผ่านไม่ตรงกัน");
      return;
    }

    setLoading(true);
    try {
      await resetUserPassword(email, otpCode, newPassword);
      toast.success("รีเซ็ตรหัสผ่านสำเร็จเรียบร้อยแล้ว!");
      setResetSuccess(true);
      // Redirect to login after 2 seconds
      setTimeout(() => {
        window.location.href = "/login";
      }, 2000);
    } catch (err: any) {
      setError(err.message || "ไม่สามารถรีเซ็ตรหัสผ่านได้");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md bg-[#171513]/80 border border-white/5 p-8 rounded-2xl shadow-2xl backdrop-blur-md">
      {/* Back button */}
      {step < 3 && (
        <button
          onClick={() => {
            setError(null);
            if (step === 2) setStep(1);
          }}
          className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white mb-6 transition-colors cursor-pointer"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>{step === 2 ? "ย้อนกลับไปกรอกอีเมล" : "กลับหน้าหลัก"}</span>
        </button>
      )}

      {/* Title */}
      <div className="mb-6">
        <h2 className="text-xl font-extrabold text-white">ลืมรหัสผ่าน?</h2>
        <p className="text-xs text-white/35 mt-1.5 leading-relaxed">
          {step === 1 && "ระบุอีเมลบัญชีของคุณเพื่อขอรับรหัส OTP 6 หลักสำหรับรีเซ็ตรหัสผ่าน"}
          {step === 2 && `กรอกรหัส OTP 6 หลักที่ระบบส่งออก (แสดงที่ Terminal ของระบบ) สำหรับ ${email}`}
          {step === 3 && "ตั้งรหัสผ่านใหม่สำหรับเข้าสู่ระบบของบัญชีคุณ"}
        </p>
      </div>

      {/* Global Error message */}
      {error && (
        <div className="mb-5 p-3.5 rounded-xl bg-red-500/10 border border-red-500/15 flex items-start gap-2.5 text-red-400 text-xs leading-relaxed">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* ─── STEP 1: EMAIL REQUEST ─── */}
      {step === 1 && (
        <form onSubmit={handleSendOtp} method="POST" className="space-y-4">
          <div>
            <label className="block text-[10px] font-bold text-white/45 uppercase tracking-widest mb-1.5">
              อีเมลที่ใช้สมัครบัญชี
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-white/25" />
              <input
                type="email"
                placeholder="your@email.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                className="w-full bg-[#1c1917] border border-white/5 text-white/80 text-sm font-medium rounded-xl pl-11 pr-4 py-3 focus:outline-none focus:ring-1 focus:ring-accent/50 focus:border-accent/30 transition-all placeholder-white/20"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-[#e09050] text-white text-xs font-bold hover:bg-[#c97c3a] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-all flex items-center justify-center gap-1.5"
          >
            {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            <span>ส่งรหัสยืนยัน OTP</span>
          </button>
        </form>
      )}

      {/* ─── STEP 2: OTP VERIFY ─── */}
      {step === 2 && (
        <form onSubmit={handleVerifyOtp} method="POST" className="space-y-4">
          <div>
            <label className="block text-[10px] font-bold text-white/45 uppercase tracking-widest mb-1.5">
              รหัส OTP 6 หลัก (จาก Terminal)
            </label>
            <div className="relative">
              <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-white/25" />
              <input
                type="text"
                placeholder="123456"
                required
                maxLength={6}
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                disabled={loading}
                className="w-full bg-[#1c1917] border border-white/5 text-white/80 text-sm font-medium rounded-xl pl-11 pr-4 py-3 focus:outline-none focus:ring-1 focus:ring-accent/50 focus:border-accent/30 transition-all tracking-[0.25em] text-center placeholder-white/20 font-bold"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-[#e09050] text-white text-xs font-bold hover:bg-[#c97c3a] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-all flex items-center justify-center gap-1.5"
          >
            {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            <span>ยืนยันรหัส OTP</span>
          </button>
        </form>
      )}

      {/* ─── STEP 3: RESET PASSWORD / SUCCESS ─── */}
      {step === 3 && (
        <div>
          {/* If successfully changed, show landing success check */}
          {resetSuccess ? (
            <div className="flex flex-col items-center justify-center text-center py-6">
              <div className="p-3.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 mb-4 animate-bounce">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <h3 className="text-base font-bold text-white">เปลี่ยนรหัสผ่านสำเร็จ!</h3>
              <p className="text-xs text-white/40 mt-1">
                ระบบกำลังพาท่านกลับสู่หน้าเข้าสู่ระบบ...
              </p>
            </div>
          ) : (
            <form onSubmit={handleResetPassword} method="POST" className="space-y-4">
              {/* New Password */}
              <div>
                <label className="block text-[10px] font-bold text-white/45 uppercase tracking-widest mb-1.5">
                  รหัสผ่านใหม่ (อย่างน้อย 8 ตัวอักษร)
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-white/25" />
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    disabled={loading}
                    className="w-full bg-[#1c1917] border border-white/5 text-white/80 text-sm font-medium rounded-xl pl-11 pr-11 py-3 focus:outline-none focus:ring-1 focus:ring-accent/50 focus:border-accent/30 transition-all placeholder-white/20"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/25 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-[10px] font-bold text-white/45 uppercase tracking-widest mb-1.5">
                  ยืนยันรหัสผ่านใหม่อีกครั้ง
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-white/25" />
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="••••••••"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={loading}
                    className="w-full bg-[#1c1917] border border-white/5 text-white/80 text-sm font-medium rounded-xl pl-11 pr-11 py-3 focus:outline-none focus:ring-1 focus:ring-accent/50 focus:border-accent/30 transition-all placeholder-white/20"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/25 hover:text-white"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-[#e09050] text-white text-xs font-bold hover:bg-[#c97c3a] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-all flex items-center justify-center gap-1.5"
              >
                {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                <span>อัปเดตรหัสผ่านใหม่</span>
              </button>
            </form>
          )}
        </div>
      )}

      {/* Footer Link */}
      {step < 3 && (
        <div className="mt-6 text-center text-xs text-white/30 border-t border-white/5 pt-4">
          จำรหัสผ่านได้แล้ว?{" "}
          <Link href="/login" className="font-bold text-accent hover:underline ml-1">
            เข้าสู่ระบบที่นี่
          </Link>
        </div>
      )}
    </div>
  );
}
