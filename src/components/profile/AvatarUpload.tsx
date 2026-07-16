"use client";

import { useRef, useState } from "react";
import { Camera, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

interface AvatarUploadProps {
  currentUrl: string | null;
  authId: string;
  displayName: string;
  onUpload: (newUrl: string) => void;
}

export default function AvatarUpload({
  currentUrl,
  authId,
  displayName,
  onUpload,
}: AvatarUploadProps) {
  const [preview, setPreview] = useState<string | null>(currentUrl);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("กรุณาเลือกไฟล์รูปภาพเท่านั้น");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error("ขนาดไฟล์ต้องไม่เกิน 2MB");
      return;
    }

    setUploading(true);
    try {
      // Remove old avatar from bucket if it belongs to our storage
      if (currentUrl && currentUrl.includes("/storage/v1/object/public/avatars/")) {
        const oldPath = currentUrl.split("/avatars/")[1];
        if (oldPath) await supabase.storage.from("avatars").remove([oldPath]);
      }

      const ext = file.name.split(".").pop() || "jpg";
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${ext}`;
      const filePath = `${authId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from("avatars").getPublicUrl(filePath);

      setPreview(publicUrl);
      onUpload(publicUrl);
      toast.success("อัปโหลดรูปโปรไฟล์สำเร็จแล้ว");
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "อัปโหลดรูปโปรไฟล์ไม่สำเร็จ");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const initials = displayName?.slice(0, 2).toUpperCase() || "?";

  return (
    <div
      className="relative w-24 h-24 group cursor-pointer shrink-0"
      onClick={() => !uploading && inputRef.current?.click()}
    >
      {/* Avatar circle */}
      <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-white/10 bg-[#1c1917] flex items-center justify-center shadow-xl">
        {preview ? (
          <img
            src={preview}
            alt="โปรไฟล์"
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="text-2xl font-bold text-white/50">{initials}</span>
        )}
      </div>

      {/* Hover camera overlay */}
      <div className="absolute inset-0 rounded-full bg-black/60 flex flex-col items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {uploading ? (
          <Loader2 className="h-6 w-6 text-white animate-spin" />
        ) : (
          <>
            <Camera className="h-5 w-5 text-white" />
            <span className="text-[9px] text-white/80 font-semibold">เปลี่ยนรูป</span>
          </>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={handleFileChange}
        className="hidden"
        disabled={uploading}
      />
    </div>
  );
}
