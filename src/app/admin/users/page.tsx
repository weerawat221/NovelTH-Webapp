import type { Metadata } from "next";
import { createAdminClient } from "@/lib/supabase/server";
import UserManagement from "@/components/admin/UserManagement";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "จัดการผู้ใช้ — NovelTH Admin",
  description: "จัดการและตรวจสอบบัญชีผู้ใช้ในระบบ",
};

interface PageProps {
  searchParams: Promise<{
    search?: string;
    status?: string;
    page?: string;
  }>;
}

export default async function AdminUsersPage({ searchParams }: PageProps) {
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
    .from("users")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false });

  if (search.trim()) {
    query = query.or(`username.ilike.%${search.trim()}%,email.ilike.%${search.trim()}%`);
  }

  if (status && status !== "all") {
    query = query.eq("status", status);
  }

  // Paginated execute
  const { data: users, count, error } = await query.range(from, to);

  if (error) {
    console.error("Fetch users error:", error);
  }

  const usersList = users || [];
  const totalCount = count || 0;
  const totalPages = Math.ceil(totalCount / limit);

  return (
    <UserManagement
      users={usersList}
      totalPages={totalPages}
      currentPage={page}
      searchQuery={search}
      statusFilter={status}
    />
  );
}
