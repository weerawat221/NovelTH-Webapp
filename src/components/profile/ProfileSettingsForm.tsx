"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import {
  Eye,
  EyeOff,
  LogOut,
  Loader2,
  Lock,
  User,
  Shield,
  Calendar,
} from "lucide-react";
import AvatarUpload from "./AvatarUpload";

// ─── Types ─────────────────────────────────────────────────

interface ProfileData {
  username: string;
  full_name: string | null;
  email: string | null;
  profile_image: string | null;
  created_at: string;
  // User-specific
  user_id?: number;
  phone?: string | null;
  // Author-specific
  author_id?: number;
  pen_name?: string;
  bio?: string | null;
}

interface ProfileSettingsFormProps {
  authId: string;
  userEmail: string;
  provider: string;
  role: "user" | "author";
  profileData: ProfileData;
}

// ─── Validation Schemas ────────────────────────────────────

const userSchema = z.object({
  full_name: z
    .string()
    .max(100, "ไม่เกิน 100 ตัวอักษร")
    .optional()
    .or(z.literal("")),
  username: z
    .string()
    .min(3, "ต้องมีความยาวอย่างน้อย 3 ตัวอักษร")
    .max(50, "ไม่เกิน 50 ตัวอักษร")
    .regex(
      /^[a-zA-Z0-9_]+$/,
      "ใช้ได้เฉพาะตัวอักษรภาษาอังกฤษ ตัวเลข และ _"
    ),
  email: z
    .string()
    .email("รูปแบบอีเมลไม่ถูกต้อง")
    .optional()
    .or(z.literal("")),
  phone: z
    .string()
    .max(20, "ไม่เกิน 20 ตัวอักษร")
    .optional()
    .or(z.literal("")),
});

const authorSchema = z.object({
  pen_name: z
    .string()
    .min(2, "ต้องมีความยาวอย่างน้อย 2 ตัวอักษร")
    .max(100, "ไม่เกิน 100 ตัวอักษร"),
  full_name: z
    .string()
    .max(100, "ไม่เกิน 100 ตัวอักษร")
    .optional()
    .or(z.literal("")),
  email: z
    .string()
    .email("รูปแบบอีเมลไม่ถูกต้อง")
    .optional()
    .or(z.literal("")),
  bio: z
    .string()
    .max(2000, "ไม่เกิน 2000 ตัวอักษร")
    .optional()
    .or(z.literal("")),
  phone: z
    .string()
    .max(20, "ไม่เกิน 20 ตัวอักษร")
    .optional()
    .or(z.literal("")),
});

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "กรุณากรอกรหัสผ่านปัจจุบัน"),
    newPassword: z
      .string()
      .min(8, "รหัสผ่านใหม่ต้องมีความยาวอย่างน้อย 8 ตัวอักษร"),
    confirmPassword: z.string().min(1, "กรุณายืนยันรหัสผ่านใหม่"),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "รหัสผ่านใหม่และการยืนยันไม่ตรงกัน",
    path: ["confirmPassword"],
  })
  .refine((d) => d.currentPassword !== d.newPassword, {
    message: "รหัสผ่านใหม่ต้องไม่ซ้ำกับรหัสผ่านเดิม",
    path: ["newPassword"],
  });

type UserFormData = z.infer<typeof userSchema>;
type AuthorFormData = z.infer<typeof authorSchema>;
type PasswordFormData = z.infer<typeof passwordSchema>;

// ─── Helpers ───────────────────────────────────────────────

