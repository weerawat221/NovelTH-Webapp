"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Users,
  PenLine,
  BookOpen,
  Tags,
  BarChart3,
  LogOut,
  LayoutDashboard,
  Menu,
  X,
  Shield,
  Loader2,
  Globe,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

interface SidebarLinkProps {
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  active: boolean;
  onClick?: () => void;
}

function SidebarLink({ href, icon, children, active, onClick }: SidebarLinkProps) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all ${
        active
          ? "bg-[#e09050] text-white shadow-lg shadow-accent/15"
          : "text-white/55 hover:text-white hover:bg-white/5"
      }`}
    >
      <div className={`shrink-0 ${active ? "text-white" : "text-white/40 group-hover:text-white"}`}>
        {icon}
      </div>
      <span>{children}</span>
    </Link>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [adminProfile, setAdminProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAdmin() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          router.push("/login");
          return;
        }

        // Fetch admin details
        const { data: adm, error } = await supabase
          .from("admin")
          .select("username, full_name")
          .eq("auth_user_id", user.id)
          .maybeSingle();

        if (error || !adm) {
          toast.error("ไม่มีสิทธิ์เข้าถึงหน้าผู้ดูแลระบบ");
          router.push("/");
          return;
        }

        setAdminProfile({
          username: adm.username,
          full_name: adm.full_name || adm.username,
          email: user.email,
        });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    loadAdmin();
  }, [supabase, router]);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast.success("ออกจากระบบสำเร็จ");
      router.push("/");
      router.refresh();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f0d0b] text-foreground flex flex-col items-center justify-center gap-3">
        <Loader2 className="h-8 w-8 text-[#e09050] animate-spin" />
        <span className="text-xs font-bold text-white/40 tracking-widest uppercase">
          กำลังยืนยันสิทธิ์ผู้ดูแลระบบ...
        </span>
      </div>
    );
  }

  const menuItems = [
    { href: "/admin", icon: <LayoutDashboard className="h-4.5 w-4.5" />, label: "ภาพรวม (Overview)" },
    { href: "/admin/users", icon: <Users className="h-4.5 w-4.5" />, label: "จัดการผู้ใช้" },
    { href: "/admin/authors", icon: <PenLine className="h-4.5 w-4.5" />, label: "จัดการผู้แต่ง" },
    { href: "/admin/novels", icon: <BookOpen className="h-4.5 w-4.5" />, label: "จัดการนิยาย" },
    { href: "/admin/categories", icon: <Tags className="h-4.5 w-4.5" />, label: "จัดการประเภทนิยาย" },
    { href: "/admin/reports", icon: <BarChart3 className="h-4.5 w-4.5" />, label: "รายงานสถิติ" },
  ];

  return (
    <div className="min-h-screen bg-[#0f0d0b] flex flex-col md:flex-row text-white/90">
      {/* ─── Mobile Top Header ─── */}
      <div className="md:hidden h-16 bg-[#171513] border-b border-white/5 flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-2 text-accent font-extrabold">
          <Shield className="h-5 w-5" />
          <span className="text-sm tracking-wider uppercase">NovelTH Admin</span>
        </div>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 rounded-lg bg-white/5 text-white/70 hover:text-white"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* ─── Sidebar Navigation ─── */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-[#171513] border-r border-white/5 flex flex-col justify-between transition-transform duration-300 md:translate-x-0 md:static ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div>
          {/* Logo Section */}
          <div className="h-20 flex items-center gap-2.5 px-6 border-b border-white/5">
            <div className="p-2 rounded-xl bg-accent/15 border border-accent/25 text-accent">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-sm font-extrabold tracking-wider text-white">NovelTH</h1>
              <p className="text-[10px] font-bold text-accent/80 uppercase tracking-widest mt-0.5">
                Admin Control
              </p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1.5">
            {menuItems.map((item) => (
              <SidebarLink
                key={item.href}
                href={item.href}
                icon={item.icon}
                active={pathname === item.href}
                onClick={() => setMobileOpen(false)}
              >
                {item.label}
              </SidebarLink>
            ))}
            <div className="h-px bg-white/5 my-3" />
            <Link
              href="/"
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold text-white/55 hover:text-white hover:bg-white/5 transition-all"
            >
              <Globe className="h-4.5 w-4.5 text-white/40" />
              <span>กลับหน้าเว็บหลัก</span>
            </Link>
          </nav>
        </div>

        {/* Footer Admin Profile Card */}
        {adminProfile && (
          <div className="p-4 border-t border-white/5 bg-black/10">
            <div className="flex items-center gap-3 px-2 py-1.5 mb-3">
              <div className="h-8 w-8 rounded-full bg-accent/20 border border-accent/30 flex items-center justify-center text-accent text-xs font-bold">
                {adminProfile.username.slice(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-extrabold text-white truncate">
                  {adminProfile.full_name}
                </p>
                <p className="text-[10px] text-white/35 truncate mt-0.5">
                  @{adminProfile.username}
                </p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 text-xs font-bold rounded-xl border border-red-500/10 bg-red-500/5 text-red-400 hover:bg-red-500/10 transition-all cursor-pointer"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>ออกจากระบบ</span>
            </button>
          </div>
        )}
      </aside>

      {/* Backdrop for mobile */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* ─── Main Content Area ─── */}
      <main className="flex-1 overflow-x-hidden p-6 sm:p-8 bg-[#0f0d0b]">
        {children}
      </main>
    </div>
  );
}
