"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/server";

// ═════════════════════════════════════════════════════════════
// USER ACTIONS
// ═════════════════════════════════════════════════════════════

export async function updateUser(
  userId: number,
  data: { full_name: string | null; phone: string | null; email: string | null }
) {
  const supabase = await createAdminClient();

  const { error } = await supabase
    .from("users")
    .update({
      full_name: data.full_name?.trim() || null,
      phone: data.phone?.trim() || null,
      email: data.email?.trim() || null,
    })
    .eq("user_id", userId);

  if (error) {
    console.error("updateUser error:", error);
    throw new Error(error.message || "ไม่สามารถแก้ไขข้อมูลผู้ใช้ได้");
  }

  revalidatePath("/admin/users");
}

export async function toggleUserSuspension(userId: number, currentStatus: string) {
  const supabase = await createAdminClient();
  const nextStatus = currentStatus === "suspended" ? "active" : "suspended";

  const { error } = await supabase
    .from("users")
    .update({ status: nextStatus })
    .eq("user_id", userId);

  if (error) {
    console.error("toggleUserSuspension error:", error);
    throw new Error(error.message || "ไม่สามารถเปลี่ยนสถานะผู้ใช้ได้");
  }

  revalidatePath("/admin/users");
}

export async function softDeleteUser(userId: number) {
  const supabase = await createAdminClient();

  const { error } = await supabase
    .from("users")
    .update({ status: "deleted" })
    .eq("user_id", userId);

  if (error) {
    console.error("softDeleteUser error:", error);
    throw new Error(error.message || "ไม่สามารถลบผู้ใช้งานได้");
  }

  revalidatePath("/admin/users");
}

// ═════════════════════════════════════════════════════════════
// AUTHOR ACTIONS
// ═════════════════════════════════════════════════════════════

export async function updateAuthor(
  authorId: number,
  data: { pen_name: string; full_name: string | null; email: string | null; bio: string | null }
) {
  const supabase = await createAdminClient();

  const { error } = await supabase
    .from("author")
    .update({
      pen_name: data.pen_name.trim(),
      full_name: data.full_name?.trim() || null,
      email: data.email?.trim() || null,
      bio: data.bio?.trim() || null,
    })
    .eq("author_id", authorId);

  if (error) {
    console.error("updateAuthor error:", error);
    throw new Error(error.message || "ไม่สามารถแก้ไขข้อมูลผู้แต่งได้");
  }

  revalidatePath("/admin/authors");
}

export async function approveAuthor(authorId: number) {
  const supabase = await createAdminClient();

  const { error } = await supabase
    .from("author")
    .update({ status: "active" })
    .eq("author_id", authorId);

  if (error) {
    console.error("approveAuthor error:", error);
    throw new Error(error.message || "ไม่สามารถอนุมัติผู้แต่งได้");
  }

  revalidatePath("/admin/authors");
}

export async function toggleAuthorSuspension(authorId: number, currentStatus: string) {
  const supabase = await createAdminClient();
  const nextStatus = currentStatus === "suspended" ? "active" : "suspended";

  const { error } = await supabase
    .from("author")
    .update({ status: nextStatus })
    .eq("author_id", authorId);

  if (error) {
    console.error("toggleAuthorSuspension error:", error);
    throw new Error(error.message || "ไม่สามารถเปลี่ยนสถานะผู้แต่งได้");
  }

  revalidatePath("/admin/authors");
}

// ═════════════════════════════════════════════════════════════
// NOVEL ACTIONS
// ═════════════════════════════════════════════════════════════

export async function updateNovelAdmin(
  novelId: number,
  data: { novel_name: string; category_id: number; synopsis: string | null }
) {
  const supabase = await createAdminClient();

  const { error } = await supabase
    .from("novel")
    .update({
      novel_name: data.novel_name.trim(),
      category_id: data.category_id,
      synopsis: data.synopsis?.trim() || null,
      updated_at: new Date().toISOString(),
    })
    .eq("novel_id", novelId);

  if (error) {
    console.error("updateNovelAdmin error:", error);
    throw new Error(error.message || "ไม่สามารถแก้ไขข้อมูลนิยายได้");
  }

  revalidatePath("/admin/novels");
}

export async function toggleNovelSuspension(novelId: number, currentStatus: string, originalStatus: string) {
  const supabase = await createAdminClient();
  
  // If currently suspended, restore to originalStatus (fallback to ongoing if empty)
  // If not suspended, suspend it and save the originalStatus if we want (or default to suspended)
  const nextStatus = currentStatus === "suspended" ? (originalStatus || "ongoing") : "suspended";

  const { error } = await supabase
    .from("novel")
    .update({ status: nextStatus })
    .eq("novel_id", novelId);

  if (error) {
    console.error("toggleNovelSuspension error:", error);
    throw new Error(error.message || "ไม่สามารถเปลี่ยนสถานะการเผยแพร่นิยายได้");
  }

  revalidatePath("/admin/novels");
}

// ═════════════════════════════════════════════════════════════
// CATEGORY ACTIONS
// ═════════════════════════════════════════════════════════════

