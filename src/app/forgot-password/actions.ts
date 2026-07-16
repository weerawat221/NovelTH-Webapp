"use server";

import { createAdminClient } from "@/lib/supabase/server";
import crypto from "crypto";

function hashResetCode(code: string): string {
  return crypto
    .createHmac("sha256", process.env.RESET_CODE_SECRET || "default_reset_pepper_12345")
    .update(code.trim())
    .digest("base64");
}

function isRateLimited(lastRequestStr: string | null): boolean {
  if (!lastRequestStr) return false;
  // Convert DB timestamp to MS
  const lastRequest = new Date(lastRequestStr.replace(" ", "T") + "Z");
  const diffMs = Date.now() - lastRequest.getTime();
  return diffMs < 60 * 1000; // 60 seconds
}

// 1. Send OTP Code
export async function sendOtpCode(email: string) {
  const normalizedEmail = email.trim().toLowerCase();
  const supabase = await createAdminClient();

  // Generate 6-digit OTP code
  const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
  const hashedCode = hashResetCode(otpCode);

  let matchedRole: "admin" | "users" | "author" | null = null;

  // 1. Check admin table
  const { data: adminData } = await supabase
    .from("admin")
    .select("admin_id, last_reset_request")
    .eq("email", normalizedEmail)
    .maybeSingle();

  if (adminData) {
    if (isRateLimited(adminData.last_reset_request)) {
      throw new Error("กรุณารอสักครู่ก่อนขอรหัสผ่านใหม่อีกครั้ง (จำกัดการส่งรหัสผ่าน 1 ครั้งต่อนาที)");
    }
    matchedRole = "admin";
    await supabase
      .from("admin")
      .update({
        reset_password_code: hashedCode,
        last_reset_request: new Date().toISOString(),
        reset_attempts: 0,
      })
      .eq("email", normalizedEmail);
  } else {
    // 2. Check users table
    const { data: userData } = await supabase
      .from("users")
      .select("user_id, last_reset_request")
      .eq("email", normalizedEmail)
      .maybeSingle();

    if (userData) {
      if (isRateLimited(userData.last_reset_request)) {
        throw new Error("กรุณารอสักครู่ก่อนขอรหัสผ่านใหม่อีกครั้ง (จำกัดการส่งรหัสผ่าน 1 ครั้งต่อนาที)");
      }
      matchedRole = "users";
      await supabase
        .from("users")
        .update({
          reset_password_code: hashedCode,
          last_reset_request: new Date().toISOString(),
          reset_attempts: 0,
        })
        .eq("email", normalizedEmail);
    } else {
      // 3. Check author table
      const { data: authorData } = await supabase
        .from("author")
        .select("author_id, last_reset_request")
        .eq("email", normalizedEmail)
        .maybeSingle();

      if (authorData) {
        if (isRateLimited(authorData.last_reset_request)) {
          throw new Error("กรุณารอสักครู่ก่อนขอรหัสผ่านใหม่อีกครั้ง (จำกัดการส่งรหัสผ่าน 1 ครั้งต่อนาที)");
        }
        matchedRole = "author";
        await supabase
          .from("author")
          .update({
            reset_password_code: hashedCode,
            last_reset_request: new Date().toISOString(),
            reset_attempts: 0,
          })
          .eq("email", normalizedEmail);
      }
    }
  }

  // Print the code clearly in terminal console
  if (matchedRole) {
    console.log("\n==================================================");
    console.log("🔑 [RESET PASSWORD REQUEST - ACTION]");
    console.log(`📧 Email   : ${normalizedEmail}`);
    console.log(`👤 Role    : ${matchedRole}`);
    console.log(`🔢 OTP Code: ${otpCode} (6 digits)`);
    console.log("==================================================\n");
  } else {
    console.log(`\n[RESET PASSWORD REQUEST - ACTION] Email not found in any role: ${normalizedEmail}\n`);
  }

  // Return generic success to prevent email enumeration leaks
  return { success: true };
}

