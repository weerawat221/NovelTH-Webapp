import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import crypto from "crypto";

function hashResetCode(code: string): string {
  return crypto
    .createHmac("sha256", process.env.RESET_CODE_SECRET || "default_reset_pepper_12345")
    .update(code.trim())
    .digest("base64");
}

export async function POST(request: Request) {
  try {
    const { email, reset_password_code, new_password } = await request.json().catch(() => ({}));

    if (!email || !reset_password_code || !new_password) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const cleanCode = reset_password_code.trim();
    const hashedCode = hashResetCode(cleanCode);
    const supabase = await createAdminClient();

    let authUserId: string | null = null;
    let matchedTable: "admin" | "users" | "author" | null = null;
    let resetAttempts = 0;
    let dbCode: string | null = null;

    // 1. Search admin table
    const { data: adminData } = await supabase
      .from("admin")
      .select("auth_user_id, reset_password_code, reset_attempts")
      .eq("email", normalizedEmail)
      .maybeSingle();

    if (adminData) {
      matchedTable = "admin";
      resetAttempts = adminData.reset_attempts || 0;
      dbCode = adminData.reset_password_code;
      authUserId = adminData.auth_user_id;
    } else {
      // 2. Search users table
      const { data: userData } = await supabase
        .from("users")
        .select("auth_user_id, reset_password_code, reset_attempts")
        .eq("email", normalizedEmail)
        .maybeSingle();

      if (userData) {
        matchedTable = "users";
        resetAttempts = userData.reset_attempts || 0;
        dbCode = userData.reset_password_code;
        authUserId = userData.auth_user_id;
      } else {
        // 3. Search author table
        const { data: authorData } = await supabase
          .from("author")
          .select("auth_user_id, reset_password_code, reset_attempts")
          .eq("email", normalizedEmail)
          .maybeSingle();

        if (authorData) {
          matchedTable = "author";
          resetAttempts = authorData.reset_attempts || 0;
          dbCode = authorData.reset_password_code;
          authUserId = authorData.auth_user_id;
        }
      }
    }

    if (!matchedTable || !authUserId || !dbCode) {
      return NextResponse.json(
        { error: "รหัส OTP ไม่ถูกต้อง หรือหมดอายุแล้ว" },
        { status: 400 }
      );
    }

    // Check if attempts exceeded
    if (resetAttempts >= 3) {
      await supabase
        .from(matchedTable)
        .update({ reset_password_code: null, reset_attempts: 0 })
        .eq("auth_user_id", authUserId);
      return NextResponse.json(
        { error: "คุณกรอกรหัสผิดเกินจำนวนครั้งที่กำหนด (3 ครั้ง) กรุณาขอรหัสผ่านใหม่อีกครั้ง" },
        { status: 400 }
      );
    }

    // Compare code
    if (dbCode !== hashedCode) {
      const nextAttempts = resetAttempts + 1;
      if (nextAttempts >= 3) {
        await supabase
          .from(matchedTable)
          .update({ reset_password_code: null, reset_attempts: 0 })
          .eq("auth_user_id", authUserId);
        return NextResponse.json(
          { error: "คุณกรอกรหัสผิดเกินจำนวนครั้งที่กำหนด (3 ครั้ง) กรุณาขอรหัสผ่านใหม่อีกครั้ง" },
          { status: 400 }
        );
      } else {
        await supabase
          .from(matchedTable)
          .update({ reset_attempts: nextAttempts })
          .eq("auth_user_id", authUserId);
        return NextResponse.json(
          { error: `รหัส OTP ไม่ถูกต้อง (เหลือโอกาสอีก ${3 - nextAttempts} ครั้ง)` },
          { status: 400 }
        );
      }
    }

    // Update password in Supabase Auth via Admin Client
    const { error: authError } = await supabase.auth.admin.updateUserById(authUserId, {
      password: new_password,
    });

    if (authError) {
      console.error("[Reset Password API] Auth update error:", authError);
      return NextResponse.json({ error: authError.message || "ไม่สามารถเปลี่ยนรหัสผ่านได้" }, { status: 400 });
    }

    // Immediately clear the reset code and reset attempts
    const { error: clearError } = await supabase
      .from(matchedTable)
      .update({ reset_password_code: null, reset_attempts: 0 })
      .eq("auth_user_id", authUserId);

    if (clearError) {
      console.error("[Reset Password API] Failed to clear reset code:", clearError);
      return NextResponse.json({ error: "Failed to update status in database" }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "รีเซ็ตรหัสผ่านสำเร็จเรียบร้อยแล้ว!" });
  } catch (err: any) {
    console.error("[Reset Password API] Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
