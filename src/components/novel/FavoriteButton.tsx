"use client";

import { useState, useEffect } from "react";
import { Heart } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface FavoriteButtonProps {
  novelId: number;
  initialFavorited?: boolean;
}

export default function FavoriteButton({
  novelId,
  initialFavorited = false,
}: FavoriteButtonProps) {
  const [isFavorited, setIsFavorited] = useState(initialFavorited);
  const [isAnimating, setIsAnimating] = useState(false);
  const supabase = createClient();
  const router = useRouter();

  // Sync state if initialFavorited prop changes
  useEffect(() => {
    setIsFavorited(initialFavorited);
  }, [initialFavorited]);

  const handleToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Check if user is logged in
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error("กรุณาเข้าสู่ระบบเพื่อบันทึกนิยายโปรด");
      router.push("/login");
      return;
    }

    // Get public.users user_id
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("user_id")
      .eq("auth_user_id", user.id)
      .maybeSingle();

    if (userError || !userData) {
      toast.error("ไม่พบข้อมูลผู้ใช้");
      return;
    }

    const userId = userData.user_id;
    const nextFavorited = !isFavorited;

    setIsAnimating(true);
    setIsFavorited(nextFavorited);

    try {
      if (nextFavorited) {
        const { error } = await supabase
          .from("favorite")
          .insert({
            user_id: userId,
            novel_id: novelId,
          });
        if (error) throw error;
        toast.success("บันทึกเป็นนิยายโปรดแล้ว");
      } else {
        const { error } = await supabase
          .from("favorite")
          .delete()
          .eq("user_id", userId)
          .eq("novel_id", novelId);
        if (error) throw error;
        toast.success("ลบออกจากรายการโปรดแล้ว");
      }
      router.refresh();
    } catch (err) {
      console.error(err);
      // Revert on error
      setIsFavorited(!nextFavorited);
      toast.error("ทำรายการไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
    } finally {
      setIsAnimating(false);
    }
  };

  return (
    <button
      onClick={handleToggle}
      className={`
        h-8 w-8 rounded-full flex items-center justify-center
        bg-white/70 backdrop-blur-sm border border-white/30
        shadow-sm hover:shadow-md
        transition-all duration-200
        hover:scale-110
        ${isAnimating ? "scale-125" : ""}
      `}
      aria-label={isFavorited ? "ลบออกจากรายการโปรด" : "เพิ่มในรายการโปรด"}
    >
      <Heart
        className={`h-4 w-4 transition-colors duration-200 ${
          isFavorited
            ? "fill-red-500 text-red-500"
            : "fill-transparent text-gray-600 hover:text-red-400"
        }`}
      />
    </button>
  );
}