function formatJoinDate(dateStr: string): string {
  const normalized =
    dateStr.endsWith("Z") || dateStr.includes("+")
      ? dateStr
      : dateStr.replace(" ", "T") + "Z";
  return new Date(normalized).toLocaleDateString("th-TH", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

// ─── Reusable Input ────────────────────────────────────────

function SectionHeader({
  icon: Icon,
  title,
}: {
  icon: React.ElementType;
  title: string;
}) {
  return (
    <div className="flex items-center gap-2.5 border-b border-white/5 pb-4 mb-6">
      <div className="p-1.5 rounded-lg bg-accent/10">
        <Icon className="h-3.5 w-3.5 text-accent" />
      </div>
      <h2 className="text-sm font-bold text-white/80">{title}</h2>
    </div>
  );
}

function FieldLabel({
  children,
  required,
  note,
}: {
  children: React.ReactNode;
  required?: boolean;
  note?: string;
}) {
  return (
    <label className="block text-xs font-bold text-white/50 uppercase tracking-wider mb-1.5">
      {children}
      {required && <span className="text-red-400 ml-0.5">*</span>}
      {note && (
        <span className="ml-2 text-white/25 font-normal normal-case">
          ({note})
        </span>
      )}
    </label>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-xs text-red-400 mt-1">{message}</p>;
}

const inputClass =
  "w-full bg-[#1c1917] border border-white/5 text-white/80 text-sm font-medium rounded-xl px-4 py-3 focus:outline-none focus:ring-1 focus:ring-accent/50 focus:border-accent/30 transition-colors placeholder-white/20";

const readonlyInputClass =
  "w-full bg-[#1c1917]/50 border border-white/5 text-white/30 text-sm font-medium rounded-xl px-4 py-3 cursor-not-allowed";

// ─── Password Input with eye toggle ───────────────────────

function PasswordInput({
  show,
  onToggle,
  error,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & {
  show: boolean;
  onToggle: () => void;
  error?: string;
}) {
  return (
    <div>
      <div className="relative">
        <input
          type={show ? "text" : "password"}
          {...props}
          className={`${inputClass} pr-12`}
        />
        <button
          type="button"
          onClick={onToggle}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-white/35 hover:text-white/70 transition-colors cursor-pointer"
        >
          {show ? (
            <EyeOff className="h-4 w-4" />
          ) : (
            <Eye className="h-4 w-4" />
          )}
        </button>
      </div>
      <FieldError message={error} />
    </div>
  );
}

// ─── Save Button ──────────────────────────────────────────

function SaveButton({
  loading,
  disabled,
  children = "บันทึกการเปลี่ยนแปลง",
}: {
  loading: boolean;
  disabled: boolean;
  children?: React.ReactNode;
}) {
  return (
    <button
      type="submit"
      disabled={loading || disabled}
      className="inline-flex items-center gap-1.5 px-5 py-2.5 text-xs font-bold rounded-xl bg-[#e09050] text-white hover:bg-[#c97c3a] disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200 cursor-pointer"
    >
      {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
      {children}
    </button>
  );
}

// ─── Main Component ────────────────────────────────────────

export default function ProfileSettingsForm({
  authId,
  userEmail,
  provider,
  role,
  profileData,
}: ProfileSettingsFormProps) {
  const router = useRouter();
  const supabase = createClient();
  const isGoogle = provider === "google";

  // Avatar state — saved to DB only when profile form is submitted
  const [avatarUrl, setAvatarUrl] = useState<string | null>(
    profileData.profile_image
  );
  const avatarChanged = avatarUrl !== profileData.profile_image;

  // Password visibility toggles
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Loading states
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  // ─── Forms ───

  const userForm = useForm<UserFormData>({
    resolver: zodResolver(userSchema) as any,
    defaultValues: {
      full_name: profileData.full_name || "",
      username: profileData.username || "",
      email: profileData.email || userEmail || "",
      phone: profileData.phone || "",
    },
  });

  const authorForm = useForm<AuthorFormData>({
    resolver: zodResolver(authorSchema) as any,
    defaultValues: {
      pen_name: profileData.pen_name || "",
      full_name: profileData.full_name || "",
      email: profileData.email || userEmail || "",
      bio: profileData.bio || "",
      phone: profileData.phone || "",
    },
  });

  const passwordForm = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema) as any,
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  // ─── Handlers ───

  const handleSaveUser = async (values: UserFormData) => {
    setSavingProfile(true);
    try {
      // Unique username check
      const { data: dup } = await supabase
        .from("users")
        .select("user_id")
        .eq("username", values.username.trim())
        .neq("user_id", profileData.user_id!)
        .maybeSingle();

      if (dup) {
        userForm.setError("username", {
          message: "Username นี้ถูกใช้งานแล้ว กรุณาเลือกชื่ออื่น",
        });
        return;
      }

      const { error } = await supabase
        .from("users")
        .update({
          full_name: values.full_name?.trim() || null,
          username: values.username.trim(),
          ...(!isGoogle && { email: values.email?.trim() || null }),
          phone: values.phone?.trim() || null,
          profile_image: avatarUrl,
        })
        .eq("auth_user_id", authId);

      if (error) throw error;

      toast.success("บันทึกข้อมูลโปรไฟล์เรียบร้อยแล้ว");
      userForm.reset(values);
      router.refresh();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "บันทึกข้อมูลไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSaveAuthor = async (values: AuthorFormData) => {
    setSavingProfile(true);
    try {
      // Unique pen_name check
      const { data: dup } = await supabase
        .from("author")
        .select("author_id")
        .eq("pen_name", values.pen_name.trim())
        .neq("author_id", profileData.author_id!)
        .maybeSingle();

      if (dup) {
        authorForm.setError("pen_name", {
          message: "นามปากกานี้ถูกใช้งานแล้ว กรุณาเลือกชื่ออื่น",
        });
        return;
      }

      const { error } = await supabase
        .from("author")
        .update({
          pen_name: values.pen_name.trim(),
          full_name: values.full_name?.trim() || null,
          ...(!isGoogle && { email: values.email?.trim() || null }),
          bio: values.bio?.trim() || null,
          phone: values.phone?.trim() || null,
          profile_image: avatarUrl,
        })
        .eq("auth_user_id", authId);

      if (error) throw error;

      toast.success("บันทึกข้อมูลโปรไฟล์เรียบร้อยแล้ว");
      authorForm.reset(values);
      router.refresh();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "บันทึกข้อมูลไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (values: PasswordFormData) => {
    setSavingPassword(true);
    try {
      // Verify current password via re-authentication
      const { error: verifyError } = await supabase.auth.signInWithPassword({
        email: userEmail,
        password: values.currentPassword,
      });

      if (verifyError) {
        passwordForm.setError("currentPassword", {
          message: "รหัสผ่านปัจจุบันไม่ถูกต้อง",
        });
        return;
      }

      // Update to new password
      const { error: updateError } = await supabase.auth.updateUser({
        password: values.newPassword,
      });

      if (updateError) throw updateError;

      toast.success("เปลี่ยนรหัสผ่านเรียบร้อยแล้ว");
      passwordForm.reset();
    } catch (err: any) {
      console.error(err);
      toast.error(
        err.message || "เปลี่ยนรหัสผ่านไม่สำเร็จ กรุณาลองใหม่อีกครั้ง"
      );
    } finally {
      setSavingPassword(false);
    }
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await supabase.auth.signOut();
      toast.success("ออกจากระบบเรียบร้อยแล้ว");
      router.push("/");
      router.refresh();
    } catch {
      setLoggingOut(false);
    }
  };

  const displayName =
    role === "author"
      ? profileData.pen_name || profileData.username
      : profileData.full_name || profileData.username;

  const profileDirty =
    role === "user" ? userForm.formState.isDirty : authorForm.formState.isDirty;
  const profileCanSave = profileDirty || avatarChanged;

  return (
    <div className="max-w-2xl mx-auto px-4 space-y-6 pb-12">
      {/* ════════════════════════════════════════
          SECTION A — Personal Info
      ════════════════════════════════════════ */}
      <section className="bg-[#171513]/60 border border-white/5 rounded-2xl backdrop-blur-sm p-6">
        <SectionHeader icon={User} title="ข้อมูลส่วนตัว" />

        {/* Avatar row */}
        <div className="flex items-center gap-5 mb-7">
          <AvatarUpload
            currentUrl={avatarUrl}
            authId={authId}
            displayName={displayName}
            onUpload={(url) => setAvatarUrl(url)}
          />
          <div className="min-w-0">
            <p className="text-sm font-bold text-white/90 truncate">
              {displayName}
            </p>
            <p className="text-xs text-white/40 mt-0.5 truncate">
              {role === "author" ? "นักเขียน" : "นักอ่าน"} ·{" "}
              <span className="text-accent/70">@{profileData.username}</span>
            </p>
            <p className="text-[10px] text-white/25 mt-1.5">
              คลิกที่รูปเพื่อเปลี่ยนรูปโปรไฟล์ · JPG, PNG, WebP ไม่เกิน 2MB
            </p>
          </div>
        </div>

        {/* ── User Form ── */}
        {role === "user" && (
          <form
            onSubmit={userForm.handleSubmit(handleSaveUser)}
            className="space-y-4"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <FieldLabel>ชื่อ-นามสกุล</FieldLabel>
                <input
                  type="text"
                  placeholder="ชื่อ-นามสกุลของคุณ"
                  {...userForm.register("full_name")}
                  className={inputClass}
                />
                <FieldError
                  message={userForm.formState.errors.full_name?.message}
                />
              </div>
              <div>
                <FieldLabel required>Username</FieldLabel>
                <input
                  type="text"
                  placeholder="your_username"
                  {...userForm.register("username")}
                  className={inputClass}
                />
                <FieldError
                  message={userForm.formState.errors.username?.message}
                />
              </div>
              <div>
                <FieldLabel note={isGoogle ? "ไม่สามารถแก้ไขได้" : undefined}>
                  อีเมล
                </FieldLabel>
                {isGoogle ? (
                  <input
                    type="email"
                    value={userEmail}
                    readOnly
                    className={readonlyInputClass}
                  />
                ) : (
                  <>
                    <input
                      type="email"
                      placeholder="your@email.com"
                      {...userForm.register("email")}
                      className={inputClass}
                    />
                    <FieldError
                      message={userForm.formState.errors.email?.message}
                    />
                  </>
                )}
              </div>
              <div>
                <FieldLabel>เบอร์โทรศัพท์</FieldLabel>
                <input
                  type="tel"
                  placeholder="0812345678"
                  {...userForm.register("phone")}
                  className={inputClass}
                />
                <FieldError
                  message={userForm.formState.errors.phone?.message}
                />
              </div>
            </div>
            <div className="flex justify-end pt-2">
              <SaveButton loading={savingProfile} disabled={!profileCanSave} />
            </div>
          </form>
        )}

        {/* ── Author Form ── */}
        {role === "author" && (
          <form
            onSubmit={authorForm.handleSubmit(handleSaveAuthor)}
            className="space-y-4"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <FieldLabel required>นามปากกา</FieldLabel>
                <input
                  type="text"
                  placeholder="นามปากกาของคุณ"
                  {...authorForm.register("pen_name")}
                  className={inputClass}
                />
                <FieldError
                  message={authorForm.formState.errors.pen_name?.message}
                />
              </div>
              <div>
                <FieldLabel>ชื่อ-นามสกุล</FieldLabel>
                <input
                  type="text"
                  placeholder="ชื่อ-นามสกุลของคุณ"
                  {...authorForm.register("full_name")}
                  className={inputClass}
                />
                <FieldError
                  message={authorForm.formState.errors.full_name?.message}
                />
              </div>
              <div>
                <FieldLabel note={isGoogle ? "ไม่สามารถแก้ไขได้" : undefined}>
                  อีเมล
                </FieldLabel>
                {isGoogle ? (
                  <input
                    type="email"
                    value={userEmail}
                    readOnly
                    className={readonlyInputClass}
                  />
                ) : (
                  <>
                    <input
                      type="email"
                      placeholder="your@email.com"
                      {...authorForm.register("email")}
                      className={inputClass}
                    />
                    <FieldError
                      message={authorForm.formState.errors.email?.message}
                    />
                  </>
                )}
              </div>
              <div>
                <FieldLabel>เบอร์โทรศัพท์</FieldLabel>
                <input
                  type="tel"
                  placeholder="0812345678"
                  {...authorForm.register("phone")}
                  className={inputClass}
                />
                <FieldError
                  message={authorForm.formState.errors.phone?.message}
                />
              </div>
            </div>
            <div>
              <FieldLabel>ประวัตินักเขียน</FieldLabel>
              <textarea
                rows={4}
                placeholder="เล่าให้นักอ่านรู้จักคุณ... (ไม่เกิน 2,000 ตัวอักษร)"
                {...authorForm.register("bio")}
                className={`${inputClass} resize-none`}
              />
              <FieldError message={authorForm.formState.errors.bio?.message} />
            </div>
            <div className="flex justify-end pt-2">
              <SaveButton loading={savingProfile} disabled={!profileCanSave} />
            </div>
          </form>
        )}
      </section>

      {/* ════════════════════════════════════════
          SECTION B — Change Password
          (Hidden for Google OAuth accounts)
      ════════════════════════════════════════ */}
      {!isGoogle && (
        <section className="bg-[#171513]/60 border border-white/5 rounded-2xl backdrop-blur-sm p-6">
          <SectionHeader icon={Lock} title="เปลี่ยนรหัสผ่าน" />

          <form
            onSubmit={passwordForm.handleSubmit(handleChangePassword)}
            className="space-y-4"
          >
            <div>
              <FieldLabel required>รหัสผ่านปัจจุบัน</FieldLabel>
              <PasswordInput
                show={showCurrent}
                onToggle={() => setShowCurrent((v) => !v)}
                placeholder="กรอกรหัสผ่านปัจจุบัน"
                {...passwordForm.register("currentPassword")}
                error={
                  passwordForm.formState.errors.currentPassword?.message
                }
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <FieldLabel required>รหัสผ่านใหม่</FieldLabel>
                <PasswordInput
                  show={showNew}
                  onToggle={() => setShowNew((v) => !v)}
                  placeholder="อย่างน้อย 8 ตัวอักษร"
                  {...passwordForm.register("newPassword")}
                  error={passwordForm.formState.errors.newPassword?.message}
                />
              </div>
              <div>
                <FieldLabel required>ยืนยันรหัสผ่านใหม่</FieldLabel>
                <PasswordInput
                  show={showConfirm}
                  onToggle={() => setShowConfirm((v) => !v)}
                  placeholder="กรอกรหัสผ่านใหม่อีกครั้ง"
                  {...passwordForm.register("confirmPassword")}
                  error={
                    passwordForm.formState.errors.confirmPassword?.message
                  }
                />
              </div>
            </div>
            <div className="flex justify-end pt-2">
              <SaveButton loading={savingPassword} disabled={false}>
                เปลี่ยนรหัสผ่าน
              </SaveButton>
            </div>
          </form>
        </section>
      )}

      {/* ════════════════════════════════════════
          SECTION C — Account
      ════════════════════════════════════════ */}
      <section className="bg-[#171513]/60 border border-white/5 rounded-2xl backdrop-blur-sm p-6 space-y-5">
        <SectionHeader icon={Shield} title="บัญชี" />

        {/* Join date */}
        <div className="flex items-center gap-2.5 text-xs text-white/40">
          <Calendar className="h-4 w-4 shrink-0" />
          <span>สมาชิกตั้งแต่ {formatJoinDate(profileData.created_at)}</span>
        </div>

        {/* Google badge */}
        {isGoogle && (
          <div className="flex items-start gap-3 p-3.5 rounded-xl bg-blue-500/5 border border-blue-500/10 text-xs text-blue-400">
            <Shield className="h-4 w-4 shrink-0 mt-0.5" />
            <span>
              บัญชีนี้เข้าสู่ระบบผ่าน Google OAuth
              การเปลี่ยนรหัสผ่านต้องทำผ่าน Google Account ของคุณโดยตรง
            </span>
          </div>
        )}

        {/* Logout */}
        <div className="border-t border-white/5 pt-4">
          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl border border-red-500/20 bg-red-500/5 text-red-400 hover:bg-red-500/10 hover:border-red-500/30 disabled:opacity-40 transition-all cursor-pointer"
          >
            {loggingOut ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <LogOut className="h-3.5 w-3.5" />
            )}
            ออกจากระบบ
          </button>
        </div>
      </section>
    </div>
  );
}
