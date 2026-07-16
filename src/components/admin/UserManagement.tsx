"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Filter,
  Ban,
  CheckCircle,
  Trash2,
  Edit2,
  ChevronLeft,
  ChevronRight,
  UserX,
  X,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { updateUser, toggleUserSuspension, softDeleteUser } from "@/app/admin/actions";

interface UserItem {
  user_id: number;
  username: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  profile_image: string | null;
  status: string;
  created_at: string;
}

interface UserManagementProps {
  users: UserItem[];
  totalPages: number;
  currentPage: number;
  searchQuery: string;
  statusFilter: string;
}

export default function UserManagement({
  users,
  totalPages,
  currentPage,
  searchQuery,
  statusFilter,
}: UserManagementProps) {
  const router = useRouter();

  // Search/Filter states
  const [search, setSearch] = useState(searchQuery);
  const [status, setStatus] = useState(statusFilter);

  // Modal / Drawer states
  const [selectedUser, setSelectedUser] = useState<UserItem | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({ full_name: "", phone: "", email: "" });
  const [saving, setSaving] = useState(false);

  // Confirm states
  const [confirmAction, setConfirmAction] = useState<{
    type: "suspend" | "delete";
    user: UserItem;
  } | null>(null);
  const [actionReason, setActionReason] = useState("");
  const [executing, setExecuting] = useState(false);

  // Trigger search/filter redirect
  const applyFilters = (newSearch = search, newStatus = status, page = 1) => {
    const params = new URLSearchParams();
    if (newSearch.trim()) params.set("search", newSearch.trim());
    if (newStatus && newStatus !== "all") params.set("status", newStatus);
    if (page > 1) params.set("page", page.toString());
    router.push(`/admin/users?${params.toString()}`);
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") applyFilters();
  };

  const handleOpenEdit = (user: UserItem) => {
    setSelectedUser(user);
    setEditForm({
      full_name: user.full_name || "",
      phone: user.phone || "",
      email: user.email || "",
    });
    setEditOpen(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    setSaving(true);
    try {
      await updateUser(selectedUser.user_id, editForm);
      toast.success("บันทึกการแก้ไขข้อมูลสำเร็จ");
      setEditOpen(false);
      setSelectedUser(null);
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
      if (confirmAction.type === "suspend") {
        await toggleUserSuspension(confirmAction.user.user_id, confirmAction.user.status);
        const actionText = confirmAction.user.status === "suspended" ? "ยกเลิกการระงับ" : "ระงับบัญชี";
        
        // Log suspension reason in console for audit trail if any
        if (actionReason && confirmAction.user.status !== "suspended") {
          console.log(`User ${confirmAction.user.username} suspended. Reason: ${actionReason}`);
        }

        toast.success(`${actionText}ผู้ใช้งานสำเร็จ`);
      } else {
        await softDeleteUser(confirmAction.user.user_id);
        toast.success("ลบผู้ใช้งาน (Soft Delete) สำเร็จ");
      }
      setConfirmAction(null);
      setActionReason("");
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "การกระทำล้มเหลว");
    } finally {
      setExecuting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-white">จัดการผู้ใช้</h1>
          <p className="text-xs text-white/35 mt-1">
            ค้นหา ตรวจสอบข้อมูล แก้ไขโปรไฟล์ และระงับสิทธิ์บัญชีผู้อ่านนิยาย
          </p>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 bg-[#171513]/60 border border-white/5 p-4 rounded-2xl">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/25" />
          <input
            type="text"
            placeholder="ค้นหาด้วย Username หรือ Email... (กด Enter)"
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
            <option value="active">ปกติ (Active)</option>
            <option value="suspended">ระงับใช้งาน (Suspended)</option>
            <option value="deleted">ลบแล้ว (Deleted)</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-[#171513]/60 border border-white/5 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-white/5 text-white/40 uppercase tracking-wider font-bold">
                <th className="py-4 px-5">ผู้ใช้</th>
                <th className="py-4 px-5">อีเมล</th>
                <th className="py-4 px-5">เบอร์โทร</th>
                <th className="py-4 px-5">สถานะ</th>
                <th className="py-4 px-5">วันที่สมัคร</th>
                <th className="py-4 px-5 text-right">เครื่องมือ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.03]">
              {users.length > 0 ? (
                users.map((user) => {
                  const displayName = user.full_name || user.username;
                  const initials = displayName.slice(0, 2).toUpperCase();

                  return (
                    <tr key={user.user_id} className="hover:bg-white/[0.01] transition-colors">
                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full overflow-hidden border border-white/10 bg-[#1c1917] shrink-0 flex items-center justify-center font-bold text-white/40">
                            {user.profile_image ? (
                              <img
                                src={user.profile_image}
                                alt={user.username}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <span>{initials}</span>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-white/90 truncate">{displayName}</p>
                            <p className="text-[10px] text-white/35 truncate mt-0.5">@{user.username}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-5 text-white/60 font-medium">
                        {user.email || "-"}
                      </td>
                      <td className="py-3.5 px-5 text-white/60 font-medium">
                        {user.phone || "-"}
                      </td>
                      <td className="py-3.5 px-5">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold ${
                            user.status === "active"
                              ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                              : user.status === "suspended"
                              ? "bg-red-500/10 text-red-500 border border-red-500/20"
                              : "bg-white/5 text-white/35 border border-white/10"
                          }`}
                        >
                          {user.status === "active"
                            ? "ปกติ"
                            : user.status === "suspended"
                            ? "ระงับใช้งาน"
                            : "ลบแล้ว"}
                        </span>
                      </td>
                      <td className="py-3.5 px-5 text-white/40 font-bold">
                        {new Date(user.created_at).toLocaleDateString("th-TH", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </td>
                      <td className="py-3.5 px-5 text-right space-x-1.5 shrink-0">
                        {user.status !== "deleted" && (
                          <>
                            <button
                              onClick={() => handleOpenEdit(user)}
                              className="p-1.5 rounded-lg border border-white/5 bg-white/5 text-white/60 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
                              title="แก้ไขข้อมูล"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() =>
                                setConfirmAction({ type: "suspend", user })
                              }
                              className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                                user.status === "suspended"
                                  ? "border-emerald-500/15 bg-emerald-500/5 text-emerald-400 hover:bg-emerald-500/10"
                                  : "border-red-500/15 bg-red-500/5 text-red-400 hover:bg-red-500/10"
                              }`}
                              title={user.status === "suspended" ? "ยกเลิกระงับใช้งาน" : "ระงับใช้งาน"}
                            >
                              {user.status === "suspended" ? (
                                <CheckCircle className="h-3.5 w-3.5" />
                              ) : (
                                <Ban className="h-3.5 w-3.5" />
                              )}
                            </button>
                            <button
                              onClick={() => setConfirmAction({ type: "delete", user })}
                              className="p-1.5 rounded-lg border border-red-500/15 bg-red-500/5 text-red-400 hover:bg-red-500/10 transition-all cursor-pointer"
                              title="ลบผู้ใช้ (Soft delete)"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-white/35 font-medium">
                    ไม่พบรายชื่อผู้ใช้งาน
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
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

      {/* ─── Drawer/Modal: Edit User ─── */}
      {editOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs" onClick={() => setEditOpen(false)} />
          <div className="relative w-full max-w-md bg-[#171513] border border-white/5 rounded-2xl shadow-2xl p-6 overflow-hidden animate-fadeIn">
            <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-5">
              <h3 className="text-sm font-bold text-white/80">แก้ไขข้อมูลผู้ใช้</h3>
              <button onClick={() => setEditOpen(false)} className="text-white/40 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1.5">
                  ชื่อผู้ใช้ (Username)
                </label>
                <input
                  type="text"
                  value={selectedUser.username}
                  disabled
                  className="w-full bg-[#1c1917]/50 border border-white/5 text-white/30 text-sm font-medium rounded-xl px-4 py-3 cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-white/45 uppercase tracking-widest mb-1.5">
                  ชื่อ-นามสกุล
                </label>
                <input
                  type="text"
                  value={editForm.full_name}
                  onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                  placeholder="ชื่อ-นามสกุล"
                  className="w-full bg-[#1c1917] border border-white/5 text-white/80 text-sm font-medium rounded-xl px-4 py-3 focus:outline-none focus:ring-1 focus:ring-accent/50 transition-colors"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-white/45 uppercase tracking-widest mb-1.5">
                  อีเมล
                </label>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  placeholder="your@email.com"
                  className="w-full bg-[#1c1917] border border-white/5 text-white/80 text-sm font-medium rounded-xl px-4 py-3 focus:outline-none focus:ring-1 focus:ring-accent/50 transition-colors"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-white/45 uppercase tracking-widest mb-1.5">
                  เบอร์โทรศัพท์
                </label>
                <input
                  type="tel"
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  placeholder="0812345678"
                  className="w-full bg-[#1c1917] border border-white/5 text-white/80 text-sm font-medium rounded-xl px-4 py-3 focus:outline-none focus:ring-1 focus:ring-accent/50 transition-colors"
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

      {/* ─── Modal: Confirm Actions (Suspend/Delete) ─── */}
      {confirmAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs" onClick={() => setConfirmAction(null)} />
          <div className="relative w-full max-w-md bg-[#171513] border border-white/5 rounded-2xl shadow-2xl p-6 overflow-hidden animate-fadeIn">
            <div className="flex items-center gap-3 text-red-400 border-b border-white/5 pb-4 mb-4">
              <UserX className="h-5 w-5 shrink-0" />
              <h3 className="text-sm font-bold text-white">
                {confirmAction.type === "suspend"
                  ? confirmAction.user.status === "suspended"
                    ? "ยืนยันยกเลิกการระงับบัญชี?"
                    : "ยืนยันการระงับบัญชีผู้ใช้?"
                  : "ยืนยันการลบผู้ใช้ (Soft Delete)?"}
              </h3>
            </div>
            <p className="text-xs text-white/50 leading-relaxed mb-5">
              {confirmAction.type === "suspend"
                ? confirmAction.user.status === "suspended"
                  ? `คุณต้องการยกเลิกการระงับบัญชีผู้ใช้งาน @${confirmAction.user.username} เพื่อให้กลับมาใช้งานระบบได้ปกติใช่หรือไม่?`
                  : `คุณต้องการระงับบัญชีผู้ใช้งาน @${confirmAction.user.username} ใช่หรือไม่? ผู้ใช้รายนี้จะไม่สามารถล็อคอินเข้าสู่ระบบได้ชั่วคราว`
                : `คุณแน่ใจว่าต้องการลบข้อมูลบัญชีของ @${confirmAction.user.username}? ระบบจะทำการทำเครื่องหมายว่าถูกลบ (Soft Delete) โดยข้อมูลชั้นบันทึกการอ่านหรือความเห็นจะยังคงถูกเก็บรักษาไว้`}
            </p>

            {/* Suspended Reason Field */}
            {confirmAction.type === "suspend" && confirmAction.user.status !== "suspended" && (
              <div className="mb-5">
                <label className="block text-[10px] font-bold text-white/45 uppercase tracking-widest mb-1.5">
                  ระบุเหตุผลในการระงับบัญชี
                </label>
                <textarea
                  rows={3}
                  value={actionReason}
                  onChange={(e) => setActionReason(e.target.value)}
                  placeholder="ระบุเหตุผลที่จะบันทึก..."
                  className="w-full bg-[#1c1917] border border-white/5 text-white/80 text-sm font-medium rounded-xl px-4 py-3 focus:outline-none focus:ring-1 focus:ring-accent/50 transition-colors resize-none placeholder-white/20"
                />
              </div>
            )}

            <div className="flex justify-end gap-3 pt-3 border-t border-white/5">
              <button
                type="button"
                onClick={() => {
                  setConfirmAction(null);
                  setActionReason("");
                }}
                className="px-4 py-2.5 rounded-xl border border-white/5 hover:bg-white/5 text-xs font-bold text-white/60 hover:text-white transition-all cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleRunConfirmAction}
                disabled={executing}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 text-xs font-bold rounded-xl bg-red-500 hover:bg-red-600 text-white disabled:opacity-40 cursor-pointer transition-all"
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
