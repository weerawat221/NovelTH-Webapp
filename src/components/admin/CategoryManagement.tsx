"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Edit2,
  Trash2,
  X,
  Loader2,
  Tag,
} from "lucide-react";
import { toast } from "sonner";
import { createCategory, updateCategory, deleteCategory } from "@/app/admin/actions";

interface CategoryItem {
  category_id: number;
  category_name: string;
  description: string | null;
  novel_count?: number;
}

interface CategoryManagementProps {
  categories: CategoryItem[];
}

export default function CategoryManagement({ categories }: CategoryManagementProps) {
  const router = useRouter();

  // Modal states
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  // Selected item states
  const [selectedCategory, setSelectedCategory] = useState<CategoryItem | null>(null);

  // Form states
  const [form, setForm] = useState({ category_name: "", description: "" });
  const [saving, setSaving] = useState(false);
  const [executing, setExecuting] = useState(false);

  const handleOpenAdd = () => {
    setForm({ category_name: "", description: "" });
    setAddOpen(true);
  };

  const handleOpenEdit = (cat: CategoryItem) => {
    setSelectedCategory(cat);
    setForm({
      category_name: cat.category_name,
      description: cat.description || "",
    });
    setEditOpen(true);
  };

  const handleOpenDelete = (cat: CategoryItem) => {
    setSelectedCategory(cat);
    setDeleteOpen(true);
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.category_name.trim()) return;

    setSaving(true);
    try {
      await createCategory(form);
      toast.success("เพิ่มประเภทนิยายสำเร็จ");
      setAddOpen(false);
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "เกิดข้อผิดพลาดในการเพิ่มข้อมูล");
    } finally {
      setSaving(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCategory || !form.category_name.trim()) return;

    setSaving(true);
    try {
      await updateCategory(selectedCategory.category_id, form);
      toast.success("แก้ไขข้อมูลหมวดหมู่สำเร็จ");
      setEditOpen(false);
      setSelectedCategory(null);
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "เกิดข้อผิดพลาดในการบันทึกข้อมูล");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedCategory) return;

    setExecuting(true);
    try {
      await deleteCategory(selectedCategory.category_id);
      toast.success("ลบประเภทนิยายสำเร็จ");
      setDeleteOpen(false);
      setSelectedCategory(null);
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "เกิดข้อผิดพลาดในการลบหมวดหมู่");
    } finally {
      setExecuting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-white">จัดการประเภทนิยาย</h1>
          <p className="text-xs text-white/35 mt-1">
            เพิ่ม แก้ไข และลบประเภท/หมวดหมู่หลักของนิยายในระบบ
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold rounded-xl bg-[#e09050] text-white hover:bg-[#c97c3a] transition-all cursor-pointer shadow-md"
        >
          <Plus className="h-4 w-4" />
          <span>เพิ่มประเภทใหม่</span>
        </button>
      </div>

      {/* Categories Table */}
      <div className="bg-[#171513]/60 border border-white/5 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-white/5 text-white/40 uppercase tracking-wider font-bold">
                <th className="py-4 px-5">ชื่อประเภทนิยาย</th>
                <th className="py-4 px-5">คำอธิบายรายละเอียด</th>
                <th className="py-4 px-5">จำนวนนิยายที่ผูกอยู่</th>
                <th className="py-4 px-5 text-right">เครื่องมือ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.03]">
              {categories.length > 0 ? (
                categories.map((cat) => (
                  <tr key={cat.category_id} className="hover:bg-white/[0.01] transition-colors">
                    <td className="py-4 px-5 font-bold text-white/90">
                      <div className="flex items-center gap-2">
                        <Tag className="h-3.5 w-3.5 text-accent" />
                        <span>{cat.category_name}</span>
                      </div>
                    </td>
                    <td className="py-4 px-5 text-white/60 font-medium">
                      {cat.description || "—"}
                    </td>
                    <td className="py-4 px-5 font-bold text-white/40">
                      {(cat.novel_count || 0).toLocaleString("th-TH")} เรื่อง
                    </td>
                    <td className="py-4 px-5 text-right space-x-1.5">
                      <button
                        onClick={() => handleOpenEdit(cat)}
                        className="p-1.5 rounded-lg border border-white/5 bg-white/5 text-white/60 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
                        title="แก้ไขประเภท"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleOpenDelete(cat)}
                        className="p-1.5 rounded-lg border border-red-500/15 bg-red-500/5 text-red-400 hover:bg-red-500/10 transition-all cursor-pointer"
                        title="ลบประเภท"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-white/35 font-medium">
                    ไม่พบหมวดหมู่ประเภทนิยายในระบบ
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── Modal: Add Category ─── */}
      {addOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs" onClick={() => setAddOpen(false)} />
          <div className="relative w-full max-w-md bg-[#171513] border border-white/5 rounded-2xl shadow-2xl p-6 overflow-hidden animate-fadeIn">
            <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-5">
              <h3 className="text-sm font-bold text-white/80">เพิ่มประเภทนิยายใหม่</h3>
              <button onClick={() => setAddOpen(false)} className="text-white/40 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-white/45 uppercase tracking-widest mb-1.5">
                  ชื่อประเภทนิยาย (ต้องไม่ซ้ำกัน)
                </label>
                <input
                  type="text"
                  value={form.category_name}
                  onChange={(e) => setForm({ ...form, category_name: e.target.value })}
                  placeholder="เช่น แฟนตาซี, รักโรแมนติก"
                  required
                  className="w-full bg-[#1c1917] border border-white/5 text-white/80 text-sm font-medium rounded-xl px-4 py-3 focus:outline-none focus:ring-1 focus:ring-accent/50 transition-colors"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-white/45 uppercase tracking-widest mb-1.5">
                  คำอธิบายหมวดหมู่
                </label>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="คำอธิบายสั้นๆ เกี่ยวกับหมวดหมู่นี้..."
                  className="w-full bg-[#1c1917] border border-white/5 text-white/80 text-sm font-medium rounded-xl px-4 py-3 focus:outline-none focus:ring-1 focus:ring-accent/50 transition-colors resize-none"
                />
              </div>
              <div className="flex justify-end gap-3 pt-3 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setAddOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-white/5 hover:bg-white/5 text-xs font-bold text-white/60 hover:text-white transition-all cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 text-xs font-bold rounded-xl bg-[#e09050] text-white hover:bg-[#c97c3a] disabled:opacity-40 cursor-pointer transition-all"
                >
                  {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  เพิ่มหมวดหมู่
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── Modal: Edit Category ─── */}
      {editOpen && selectedCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs" onClick={() => setEditOpen(false)} />
          <div className="relative w-full max-w-md bg-[#171513] border border-white/5 rounded-2xl shadow-2xl p-6 overflow-hidden animate-fadeIn">
            <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-5">
              <h3 className="text-sm font-bold text-white/80">แก้ไขประเภทนิยาย</h3>
              <button onClick={() => setEditOpen(false)} className="text-white/40 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-white/45 uppercase tracking-widest mb-1.5">
                  ชื่อประเภทนิยาย
                </label>
                <input
                  type="text"
                  value={form.category_name}
                  onChange={(e) => setForm({ ...form, category_name: e.target.value })}
                  placeholder="เช่น แฟนตาซี, รักโรแมนติก"
                  required
                  className="w-full bg-[#1c1917] border border-white/5 text-white/80 text-sm font-medium rounded-xl px-4 py-3 focus:outline-none focus:ring-1 focus:ring-accent/50 transition-colors"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-white/45 uppercase tracking-widest mb-1.5">
                  คำอธิบายหมวดหมู่
                </label>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="คำอธิบายสั้นๆ..."
                  className="w-full bg-[#1c1917] border border-white/5 text-white/80 text-sm font-medium rounded-xl px-4 py-3 focus:outline-none focus:ring-1 focus:ring-accent/50 transition-colors resize-none"
                />
              </div>
              <div className="flex justify-end gap-3 pt-3 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setEditOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-white/5 hover:bg-white/5 text-xs font-bold text-white/60 hover:text-white transition-all cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 text-xs font-bold rounded-xl bg-[#e09050] text-white hover:bg-[#c97c3a] disabled:opacity-40 cursor-pointer transition-all"
                >
                  {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  บันทึกการเปลี่ยนแปลง
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── Modal: Confirm Delete Category ─── */}
      {deleteOpen && selectedCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs" onClick={() => setDeleteOpen(false)} />
          <div className="relative w-full max-w-sm bg-[#171513] border border-white/5 rounded-2xl shadow-2xl p-6 overflow-hidden animate-fadeIn">
            <h3 className="text-sm font-bold text-white mb-3">ยืนยันการลบประเภทนิยาย?</h3>
            <p className="text-xs text-white/50 leading-relaxed mb-5">
              คุณต้องการลบหมวดหมู่ประเภทนิยาย "{selectedCategory.category_name}" ใช่หรือไม่?
              การกระทำนี้จะลบถาวรและไม่สามารถย้อนคืนได้
            </p>
            <div className="flex justify-end gap-3 pt-3 border-t border-white/5">
              <button
                type="button"
                onClick={() => setDeleteOpen(false)}
                className="px-4 py-2.5 rounded-xl border border-white/5 hover:bg-white/5 text-xs font-bold text-white/60 hover:text-white transition-all cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={executing}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 text-xs font-bold rounded-xl bg-red-500 hover:bg-red-600 text-white disabled:opacity-40 cursor-pointer transition-all"
              >
                {executing && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                ยืนยันการลบ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
