"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Eye, EyeOff, Loader2, AlertCircle, BookOpen, PenTool, Info } from "lucide-react";
import { toast } from "sonner";
import GoogleAuthButton from "./GoogleAuthButton";

type AccountRole = "user" | "author";

const registerSchema = z
  .object({
    username: z
      .string()
      .min(3, { message: "ชื่อผู้ใช้ (Username) ต้องมีอย่างน้อย 3 ตัวอักษร" })
      .max(30, { message: "ชื่อผู้ใช้ (Username) ต้องไม่เกิน 30 ตัวอักษร" })
      .regex(/^[a-zA-Z0-9_]+$/, { message: "ใช้ได้เฉพาะภาษาอังกฤษ ตัวเลข และเครื่องหมาย _ เท่านั้น" }),
    displayName: z
      .string()
      .min(2, { message: "กรุณากรอกชื่อ-นามสกุล หรือ นามปากกา อย่างน้อย 2 ตัวอักษร" })
      .max(50, { message: "ต้องไม่เกิน 50 ตัวอักษร" }),
    email: z
      .string()
      .min(1, { message: "กรุณากรอกอีเมล" })
      .email({ message: "รูปแบบอีเมลไม่ถูกต้อง" }),
    password: z
      .string()
      .min(8, { message: "รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร" }),
    confirmPassword: z
      .string()
      .min(1, { message: "กรุณายืนยันรหัสผ่าน" }),
    acceptTerms: z
      .boolean()
      .refine((val) => val === true, {
        message: "กรุณายอมรับเงื่อนไขการใช้งานและนโยบายความเป็นส่วนตัว",
      }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "รหัสผ่านและรหัสผ่านยืนยันไม่ตรงกัน",
    path: ["confirmPassword"],
  });

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function RegisterForm() {
  const router = useRouter();
  const supabase = createClient();
  const [role, setRole] = useState<AccountRole>("user");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [usernameStatus, setUsernameStatus] = useState<"idle" | "checking" | "available" | "taken">("idle");

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      displayName: "",
      email: "",
      password: "",
      confirmPassword: "",
      acceptTerms: false,
    },
  });

  const checkUsernameUnique = async (username: string) => {
    if (!username || username.length < 3) return true;
    setUsernameStatus("checking");

    try {
      const [{ data: u }, { data: a }] = await Promise.all([
        supabase.from("users").select("user_id").eq("username", username).maybeSingle(),
        supabase.from("author").select("author_id").eq("username", username).maybeSingle(),
      ]);

      if (u || a) {
        setUsernameStatus("taken");
        return false;
      } else {
        setUsernameStatus("available");
        return true;
      }
    } catch {
      setUsernameStatus("idle");
      return true;
    }
  };

  const onSubmit = async (data: RegisterFormValues) => {
    setGlobalError(null);

    // 1. Double-check uniqueness
    const isUnique = await checkUsernameUnique(data.username);
    if (!isUnique) {
      setGlobalError("ชื่อผู้ใช้ (Username) นี้ถูกใช้งานแล้ว กรุณาเลือกชื่ออื่น");
      return;
    }

    try {
      // 2. Sign up with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            role,
            username: data.username,
            display_name: data.displayName,
          },
        },
      });

      if (authError) {
        if (authError.message.includes("already registered") || authError.status === 400 || authError.status === 422) {
          setGlobalError("อีเมลนี้ถูกลงทะเบียนแล้ว กรุณาเข้าสู่ระบบ หรือใช้อีเมลอื่น");
        } else {
          setGlobalError(authError.message || "เกิดข้อผิดพลาดในการลงทะเบียน");
        }
        return;
      }

      const authUser = authData.user;
      if (!authUser) {
        setGlobalError("ไม่สามารถสร้างบัญชีได้ กรุณาลองใหม่อีกครั้ง");
        return;
      }

      // 3. Insert into the appropriate table (`users` or `author`)
      if (role === "user") {
        const { error: insertError } = await supabase
          .from("users")
          .insert({
            username: data.username,
            full_name: data.displayName,
            email: data.email,
            auth_user_id: authUser.id,
            status: "active",
          })
          .select("user_id");

        if (insertError) {
          console.error("User profile insert error:", insertError);
          // If insert fails due to constraint or anything, show clean error
          if (insertError.code === "23505") {
            setGlobalError("ชื่อผู้ใช้หรืออีเมลนี้มีอยู่ในระบบแล้ว");
            return;
          }
        }
        toast.success("สมัครสมาชิกนักอ่านสำเร็จ ยินดีต้อนรับสู่ NovelTH!");
      } else {
        const { error: insertError } = await supabase
          .from("author")
          .insert({
            username: data.username,
            pen_name: data.displayName,
            email: data.email,
            auth_user_id: authUser.id,
            status: "pending", // Schema requirement: author waits for admin approval
          })
          .select("author_id");

        if (insertError) {
          console.error("Author profile insert error:", insertError);
          if (insertError.code === "23505") {
            setGlobalError("ชื่อผู้ใช้ หรือ นามปากกานี้มีอยู่ในระบบแล้ว");
            return;
          }
        }
        toast.success("สมัครสมาชิกนักเขียนสำเร็จ! กรุณารอ Admin อนุมัติก่อนจึงจะสามารถเผยแพร่นิยายได้");
      }

      router.push("/");
      router.refresh();
    } catch (err: any) {
      console.error("Register error:", err);
      setGlobalError("เกิดข้อผิดพลาดที่ไม่คาดคิด กรุณาลองใหม่อีกครั้ง");
    }
  };

  return (
    <div className="w-full">
      <GoogleAuthButton label="สมัครด้วย Google" />

      {/* Role Selection Tabs */}
      <div className="mb-6">
        <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-2 text-center">
          เลือกประเภทบัญชีที่ต้องการสมัคร
        </label>
        <div className="grid grid-cols-2 gap-2 p-1 bg-surface-hover/80 rounded-xl border border-border">
          <button
            type="button"
            onClick={() => setRole("user")}
            className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-sm font-medium transition-all ${
              role === "user"
                ? "bg-accent text-white shadow-sm"
                : "text-muted hover:text-foreground"
            }`}
          >
            <BookOpen className="h-4 w-4" />
            <span>นักอ่าน (User)</span>
          </button>
          <button
            type="button"
            onClick={() => setRole("author")}
            className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-sm font-medium transition-all ${
              role === "author"
                ? "bg-accent text-white shadow-sm"
                : "text-muted hover:text-foreground"
            }`}
          >
            <PenTool className="h-4 w-4" />
            <span>นักเขียน (Author)</span>
          </button>
        </div>
      </div>

      {/* Author Notice Banner */}
      {role === "author" && (
        <div className="mb-6 p-3 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-start gap-2.5 text-amber-700 dark:text-amber-300 text-xs sm:text-sm animate-fadeIn">
          <Info className="h-4 w-4 shrink-0 mt-0.5 text-amber-500" />
          <div>
            <p className="font-semibold">บัญชีนักเขียนต้องรออนุมัติ</p>
            <p className="mt-0.5 text-xs text-amber-600 dark:text-amber-400">
              เมื่อสมัครสมาชิกแล้ว สถานะบัญชีจะอยู่ในสถานะ <strong>pending</strong> เพื่อให้ Admin ตรวจสอบ และอนุมัติก่อนจึงจะสามารถเผยแพร่นิยายเข้าสู่ระบบได้
            </p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} method="POST" className="space-y-4">
        {/* Username Input */}
        <div>
          <label
            htmlFor="username"
            className="block text-sm font-medium text-foreground mb-1"
          >
            ชื่อผู้ใช้ (Username)
          </label>
          <div className="relative">
            <input
              id="username"
              type="text"
              placeholder="e.g., booklover99"
              disabled={isSubmitting}
              {...register("username")}
              onBlur={(e) => checkUsernameUnique(e.target.value)}
              className={`w-full px-3 py-2 text-sm rounded-lg border bg-surface text-foreground placeholder-muted focus:outline-none focus:ring-2 transition-all ${
                errors.username || usernameStatus === "taken"
                  ? "border-red-500 focus:ring-red-500/30"
                  : usernameStatus === "available"
                  ? "border-emerald-500 focus:ring-emerald-500/30"
                  : "border-border focus:ring-accent/30 focus:border-accent"
              } disabled:opacity-60`}
            />
          </div>
          {usernameStatus === "checking" && (
            <p className="mt-1 text-xs text-muted flex items-center gap-1">
              <Loader2 className="h-3 w-3 animate-spin" /> กำลังตรวจสอบชื่อผู้ใช้...
            </p>
          )}
          {usernameStatus === "taken" && !errors.username && (
            <p className="mt-1 text-xs text-red-500 font-medium">
              ชื่อผู้ใช้นี้ถูกใช้งานแล้ว กรุณาเลือกชื่ออื่น
            </p>
          )}
          {usernameStatus === "available" && !errors.username && (
            <p className="mt-1 text-xs text-emerald-500 font-medium">
              ✓ ชื่อผู้ใช้นี้สามารถใช้งานได้
            </p>
          )}
          {errors.username && (
            <p className="mt-1 text-xs text-red-500 font-medium">
              {errors.username.message}
            </p>
          )}
        </div>

        {/* Dynamic Display Name Input (Full name vs Pen name) */}
        <div>
          <label
            htmlFor="displayName"
            className="block text-sm font-medium text-foreground mb-1"
          >
            {role === "author" ? "นามปากกา (Pen Name)" : "ชื่อ-นามสกุล (Full Name)"}
          </label>
          <input
            id="displayName"
            type="text"
            placeholder={role === "author" ? "ระบุนามปากกาสำหรับเผยแพร่นิยาย" : "ระบุชื่อ-นามสกุลของคุณ"}
            disabled={isSubmitting}
            {...register("displayName")}
            className={`w-full px-3 py-2 text-sm rounded-lg border bg-surface text-foreground placeholder-muted focus:outline-none focus:ring-2 transition-all ${
              errors.displayName
                ? "border-red-500 focus:ring-red-500/30"
                : "border-border focus:ring-accent/30 focus:border-accent"
            } disabled:opacity-60`}
          />
          {errors.displayName && (
            <p className="mt-1 text-xs text-red-500 font-medium">
              {errors.displayName.message}
            </p>
          )}
        </div>

        {/* Email Input */}
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-foreground mb-1"
          >
            อีเมล
          </label>
          <input
            id="email"
            type="email"
            placeholder="name@example.com"
            disabled={isSubmitting}
            {...register("email")}
            className={`w-full px-3 py-2 text-sm rounded-lg border bg-surface text-foreground placeholder-muted focus:outline-none focus:ring-2 transition-all ${
              errors.email
                ? "border-red-500 focus:ring-red-500/30"
                : "border-border focus:ring-accent/30 focus:border-accent"
            } disabled:opacity-60`}
          />
          {errors.email && (
            <p className="mt-1 text-xs text-red-500 font-medium">
              {errors.email.message}
            </p>
          )}
        </div>

        {/* Password Input */}
        <div>
          <label
            htmlFor="password"
            className="block text-sm font-medium text-foreground mb-1"
          >
            รหัสผ่าน (อย่างน้อย 8 ตัวอักษร)
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              disabled={isSubmitting}
              {...register("password")}
              className={`w-full pl-3 pr-10 py-2 text-sm rounded-lg border bg-surface text-foreground placeholder-muted focus:outline-none focus:ring-2 transition-all ${
                errors.password
                  ? "border-red-500 focus:ring-red-500/30"
                  : "border-border focus:ring-accent/30 focus:border-accent"
              } disabled:opacity-60`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              disabled={isSubmitting}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted hover:text-foreground focus:outline-none transition-colors"
              aria-label={showPassword ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
          {errors.password && (
            <p className="mt-1 text-xs text-red-500 font-medium">
              {errors.password.message}
            </p>
          )}
        </div>

        {/* Confirm Password Input */}
        <div>
          <label
            htmlFor="confirmPassword"
            className="block text-sm font-medium text-foreground mb-1"
          >
            ยืนยันรหัสผ่าน
          </label>
          <div className="relative">
            <input
              id="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              placeholder="••••••••"
              disabled={isSubmitting}
              {...register("confirmPassword")}
              className={`w-full pl-3 pr-10 py-2 text-sm rounded-lg border bg-surface text-foreground placeholder-muted focus:outline-none focus:ring-2 transition-all ${
                errors.confirmPassword
                  ? "border-red-500 focus:ring-red-500/30"
                  : "border-border focus:ring-accent/30 focus:border-accent"
              } disabled:opacity-60`}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              disabled={isSubmitting}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted hover:text-foreground focus:outline-none transition-colors"
              aria-label={showConfirmPassword ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
            >
              {showConfirmPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="mt-1 text-xs text-red-500 font-medium">
              {errors.confirmPassword.message}
            </p>
          )}
        </div>

        {/* Accept Terms Checkbox */}
        <div className="pt-1">
          <label className="flex items-start gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              disabled={isSubmitting}
              {...register("acceptTerms")}
              className="mt-0.5 h-4 w-4 rounded border-border text-accent focus:ring-accent/40 bg-surface transition-colors cursor-pointer"
            />
            <span className="text-xs text-muted leading-relaxed">
              ฉันได้อ่านและยอมรับ{" "}
              <Link href="/terms" className="text-accent underline underline-offset-2 hover:text-accent-hover">
                ข้อกำหนดการใช้งาน
              </Link>{" "}
              และ{" "}
              <Link href="/privacy" className="text-accent underline underline-offset-2 hover:text-accent-hover">
                นโยบายความเป็นส่วนตัว
              </Link>
            </span>
          </label>
          {errors.acceptTerms && (
            <p className="mt-1 text-xs text-red-500 font-medium">
              {errors.acceptTerms.message}
            </p>
          )}
        </div>

        {/* Global Error Message Under Form */}
        {globalError && (
          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 flex items-start gap-2.5 text-red-600 dark:text-red-400 text-xs sm:text-sm">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{globalError}</span>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full mt-3 py-2.5 px-4 rounded-lg bg-accent hover:bg-accent-hover text-white text-sm font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>กำลังสร้างบัญชี...</span>
            </>
          ) : (
            <span>สมัครสมาชิก</span>
          )}
        </button>
      </form>
    </div>
  );
}