// 2. Verify OTP Code
export async function verifyOtpCode(email: string, code: string) {
  const normalizedEmail = email.trim().toLowerCase();
  const cleanCode = code.trim();
  const hashedCode = hashResetCode(cleanCode);
  const supabase = await createAdminClient();

  let matchedTable: "admin" | "users" | "author" | null = null;
  let resetAttempts = 0;
  let dbCode: string | null = null;
  let authUserId: string | null = null;

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
    throw new Error("รหัส OTP ไม่ถูกต้อง หรือหมดอายุแล้ว");
  }

  // Check if attempts exceeded
  if (resetAttempts >= 3) {
    await supabase
      .from(matchedTable)
      .update({ reset_password_code: null, reset_attempts: 0 })
      .eq("auth_user_id", authUserId);
    throw new Error("คุณกรอกรหัสผิดเกินจำนวนครั้งที่กำหนด (3 ครั้ง) กรุณาขอรหัสผ่านใหม่อีกครั้ง");
  }

  // Compare code
  if (dbCode !== hashedCode) {
    const nextAttempts = resetAttempts + 1;
    if (nextAttempts >= 3) {
      await supabase
        .from(matchedTable)
        .update({ reset_password_code: null, reset_attempts: 0 })
        .eq("auth_user_id", authUserId);
      throw new Error("คุณกรอกรหัสผิดเกินจำนวนครั้งที่กำหนด (3 ครั้ง) กรุณาขอรหัสผ่านใหม่อีกครั้ง");
    } else {
      await supabase
        .from(matchedTable)
        .update({ reset_attempts: nextAttempts })
        .eq("auth_user_id", authUserId);
      throw new Error(`รหัส OTP ไม่ถูกต้อง (เหลือโอกาสอีก ${3 - nextAttempts} ครั้ง)`);
    }
  }

  return { success: true };
}

// 3. Reset Password
export async function resetUserPassword(email: string, code: string, newPassword: string) {
  const normalizedEmail = email.trim().toLowerCase();
  const cleanCode = code.trim();
  const hashedCode = hashResetCode(cleanCode);
  const supabase = await createAdminClient();

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    throw new Error(
      "ระบบหลังบ้านยังไม่ได้กำหนดสิทธิ์ SUPABASE_SERVICE_ROLE_KEY ในไฟล์ .env.local กรุณาติดต่อผู้ดูแลระบบเพื่อเปิดใช้งานฟังก์ชันนี้"
    );
  }

  let matchedTable: "admin" | "users" | "author" | null = null;
  let resetAttempts = 0;
  let dbCode: string | null = null;
  let authUserId: string | null = null;

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
    throw new Error("รหัส OTP ไม่ถูกต้อง หรือหมดอายุแล้ว");
  }

  // Check if attempts exceeded
  if (resetAttempts >= 3) {
    await supabase
      .from(matchedTable)
      .update({ reset_password_code: null, reset_attempts: 0 })
      .eq("auth_user_id", authUserId);
    throw new Error("คุณกรอกรหัสผิดเกินจำนวนครั้งที่กำหนด (3 ครั้ง) กรุณาขอรหัสผ่านใหม่อีกครั้ง");
  }

  // Compare code
  if (dbCode !== hashedCode) {
    const nextAttempts = resetAttempts + 1;
    if (nextAttempts >= 3) {
      await supabase
        .from(matchedTable)
        .update({ reset_password_code: null, reset_attempts: 0 })
        .eq("auth_user_id", authUserId);
      throw new Error("คุณกรอกรหัสผิดเกินจำนวนครั้งที่กำหนด (3 ครั้ง) กรุณาขอรหัสผ่านใหม่อีกครั้ง");
    } else {
      await supabase
        .from(matchedTable)
        .update({ reset_attempts: nextAttempts })
        .eq("auth_user_id", authUserId);
      throw new Error(`รหัส OTP ไม่ถูกต้อง (เหลือโอกาสอีก ${3 - nextAttempts} ครั้ง)`);
    }
  }

  console.log(`[Reset Password] Found user in table "${matchedTable}" with Auth User ID: ${authUserId}. Updating password...`);

  // Update password in Supabase Auth via Admin Client
  const { data: updateData, error: authError } = await supabase.auth.admin.updateUserById(authUserId, {
    password: newPassword,
  });

  if (authError) {
    console.error("[Reset Password] Auth update error:", authError);
    throw new Error(authError.message || "ไม่สามารถเปลี่ยนรหัสผ่านได้");
  }

  console.log("[Reset Password] Auth password updated successfully. Clearing reset code in database...");

  // Clear the reset code (make it single-use)
  const { error: clearError } = await supabase
    .from(matchedTable)
    .update({ reset_password_code: null, reset_attempts: 0 })
    .eq("auth_user_id", authUserId);

  if (clearError) {
    console.error("[Reset Password] Failed to clear reset_password_code in DB:", clearError);
    throw new Error("เกิดข้อผิดพลาดในการบันทึกข้อมูลรหัสผ่านลงฐานข้อมูล: " + clearError.message);
  }

  console.log("[Reset Password] Reset code cleared successfully. Password reset complete!");
  return { success: true };
}
