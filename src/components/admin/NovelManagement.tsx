"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Filter,
  Ban,
  CheckCircle,
  Edit2,
  ChevronLeft,
  ChevronRight,
  X,
  Loader2,
  BookOpen,
} from "lucide-react";
import { toast } from "sonner";
import { updateNovelAdmin, toggleNovelSuspension } from "@/app/admin/actions";

interface CategoryItem {
  category_id: number;
  category_name: string;
}

interface NovelItem {
  novel_id: number;
  novel_name: string;
  author_id: number;
  category_id: number;
  synopsis: string | null;
  cover_image: string | null;
  status: string;
  view_count: number;
  created_at: string;
  updated_at: string;
  author: { pen_name: string } | null;
  category: { category_name: string } | null;
}

interface NovelManagementProps {
  novels: NovelItem[];
  categories: CategoryItem[];
  totalPages: number;
  currentPage: number;
  searchQuery: string;
  statusFilter: string;
  categoryFilter: string;
}

export default function NovelManagement({
  novels,
  categories,
  totalPages,
  currentPage,
  searchQuery,
  statusFilter,
  categoryFilter,
}: NovelManagementProps) {
  const router = useRouter();

  // Search/Filter states
  const [search, setSearch] = useState(searchQuery);
  const [status, setStatus] = useState(statusFilter);
  const [category, setCategory] = useState(categoryFilter);

  // Edit Modal states
  const [selectedNovel, setSelectedNovel] = useState<NovelItem | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({ novel_name: "", category_id: 0, synopsis: "" });
  const [saving, setSaving] = useState(false);

  // Confirm states
  const [confirmAction, setConfirmAction] = useState<{
    novel: NovelItem;
  } | null>(null);
  const [executing, setExecuting] = useState(false);

  const applyFilters = (newSearch = search, newStatus = status, newCategory = category, page = 1) => {
    const params = new URLSearchParams();
    if (newSearch.trim()) params.set("search", newSearch.trim());
    if (newStatus && newStatus !== "all") params.set("status", newStatus);
    if (newCategory && newCategory !== "all") params.set("category", newCategory);
    if (page > 1) params.set("page", page.toString());
    router.push(`/admin/novels?${params.toString()}`);
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") applyFilters();
  };

  const handleOpenEdit = (novel: NovelItem) => {
    setSelectedNovel(novel);
    setEditForm({
      novel_name: novel.novel_name,
      category_id: novel.category_id,
      synopsis: novel.synopsis || "",
    });
    setEditOpen(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedNovel) return;

    setSaving(true);
    try {
      await updateNovelAdmin(selectedNovel.novel_id, {
        novel_name: editForm.novel_name,
        category_id: Number(editForm.category_id),
        synopsis: editForm.synopsis,
      });
      toast.success("บันทึกการแก้ไขนิยายสำเร็จ");
      setEditOpen(false);
      setSelectedNovel(null);
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "เกิดข้อผิดพลาดในการบันทึกข้อมูล");
    } finally {
      setSaving(false);
    }
  };

  const handleRunConfirmAction = async () => {
    if (!confirmAction) return;

    setExecuting(true);
    try {
      // Toggle suspension, fallback originalStatus to ongoing if not present
      await toggleNovelSuspension(
        confirmAction.novel.novel_id,
        confirmAction.novel.status,
        "ongoing"
      );
      const actionText = confirmAction.novel.status === "suspended" ? "ยกเลิกการระงับ" : "ระงับการเผยแพร่";
      toast.success(`${actionText}นิยายสำเร็จ`);
      setConfirmAction(null);
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "การทำรายการล้มเหลว");
    } finally {
      setExecuting(false);
    }
  };

  const placeholderGradients = [
    "from-violet-500 to-purple-700",
    "from-rose-400 to-pink-600",
    "from-sky-400 to-blue-600",
    "from-emerald-400 to-teal-600",
  ];

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div>
        <h1 className="text-xl sm:text-2xl font-extrabold text-white">จัดการนิยาย</h1>
        <p className="text-xs text-white/35 mt-1">
          ตรวจสอบความถูกต้องของเนื้อหานิยาย เปลี่ยนหมวดหมู่ และระงับการเผยแพร่ที่ขัดต่อกฎระเบียบ
        </p>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-col lg:flex-row gap-3 bg-[#171513]/60 border border-white/5 p-4 rounded-2xl">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/25" />
          <input
            type="text"
            placeholder="ค้นหาด้วย ชื่อนิยาย หรือ ชื่อผู้แต่ง... (กด Enter)"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            className="w-full bg-[#1c1917] border border-white/5 text-white/80 text-sm font-medium rounded-xl pl-10 pr-4 py-2.5 focus:outline-none focus:ring-1 focus:ring-accent/50 focus:border-accent/30 transition-all placeholder-white/20"
          />
        </div>
        <div className="flex flex-wrap gap-2.5">
          <div className="relative w-full sm:w-44">
            <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/25" />
            <select
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                applyFilters(search, status, e.target.value, 1);
              }}
              className="w-full bg-[#1c1917] border border-white/5 text-white/80 text-sm font-medium rounded-xl pl-10 pr-4 py-2.5 focus:outline-none focus:ring-1 focus:ring-accent/50 cursor-pointer appearance-none"
            >
              <option value="all">ทุกประเภทนิยาย</option>
              {categories.map((cat) => (
                <option key={cat.category_id} value={cat.category_id.toString()}>
                  {cat.category_name}
                </option>
              ))}
            </select>
          </div>
          <div className="relative w-full sm:w-44">
            <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/25" />
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                applyFilters(search, e.target.value, category, 1);
              }}
              className="w-full bg-[#1c1917] border border-white/5 text-white/80 text-sm font-medium rounded-xl pl-10 pr-4 py-2.5 focus:outline-none focus:ring-1 focus:ring-accent/50 cursor-pointer appearance-none"
            >
              <option value="all">สถานะทั้งหมด</option>
              <option value="ongoing">กำลังเขียน</option>
              <option value="completed">จบแล้ว</option>
              <option value="draft">แบบร่าง</option>
              <option value="suspended">ระงับการเผยแพร่</option>
            </select>
          </div>
        </div>
      </div>

      {/* Novels Table */}
      <div className="bg-[#171513]/60 border border-white/5 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-white/5 text-white/40 uppercase tracking-wider font-bold">
                <th className="py-4 px-5">ปก / ชื่อนิยาย</th>
                <th className="py-4 px-5">ผู้แต่ง</th>
                <th className="py-4 px-5">หมวดหมู่</th>
                <th className="py-4 px-5">สถานะ</th>
                <th className="py-4 px-5">ยอดวิว</th>
                <th className="py-4 px-5">อัปเดตล่าสุด</th>
                <th className="py-4 px-5 text-right">เครื่องมือ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.03]">
              {novels.length > 0 ? (
                novels.map((novel) => {
                  const gradient = placeholderGradients[novel.novel_id % placeholderGradients.length];

                  return (
                    <tr key={novel.novel_id} className="hover:bg-white/[0.01] transition-colors">
                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-3">
                          {/* Book cover thumbnail */}
                          <div className="w-9 h-13 rounded-lg overflow-hidden border border-white/10 bg-[#1c1917] shrink-0 relative flex-none shadow-md">
                            {novel.cover_image ? (
                              <img
                                src={novel.cover_image}
                                alt={novel.novel_name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className={`w-full h-full bg-gradient-to-br ${gradient} flex items-center justify-center p-0.5 text-center`}>
                                <span className="text-white/80 font-bold text-[7px] leading-tight line-clamp-2">
                                  {novel.novel_name}
                                </span>
                              </div>
                            )}
                          </div>
                          <span className="font-bold text-white/90 truncate max-w-[150px] sm:max-w-[200px]" title={novel.novel_name}>
                            {novel.novel_name}
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-5 text-white/80 font-bold">
                        {novel.author?.pen_name || "-"}
                      </td>
                      <td className="py-3.5 px-5 text-white/60">
                        {novel.category?.category_name || "-"}
                      </td>
                      <td className="py-3.5 px-5">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold ${
                            novel.status === "ongoing"
                              ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                              : novel.status === "completed"
                              ? "bg-blue-500/10 text-blue-500 border border-blue-500/20"
                              : novel.status === "suspended"
                              ? "bg-red-500/10 text-red-500 border border-red-500/20"
                              : "bg-white/5 text-white/35 border border-white/10"
                          }`}
                        >
                          {novel.status === "ongoing"
                            ? "กำลังเขียน"
                            : novel.status === "completed"
                            ? "จบแล้ว"
                            : novel.status === "suspended"
                            ? "ระงับเผยแพร่"
                            : "แบบร่าง"}
                        </span>
                      </td>
                      <td className="py-3.5 px-5 text-white/60 font-medium">
                        {novel.view_count.toLocaleString("th-TH")} วิว
                      </td>
                      <td className="py-3.5 px-5 text-white/40 font-bold">
                        {new Date(novel.updated_at).toLocaleDateString("th-TH", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </td>
                      <td className="py-3.5 px-5 text-right space-x-1.5 shrink-0">
                        <button
                          onClick={() => handleOpenEdit(novel)}
                          className="p-1.5 rounded-lg border border-white/5 bg-white/5 text-white/60 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
                          title="แก้ไขข้อมูลนิยาย"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => setConfirmAction({ novel })}
                          className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                            novel.status === "suspended"
                              ? "border-emerald-500/15 bg-emerald-500/5 text-emerald-400 hover:bg-emerald-500/10"
                              : "border-red-500/15 bg-red-500/5 text-red-400 hover:bg-red-500/10"
                          }`}
                          title={novel.status === "suspended" ? "ยกเลิกระงับการเผยแพร่" : "ระงับการเผยแพร่"}
                        >
                          {novel.status === "suspended" ? (
                            <CheckCircle className="h-3.5 w-3.5" />
                          ) : (
                            <Ban className="h-3.5 w-3.5" />
                          )}
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-white/35 font-medium">
                    ไม่พบข้อมูลนิยายในระบบ
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-white/5 text-xs text-white/40">
            <span>
              หน้า {currentPage} จากทั้งหมด {totalPages} หน้า
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={currentPage <= 1}
                onClick={() => applyFilters(search, status, category, currentPage - 1)}
                className="p-2 rounded-xl bg-white/5 border border-white/5 text-white/60 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                disabled={currentPage >= totalPages}
                onClick={() => applyFilters(search, status, category, currentPage + 1)}
                className="p-2 rounded-xl bg-white/5 border border-white/5 text-white/60 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ─── Modal: Edit Novel Admin ─── */}
      {editOpen && selectedNovel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs" onClick={() => setEditOpen(false)} />
          <div className="relative w-full max-w-md bg-[#171513] border border-white/5 rounded-2xl shadow-2xl p-6 overflow-hidden animate-fadeIn">
            <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-5">
              <h3 className="text-sm font-bold text-white/80">แก้ไขข้อมูลนิยาย</h3>
              <button onClick={() => setEditOpen(false)} className="text-white/40 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-white/45 uppercase tracking-widest mb-1.5">
                  ชื่อนิยาย (Novel Title)
                </label>
                <input
                  type="text"
                  value={editForm.novel_name}
                  onChange={(e) => setEditForm({ ...editForm, novel_name: e.target.value })}
                  placeholder="ชื่อนิยาย"
                  required
                  className="w-full bg-[#1c1917] border border-white/5 text-white/80 text-sm font-medium rounded-xl px-4 py-3 focus:outline-none focus:ring-1 focus:ring-accent/50 transition-colors"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-white/45 uppercase tracking-widest mb-1.5">
                  ประเภทนิยาย (Category)
                </label>
                <select
                  value={editForm.category_id}
                  onChange={(e) => setEditForm({ ...editForm, category_id: Number(e.target.value) })}
                  className="w-full bg-[#1c1917] border border-white/5 text-white/85 text-sm font-medium rounded-xl px-4 py-3 focus:outline-none focus:ring-1 focus:ring-accent/50 cursor-pointer"
                >
                  {categories.map((cat) => (
                    <option key={cat.category_id} value={cat.category_id}>
                      {cat.category_name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-white/45 uppercase tracking-widest mb-1.5">
                  เรื่องย่อ (Synopsis)
                </label>
                <textarea
                  rows={4}
                  value={editForm.synopsis}
                  onChange={(e) => setEditForm({ ...editForm, synopsis: e.target.value })}
                  placeholder="เรื่องย่อ..."
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

      {/* ─── Confirm Action Modal ─── */}
      {confirmAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs" onClick={() => setConfirmAction(null)} />
          <div className="relative w-full max-w-sm bg-[#171513] border border-white/5 rounded-2xl shadow-2xl p-6 overflow-hidden animate-fadeIn">
            <h3 className="text-sm font-bold text-white mb-3">
              {confirmAction.novel.status === "suspended" ? "ยกเลิกการระงับนิยาย?" : "ยืนยันการระงับเผยแพร่นิยาย?"}
            </h3>
            <p className="text-xs text-white/50 leading-relaxed mb-5">
              {confirmAction.novel.status === "suspended"
                ? `คุณต้องการยกเลิกการระงับและเผยแพร่นิยาย "${confirmAction.novel.novel_name}" อีกครั้งใช่หรือไม่?`
                : `คุณต้องการระงับการเผยแพร่นิยายเรื่อง "${confirmAction.novel.novel_name}" ใช่หรือไม่? หลังจากระงับ นิยายจะไม่ถูกแสดงผลที่หน้าเว็บบอร์ดหลักทันที`}
            </p>
            <div className="flex justify-end gap-3 pt-3 border-t border-white/5">
              <button
                type="button"
                onClick={() => setConfirmAction(null)}
                className="px-4 py-2.5 rounded-xl border border-white/5 hover:bg-white/5 text-xs font-bold text-white/60 hover:text-white transition-all cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleRunConfirmAction}
                disabled={executing}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 text-xs font-bold rounded-xl bg-accent text-white hover:bg-accent-hover disabled:opacity-40 cursor-pointer transition-all"
              >
                {executing && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                ยืนยันการทำรายการ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
