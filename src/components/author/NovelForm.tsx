"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Upload, X, Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";

interface Category {
  category_id: number;
  category_name: string;
}

interface NovelFormProps {
  categories: Category[];
  initialData?: {
    novel_id: number;
    novel_name: string;
    category_id: number;
    synopsis: string | null;
    cover_image: string | null;
    status: "ongoing" | "completed" | "draft";
  };
  authorId: number;
}

const formSchema = z.object({
  novel_name: z
    .string()
    .min(2, "ชื่อนิยายต้องมีความยาวอย่างน้อย 2 ตัวอักษร")
    .max(100, "ชื่อนิยายต้องไม่เกิน 100 ตัวอักษร"),
  category_id: z.coerce.number().min(1, "กรุณาเลือกหมวดหมู่นิยาย"),
  synopsis: z.string().max(2000, "เรื่องย่อต้องไม่เกิน 2000 ตัวอักษร").default("").optional(),
  status: z.enum(["ongoing", "completed", "draft"]),
});

type NovelFormData = z.infer<typeof formSchema>;

export default function NovelForm({ categories, initialData, authorId }: NovelFormProps) {
  const isEdit = !!initialData;
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(false);
  
  // Image Upload State
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(initialData?.cover_image || null);
  const [uploadProgress, setUploadProgress] = useState(false);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<NovelFormData>({
    resolver: zodResolver(formSchema) as any,
    defaultValues: {
      novel_name: initialData?.novel_name || "",
      category_id: initialData?.category_id || 0,
      synopsis: initialData?.synopsis || "",
      status: initialData?.status || "draft",
    },
  });

  // Handle Image Change
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("กรุณาเลือกไฟล์รูปภาพเท่านั้น");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error("ขนาดไฟล์รูปภาพต้องไม่เกิน 2MB");
      return;
    }

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  // Image Upload Helper
  const uploadImage = async (file: File): Promise<string> => {
    setUploadProgress(true);
    const fileExt = file.name.split(".").pop();
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
    const filePath = `${authorId}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("covers")
      .upload(filePath, file);

    if (uploadError) {
      setUploadProgress(false);
      throw new Error("อัปโหลดรูปภาพปกไม่สำเร็จ: " + uploadError.message);
    }

    const { data: { publicUrl } } = supabase.storage
      .from("covers")
      .getPublicUrl(filePath);

    setUploadProgress(false);
    return publicUrl;
  };

  // Form Submit Handler
  const onSubmit = async (values: NovelFormData) => {
    setLoading(true);

    try {
      // 1. Unique Name Validation
      const { data: existingNovel } = await supabase
        .from("novel")
        .select("novel_id")
        .eq("novel_name", values.novel_name.trim())
        .maybeSingle();

      if (existingNovel && (!isEdit || existingNovel.novel_id !== initialData.novel_id)) {
        setError("novel_name", { message: "ชื่อนิยายนี้มีอยู่ในระบบแล้ว กรุณาใช้ชื่ออื่น" });
        setLoading(false);
        return;
      }

      // 2. Upload cover image if a new file is chosen
      let finalImageUrl = initialData?.cover_image || null;
      if (imageFile) {
        // Delete previous cover if editing and replacing
        if (isEdit && initialData.cover_image && initialData.cover_image.includes("/storage/v1/object/public/covers/")) {
          const fileUrlParts = initialData.cover_image.split("/covers/");
          if (fileUrlParts.length > 1) {
            const oldPath = fileUrlParts[1];
            await supabase.storage.from("covers").remove([oldPath]);
          }
        }
        finalImageUrl = await uploadImage(imageFile);
      }

      // 3. Save to database
      if (isEdit) {
        const { error } = await supabase
          .from("novel")
          .update({
            novel_name: values.novel_name.trim(),
            category_id: values.category_id,
            synopsis: values.synopsis || null,
            cover_image: finalImageUrl,
            status: values.status,
            updated_at: new Date().toISOString(),
          })
          .eq("novel_id", initialData.novel_id);

        if (error) throw error;
        toast.success("อัปเดตข้อมูลนิยายเรียบร้อยแล้ว");
      } else {
        const { error } = await supabase
          .from("novel")
          .insert({
            novel_name: values.novel_name.trim(),
            author_id: authorId,
            category_id: values.category_id,
            synopsis: values.synopsis || null,
            cover_image: finalImageUrl,
            status: values.status,
            view_count: 0,
          });

        if (error) throw error;
        toast.success("สร้างนิยายเรื่องใหม่เรียบร้อยแล้ว");
      }

      router.push("/author/dashboard");
      router.refresh();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "เกิดข้อผิดพลาดในการบันทึกข้อมูล");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4">
      {/* ─── Back Link ─── */}
      <div className="mb-6">
        <Link
          href="/author/dashboard"
          className="inline-flex items-center gap-1.5 text-xs text-white/40 hover:text-white/80 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>กลับไปหน้าแดชบอร์ด</span>
        </Link>
      </div>

      {/* ─── Title ─── */}
      <h1 className="text-xl sm:text-2xl font-extrabold text-white/90 mb-8 pb-4 border-b border-white/5">
        {isEdit ? "แก้ไขข้อมูลนิยาย" : "สร้างนิยายเรื่องใหม่"}
      </h1>

      {/* ─── Form ─── */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        
        {/* Cover Image Upload */}
        <div className="space-y-2">
          <label className="block text-xs font-bold text-white/60 uppercase tracking-wider">
            รูปภาพปกนิยาย
          </label>
          <div className="flex flex-col sm:flex-row gap-4 items-start">
            <div className="relative h-44 w-32 shrink-0 rounded-2xl overflow-hidden bg-white/5 border border-white/10 flex items-center justify-center shadow-lg">
              {imagePreview ? (
                <img
                  src={imagePreview}
                  alt="Cover Preview"
                  className="w-full h-full object-cover"
                />
              ) : (
                <Upload className="h-6 w-6 text-white/20" />
              )}
              {imagePreview && (
                <button
                  type="button"
                  onClick={() => {
                    setImageFile(null);
                    setImagePreview(null);
                  }}
                  className="absolute top-2 right-2 p-1 rounded-lg bg-black/60 text-white/80 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
            
            <div className="flex-1 space-y-2 pt-2">
              <p className="text-xs text-white/40 leading-relaxed">
                แนะนำขนาดปกสัดส่วน 2:3 (เช่น 600x900px) ขนาดไฟล์ไม่เกิน 2MB รองรับเฉพาะไฟล์รูปภาพหลัก (JPG, PNG, WebP)
              </p>
              <label className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl border border-white/10 text-white/80 hover:text-white hover:bg-white/5 transition-all cursor-pointer">
                <Upload className="h-3.5 w-3.5" />
                เลือกรูปภาพปก
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        </div>

        {/* Novel Name */}
        <div className="space-y-2">
          <label className="block text-xs font-bold text-white/60 uppercase tracking-wider">
            ชื่อนิยาย <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            placeholder="ตั้งชื่อนิยายของคุณ..."
            {...register("novel_name")}
            className="w-full bg-[#1c1917] border border-white/5 text-white/80 text-sm font-semibold rounded-xl px-4 py-3 focus:outline-none focus:ring-1 focus:ring-accent/50"
          />
          {errors.novel_name && (
            <p className="text-xs text-red-400 mt-1">{errors.novel_name.message}</p>
          )}
        </div>

        {/* Category */}
        <div className="space-y-2">
          <label className="block text-xs font-bold text-white/60 uppercase tracking-wider">
            หมวดหมู่นิยาย <span className="text-red-400">*</span>
          </label>
          <select
            {...register("category_id")}
            className="w-full bg-[#1c1917] border border-white/5 text-white/80 text-sm font-semibold rounded-xl px-4 py-3 focus:outline-none focus:ring-1 focus:ring-accent/50 cursor-pointer"
          >
            <option value={0}>เลือกหมวดหมู่...</option>
            {categories.map((cat) => (
              <option key={cat.category_id} value={cat.category_id}>
                {cat.category_name}
              </option>
            ))}
          </select>
          {errors.category_id && (
            <p className="text-xs text-red-400 mt-1">{errors.category_id.message}</p>
          )}
        </div>

        {/* Status */}
        <div className="space-y-2">
          <label className="block text-xs font-bold text-white/60 uppercase tracking-wider">
            สถานะของนิยาย
          </label>
          <select
            {...register("status")}
            className="w-full bg-[#1c1917] border border-white/5 text-white/80 text-sm font-semibold rounded-xl px-4 py-3 focus:outline-none focus:ring-1 focus:ring-accent/50 cursor-pointer"
          >
            <option value="draft">ฉบับร่าง (Draft)</option>
            <option value="ongoing">กำลังแต่ง (Ongoing)</option>
            <option value="completed">จบแล้ว (Completed)</option>
          </select>
          {errors.status && (
            <p className="text-xs text-red-400 mt-1">{errors.status.message}</p>
          )}
        </div>

        {/* Synopsis */}
        <div className="space-y-2">
          <label className="block text-xs font-bold text-white/60 uppercase tracking-wider">
            เรื่องย่อ
          </label>
          <textarea
            placeholder="เขียนเรื่องย่อของคุณให้น่าสนใจ..."
            rows={5}
            {...register("synopsis")}
            className="w-full bg-[#1c1917] border border-white/5 text-white/80 text-sm font-semibold rounded-xl px-4 py-3 focus:outline-none focus:ring-1 focus:ring-accent/50 resize-none"
          />
          {errors.synopsis && (
            <p className="text-xs text-red-400 mt-1">{errors.synopsis.message}</p>
          )}
        </div>

        {/* Buttons */}
        <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
          <Link
            href="/author/dashboard"
            className="px-6 py-2.5 text-xs font-semibold rounded-xl border border-white/10 text-white/60 hover:text-white hover:bg-white/5 transition-colors"
          >
            ยกเลิก
          </Link>
          <button
            type="submit"
            disabled={loading || uploadProgress}
            className="inline-flex items-center justify-center gap-1.5 px-6 py-2.5 text-xs font-semibold rounded-xl bg-[#e09050] text-white hover:bg-[#c97c3a] disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
          >
            {(loading || uploadProgress) && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {isEdit ? "บันทึกข้อมูล" : "สร้างนิยาย"}
          </button>
        </div>
      </form>
    </div>
  );
}
