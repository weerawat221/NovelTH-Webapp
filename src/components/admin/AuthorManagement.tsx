"use client";

import { useState, useEffect } from "react";
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
  UserCheck,
  BookOpen,
} from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { updateAuthor, approveAuthor, toggleAuthorSuspension } from "@/app/admin/actions";

interface AuthorItem {
  author_id: number;
  username: string;
  pen_name: string;
  full_name: string | null;
  email: string | null;
  bio: string | null;
  profile_image: string | null;
  status: string;
  created_at: string;
}

interface AuthorManagementProps {
  authors: AuthorItem[];
  totalPages: number;
  currentPage: number;
  searchQuery: string;
  statusFilter: string;
}

export default function AuthorManagement({
  authors,
  totalPages,
  currentPage,
  searchQuery,
  statusFilter,
}: AuthorManagementProps) {
  const router = useRouter();
  const supabase = createClient();

  // Search/Filter states
  const [search, setSearch] = useState(searchQuery);
  const [status, setStatus] = useState(statusFilter);

  // Modal states
  const [selectedAuthor, setSelectedAuthor] = useState<AuthorItem | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({ pen_name: "", full_name: "", email: "", bio: "" });
  const [saving, setSaving] = useState(false);

  // Author's Novels state (loaded on demand)
  const [novels, setNovels] = useState<any[]>([]);
  const [loadingNovels, setLoadingNovels] = useState(false);

  // Action confirm states
  const [confirmAction, setConfirmAction] = useState<{
    type: "approve" | "suspend";
    author: AuthorItem;
  } | null>(null);
  const [executing, setExecuting] = useState(false);

  // Load novels when detail modal opens
  useEffect(() => {
    if (detailOpen && selectedAuthor) {
      setLoadingNovels(true);
      supabase
        .from("novel")
        .select("novel_id, novel_name, status, view_count")
        .eq("author_id", selectedAuthor.author_id)
        .then(({ data }) => {
          setNovels(data || []);
          setLoadingNovels(false);
        });
    } else {
      setNovels([]);
    }
  }, [detailOpen, selectedAuthor, supabase]);

  const applyFilters = (newSearch = search, newStatus = status, page = 1) => {
    const params = new URLSearchParams();
    if (newSearch.trim()) params.set("search", newSearch.trim());
    if (newStatus && newStatus !== "all") params.set("status", newStatus);
    if (page > 1) params.set("page", page.toString());
    router.push(`/admin/authors?${params.toString()}`);
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") applyFilters();
  };

  const handleOpenEdit = (author: AuthorItem) => {
    setSelectedAuthor(author);
    setEditForm({
      pen_name: author.pen_name || "",
      full_name: author.full_name || "",
      email: author.email || "",
      bio: author.bio || "",
    });
    setEditOpen(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAuthor) return;

    setSaving(true);
    try {
      await updateAuthor(selectedAuthor.author_id, editForm);
      toast.success("บันทึกการแก้ไขข้อมูลผู้แต่งสำเร็จ");
      setEditOpen(false);
      setSelectedAuthor(null);
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
      if (confirmAction.type === "approve") {
        await approveAuthor(confirmAction.author.author_id);
        toast.success("อนุมัติบัญชีนักเขียนเรียบร้อยแล้ว");
      } else {
        await toggleAuthorSuspension(confirmAction.author.author_id, confirmAction.author.status);
        const actionText = confirmAction.author.status === "suspended" ? "ยกเลิกการระงับ" : "ระงับใช้งาน";
        toast.success(`${actionText}บัญชีนักเขียนสำเร็จ`);
      }
      setConfirmAction(null);
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "การทำรายการล้มเหลว");
    } finally {
      setExecuting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div>
        <h1 className="text-xl sm:text-2xl font-extrabold text-white">จัดการนักเขียน / ผู้แต่ง</h1>
        <p className="text-xs text-white/35 mt-1">
          อนุมัตินักเขียนสมัครใหม่ ตรวจสอบประวัติ และระงับใช้งานบัญชีที่ผิดนโยบาย
        </p>
      </div>

      {/* Quick Filter Tabs for pending status */}
      <div className="flex gap-2 border-b border-white/5 pb-2">
        <button
          onClick={() => {
            setStatus("all");
            applyFilters(search, "all", 1);
          }}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
            status === "all"
              ? "bg-[#e09050] text-white"
              : "text-white/40 hover:text-white hover:bg-white/5"
          }`}
        >
          ทั้งหมด
        </button>
        <button
          onClick={() => {
            setStatus("pending");
            applyFilters(search, "pending", 1);
          }}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer relative ${
            status === "pending"
              ? "bg-amber-500 text-black"
              : "text-amber-500 bg-amber-500/5 hover:bg-amber-500/10 border border-amber-500/10"
          }`}
        >
          รออนุมัติ (Pending)
        </button>
        <button
          onClick={() => {
            setStatus("active");
            applyFilters(search, "active", 1);
          }}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
            status === "active"
              ? "bg-emerald-500/80 text-white"
              : "text-white/40 hover:text-white hover:bg-white/5"
          }`}
        >
          อนุมัติแล้ว (Active)
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 bg-[#171513]/60 border border-white/5 p-4 rounded-2xl">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/25" />
          <input
            type="text"
            placeholder="ค้นหาผู้แต่งด้วย นามปากกา, Username หรือ Email... (กด Enter)"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            className="w-full bg-[#1c1917] border border-white/5 text-white/80 text-sm font-medium rounded-xl pl-10 pr-4 py-2.5 focus:outline-none focus:ring-1 focus:ring-accent/50 focus:border-accent/30 transition-all placeholder-white/20"
          />
        </div>
        <div className="relative w-full sm:w-48">
          <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/25" />
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              applyFilters(search, e.target.value, 1);
            }}
            className="w-full bg-[#1c1917] border border-white/5 text-white/80 text-sm font-medium rounded-xl pl-10 pr-4 py-2.5 focus:outline-none focus:ring-1 focus:ring-accent/50 focus:border-accent/30 transition-all cursor-pointer appearance-none"
          >
            <option value="all">สถานะทั้งหมด</option>
            <option value="pending">รออนุมัติ (Pending)</option>
            <option value="active">ปกติ (Active)</option>
            <option value="suspended">ระงับการใช้งาน (Suspended)</option>
          </select>
        </div>
      </div>

      {/* Authors Table */}
      <div className="bg-[#171513]/60 border border-white/5 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-white/5 text-white/40 uppercase tracking-wider font-bold">
                <th className="py-4 px-5">นักเขียน</th>
                <th className="py-4 px-5">นามปากกา</th>
                <th className="py-4 px-5">อีเมล</th>
                <th className="py-4 px-5">สถานะ</th>
                <th className="py-4 px-5">วันที่สมัคร</th>
                <th className="py-4 px-5 text-right">เครื่องมือ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.03]">
              {authors.length > 0 ? (
                authors.map((author) => {
                  const displayName = author.full_name || author.username;
                  const initials = author.pen_name.slice(0, 2).toUpperCase();

                  return (
                    <tr key={author.author_id} className="hover:bg-white/[0.01] transition-colors">
                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full overflow-hidden border border-white/10 bg-[#1c1917] shrink-0 flex items-center justify-center font-bold text-white/40">
                            {author.profile_image ? (
                              <img
                                src={author.profile_image}
                                alt={author.username}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <span>{initials}</span>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-white/90 truncate">{displayName}</p>
                            <p className="text-[10px] text-white/35 truncate mt-0.5">@{author.username}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-5 text-white/80 font-bold">
                        {author.pen_name}
                      </td>
                      <td className="py-3.5 px-5 text-white/60 font-medium">
                        {author.email || "-"}
                      </td>
                      <td className="py-3.5 px-5">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold ${
                            author.status === "active"
                              ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                              : author.status === "pending"
                              ? "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                              : "bg-red-500/10 text-red-500 border border-red-500/20"
                          }`}
                        >
                          {author.status === "active"
                            ? "ปกติ"
                            : author.status === "pending"
                            ? "รออนุมัติ"
                            : "ระงับใช้งาน"}
                        </span>
                      </td>
                      <td className="py-3.5 px-5 text-white/40 font-bold">
                        {new Date(author.created_at).toLocaleDateString("th-TH", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </td>
                      <td className="py-3.5 px-5 text-right space-x-1.5 shrink-0">
                        <button
                          onClick={() => {
                            setSelectedAuthor(author);
                            setDetailOpen(true);
                          }}
                          className="px-2.5 py-1.5 rounded-lg border border-white/5 bg-white/5 text-white/60 hover:text-white hover:bg-white/10 text-[10px] font-bold transition-all cursor-pointer"
                        >
                          ดูนิยาย
                        </button>
                        <button
                          onClick={() => handleOpenEdit(author)}
                          className="p-1.5 rounded-lg border border-white/5 bg-white/5 text-white/60 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
                          title="แก้ไขข้อมูล"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        {author.status === "pending" ? (
                          <button
                            onClick={() =>
                              setConfirmAction({ type: "approve", author })
                            }
                            className="p-1.5 rounded-lg border border-emerald-500/15 bg-emerald-500/5 text-emerald-400 hover:bg-emerald-500/10 transition-all cursor-pointer animate-pulse"
                            title="อนุมัติการสมัคร"
                          >
                            <UserCheck className="h-3.5 w-3.5" />
                          </button>
                        ) : (
                          <button
                            onClick={() =>
                              setConfirmAction({ type: "suspend", author })
                            }
                            className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                              author.status === "suspended"
                                ? "border-emerald-500/15 bg-emerald-500/5 text-emerald-400 hover:bg-emerald-500/10"
                                : "border-red-500/15 bg-red-500/5 text-red-400 hover:bg-red-500/10"
                            }`}
                            title={author.status === "suspended" ? "ยกเลิกระงับใช้งาน" : "ระงับใช้งาน"}
                          >
                            {author.status === "suspended" ? (
                              <CheckCircle className="h-3.5 w-3.5" />
                            ) : (
                              <Ban className="h-3.5 w-3.5" />
                            )}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-white/35 font-medium">
                    ไม่พบรายชื่อผู้แต่ง/นักเขียน
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
                onClick={() => applyFilters(search, status, currentPage - 1)}
                className="p-2 rounded-xl bg-white/5 border border-white/5 text-white/60 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                disabled={currentPage >= totalPages}
                onClick={() => applyFilters(search, status, currentPage + 1)}
                className="p-2 rounded-xl bg-white/5 border border-white/5 text-white/60 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ─── Modal: Author Details & Novels ─── */}
      {detailOpen && selectedAuthor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs" onClick={() => setDetailOpen(false)} />
          <div className="relative w-full max-w-lg bg-[#171513] border border-white/5 rounded-2xl shadow-2xl p-6 overflow-hidden animate-fadeIn">
            <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-5">
              <h3 className="text-sm font-bold text-white/80">ข้อมูลผู้แต่ง & ผลงาน</h3>
              <button onClick={() => setDetailOpen(false)} className="text-white/40 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Profile Info Summary */}
            <div className="flex gap-4 items-start mb-6">
              <div className="h-14 w-14 rounded-full overflow-hidden border border-white/10 bg-[#1c1917] shrink-0 flex items-center justify-center font-bold text-xl text-white/40">
                {selectedAuthor.profile_image ? (
                  <img src={selectedAuthor.profile_image} alt="" className="h-full w-full object-cover" />
                ) : (
                  <span>{selectedAuthor.pen_name.slice(0, 2).toUpperCase()}</span>
                )}
              </div>
              <div className="min-w-0">
                <h4 className="text-base font-bold text-white leading-tight">{selectedAuthor.pen_name}</h4>
                <p className="text-xs text-white/40 mt-1">
                  @{selectedAuthor.username} · {selectedAuthor.email}
                </p>
                {selectedAuthor.bio && (
                  <p className="text-xs text-white/60 mt-2 bg-white/5 border border-white/5 p-2.5 rounded-lg whitespace-pre-wrap leading-relaxed">
                    {selectedAuthor.bio}
                  </p>
                )}
              </div>
            </div>

            {/* Novels List */}
            <div>
              <h5 className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                <BookOpen className="h-3.5 w-3.5" />
                <span>รายชื่อนิยาย ({novels.length})</span>
              </h5>
              <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
                {loadingNovels ? (
                  <div className="flex justify-center py-6">
                    <Loader2 className="h-5 w-5 text-accent animate-spin" />
                  </div>
                ) : novels.length > 0 ? (
                  novels.map((novel) => (
                    <div
                      key={novel.novel_id}
                      className="flex items-center justify-between p-3 rounded-xl border border-white/5 bg-white/[0.01]"
                    >
                      <span className="text-xs font-bold text-white/90 truncate mr-3">
                        {novel.novel_name}
                      </span>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[10px] text-white/40">
                          {novel.view_count.toLocaleString()} วิว
                        </span>
                        <span
                          className={`px-1.5 py-0.5 rounded text-[8px] font-bold ${
                            novel.status === "ongoing"
                              ? "bg-emerald-500/10 text-emerald-400"
                              : novel.status === "completed"
                              ? "bg-blue-500/10 text-blue-400"
                              : "bg-white/5 text-white/35"
                          }`}
                        >
                          {novel.status === "ongoing"
                            ? "กำลังเขียน"
                            : novel.status === "completed"
                            ? "จบแล้ว"
                            : "แบบร่าง"}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-white/35 py-6 text-center">ไม่มีผลงานที่เผยแพร่</p>
                )}
              </div>
            </div>

            <div className="flex justify-end pt-5 border-t border-white/5 mt-5">
              <button
                onClick={() => setDetailOpen(false)}
                className="px-5 py-2 rounded-xl bg-white/5 border border-white/5 text-xs font-bold text-white/60 hover:text-white cursor-pointer transition-all"
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Modal: Edit Author Profile ─── */}
      {editOpen && selectedAuthor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs" onClick={() => setEditOpen(false)} />
          <div className="relative w-full max-w-md bg-[#171513] border border-white/5 rounded-2xl shadow-2xl p-6 overflow-hidden animate-fadeIn">
            <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-5">
              <h3 className="text-sm font-bold text-white/80">แก้ไขข้อมูลผู้แต่ง</h3>
              <button onClick={() => setEditOpen(false)} className="text-white/40 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-white/45 uppercase tracking-widest mb-1.5">
                  นามปากกา
                </label>
                <input
                  type="text"
                  value={editForm.pen_name}
                  onChange={(e) => setEditForm({ ...editForm, pen_name: e.target.value })}
                  placeholder="นามปากกา"
                  required
                  className="w-full bg-[#1c1917] border border-white/5 text-white/80 text-sm font-medium rounded-xl px-4 py-3 focus:outline-none focus:ring-1 focus:ring-accent/50 transition-colors"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-white/45 uppercase tracking-widest mb-1.5">
                  ชื่อ-นามสกุลจริง
                </label>
                <input
                  type="text"
                  value={editForm.full_name}
                  onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                  placeholder="ชื่อจริง (ถ้ามี)"
                  className="w-full bg-[#1c1917] border border-white/5 text-white/80 text-sm font-medium rounded-xl px-4 py-3 focus:outline-none focus:ring-1 focus:ring-accent/50 transition-colors"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-white/45 uppercase tracking-widest mb-1.5">
                  อีเมลผู้ติดต่อ
                </label>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  placeholder="email@contact.com"
                  className="w-full bg-[#1c1917] border border-white/5 text-white/80 text-sm font-medium rounded-xl px-4 py-3 focus:outline-none focus:ring-1 focus:ring-accent/50 transition-colors"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-white/45 uppercase tracking-widest mb-1.5">
                  ประวัติแนะนำตัว
                </label>
                <textarea
                  rows={3}
                  value={editForm.bio}
                  onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                  placeholder="แนะนำประวัติสั้นๆ..."
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
              {confirmAction.type === "approve" ? "ยืนยันการอนุมัตินักเขียน?" : "ยืนยันการเปลี่ยนสถานะระงับใช้งาน?"}
            </h3>
            <p className="text-xs text-white/50 leading-relaxed mb-5">
              {confirmAction.type === "approve"
                ? `คุณต้องการอนุมัติสิทธิ์นักเขียนให้กับคุณ ${confirmAction.author.pen_name} (@${confirmAction.author.username}) ใช่หรือไม่? หลังจากอนุมัติ ผู้ใช้จะสามารถเขียนและเผยแพร่นิยายได้`
                : confirmAction.author.status === "suspended"
                ? `คุณต้องการยกเลิกการระงับบัญชีของ ${confirmAction.author.pen_name} เพื่อให้กลับมาใช้งานได้ปกติใช่หรือไม่?`
                : `คุณต้องการระงับบัญชีของ ${confirmAction.author.pen_name} ชั่วคราวใช่หรือไม่? บัญชีนี้จะไม่สามารถเข้าสู่ระบบหรือแต่งนิยายต่อได้`}
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
