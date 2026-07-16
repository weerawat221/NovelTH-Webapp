import Link from "next/link";
import {
  Users,
  PenLine,
  BookOpen,
  Eye,
  ArrowUpRight,
  UserX,
  Plus,
} from "lucide-react";
import { createAdminClient } from "@/lib/supabase/server";
import OverviewCharts from "@/components/admin/OverviewCharts";

export const dynamic = "force-dynamic";

export default async function AdminOverviewPage() {
  const supabase = await createAdminClient();

  // 1. Fetch counts
  const [
    { count: usersCount },
    { count: authorsCount },
    { count: novelsCount },
  ] = await Promise.all([
    supabase.from("users").select("*", { count: "exact", head: true }),
    supabase.from("author").select("*", { count: "exact", head: true }),
    supabase.from("novel").select("*", { count: "exact", head: true }),
  ]);

  // Today's start timestamp in local time
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const { count: todayVisits } = await supabase
    .from("visit_log")
    .select("*", { count: "exact", head: true })
    .gte("visit_date", todayStart.toISOString());

  // 2. Fetch last 7 days visit data for line chart
  const last7DaysData: { date: string; count: number }[] = [];
  const promises = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const start = new Date(d);
    start.setHours(0, 0, 0, 0);
    const end = new Date(d);
    end.setHours(23, 59, 59, 999);

    promises.push(
      supabase
        .from("visit_log")
        .select("*", { count: "exact", head: true })
        .gte("visit_date", start.toISOString())
        .lte("visit_date", end.toISOString())
        .then(({ count }) => {
          last7DaysData.push({
            date: start.toISOString(),
            count: count || 0,
          });
        })
    );
  }
  await Promise.all(promises);
  // Sort by date ascending
  last7DaysData.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // 3. Fetch Recent Activities
  // New Authors
  const { data: newAuthors } = await supabase
    .from("author")
    .select("pen_name, username, status, created_at")
    .order("created_at", { ascending: false })
    .limit(5);

  // New Novels
  const { data: newNovels } = await supabase
    .from("novel")
    .select(`
      novel_id,
      novel_name,
      created_at,
      author:author_id (pen_name)
    `)
    .order("created_at", { ascending: false })
    .limit(5);

  // Recently Suspended/Deleted Users
  const { data: recentSuspended } = await supabase
    .from("users")
    .select("username, full_name, status, created_at")
    .in("status", ["suspended", "deleted"])
    .order("created_at", { ascending: false })
    .limit(5);

  const stats = [
    {
      label: "จำนวนผู้ใช้ทั้งหมด",
      value: (usersCount || 0).toLocaleString("th-TH"),
      icon: <Users className="h-5 w-5 text-blue-400" />,
      color: "from-blue-500/10 to-indigo-500/5 border-blue-500/10",
      href: "/admin/users",
    },
    {
      label: "จำนวนผู้แต่งทั้งหมด",
      value: (authorsCount || 0).toLocaleString("th-TH"),
      icon: <PenLine className="h-5 w-5 text-amber-400" />,
      color: "from-amber-500/10 to-orange-500/5 border-amber-500/10",
      href: "/admin/authors",
    },
    {
      label: "จำนวนนิยายทั้งหมด",
      value: (novelsCount || 0).toLocaleString("th-TH"),
      icon: <BookOpen className="h-5 w-5 text-emerald-400" />,
      color: "from-emerald-500/10 to-teal-500/5 border-emerald-500/10",
      href: "/admin/novels",
    },
    {
      label: "ยอดเข้าชมวันนี้",
      value: (todayVisits || 0).toLocaleString("th-TH"),
      icon: <Eye className="h-5 w-5 text-accent" />,
      color: "from-accent/15 to-accent/5 border-accent/20",
      href: "/admin/reports",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-extrabold text-white">ภาพรวมระบบ</h1>
        <p className="text-xs text-white/35 mt-1">ยินดีต้อนรับสู่ระบบควบคุมและตรวจสอบหลังบ้านของ NovelTH</p>
      </div>

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4.5">
        {stats.map((stat, i) => (
          <Link
            key={i}
            href={stat.href}
            className={`group block bg-gradient-to-br ${stat.color} border rounded-2xl p-5 hover:scale-[1.01] hover:border-white/10 transition-all duration-300`}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 rounded-xl bg-white/5 border border-white/5">
                {stat.icon}
              </div>
              <ArrowUpRight className="h-4 w-4 text-white/20 group-hover:text-white/60 transition-colors" />
            </div>
            <p className="text-xs font-bold text-white/40 uppercase tracking-wider">
              {stat.label}
            </p>
            <p className="text-2xl font-extrabold text-white mt-1.5 leading-none">
              {stat.value}
            </p>
          </Link>
        ))}
      </div>

      {/* Chart & Summary Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <OverviewCharts data={last7DaysData} />
        </div>

        {/* Categories Shortcut / Quick Links */}
        <div className="bg-[#171513]/60 border border-white/5 rounded-2xl p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold text-white/40 uppercase tracking-widest mb-4">
              เมนูลัดผู้ดูแลระบบ
            </h3>
            <div className="space-y-2">
              <Link
                href="/admin/categories"
                className="flex items-center justify-between p-3.5 rounded-xl border border-white/5 hover:bg-white/5 transition-all text-xs font-bold text-white/70"
              >
                <span>จัดการหมวดหมู่ประเภทนิยาย</span>
                <Plus className="h-3.5 w-3.5 text-accent" />
              </Link>
              <Link
                href="/admin/reports"
                className="flex items-center justify-between p-3.5 rounded-xl border border-white/5 hover:bg-white/5 transition-all text-xs font-bold text-white/70"
              >
                <span>ดูรายงานยอดวิวและผู้เข้าใช้</span>
                <ArrowUpRight className="h-3.5 w-3.5 text-accent" />
              </Link>
            </div>
          </div>

          <div className="pt-6 border-t border-white/5 mt-6 text-[10px] text-white/25 leading-relaxed">
            ผู้ดูแลระบบสามารถตรวจสอบการอนุมัตินักเขียนรายใหม่, ระงับนิยายหรือบัญชีผู้ใช้ที่ละเมิดนโยบายของระบบได้จากแท็บจัดการด้านซ้าย
          </div>
        </div>
      </div>

      {/* Activities Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* New Authors */}
        <div className="bg-[#171513]/60 border border-white/5 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4.5 border-b border-white/5 pb-3">
            <h3 className="text-xs font-bold text-white/80 uppercase tracking-wider flex items-center gap-2">
              <PenLine className="h-3.5 w-3.5 text-amber-400" />
              <span>ผู้แต่งสมัครใหม่</span>
            </h3>
            <Link href="/admin/authors" className="text-[10px] font-bold text-accent hover:underline">
              ดูทั้งหมด
            </Link>
          </div>
          <div className="space-y-3">
            {newAuthors && newAuthors.length > 0 ? (
              newAuthors.map((author, i) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <div className="min-w-0">
                    <p className="font-bold text-white/90 truncate">{author.pen_name}</p>
                    <p className="text-[10px] text-white/35 truncate mt-0.5">@{author.username}</p>
                  </div>
                  <span
                    className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                      author.status === "pending"
                        ? "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                        : "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                    }`}
                  >
                    {author.status === "pending" ? "รออนุมัติ" : "ใช้งานอยู่"}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-xs text-white/35 py-4 text-center">ไม่มีข้อมูล</p>
            )}
          </div>
        </div>

        {/* New Novels */}
        <div className="bg-[#171513]/60 border border-white/5 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4.5 border-b border-white/5 pb-3">
            <h3 className="text-xs font-bold text-white/80 uppercase tracking-wider flex items-center gap-2">
              <BookOpen className="h-3.5 w-3.5 text-emerald-400" />
              <span>นิยายเผยแพร่ใหม่</span>
            </h3>
            <Link href="/admin/novels" className="text-[10px] font-bold text-accent hover:underline">
              ดูทั้งหมด
            </Link>
          </div>
          <div className="space-y-3">
            {newNovels && newNovels.length > 0 ? (
              newNovels.map((novel, i) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <div className="min-w-0">
                    <p className="font-bold text-white/90 truncate">{novel.novel_name}</p>
                    <p className="text-[10px] text-white/35 truncate mt-0.5">
                      โดย {(novel.author as any)?.pen_name || "ไม่ระบุ"}
                    </p>
                  </div>
                  <span className="text-[10px] text-white/35 font-bold shrink-0">
                    {new Date(novel.created_at).toLocaleDateString("th-TH", {
                      day: "numeric",
                      month: "short",
                    })}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-xs text-white/35 py-4 text-center">ไม่มีข้อมูล</p>
            )}
          </div>
        </div>

        {/* Suspended Users */}
        <div className="bg-[#171513]/60 border border-white/5 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4.5 border-b border-white/5 pb-3">
            <h3 className="text-xs font-bold text-white/80 uppercase tracking-wider flex items-center gap-2">
              <UserX className="h-3.5 w-3.5 text-red-400" />
              <span>บัญชีที่ถูกระงับล่าสุด</span>
            </h3>
            <Link href="/admin/users" className="text-[10px] font-bold text-accent hover:underline">
              ดูทั้งหมด
            </Link>
          </div>
          <div className="space-y-3">
            {recentSuspended && recentSuspended.length > 0 ? (
              recentSuspended.map((user, i) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <div className="min-w-0">
                    <p className="font-bold text-white/90 truncate">
                      {user.full_name || user.username}
                    </p>
                    <p className="text-[10px] text-white/35 truncate mt-0.5">@{user.username}</p>
                  </div>
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-red-500/10 text-red-500 border border-red-500/20 shrink-0">
                    {user.status === "deleted" ? "ลบแล้ว" : "ระงับใช้งาน"}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-xs text-white/35 py-4 text-center">ไม่มีบัญชีถูกระงับ</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