export async function createCategory(data: { category_name: string; description: string | null }) {
  const supabase = await createAdminClient();

  // Check unique
  const { data: existing } = await supabase
    .from("category")
    .select("category_id")
    .ilike("category_name", data.category_name.trim())
    .maybeSingle();

  if (existing) {
    throw new Error("มีชื่อหมวดหมู่นี้ในระบบแล้ว");
  }

  const { error } = await supabase.from("category").insert({
    category_name: data.category_name.trim(),
    description: data.description?.trim() || null,
  });

  if (error) {
    console.error("createCategory error:", error);
    throw new Error(error.message || "ไม่สามารถเพิ่มหมวดหมู่ได้");
  }

  revalidatePath("/admin/categories");
}

export async function updateCategory(
  categoryId: number,
  data: { category_name: string; description: string | null }
) {
  const supabase = await createAdminClient();

  // Check unique excluding itself
  const { data: existing } = await supabase
    .from("category")
    .select("category_id")
    .ilike("category_name", data.category_name.trim())
    .neq("category_id", categoryId)
    .maybeSingle();

  if (existing) {
    throw new Error("มีชื่อหมวดหมู่นี้ในระบบแล้ว");
  }

  const { error } = await supabase
    .from("category")
    .update({
      category_name: data.category_name.trim(),
      description: data.description?.trim() || null,
    })
    .eq("category_id", categoryId);

  if (error) {
    console.error("updateCategory error:", error);
    throw new Error(error.message || "ไม่สามารถแก้ไขหมวดหมู่ได้");
  }

  revalidatePath("/admin/categories");
}

export async function deleteCategory(categoryId: number) {
  const supabase = await createAdminClient();

  // Verify if any novel is linked
  const { count } = await supabase
    .from("novel")
    .select("novel_id", { count: "exact", head: true })
    .eq("category_id", categoryId);

  if (count && count > 0) {
    throw new Error(
      `ไม่สามารถลบหมวดหมู่ได้ เนื่องจากมีนิยายจำนวน ${count} เรื่องกำลังใช้งานอยู่ กรุณาย้ายนิยายเหล่านั้นไปหมวดหมู่อื่นก่อน`
    );
  }

  const { error } = await supabase.from("category").delete().eq("category_id", categoryId);

  if (error) {
    console.error("deleteCategory error:", error);
    throw new Error(error.message || "ไม่สามารถลบหมวดหมู่ได้");
  }

  revalidatePath("/admin/categories");
}

// ═════════════════════════════════════════════════════════════
// REPORT ACTIONS
// ═════════════════════════════════════════════════════════════

export async function getReportTotalVisits(startDate: string, endDate: string) {
  const supabase = await createAdminClient();
  const { data, error } = await supabase.rpc("report_total_visits", {
    start_date: startDate,
    end_date: endDate,
  });

  if (error) {
    console.error("report_total_visits error:", error);
    throw new Error(error.message);
  }
  return data?.[0] || { total_visits: 0, unique_visitors: 0 };
}

export async function getReportVisitsByDay(startDate: string, endDate: string) {
  const supabase = await createAdminClient();
  const { data, error } = await supabase.rpc("report_visits_by_day", {
    start_date: startDate,
    end_date: endDate,
  });

  if (error) {
    console.error("report_visits_by_day error:", error);
    throw new Error(error.message);
  }
  return data || [];
}

export async function getReportVisitsByMonth(targetYear: number) {
  const supabase = await createAdminClient();
  const { data, error } = await supabase.rpc("report_visits_by_month", {
    target_year: targetYear,
  });

  if (error) {
    console.error("report_visits_by_month error:", error);
    throw new Error(error.message);
  }
  return data || [];
}

export async function getReportVisitsByYear() {
  const supabase = await createAdminClient();
  const { data, error } = await supabase.rpc("report_visits_by_year");

  if (error) {
    console.error("report_visits_by_year error:", error);
    throw new Error(error.message);
  }
  return data || [];
}

export async function getReportVisitsByCategory(startDate: string, endDate: string) {
  const supabase = await createAdminClient();
  const { data, error } = await supabase.rpc("report_visits_by_category", {
    start_date: startDate,
    end_date: endDate,
  });

  if (error) {
    console.error("report_visits_by_category error:", error);
    throw new Error(error.message);
  }
  return data || [];
}

export async function getReportVisitsByAuthor(startDate: string, endDate: string) {
  const supabase = await createAdminClient();
  const { data, error } = await supabase.rpc("report_visits_by_author", {
    start_date: startDate,
    end_date: endDate,
  });

  if (error) {
    console.error("report_visits_by_author error:", error);
    throw new Error(error.message);
  }
  return data || [];
}

export async function getAuthorNovelsBreakdown(authorId: number, startDate: string, endDate: string) {
  const supabase = await createAdminClient();

  const { data, error } = await supabase
    .from("novel")
    .select(`
      novel_id,
      novel_name,
      status,
      created_at
    `)
    .eq("author_id", authorId);

  if (error) {
    console.error("getAuthorNovelsBreakdown error:", error);
    throw new Error(error.message);
  }

  // For each novel, fetch the visit count in the date range
  const breakdown = await Promise.all(
    (data || []).map(async (n) => {
      const { count } = await supabase
        .from("visit_log")
        .select("visit_id", { count: "exact", head: true })
        .eq("novel_id", n.novel_id)
        .gte("visit_date", startDate)
        .lte("visit_date", endDate);

      return {
        novel_id: n.novel_id,
        novel_name: n.novel_name,
        status: n.status,
        visit_count: count || 0,
      };
    })
  );

  // Sort by visit count descending
  breakdown.sort((a, b) => b.visit_count - a.visit_count);
  return breakdown;
}
