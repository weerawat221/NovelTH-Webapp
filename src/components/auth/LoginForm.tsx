"use client";

import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Eye, EyeOff, Loader2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import GoogleAuthButton from "./GoogleAuthButton";

const loginSchema = z.object({
  email: z
    .string()
    .min(1, { message: "กรุณากรอกอีเมล" })
    .email({ message: "รูปแบบอีเมลไม่ถูกต้อง" }),
  password: z
    .string()
    .min(1, { message: "กรุณากรอกรหัสผ่าน" })
    .min(8, { message: "รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร" }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const errorParam = searchParams.get("error");
  const supabase = createClient();
  const [showPassword, setShowPassword] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);

  useEffect(() => {
    if (errorParam === "suspended") {
      setGlobalError("บัญชีนี้ถูกระงับการใช้งานชั่วคราวหรือถาวร กรุณาติดต่อผู้ดูแลระบบ");
    }
  }, [errorParam]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginFormValues) => {
    setGlobalError(null);
    try {
      // 1. Sign in with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (authError) {
        if (
          authError.message.includes("Invalid login credentials") ||
          authError.status === 400
        ) {
          setGlobalError("อีเมลหรือรหัสผ่านไม่ถูกต้อง");
        } else {
          setGlobalError(authError.message || "เกิดข้อผิดพลาดในการเข้าสู่ระบบ");
        }
        return;
      }

      const user = authData.user;
      if (!user) {
        setGlobalError("ไม่พบข้อมูลผู้ใช้งาน");
        return;
      }

      // 2. Check if user exists in `admin`, `users` or `author` table
      const { data: adminData } = await supabase
        .from("admin")
        .select("admin_id, username")
        .eq("auth_user_id", user.id)
        .maybeSingle();

      if (adminData) {
        toast.success("เข้าสู่ระบบในฐานะผู้ดูแลระบบสำเร็จ!");
        router.push("/");
        router.refresh();
        return;
      }

      const { data: userData } = await supabase
        .from("users")
        .select("user_id, username, full_name")
        .eq("auth_user_id", user.id)
        .maybeSingle();

      const { data: authorData } = await supabase
        .from("author")
        .select("author_id, pen_name, status")
        .eq("auth_user_id", user.id)
        .maybeSingle();

      if (!userData && !authorData) {
        // User logged in via auth but hasn't completed profile choice (e.g. legacy or incomplete OAuth)
        toast.info("กรุณาเลือกประเภทบัญชีก่อนเริ่มใช้งาน");
        router.push("/auth/select-role");
        return;
      }

      toast.success("เข้าสู่ระบบสำเร็จ!");
      router.push("/");
      router.refresh();
    } catch (err: any) {
      console.error("Login error:", err);
      setGlobalError("เกิดข้อผิดพลาดที่ไม่คาดคิด กรุณาลองใหม่อีกครั้ง");
    }
  };

  return (
    <div className="w-full">
      <GoogleAuthButton label="เข้าสู่ระบบด้วย Google" />

      <form onSubmit={handleSubmit(onSubmit)} method="POST" className="space-y-4">
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
          <div className="flex items-center justify-between mb-1">
            <label
              htmlFor="password"
              className="block text-sm font-medium text-foreground"
            >
              รหัสผ่าน
            </label>
            <Link
              href="/forgot-password"
              className="text-xs font-medium text-accent hover:text-accent-hover transition-colors"
            >
              ลืมรหัสผ่าน?
            </Link>
          </div>
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
          className="w-full mt-2 py-2.5 px-4 rounded-lg bg-accent hover:bg-accent-hover text-white text-sm font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>กำลังเข้าสู่ระบบ...</span>
            </>
          ) : (
            <span>เข้าสู่ระบบ</span>
          )}
        </button>
      </form>
    </div>
  );
}
