import { NextResponse } from "next/server";
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
  const lastRequest = new Date(lastRequestStr.replace(" ", "T") + "Z");
  const diffMs = Date.now() - lastRequest.getTime();
  return diffMs < 60 * 1000; // 60 seconds
}

export async function POST(request: Request) {
  try {
    const { email } = await request.json().catch(() => ({}));

    if (!email || typeof email !== "string" || !email.trim()) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const supabase = await createAdminClient();

    // Generate a 6-digit numeric OTP code
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
        return NextResponse.json(
          { error: "กรุณารอสักครู่ก่อนขอรหัสผ่านใหม่อีกครั้ง (จำกัดการส่งรหัสผ่าน 1 ครั้งต่อนาที)" },
          { status: 429 }
        );
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
          return NextResponse.json(
            { error: "กรุณารอสักครู่ก่อนขอรหัสผ่านใหม่อีกครั้ง (จำกัดการส่งรหัสผ่าน 1 ครั้งต่อนาที)" },
            { status: 429 }
          );
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
            return NextResponse.json(
              { error: "กรุณารอสักครู่ก่อนขอรหัสผ่านใหม่อีกครั้ง (จำกัดการส่งรหัสผ่าน 1 ครั้งต่อนาที)" },
              { status: 429 }
            );
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

    // Print the plain code clearly in the terminal console (simulated email sending)
    if (matchedRole) {
      console.log("\n==================================================");
      console.log("🔑 [NEW RESET PASSWORD REQUEST]");
      console.log(`📧 Email   : ${normalizedEmail}`);
      console.log(`👤 Role    : ${matchedRole}`);
      console.log(`🔢 OTP Code: ${otpCode} (6 digits)`);
      console.log("==================================================\n");
    } else {
      console.log(`\n[RESET PASSWORD REQUEST] Email not found in any role: ${normalizedEmail}\n`);
    }

    // Always return a generic success message to prevent account enumeration
    return NextResponse.json({ success: true, message: "If the email is registered, a reset code has been sent." });
  } catch (err: any) {
    console.error("[Forgot Password API] Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
