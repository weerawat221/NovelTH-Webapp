"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import {
  Calendar,
  Download,
  BarChart3,
  TrendingUp,
  PieChart,
  Crown,
  BookOpen,
  Eye,
  Loader2,
  ChevronRight,
  ChevronLeft,
  X,
} from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { toast } from "sonner";
import {
  getReportTotalVisits,
  getReportVisitsByDay,
  getReportVisitsByMonth,
  getReportVisitsByYear,
  getReportVisitsByCategory,
  getReportVisitsByAuthor,
  getAuthorNovelsBreakdown,
} from "@/app/admin/actions";

// Helpers
function exportToCSV(filename: string, headers: string[], rows: (string | number)[][]) {
  const csvContent =
    "data:text/csv;charset=utf-8,\uFEFF" +
    [
      headers.join(","),
      ...rows.map((row) =>
        row
          .map((val) => {
            const strVal = String(val).replace(/"/g, '""');
            return `"${strVal}"`;
          })
          .join(",")
      ),
    ].join("\n");

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function fillMissingDates(data: any[], startStr: string, endStr: string) {
  const filled = [];
  const start = new Date(startStr);
  const end = new Date(endStr);

  const dataMap = new Map();
  if (Array.isArray(data)) {
    data.forEach((item) => {
      const dateKey = new Date(item.visit_day).toISOString().split("T")[0];
      dataMap.set(dateKey, item);
    });
  }

  const current = new Date(start);
  while (current <= end) {
    const dateKey = current.toISOString().split("T")[0];
    if (dataMap.has(dateKey)) {
      filled.push(dataMap.get(dateKey));
    } else {
      filled.push({
        visit_day: dateKey,
        visit_count: 0,
        unique_count: 0,
      });
    }
    current.setDate(current.getDate() + 1);
  }

  return filled;
}

function fillMissingMonths(data: any[]) {
  const filled = [];
  const dataMap = new Map();
  if (Array.isArray(data)) {
    data.forEach((item) => {
      dataMap.set(Number(item.visit_month), Number(item.visit_count));
    });
  }
  for (let m = 1; m <= 12; m++) {
    filled.push({
      visit_month: m,
      visit_count: dataMap.get(m) || 0,
    });
  }
  return filled;
}

const COLORS = ["#e09050", "#3b82f6", "#10b981", "#f59e0b", "#ec4899", "#8b5cf6"];

export default function ReportsClient() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const today = new Date();
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(today.getDate() - 30);

  const todayStr = today.toISOString().split("T")[0];
  const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split("T")[0];
  const currentMonthStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`; // e.g. "2026-07"

  // Local States for Filters (initialized from searchParams if available, or fallbacks)
  const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "overview");
  const [startDate, setStartDate] = useState(searchParams.get("start") || thirtyDaysAgoStr);
  const [endDate, setEndDate] = useState(searchParams.get("end") || todayStr);
  const [targetYear, setTargetYear] = useState(Number(searchParams.get("year")) || today.getFullYear());
  const [targetMonth, setTargetMonth] = useState(searchParams.get("month") || currentMonthStr);

  // Loading & Data States
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState<any>(null);

  // Author details modal state
  const [selectedAuthor, setSelectedAuthor] = useState<any>(null);
  const [authorNovels, setAuthorNovels] = useState<any[]>([]);
  const [loadingAuthorNovels, setLoadingAuthorNovels] = useState(false);

  // Helper to dynamically compile available years
  const availableYears = useMemo(() => {
    const years = [];
    const currentYr = new Date().getFullYear();
    const earliestYr = 2024;
    for (let y = currentYr; y >= earliestYr; y--) {
      years.push(y);
    }
    return years;
  }, []);

  // Update query params helper
  const updateQueryParams = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => {
      if (value === null) {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    });
    router.push(`${pathname}?${params.toString()}`);
  };

  // 1. Initial Mount Hook: If URL params are missing, replace URL with defaults immediately
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    let updated = false;

    if (!params.has("tab")) {
      params.set("tab", "overview");
      updated = true;
    }
    if (!params.has("start")) {
      params.set("start", thirtyDaysAgoStr);
      updated = true;
    }
    if (!params.has("end")) {
      params.set("end", todayStr);
      updated = true;
    }
    if (!params.has("year")) {
      params.set("year", String(new Date().getFullYear()));
      updated = true;
    }
    if (!params.has("month")) {
      params.set("month", currentMonthStr);
      updated = true;
    }

    if (updated) {
      router.replace(`${window.location.pathname}?${params.toString()}`);
    }
  }, []);

  // 2. Synchronize URL changes to local states (handles manual URL entry or Back/Forward browser navigation)
  useEffect(() => {
    const tab = searchParams.get("tab");
    const start = searchParams.get("start");
    const end = searchParams.get("end");
    const year = searchParams.get("year");
    const month = searchParams.get("month");

    if (tab && tab !== activeTab) setActiveTab(tab);
    if (start && start !== startDate) setStartDate(start);
    if (end && end !== endDate) setEndDate(end);
    if (year && Number(year) !== targetYear) setTargetYear(Number(year));
    if (month && month !== targetMonth) setTargetMonth(month);
  }, [searchParams]);

  useEffect(() => {
    async function loadReport() {
      setLoading(true);
      try {
        // Convert to local YYYY-MM-DD HH:mm:ss format
        const startStr = `${startDate} 00:00:00`;
        const endStr = `${endDate} 23:59:59.999`;

        if (activeTab === "overview") {
          const data = await getReportTotalVisits(startStr, endStr);
          setReportData(data);
        } else if (activeTab === "daily") {
          const data = await getReportVisitsByDay(startStr, endStr);
          const filledData = fillMissingDates(data, startDate, endDate);
          setReportData(filledData);
        } else if (activeTab === "monthly") {
          const [yrStr, moStr] = targetMonth.split("-");
          const yr = parseInt(yrStr, 10);
          const mo = parseInt(moStr, 10) - 1;

          // Start & End of month in YYYY-MM-DD format
          const lastDay = new Date(yr, mo + 1, 0).getDate();
          const startOfMonthStr = `${yr}-${String(mo + 1).padStart(2, "0")}-01 00:00:00`;
          const endOfMonthStr = `${yr}-${String(mo + 1).padStart(2, "0")}-${String(lastDay).padStart(2, "0")} 23:59:59.999`;

          const startOfPrevMonth = new Date(yr, mo - 1, 1);
          const lastDayPrev = new Date(yr, mo, 0).getDate();
          const startOfPrevMonthStr = `${startOfPrevMonth.getFullYear()}-${String(startOfPrevMonth.getMonth() + 1).padStart(2, "0")}-01 00:00:00`;
          const endOfPrevMonthStr = `${startOfPrevMonth.getFullYear()}-${String(startOfPrevMonth.getMonth() + 1).padStart(2, "0")}-${String(lastDayPrev).padStart(2, "0")} 23:59:59.999`;

          const dailyData = await getReportVisitsByDay(startOfMonthStr, endOfMonthStr);
          const filledDaily = fillMissingDates(dailyData, `${yr}-${String(mo + 1).padStart(2, "0")}-01`, `${yr}-${String(mo + 1).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`);
          
          const currentTotal = await getReportTotalVisits(startOfMonthStr, endOfMonthStr);
          const prevTotal = await getReportTotalVisits(startOfPrevMonthStr, endOfPrevMonthStr);

          setReportData({
            daily: filledDaily,
            total_visits: currentTotal.total_visits || 0,
            prev_total_visits: prevTotal.total_visits || 0,
          });
        } else if (activeTab === "yearly") {
          const monthlyData = await getReportVisitsByMonth(targetYear);
          const filledMonthly = fillMissingMonths(monthlyData);
          const totalVisits = filledMonthly.reduce((sum: number, item: any) => sum + Number(item.visit_count), 0);
          setReportData({
            monthly: filledMonthly,
            total_visits: totalVisits,
          });
        } else if (activeTab === "category") {
          const data = await getReportVisitsByCategory(startStr, endStr);
          setReportData(data);
        } else if (activeTab === "author") {
          const data = await getReportVisitsByAuthor(startStr, endStr);
          setReportData(data);
        }
      } catch (err: any) {
        console.error(err);
        toast.error("ดึงข้อมูลรายงานไม่สำเร็จ");
      } finally {
        setLoading(false);
      }
    }

    loadReport();
  }, [activeTab, startDate, endDate, targetYear, targetMonth]);

  // Load selected author novels breakdown
  const handleOpenAuthorDetails = async (author: any) => {
    setSelectedAuthor(author);
    setLoadingAuthorNovels(true);

    try {
      const startStr = `${startDate} 00:00:00`;
      const endStr = `${endDate} 23:59:59.999`;

      const breakdown = await getAuthorNovelsBreakdown(author.author_id, startStr, endStr);
      setAuthorNovels(breakdown);
    } catch (err) {
      console.error(err);
      toast.error("ไม่สามารถดึงข้อมูลผลงานแยกย่อยได้");
    } finally {
      setLoadingAuthorNovels(false);
    }
  };

  // Export handlers
  const handleExportCSV = () => {
    if (!reportData) {
      toast.error("ไม่มีข้อมูลที่จะดาวน์โหลด");
      return;
    }

    if (activeTab === "daily") {
      if (!Array.isArray(reportData) || reportData.length === 0) {
        toast.error("ไม่มีข้อมูลที่จะดาวน์โหลด");
        return;
      }
      const headers = ["วันที่", "ยอดเข้าชมทั้งหมด", "จำนวนผู้ใช้ไม่ซ้ำ (Unique)"];
      const rows = reportData.map((d: any) => [
        new Date(d.visit_day).toLocaleDateString("th-TH"),
        d.visit_count,
        d.unique_count,
      ]);
      exportToCSV(`report_visits_daily_${startDate}_to_${endDate}`, headers, rows);
    } else if (activeTab === "monthly") {
      const dailyData = reportData.daily || [];
      if (dailyData.length === 0) {
        toast.error("ไม่มีข้อมูลที่จะดาวน์โหลด");
        return;
      }
      const headers = ["วันที่", "ยอดเข้าชมทั้งหมด", "จำนวนผู้ใช้ไม่ซ้ำ (Unique)"];
      const rows = dailyData.map((d: any) => [
        new Date(d.visit_day).toLocaleDateString("th-TH"),
        d.visit_count,
        d.unique_count,
      ]);
      exportToCSV(`report_visits_monthly_${targetMonth}`, headers, rows);
    } else if (activeTab === "yearly") {
      const monthlyData = reportData.monthly || [];
      if (monthlyData.length === 0) {
        toast.error("ไม่มีข้อมูลที่จะดาวน์โหลด");
        return;
      }
      const headers = ["เดือน", "ยอดเข้าชมทั้งหมด"];
      const rows = monthlyData.map((d: any) => [
        new Date(2020, d.visit_month - 1).toLocaleDateString("th-TH", { month: "long" }),
        d.visit_count,
      ]);
      exportToCSV(`report_visits_yearly_${targetYear}`, headers, rows);
    } else if (activeTab === "category") {
      if (!Array.isArray(reportData) || reportData.length === 0) {
        toast.error("ไม่มีข้อมูลที่จะดาวน์โหลด");
        return;
      }
      const headers = ["ประเภทนิยาย", "ยอดเข้าชมทั้งหมด"];
      const rows = reportData.map((d: any) => [d.category_name, d.visit_count]);
      exportToCSV(`report_visits_by_category_${startDate}_to_${endDate}`, headers, rows);
    } else if (activeTab === "author") {
      if (!Array.isArray(reportData) || reportData.length === 0) {
        toast.error("ไม่มีข้อมูลที่จะดาวน์โหลด");
        return;
      }
      const headers = ["อันดับ", "นามปากกา", "Username", "จำนวนนิยาย", "ยอดเข้าชมรวม"];
      const rows = reportData.map((d: any, idx: number) => [
        idx + 1,
        d.pen_name,
        d.username,
        d.novel_count,
        d.visit_count,
      ]);
      exportToCSV(`report_visits_by_author_${startDate}_to_${endDate}`, headers, rows);
    }
    toast.success("ส่งออกไฟล์ CSV สำเร็จ");
  };

  const tabs = [
    { id: "overview", label: "ภาพรวมยอดผู้เข้าชม", icon: <TrendingUp className="h-4 w-4" /> },
    { id: "daily", label: "รายงานรายวัน", icon: <BarChart3 className="h-4 w-4" /> },
    { id: "monthly", label: "รายงานรายเดือน", icon: <BarChart3 className="h-4 w-4" /> },
    { id: "yearly", label: "รายงานรายปี", icon: <BarChart3 className="h-4 w-4" /> },
    { id: "category", label: "สัดส่วนแยกตามประเภท", icon: <PieChart className="h-4 w-4" /> },
    { id: "author", label: "กระดานผู้นำนักเขียน (Leaderboard)", icon: <Crown className="h-4 w-4" /> },
  ];

  return (
    <div className="space-y-6">
      {/* Top Title & Date Range */}
      <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-5 bg-[#171513]/60 border border-white/5 p-6 rounded-2xl">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-white">รายงานวิเคราะห์ระบบ</h1>
          <p className="text-xs text-white/35 mt-1">
            ดูสถิติและรายงานเชิงลึกเกี่ยวกับการตอบรับและยอดเข้าใช้งานระบบของ NovelTH
          </p>
        </div>

        {/* Date Filters Form */}
        {activeTab !== "monthly" && activeTab !== "yearly" && (
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-white/20" />
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  const val = e.target.value;
                  setStartDate(val);
                  updateQueryParams({ start: val });
                }}
                className="bg-[#1c1917] border border-white/5 text-white/80 text-xs font-bold rounded-xl px-3 py-2 focus:outline-none transition-colors"
              />
            </div>
            <span className="text-white/20 text-xs">ถึง</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                const val = e.target.value;
                setEndDate(val);
                updateQueryParams({ end: val });
              }}
              className="bg-[#1c1917] border border-white/5 text-white/80 text-xs font-bold rounded-xl px-3 py-2 focus:outline-none transition-colors"
            />
          </div>
        )}

        {/* Monthly report target month selector */}
        {activeTab === "monthly" && (
          <div className="flex items-center gap-3">
            <span className="text-xs text-white/40 font-bold">เลือกเดือนเป้าหมาย:</span>
            <input
              type="month"
              value={targetMonth}
              onChange={(e) => {
                const val = e.target.value;
                setTargetMonth(val);
                updateQueryParams({ month: val });
              }}
              className="bg-[#1c1917] border border-white/5 text-white/80 text-xs font-bold rounded-xl px-3.5 py-2 focus:outline-none"
            />
          </div>
        )}

        {/* Yearly report target year selector */}
        {activeTab === "yearly" && (
          <div className="flex items-center gap-3">
            <span className="text-xs text-white/40 font-bold">เลือกปีเป้าหมาย:</span>
            <select
              value={targetYear}
              onChange={(e) => {
                const val = e.target.value;
                setTargetYear(Number(val));
                updateQueryParams({ year: val });
              }}
              className="bg-[#1c1917] border border-white/5 text-white/80 text-xs font-bold rounded-xl px-3.5 py-2 focus:outline-none"
            >
              {availableYears.map((yr) => (
                <option key={yr} value={yr}>
                  พ.ศ. {yr + 543}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Main Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Sub-Sidebar Menu */}
        <div className="flex flex-col gap-1 bg-[#171513]/60 border border-white/5 p-4 rounded-2xl h-fit">
          <p className="text-[10px] font-bold text-white/25 uppercase tracking-widest px-4 py-2">
            เลือกรายงานที่ต้องการ
          </p>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                updateQueryParams({ tab: tab.id });
                setReportData(null);
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === tab.id
                  ? "bg-[#e09050] text-white shadow-md shadow-accent/15"
                  : "text-white/55 hover:text-white hover:bg-white/5"
              }`}
            >
              <div className={activeTab === tab.id ? "text-white" : "text-white/30"}>
                {tab.icon}
              </div>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Right Dashboard Area */}
        <div className="lg:col-span-3 space-y-6">
          {loading ? (
            <div className="w-full h-80 bg-[#171513]/40 border border-white/5 rounded-2xl flex flex-col items-center justify-center gap-3">
              <Loader2 className="h-7 w-7 text-accent animate-spin" />
              <span className="text-xs font-bold text-white/25 uppercase tracking-wider">
                กำลังรวบรวมข้อมูลสถิติ...
              </span>
            </div>
          ) : (
            <>
              {/* ─── TAB 1: OVERVIEW ─── */}
              {activeTab === "overview" && reportData && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="bg-gradient-to-br from-accent/10 to-accent/5 border border-accent/15 rounded-2xl p-6 text-center">
                    <TrendingUp className="h-6 w-6 text-accent mx-auto mb-3" />
                    <p className="text-xs font-bold text-white/40 uppercase tracking-wider">
                      จำนวนผู้เข้าชมรวมสะสมในระบบ
                    </p>
                    <p className="text-4xl font-black text-white mt-2 leading-none">
                      {Number(reportData.total_visits || 0).toLocaleString("th-TH")}
                    </p>
                    <p className="text-[10px] text-white/20 mt-3">
                      อิงตามระยะเวลาเริ่มต้นถึงสิ้นสุดที่เลือก
                    </p>
                  </div>

                  <div className="bg-gradient-to-br from-blue-500/10 to-indigo-500/5 border border-blue-500/10 rounded-2xl p-6 text-center">
                    <Eye className="h-6 w-6 text-blue-400 mx-auto mb-3" />
                    <p className="text-xs font-bold text-white/40 uppercase tracking-wider">
                      จำนวนผู้เข้าชมไม่ซ้ำหน้า (Unique Users)
                    </p>
                    <p className="text-4xl font-black text-white mt-2 leading-none">
                      {Number(reportData.unique_visitors || 0).toLocaleString("th-TH")}
                    </p>
                    <p className="text-[10px] text-white/20 mt-3">
                      กรองด้วย ID ผู้ใช้ ลำดับ IP Address
                    </p>
                  </div>
                </div>
              )}

              {/* ─── TAB 2: DAILY VISITS ─── */}
              {activeTab === "daily" && reportData && (
                <div className="bg-[#171513]/60 border border-white/5 rounded-2xl p-6 space-y-6">
                  <div className="flex items-center justify-between border-b border-white/5 pb-4">
                    <h3 className="text-xs font-bold text-white/40 uppercase tracking-widest">
                      กราฟแนวโน้มเข้าใช้งานรายวัน
                    </h3>
                    <button
                      onClick={handleExportCSV}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border border-white/5 bg-white/5 text-white/60 hover:text-white text-[10px] font-bold cursor-pointer transition-all"
                    >
                      <Download className="h-3.5 w-3.5" />
                      <span>Export CSV</span>
                    </button>
                  </div>

                  {/* Daily Chart */}
                  <div className="w-full h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={reportData.map((d: any) => ({
                          name: new Date(d.visit_day).toLocaleDateString("th-TH", {
                            day: "numeric",
                            month: "short",
                          }),
                          เข้าชม: d.visit_count,
                          ไม่ซ้ำ: d.unique_count,
                        }))}
                        margin={{ top: 5, right: 10, left: -20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#2e2a27" />
                        <XAxis dataKey="name" stroke="#8c8278" fontSize={9} />
                        <YAxis stroke="#8c8278" fontSize={9} />
                        <Tooltip />
                        <Legend wrapperStyle={{ fontSize: "10px", marginTop: "10px" }} />
                        <Line
                          type="monotone"
                          dataKey="เข้าชม"
                          stroke="#e09050"
                          strokeWidth={2.5}
                        />
                        <Line type="monotone" dataKey="ไม่ซ้ำ" stroke="#3b82f6" strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Daily Table */}
                  <div className="border border-white/5 rounded-xl overflow-hidden mt-6">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-white/5 text-white/40 uppercase font-bold tracking-wider">
                          <th className="py-2.5 px-4">วันที่</th>
                          <th className="py-2.5 px-4">ยอดเข้าชมทั้งหมด</th>
                          <th className="py-2.5 px-4">ผู้เข้าชมไม่ซ้ำ</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {reportData.map((row: any, i: number) => (
                          <tr key={i} className="hover:bg-white/[0.01]">
                            <td className="py-2.5 px-4 font-bold text-white/80">
                              {new Date(row.visit_day).toLocaleDateString("th-TH", {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                              })}
                            </td>
                            <td className="py-2.5 px-4 text-white/70 font-medium">
                              {row.visit_count.toLocaleString()} ครั้ง
                            </td>
                            <td className="py-2.5 px-4 text-white/55">
                              {row.unique_count.toLocaleString()} คน
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* ─── TAB 3: MONTHLY VISITS ─── */}
              {activeTab === "monthly" && reportData && (
                <div className="space-y-6">
                  {/* Stat Card */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="bg-gradient-to-br from-accent/10 to-accent/5 border border-accent/15 rounded-2xl p-6 text-center flex flex-col justify-center">
                      <TrendingUp className="h-6 w-6 text-accent mx-auto mb-3" />
                      <p className="text-xs font-bold text-white/40 uppercase tracking-wider">
                        ยอดผู้เข้าชมรวมประจำเดือน
                      </p>
                      <p className="text-4xl font-black text-white mt-2 leading-none">
                        {Number(reportData.total_visits || 0).toLocaleString("th-TH")}
                      </p>
                      <p className="text-[10px] text-white/20 mt-3">
                        เดือน {new Date(targetMonth + "-02").toLocaleDateString("th-TH", { month: "long", year: "numeric" })}
                      </p>
                    </div>

                    <div className="bg-gradient-to-br from-blue-500/10 to-indigo-500/5 border border-blue-500/10 rounded-2xl p-6 text-center flex flex-col justify-center">
                      <p className="text-xs font-bold text-white/40 uppercase tracking-wider">
                        เปรียบเทียบกับเดือนก่อนหน้า
                      </p>
                      {reportData.prev_total_visits > 0 ? (
                        (() => {
                          const diff = reportData.total_visits - reportData.prev_total_visits;
                          const pct = (diff / reportData.prev_total_visits) * 100;
                          const isUp = diff >= 0;
                          return (
                            <div className="mt-2">
                              <p className={`text-2xl font-black ${isUp ? "text-emerald-450" : "text-red-400"}`}>
                                {isUp ? "+" : ""}{pct.toFixed(1)}%
                              </p>
                              <p className="text-[10px] text-white/20 mt-2">
                                เดือนก่อนหน้ามียอดเข้าชม {reportData.prev_total_visits.toLocaleString()} ครั้ง
                              </p>
                            </div>
                          );
                        })()
                      ) : (
                        <p className="text-sm font-bold text-white/30 mt-3">
                          ไม่มีข้อมูลเปรียบเทียบจากเดือนก่อนหน้า
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Daily graph */}
                  <div className="bg-[#171513]/60 border border-white/5 rounded-2xl p-6 space-y-6">
                    <div className="flex items-center justify-between border-b border-white/5 pb-4">
                      <h3 className="text-xs font-bold text-white/40 uppercase tracking-widest">
                        กราฟยอดเข้าชมรายวันภายในเดือน
                      </h3>
                      <button
                        onClick={handleExportCSV}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border border-white/5 bg-white/5 text-white/60 hover:text-white text-[10px] font-bold cursor-pointer transition-all"
                      >
                        <Download className="h-3.5 w-3.5" />
                        <span>Export CSV</span>
                      </button>
                    </div>

                    <div className="w-full h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={(reportData.daily || []).map((d: any) => ({
                            name: new Date(d.visit_day).getDate().toString(),
                            ยอดเข้าชม: d.visit_count,
                          }))}
                          margin={{ top: 5, right: 10, left: -20, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="#2e2a27" />
                          <XAxis dataKey="name" stroke="#8c8278" fontSize={9} />
                          <YAxis stroke="#8c8278" fontSize={9} />
                          <Tooltip formatter={(value) => [`${value} ครั้ง`, "ยอดเข้าชม"]} />
                          <Bar dataKey="ยอดเข้าชม" fill="#e09050" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              )}

              {/* ─── TAB 4: YEARLY VISITS ─── */}
              {activeTab === "yearly" && reportData && (
                <div className="space-y-6">
                  {/* Stat Card */}
                  <div className="bg-gradient-to-br from-accent/10 to-accent/5 border border-accent/15 rounded-2xl p-6 text-center max-w-sm mx-auto">
                    <TrendingUp className="h-6 w-6 text-accent mx-auto mb-3" />
                    <p className="text-xs font-bold text-white/40 uppercase tracking-wider">
                      ยอดผู้เข้าชมรวมสะสมรายปี
                    </p>
                    <p className="text-4xl font-black text-white mt-2 leading-none">
                      {Number(reportData.total_visits || 0).toLocaleString("th-TH")}
                    </p>
                    <p className="text-[10px] text-white/20 mt-3">
                      ปี พ.ศ. {targetYear + 543}
                    </p>
                  </div>

                  <div className="bg-[#171513]/60 border border-white/5 rounded-2xl p-6 space-y-6">
                    <div className="flex items-center justify-between border-b border-white/5 pb-4">
                      <h3 className="text-xs font-bold text-white/40 uppercase tracking-widest">
                        กราฟเปรียบเทียบรายเดือนของปี พ.ศ. {targetYear + 543}
                      </h3>
                      <button
                        onClick={handleExportCSV}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border border-white/5 bg-white/5 text-white/60 hover:text-white text-[10px] font-bold cursor-pointer transition-all"
                      >
                        <Download className="h-3.5 w-3.5" />
                        <span>Export CSV</span>
                      </button>
                    </div>

                    <div className="w-full h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={(reportData.monthly || []).map((d: any) => ({
                            name: new Date(2020, d.visit_month - 1).toLocaleDateString("th-TH", {
                              month: "short",
                            }),
                            ยอดเข้าชม: d.visit_count,
                          }))}
                          margin={{ top: 5, right: 10, left: -20, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="#2e2a27" />
                          <XAxis dataKey="name" stroke="#8c8278" fontSize={10} />
                          <YAxis stroke="#8c8278" fontSize={10} />
                          <Tooltip formatter={(value) => [`${value} ครั้ง`, "ยอดเข้าชม"]} />
                          <Bar dataKey="ยอดเข้าชม" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              )}

              {/* ─── TAB 5: VISITS BY CATEGORY ─── */}
              {activeTab === "category" && reportData && (
                <div className="bg-[#171513]/60 border border-white/5 rounded-2xl p-6 space-y-6">
                  <div className="flex items-center justify-between border-b border-white/5 pb-4">
                    <h3 className="text-xs font-bold text-white/40 uppercase tracking-widest">
                      สัดส่วนยอดผู้เข้าชมแยกตามประเภทนิยาย
                    </h3>
                    <button
                      onClick={handleExportCSV}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border border-white/5 bg-white/5 text-white/60 hover:text-white text-[10px] font-bold cursor-pointer transition-all"
                    >
                      <Download className="h-3.5 w-3.5" />
                      <span>Export CSV</span>
                    </button>
                  </div>

                  {/* Chart Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                    {/* Donut Chart */}
                    <div className="w-full h-64 flex justify-center">
                      <ResponsiveContainer width="100%" height="100%">
                        <RechartsPieChart>
                          <Pie
                            data={reportData.filter((d: any) => d.visit_count > 0)}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="visit_count"
                            nameKey="category_name"
                          >
                            {reportData.map((entry: any, index: number) => (
                              <Cell
                                key={`cell-${index}`}
                                fill={COLORS[index % COLORS.length]}
                              />
                            ))}
                          </Pie>
                          <Tooltip />
                          <Legend wrapperStyle={{ fontSize: "10px" }} />
                        </RechartsPieChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Breakdown Table */}
                    <div className="border border-white/5 rounded-xl overflow-hidden text-xs">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-white/5 text-white/40 uppercase font-bold">
                            <th className="py-2.5 px-4">หมวดหมู่</th>
                            <th className="py-2.5 px-4 text-right">ยอดชมรวม</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          {reportData.map((row: any, i: number) => (
                            <tr key={i}>
                              <td className="py-2.5 px-4 font-bold text-white/80 flex items-center gap-2">
                                <div
                                  className="w-2.5 h-2.5 rounded-full shrink-0"
                                  style={{ backgroundColor: COLORS[i % COLORS.length] }}
                                />
                                <span>{row.category_name}</span>
                              </td>
                              <td className="py-2.5 px-4 text-right font-semibold text-white/70">
                                {row.visit_count.toLocaleString()} ครั้ง
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* ─── TAB 6: AUTHOR LEADERBOARD ─── */}
              {activeTab === "author" && reportData && (
                <div className="bg-[#171513]/60 border border-white/5 rounded-2xl p-6 space-y-6">
                  <div className="flex items-center justify-between border-b border-white/5 pb-4">
                    <h3 className="text-xs font-bold text-white/40 uppercase tracking-widest">
                      กระดานผู้นำนักเขียนที่มีผู้เข้าชมสูงสุด
                    </h3>
                    <button
                      onClick={handleExportCSV}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border border-white/5 bg-white/5 text-white/60 hover:text-white text-[10px] font-bold cursor-pointer transition-all"
                    >
                      <Download className="h-3.5 w-3.5" />
                      <span>Export CSV</span>
                    </button>
                  </div>

                  {/* Leaderboard list */}
                  <div className="overflow-x-auto border border-white/5 rounded-xl">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-white/5 text-white/40 uppercase font-bold tracking-wider">
                          <th className="py-3 px-4">อันดับ</th>
                          <th className="py-3 px-4">นักเขียน</th>
                          <th className="py-3 px-4 text-center">จำนวนนิยาย</th>
                          <th className="py-3 px-4 text-right">ยอดเข้าชมรวม</th>
                          <th className="py-3 px-4 text-right"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {reportData.map((row: any, idx: number) => {
                          const initials = row.pen_name.slice(0, 2).toUpperCase();
                          return (
                            <tr key={row.author_id} className="hover:bg-white/[0.01]">
                              <td className="py-3 px-4 font-bold text-white/30 text-sm">
                                #{idx + 1}
                              </td>
                              <td className="py-3 px-4">
                                <Link
                                  href={`/author/${row.username}`}
                                  className="flex items-center gap-3 group"
                                >
                                  <div className="h-7 w-7 rounded-full overflow-hidden border border-white/10 bg-[#1c1917] shrink-0 flex items-center justify-center font-bold text-[10px] text-white/40 group-hover:border-accent transition-colors">
                                    {row.profile_image ? (
                                      <img
                                        src={row.profile_image}
                                        alt=""
                                        className="h-full w-full object-cover"
                                      />
                                    ) : (
                                      <span>{initials}</span>
                                    )}
                                  </div>
                                  <div>
                                    <p className="font-bold text-white/80 leading-snug group-hover:text-accent group-hover:underline transition-colors">
                                      {row.pen_name}
                                    </p>
                                    <p className="text-[9px] text-white/30">@{row.username}</p>
                                  </div>
                                </Link>
                              </td>
                              <td className="py-3 px-4 text-center text-white/60 font-semibold">
                                {row.novel_count} เรื่อง
                              </td>
                              <td className="py-3 px-4 text-right font-black text-white">
                                {row.visit_count.toLocaleString()} ครั้ง
                              </td>
                              <td className="py-3 px-4 text-right">
                                <button
                                  onClick={() => handleOpenAuthorDetails(row)}
                                  className="text-[10px] font-bold text-accent hover:underline cursor-pointer"
                                >
                                  ดูแยกรายเรื่อง
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* ─── Modal: Author Novel Breakdown ─── */}
      {selectedAuthor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs" onClick={() => setSelectedAuthor(null)} />
          <div className="relative w-full max-w-md bg-[#171513] border border-white/5 rounded-2xl shadow-2xl p-6 overflow-hidden animate-fadeIn">
            <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-5">
              <h3 className="text-sm font-bold text-white/85">Breakdown ยอดวิวนิยาย</h3>
              <button onClick={() => setSelectedAuthor(null)} className="text-white/40 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mb-4">
              <h4 className="text-xs font-bold text-white">{selectedAuthor.pen_name}</h4>
              <p className="text-[10px] text-white/35 mt-0.5">
                ยอดวิวสะสมแยกเป็นรายเรื่องในช่วงเวลาที่เลือก
              </p>
            </div>

            <div className="max-h-56 overflow-y-auto space-y-2 pr-1">
              {loadingAuthorNovels ? (
                <div className="flex justify-center py-6">
                  <Loader2 className="h-5 w-5 text-accent animate-spin" />
                </div>
              ) : authorNovels.length > 0 ? (
                authorNovels.map((novel, i) => (
                  <div
                    key={novel.novel_id}
                    className="flex items-center justify-between p-3 rounded-xl border border-white/5 bg-white/[0.01]"
                  >
                    <span className="text-xs font-bold text-white/80 truncate mr-3">
                      {novel.novel_name}
                    </span>
                    <span className="text-xs font-black text-[#e09050] shrink-0">
                      {novel.visit_count.toLocaleString()} วิว
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-xs text-white/35 py-6 text-center">ไม่มีผลงานที่เผยแพร่</p>
              )}
            </div>

            <div className="flex justify-end pt-5 border-t border-white/5 mt-5">
              <button
                onClick={() => setSelectedAuthor(null)}
                className="px-5 py-2 rounded-xl bg-white/5 border border-white/5 text-xs font-bold text-white/60 hover:text-white cursor-pointer transition-all"
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
