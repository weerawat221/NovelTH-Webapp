import type { Metadata } from "next";
import { createAdminClient } from "@/lib/supabase/server";
import AuthorManagement from "@/components/admin/AuthorManagement";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "จัดการผู้แต่ง — NovelTH Admin",
  description: "อนุมัติและจัดการข้อมูลนักเขียนในระบบ",
};

interface PageProps {
  searchParams: Promise<{
    search?: string;
    status?: string;
    page?: string;
  }>;
}

export default async function AdminAuthorsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const search = params.search || "";
  const status = params.status || "all";
  const page = parseInt(params.page || "1", 10);
  const limit = 10;
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const supabase = await createAdminClient();

  // Construct query
  let query = supabase
    .from("author")
    .select("*", { count: "exact" })
    // If status filter is pending, sort them first, otherwise sort by date descending
    .order(status === "pending" ? "created_at" : "created_at", { ascending: status === "pending" });

  if (search.trim()) {
    query = query.or(`username.ilike.%${search.trim()}%,pen_name.ilike.%${search.trim()}%,email.ilike.%${search.trim()}%`);
  }

  if (status && status !== "all") {
    query = query.eq("status", status);
  }

  // Paginated execute
  const { data: authors, count, error } = await query.range(from, to);

  if (error) {
    console.error("Fetch authors error:", error);
  }

  const authorsList = authors || [];
  const totalCount = count || 0;
  const totalPages = Math.ceil(totalCount / limit);

  return (
    <AuthorManagement
      authors={authorsList}
      totalPages={totalPages}
      currentPage={page}
      searchQuery={search}
      statusFilter={status}
    />
  );
}
