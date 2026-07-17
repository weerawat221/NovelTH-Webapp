"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function clearAllReadingHistory() {
  const supabase = await createClient();

  const { error } = await supabase.rpc("clear_all_reading_history");

  if (error) {
    console.error("clearAllReadingHistory error:", error);
    throw new Error(error.message || "ไม่สามารถล้างประวัติการอ่านได้");
  }

  revalidatePath("/reading-history");
}

export async function deleteNovelReadingHistory(novelId: number) {
  const supabase = await createClient();

  const { error } = await supabase.rpc("delete_novel_reading_history", {
    p_novel_id: novelId,
  });

  if (error) {
    console.error("deleteNovelReadingHistory error:", error);
    throw new Error(error.message || "ไม่สามารถลบประวัติการอ่านของนิยายเรื่องนี้ได้");
  }

  revalidatePath("/reading-history");
}
