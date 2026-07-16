"use client";

import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Loader2, AlertCircle, BookOpen, PenTool, Info } from "lucide-react";
import { toast } from "sonner";

type AccountRole = "user" | "author";

const selectRoleSchema = z.object({
  username: z
    .string()
    .min(3, { message: "ชื่อผู้ใช้ (Username) ต้องมีอย่างน้อย 3 ตัวอักษร" })
    .max(30, { message: "ชื่อผู้ใช้ (Username) ต้องไม่เกิน 30 ตัวอักษร" })
    .regex(/^[a-zA-Z0-9_]+$/, { message: "ใช้ได้เฉพาะภาษาอังกฤษ ตัวเลข และเครื่องหมาย _ เท่านั้น" }),
  displayName: z
    .string()
    .min(2, { message: "กรุณากรอกชื่อ หรือ นามปากกา อย่างน้อย 2 ตัวอักษร" })
    .max(50, { message: "ต้องไม่เกิน 50 ตัวอักษร" }),
});

type SelectRoleFormValues = z.infer<typeof selectRoleSchema>;

export default function SelectRoleForm() {
  const router = useRouter();
  const supabase = createClient();
  const [role, setRole] = useState<AccountRole>("user");
  const [loadingUser, setLoadingUser] = useState(true);
  const [authUser, setAuthUser] = useState<any>(null);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [usernameStatus, setUsernameStatus] = useState<"idle" | "checking" | "available" | "taken">("idle");

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<SelectRoleFormValues>({
    resolver: zodResolver(selectRoleSchema),
    defaultValues: {
      username: "",
      displayName: "",
    },
  });

  useEffect(() => {
    async function loadAuthUser() {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error || !user) {
          toast.error("ไม่พบข้อมูลบัญชี กรุณาเข้าสู่ระบบอีกครั้ง");
          router.push("/login");
          return;
        }

        setAuthUser(user);

        // Pre-fill suggested display name from Google
        const googleName = user.user_metadata?.full_name || user.user_metadata?.name || "";
        if (googleName) {
          setValue("displayName", googleName);
        }

        // Pre-fill suggested username from Google email prefix
        const emailPrefix = user.email?.split("@")[0]?.replace(/[^a-zA-Z0-9_]/g, "").toLowerCase() || "";
        if (emailPrefix && emailPrefix.length >= 3) {
          const checkName = emailPrefix.slice(0, 20);
          setValue("username", checkName);
          await checkUsernameUnique(checkName);
        }
      } catch (err) {
        console.error("Error loading user:", err);
      } finally {
        setLoadingUser(false);
      }
    }
    loadAuthUser();
  }, [supabase, router, setValue]);

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

  const onSubmit = async (data: SelectRoleFormValues) => {
    if (!authUser) return;
    setGlobalError(null);

    const isUnique = await checkUsernameUnique(data.username);
    if (!isUnique) {
      setGlobalError("ชื่อผู้ใช้นี้ถูกใช้งานแล้ว กรุณาระบุชื่ออื่น");
      return;
    }

    try {
      const email = authUser.email || "";
      const profileImage = authUser.user_metadata?.avatar_url || authUser.user_metadata?.picture || null;

      if (role === "user") {
        const { error: insertError } = await supabase
          .from("users")
          .insert({
            username: data.username,
            full_name: data.displayName,
            email,
            profile_image: profileImage,
            auth_user_id: authUser.id,
            status: "active",
          })
          .select("user_id");

        if (insertError) {
          console.error("User profile insert error:", insertError);
          if (insertError.code === "23505") {
            setGlobalError("ชื่อผู้ใช้นี้มีอยู่ในระบบแล้ว");
            return;
          }
          throw insertError;
        }
        toast.success("ตั้งค่าโปรไฟล์นักอ่านสำเร็จ ยินดีต้อนรับ!");
      } else {
        const { error: insertError } = await supabase
          .from("author")
          .insert({
            username: data.username,
            pen_name: data.displayName,
            email,
            profile_image: profileImage,
            auth_user_id: authUser.id,
            status: "pending",
          })
          .select("author_id");

        if (insertError) {
          console.error("Author profile insert error:", insertError);
          if (insertError.code === "23505") {
            setGlobalError("ชื่อผู้ใช้หรือนามปากกานี้มีอยู่ในระบบแล้ว");
            return;
          }
          throw insertError;
        }
        toast.success("ตั้งค่าโปรไฟล์นักเขียนสำเร็จ! กรุณารอ Admin อนุมัติก่อนเผยแพร่นิยาย");
      }

      router.push("/");
      router.refresh();
    } catch (err: any) {
      console.error("Select role error:", err);
      setGlobalError(err.message || "เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง");
    }
  };

  if (loadingUser) {
    return (
      <div className="py-12 flex flex-col items-center justify-center text-muted gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
        <p className="text-sm font-medium">กำลังโหลดข้อมูลโปรไฟล์...</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Role Selection Tabs */}
      <div className="mb-6">
        <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-2 text-center">
          เลือกประเภทบัญชีที่ต้องการ
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
              เมื่อบันทึกโปรไฟล์แล้ว สถานะบัญชีจะอยู่ในสถานะ <strong>pending</strong> เพื่อให้ Admin ตรวจสอบและอนุมัติก่อนจึงจะสามารถเผยแพร่นิยายได้
            </p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Username Input */}
        <div>
          <label
            htmlFor="username"
            className="block text-sm font-medium text-foreground mb-1"
          >
            ชื่อผู้ใช้ (Username)
          </label>
          <input
            id="username"
            type="text"
            placeholder="booklover99"
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

        {/* Display Name Input */}
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
              <span>กำลังบันทึกโปรไฟล์...</span>
            </>
          ) : (
            <span>ยืนยันและเริ่มใช้งาน</span>
          )}
        </button>
      </form>
    </div>
  );
}
