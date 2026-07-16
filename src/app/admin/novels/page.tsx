import type { Metadata } from "next";
import { createAdminClient } from "@/lib/supabase/server";
import NovelManagement from "@/components/admin/NovelManagement";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "จัดการนิยาย — NovelTH Admin",
  description: "ระงับและจัดการข้อมูลนิยายในระบบ",
};

interface PageProps {
  searchParams: Promise<{
    search?: string;
    status?: string;
    category?: string;
    page?: string;
  }>;
}

export default async function AdminNovelsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const search = params.search || "";
  const status = params.status || "all";
  const category = params.category || "all";
  const page = parseInt(params.page || "1", 10);
  const limit = 10;
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const supabase = await createAdminClient();

  // Fetch categories first for filters & dropdown
  const { data: categoriesData } = await supabase
    .from("category")
    .select("category_id, category_name")
    .order("category_id");

  const categories = categoriesData || [];

  // Construct query
  let query = supabase
    .from("novel")
    .select(
      `
      novel_id,
      novel_name,
      author_id,
      category_id,
      synopsis,
      cover_image,
      status,
      view_count,
      created_at,
      updated_at,
      author:author_id (pen_name),
      category:category_id (category_name)
    `,
      { count: "exact" }
    )
    .order("updated_at", { ascending: false });

  if (search.trim()) {
    // Note: since joins in supabase can filter natively, we filter using a query string
    query = query.or(`novel_name.ilike.%${search.trim()}%,author.pen_name.ilike.%${search.trim()}%`);
  }

  if (status && status !== "all") {
    query = query.eq("status", status);
  }

  if (category && category !== "all") {
    query = query.eq("category_id", Number(category));
  }

  // Paginated execute
  const { data: novels, count, error } = await query.range(from, to);

  if (error) {
    console.error("Fetch novels error:", error);
  }

  const novelsList = (novels || []) as any[];
  const totalCount = count || 0;
  const totalPages = Math.ceil(totalCount / limit);

  return (
    <NovelManagement
      novels={novelsList}
      categories={categories}
      totalPages={totalPages}
      currentPage={page}
      searchQuery={search}
      statusFilter={status}
      categoryFilter={category}
    />
  );
}
