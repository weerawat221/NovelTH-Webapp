"use client";

import { useState, useEffect, Suspense } from "react";
import {
  BookOpen,
  List,
  PencilLine,
  Search,
  Menu,
  X,
  LogIn,
  User,
  LogOut,
  ChevronDown,
  Bell,
  Shield,
  History,
} from "lucide-react";
import Link from "next/link";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

function HeaderInner() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [authUser, setAuthUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [isAuthor, setIsAuthor] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Category dropdown states
  const [categoryMenuOpen, setCategoryMenuOpen] = useState(false);
  const [mobileCategoryOpen, setMobileCategoryOpen] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);

  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Live search states
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const supabase = createClient();
  const router = useRouter();

  // Load categories from Supabase
  useEffect(() => {
    async function loadCategories() {
      const { data } = await supabase
        .from("category")
        .select("category_id, category_name")
        .order("category_id");
      if (data) setCategories(data);
    }
    loadCategories();
  }, [supabase]);

  const selectedCategories = searchParams.get("category")
    ? searchParams.get("category")!.split(",").map(id => parseInt(id, 10)).filter(Boolean)
    : [];

  const handleCategoryToggle = (catId: number, checked: boolean) => {
    const params = new URLSearchParams(searchParams.toString());
    let current = params.get("category")
      ? params.get("category")!.split(",").map(id => parseInt(id, 10)).filter(Boolean)
      : [];

    if (checked) {
      current = [...current, catId];
    } else {
      current = current.filter(id => id !== catId);
    }

    if (current.length > 0) {
      params.set("category", current.join(","));
    } else {
      params.delete("category");
    }
    params.delete("page"); // Reset page

    router.push(`/novels?${params.toString()}`);
  };

  const handleClearCategories = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("category");
    params.delete("page");
    router.push(`/novels?${params.toString()}`);
  };

  // Clear query and results when search bar collapses
  useEffect(() => {
    if (!searchOpen) {
      setSearchQuery("");
      setResults([]);
    }
  }, [searchOpen]);

  // Debounced Supabase search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setResults([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const delayDebounceFn = setTimeout(async () => {
      try {
        const { data, error } = await supabase
          .from("novel")
          .select(`
            novel_id,
            novel_name,
            cover_image,
            author:author_id (
              pen_name
            )
          `)
          .ilike("novel_name", `%${searchQuery.trim()}%`)
          .limit(5);

        if (error) throw error;
        setResults(data || []);
      } catch (err) {
        console.error("Search error:", err);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, supabase]);

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && searchQuery.trim()) {
      router.push(`/novels?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
    }
  };

  useEffect(() => {
    async function fetchProfile(user: any) {
      if (!user) {
        setUserProfile(null);
        setIsAuthor(false);
        setIsAdmin(false);
        return;
      }
      try {
        const [{ data: u }, { data: a }, { data: adm }] = await Promise.all([
          supabase.from("users").select("username, full_name, profile_image").eq("auth_user_id", user.id).maybeSingle(),
          supabase.from("author").select("username, pen_name, profile_image").eq("auth_user_id", user.id).maybeSingle(),
          supabase.from("admin").select("admin_id, username, full_name").eq("auth_user_id", user.id).maybeSingle(),
        ]);
        setUserProfile(u || a || adm || { username: user.email?.split("@")[0] || "User" });
        setIsAuthor(!!a);
        setIsAdmin(!!adm);
      } catch (err) {
        console.error("Error fetching profile:", err);
      }
    }

    async function initAuth() {
      const { data: { user } } = await supabase.auth.getUser();
      setAuthUser(user);
      await fetchProfile(user);
    }
    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const user = session?.user || null;
      setAuthUser(user);
      await fetchProfile(user);
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  // Handle query parameter errors and show toast notifications
  useEffect(() => {
    const errorParam = searchParams.get("error");
    if (errorParam) {
      if (errorParam === "author_pending") {
        toast.error("โปรไฟล์นักเขียนของคุณยังไม่ได้รับการอนุมัติ กรุณารอผู้ดูแลระบบดำเนินการ");
      } else if (errorParam === "author_unauthorized") {
        toast.error("คุณไม่มีสิทธิ์เข้าใช้หน้านี้ (สำหรับนักเขียนที่อนุมัติแล้วเท่านั้น)");
      } else if (errorParam === "unauthorized_admin") {
        toast.error("คุณไม่มีสิทธิ์เข้าใช้ระบบหลังบ้าน (สำหรับผู้ดูแลระบบเท่านั้น)");
      }

      // Clean query parameter from URL bar without refreshing
      try {
        const url = new URL(window.location.href);
        url.searchParams.delete("error");
        window.history.replaceState({}, "", url.pathname + url.search);
      } catch (e) {
        console.error("Url clean error:", e);
      }
    }
  }, [searchParams]);

  // Fetch unread count for author comments
  useEffect(() => {
    if (!authUser || !(isAuthor || isAdmin)) {
      setUnreadCount(0);
      return;
    }

    async function loadUnreadCount() {
      try {
        const { data: author } = await supabase
          .from("author")
          .select("author_id")
          .eq("auth_user_id", authUser.id)
          .maybeSingle();

        if (!author) return;

        const { data: comments } = await supabase
          .from("comment")
          .select(`
            comment_id,
            notification_read_status (read_at),
            chapter!inner (
              chapter_id,
              novel!inner (
                novel_id,
                author_id
              )
            )
          `)
          .eq("chapter.novel.author_id", author.author_id);

        if (comments) {
          const unread = comments.filter((c: any) => !c.notification_read_status || c.notification_read_status.length === 0).length;
          setUnreadCount(unread);
        }
      } catch (err) {
        console.error("Error loading unread notifications:", err);
      }
    }

    loadUnreadCount();

    const channel = supabase
      .channel("unread-notifications")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "comment" },
        () => {
          loadUnreadCount();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [authUser, isAuthor, isAdmin, supabase]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUserMenuOpen(false);
    toast.success("ออกจากระบบสำเร็จแล้ว");
    router.push("/");
    router.refresh();
  };

  return (
    <header className="sticky top-0 z-50 bg-header-bg backdrop-blur-md border-b border-border">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-14 items-center justify-between gap-4">
          {/* ─── Logo ─── */}
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <BookOpen className="h-7 w-7 text-accent" strokeWidth={2.2} />
            <span className="text-lg font-bold tracking-tight text-foreground">
              Novel<span className="text-accent">TH</span>
            </span>
          </Link>

          {/* ─── Desktop Nav (center) ─── */}
          <nav className="hidden md:flex items-center gap-2">
            <div className="relative">
              <button
                onClick={() => setCategoryMenuOpen(!categoryMenuOpen)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${categoryMenuOpen || selectedCategories.length > 0
                  ? "text-accent bg-surface-hover"
                  : "text-muted hover:text-foreground hover:bg-surface-hover"
                  }`}
              >
                <List className="h-4 w-4" />
                <span>เลือกหมวด</span>
                <ChevronDown className={`h-3 w-3 transition-transform duration-200 ${categoryMenuOpen ? "rotate-180" : ""}`} />
              </button>

              {/* Category Dropdown */}
              {categoryMenuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setCategoryMenuOpen(false)} />
                  <div className="absolute left-0 mt-2 w-56 rounded-xl bg-surface border border-border shadow-lg py-2.5 z-50 animate-fadeIn">
                    <div className="px-3 pb-2 mb-1.5 border-b border-border flex items-center justify-between">
                      <span className="text-xs font-semibold text-foreground">เลือกหมวดหมู่ ({selectedCategories.length})</span>
                      {selectedCategories.length > 0 && (
                        <button
                          onClick={handleClearCategories}
                          className="text-[10px] font-semibold text-accent hover:text-accent-hover transition-colors cursor-pointer"
                        >
                          ล้างทั้งหมด
                        </button>
                      )}
                    </div>

                    <div className="max-h-60 overflow-y-auto px-1 space-y-0.5">
                      {categories.map((cat) => {
                        const isChecked = selectedCategories.includes(cat.category_id);
                        return (
                          <label
                            key={cat.category_id}
                            className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs text-foreground hover:bg-surface-hover cursor-pointer transition-colors"
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => handleCategoryToggle(cat.category_id, e.target.checked)}
                              className="rounded border-border text-accent focus:ring-accent/40 h-3.5 w-3.5 cursor-pointer"
                            />
                            <span>{cat.category_name}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}
            </div>

            {(isAuthor) && (
              <NavLink href="/author/dashboard" icon={<PencilLine className="h-4 w-4" />}>
                หน้านักเขียน
              </NavLink>
            )}
            {isAdmin && (
              <NavLink href="/admin" icon={<Shield className="h-4 w-4 text-accent animate-pulse" />}>
                แดชบอร์ดแอดมิน
              </NavLink>
            )}
          </nav>

          {/* ─── Right side ─── */}
          <div className="flex items-center gap-2">
            {/* Search */}
            <button
              onClick={() => setSearchOpen(!searchOpen)}
              className="p-2 rounded-lg text-muted hover:text-foreground hover:bg-surface-hover transition-colors"
              aria-label="ค้นหา"
            >
              <Search className="h-5 w-5" />
            </button>

            {/* Comments Notifications Bell */}
            {(isAuthor) && (
              <Link
                href="/author/comments"
                className="p-2 rounded-lg text-muted hover:text-foreground hover:bg-surface-hover transition-colors relative cursor-pointer"
                aria-label="การแจ้งเตือนความคิดเห็น"
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 h-4 min-w-4 px-1 rounded-full bg-red-500 text-[9px] font-bold text-white flex items-center justify-center border border-[#141210] animate-pulse">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </Link>
            )}

            {/* Auth */}
            {authUser ? (
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 h-8 rounded-full bg-surface hover:bg-surface-hover border border-border px-2 transition-all"
                >
                  <div className="h-6 w-6 rounded-full bg-accent text-white flex items-center justify-center text-xs font-semibold overflow-hidden shrink-0">
                    {userProfile?.profile_image ? (
                      <img src={userProfile.profile_image} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <span>{(userProfile?.username?.[0] || "U").toUpperCase()}</span>
                    )}
                  </div>
                  <span className="text-xs font-medium text-foreground max-w-[80px] truncate hidden sm:inline">
                    {userProfile?.username || "บัญชีของฉัน"}
                  </span>
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 rounded-xl bg-surface border border-border shadow-lg py-1.5 z-50 animate-fadeIn">
                    <div className="px-3 py-2 border-b border-border">
                      <p className="text-xs font-semibold text-foreground truncate">
                        {userProfile?.full_name || userProfile?.pen_name || userProfile?.username}
                      </p>
                      <p className="text-[10px] text-muted truncate mt-0.5">{authUser.email}</p>
                    </div>
                    <Link
                      href="/profile"
                      onClick={() => setUserMenuOpen(false)}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs text-foreground hover:bg-surface-hover transition-colors"
                    >
                      <User className="h-3.5 w-3.5 text-muted" />
                      <span>ตั้งค่าโปรไฟล์</span>
                    </Link>
                    <Link
                      href="/reading-history"
                      onClick={() => setUserMenuOpen(false)}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs text-foreground hover:bg-surface-hover transition-colors"
                    >
                      <History className="h-3.5 w-3.5 text-muted" />
                      <span>ประวัติการอ่าน</span>
                    </Link>
                    {isAdmin && (
                      <Link
                        href="/admin"
                        onClick={() => setUserMenuOpen(false)}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs text-accent font-bold hover:bg-surface-hover transition-colors"
                      >
                        <Shield className="h-3.5 w-3.5" />
                        <span>ระบบจัดการแอดมิน</span>
                      </Link>
                    )}
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-500 hover:bg-red-500/10 transition-colors text-left"
                    >
                      <LogOut className="h-3.5 w-3.5" />
                      <span>ออกจากระบบ</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href="/login"
                className="hidden sm:flex items-center gap-1.5 px-4 py-2 rounded-lg bg-accent text-white text-sm font-medium hover:bg-accent-hover transition-colors"
              >
                <LogIn className="h-4 w-4" />
                เข้าสู่ระบบ
              </Link>
            )}

            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-muted hover:text-foreground hover:bg-surface-hover transition-colors md:hidden"
              aria-label="เมนู"
            >
              {mobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ─── Search backdrop & bar (collapsible) ─── */}
      {searchOpen && (
        <>
          {/* Backdrop to close search when clicking outside */}
          <div
            className="fixed inset-0 z-40 bg-black/20 backdrop-blur-xs"
            onClick={() => setSearchOpen(false)}
          />

          <div className="border-t border-border bg-surface relative z-50 shadow-md">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-3 relative">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={handleSearchKeyDown}
                  placeholder="ค้นหานิยาย ชื่อเรื่อง..."
                  className="w-full pl-10 pr-4 py-2.5 bg-background border border-border rounded-xl text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition-all"
                  autoFocus
                />
              </div>

              {/* ─── Live Search Dropdown ─── */}
              {searchQuery.trim().length > 0 && (
                <div className="absolute left-4 right-4 sm:left-6 sm:right-6 lg:left-8 lg:right-8 top-[calc(100%+4px)] z-50 bg-surface border border-border rounded-xl shadow-xl overflow-hidden divide-y divide-border animate-fadeIn">
                  {isLoading ? (
                    <div className="p-4 text-center text-xs text-muted flex items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-accent border-t-transparent" />
                      <span>กำลังค้นหา...</span>
                    </div>
                  ) : results.length > 0 ? (
                    <>
                      <div className="py-1">
                        {results.map((novel) => (
                          <Link
                            key={novel.novel_id}
                            href={`/novel/${novel.novel_id}`}
                            onClick={() => setSearchOpen(false)}
                            className="flex items-center gap-3 px-3 py-2 hover:bg-surface-hover transition-colors"
                          >
                            {/* Cover image thumbnail */}
                            <div className="w-8 h-12 bg-muted rounded overflow-hidden flex-shrink-0 relative border border-border">
                              {novel.cover_image ? (
                                <img
                                  src={novel.cover_image}
                                  alt=""
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center p-0.5">
                                  <span className="text-white text-[7px] font-bold text-center line-clamp-2">
                                    {novel.novel_name}
                                  </span>
                                </div>
                              )}
                            </div>

                            {/* Details */}
                            <div className="min-w-0 flex-1">
                              <h4 className="text-sm font-medium text-foreground truncate">
                                {novel.novel_name}
                              </h4>
                              <p className="text-xs text-muted truncate mt-0.5">
                                โดย {novel.author?.pen_name || "ไม่ระบุ"}
                              </p>
                            </div>
                          </Link>
                        ))}
                      </div>

                      {/* View all results link */}
                      <Link
                        href={`/novels?search=${encodeURIComponent(searchQuery.trim())}`}
                        onClick={() => setSearchOpen(false)}
                        className="block text-center py-2 text-xs font-semibold text-accent hover:text-accent-hover hover:bg-surface-hover transition-colors border-t border-border"
                      >
                        ดูผลลัพธ์ทั้งหมดสำหรับ "{searchQuery}"
                      </Link>
                    </>
                  ) : (
                    <div className="p-4 text-center text-xs text-muted">
                      ไม่พบนิยายที่ตรงกับ "{searchQuery}"
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* ─── Mobile menu ─── */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-border bg-surface">
          <div className="px-4 py-3 space-y-1">
            {/* Mobile Category Select */}
            <div>
              <button
                onClick={() => setMobileCategoryOpen(!mobileCategoryOpen)}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm text-foreground hover:bg-surface-hover transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <List className="h-4 w-4 text-muted" />
                  <span>เลือกหมวด</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {selectedCategories.length > 0 && (
                    <span className="text-[10px] font-semibold bg-accent/10 text-accent px-1.5 py-0.5 rounded-full">
                      {selectedCategories.length}
                    </span>
                  )}
                  <ChevronDown className={`h-4 w-4 text-muted transition-transform duration-200 ${mobileCategoryOpen ? "rotate-180" : ""}`} />
                </div>
              </button>

              {mobileCategoryOpen && (
                <div className="pl-8 pr-3 py-1.5 space-y-2.5 bg-background/30 rounded-lg mt-1 max-h-48 overflow-y-auto border border-border/50">
                  {categories.map((cat) => {
                    const isChecked = selectedCategories.includes(cat.category_id);
                    return (
                      <label
                        key={cat.category_id}
                        className="flex items-center gap-2.5 py-1 text-xs text-foreground cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => handleCategoryToggle(cat.category_id, e.target.checked)}
                          className="rounded border-border text-accent focus:ring-accent/40 h-3.5 w-3.5 cursor-pointer"
                        />
                        <span>{cat.category_name}</span>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>

            {(isAuthor || isAdmin) && (
              <MobileNavLink
                href="/author/dashboard"
                icon={<PencilLine className="h-4 w-4" />}
                onClick={() => setMobileMenuOpen(false)}
              >
                หน้านักเขียน
              </MobileNavLink>
            )}
            {isAdmin && (
              <MobileNavLink
                href="/admin"
                icon={<Shield className="h-4 w-4 text-accent" />}
                onClick={() => setMobileMenuOpen(false)}
              >
                แดชบอร์ดแอดมิน
              </MobileNavLink>
            )}
            {authUser && (
              <>
                <MobileNavLink
                  href="/profile"
                  icon={<User className="h-4 w-4" />}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  ตั้งค่าโปรไฟล์
                </MobileNavLink>
                <MobileNavLink
                  href="/reading-history"
                  icon={<History className="h-4 w-4" />}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  ประวัติการอ่าน
                </MobileNavLink>
              </>
            )}
            {!authUser && (
              <Link
                href="/login"
                className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-accent text-white text-sm font-medium mt-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                <LogIn className="h-4 w-4" />
                เข้าสู่ระบบ
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

export default function Header() {
  return (
    <Suspense fallback={<header className="sticky top-0 z-50 bg-header-bg backdrop-blur-md border-b border-border h-14" />}>
      <HeaderInner />
    </Suspense>
  );
}

/* ─── Desktop nav link ─── */
function NavLink({
  href,
  icon,
  children,
}: {
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-muted hover:text-foreground hover:bg-surface-hover transition-colors"
    >
      {icon}
      {children}
    </Link>
  );
}

/* ─── Mobile nav link ─── */
function MobileNavLink({
  href,
  icon,
  children,
  onClick,
}: {
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm text-foreground hover:bg-surface-hover transition-colors"
      onClick={onClick}
    >
      {icon}
      {children}
    </Link>
  );
}
