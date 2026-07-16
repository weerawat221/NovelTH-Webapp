import type { Metadata } from "next";
import { createAdminClient } from "@/lib/supabase/server";
import CategoryManagement from "@/components/admin/CategoryManagement";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "จัดการประเภทนิยาย — NovelTH Admin",
  description: "จัดการหมวดหมู่และประเภทของนิยายทั้งหมดในระบบ",
};

export default async function AdminCategoriesPage() {
  const supabase = await createAdminClient();

  // Fetch categories
  const { data: categories, error } = await supabase
    .from("category")
    .select("category_id, category_name, description")
    .order("category_name");

  if (error) {
    console.error("Fetch categories error:", error);
  }

  // Fetch count of novels for each category in parallel
  const categoriesList = await Promise.all(
    (categories || []).map(async (cat) => {
      const { count } = await supabase
        .from("novel")
        .select("novel_id", { count: "exact", head: true })
        .eq("category_id", cat.category_id);
      return {
        ...cat,
        novel_count: count || 0,
      };
    })
  );

  return <CategoryManagement categories={categoriesList} />;
}
