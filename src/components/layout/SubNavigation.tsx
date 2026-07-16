"use client";

import { Suspense } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

const tabs = [
  { id: "home", label: "หน้าแรก", href: "/" },
  { id: "all", label: "นิยายทั้งหมด", href: "/novels" },
  { id: "new", label: "มาใหม่", href: "/novels?sort=latest" },
  { id: "favorites", label: "นิยายโปรด", href: "/novels?filter=favorites" },
] as const;

type TabId = (typeof tabs)[number]["id"];

function SubNavigationInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Determine active tab dynamically from URL
  let activeTab: TabId = "home";
  if (pathname === "/novels") {
    if (searchParams.get("filter") === "favorites") {
      activeTab = "favorites";
    } else if (searchParams.get("sort") === "latest") {
      activeTab = "new";
    } else {
      activeTab = "all";
    }
  } else if (pathname === "/") {
    activeTab = "home";
  }

  return (
    <div className="bg-surface border-b border-border">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <nav className="flex items-center gap-0 -mb-px overflow-x-auto scrollbar-hide">
          {tabs.map((tab) => (
            <Link
              key={tab.id}
              href={tab.href}
              className={`
                relative px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors
                ${
                  activeTab === tab.id
                    ? "text-accent"
                    : "text-muted hover:text-foreground"
                }
              `}
            >
              {tab.label}
              {/* Active underline */}
              <span
                className={`
                  absolute bottom-0 left-2 right-2 h-0.5 rounded-full transition-all duration-300
                  ${activeTab === tab.id ? "bg-accent scale-x-100" : "bg-transparent scale-x-0"}
                `}
              />
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
}

export default function SubNavigation() {
  return (
    <Suspense fallback={
      <div className="bg-surface border-b border-border">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <nav className="flex items-center gap-0 -mb-px overflow-x-auto scrollbar-hide">
            {tabs.map((tab) => (
              <span
                key={tab.id}
                className="relative px-4 py-3 text-sm font-medium whitespace-nowrap text-muted"
              >
                {tab.label}
              </span>
            ))}
          </nav>
        </div>
      </div>
    }>
      <SubNavigationInner />
    </Suspense>
  );
}
