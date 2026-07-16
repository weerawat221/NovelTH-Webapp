"use client";

import React from "react";
import Link from "next/link";
import { BookOpen, BarChart3, ChevronRight } from "lucide-react";

interface AuthorSidebarProps {
  activeTab: "novels" | "stats";
}

export default function AuthorSidebar({ activeTab }: AuthorSidebarProps) {
  const menuItems = [
    {
      id: "novels",
      label: "นิยายของฉัน",
      href: "/author/dashboard",
      icon: BookOpen,
    },
    {
      id: "stats",
      label: "สถิติและรายงาน",
      href: "/author/stats",
      icon: BarChart3,
    },
  ];

  return (
    <aside className="w-full md:w-64 shrink-0 border-b md:border-b-0 md:border-r border-orange-950/20 bg-stone-950/30 backdrop-blur-md p-4 md:p-6 md:min-h-[calc(100vh-64px)]">
      {/* Sidebar Header for Desktop */}
      <div className="hidden md:block mb-8">
        <h2 className="text-xs font-bold text-orange-500/70 tracking-wider uppercase">
          ผู้เขียน (Author Panel)
        </h2>
        <p className="text-[10px] text-stone-500 mt-1">
          จัดการผลงานและดูข้อมูลเชิงลึก
        </p>
      </div>

      {/* Navigation Menu */}
      <nav className="flex md:flex-col gap-1.5 overflow-x-auto md:overflow-x-visible pb-2 md:pb-0 scrollbar-none">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <Link
              key={item.id}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 whitespace-nowrap cursor-pointer select-none group w-full ${
                isActive
                  ? "bg-gradient-to-r from-orange-500/15 to-amber-500/5 text-orange-400 border border-orange-500/30 shadow-[0_0_15px_-3px_rgba(249,115,22,0.15)]"
                  : "text-stone-400 hover:text-stone-200 hover:bg-stone-900/40 border border-transparent"
              }`}
            >
              <Icon
                className={`h-4.5 w-4.5 transition-transform duration-200 group-hover:scale-110 ${
                  isActive ? "text-orange-400" : "text-stone-500 group-hover:text-stone-300"
                }`}
              />
              <span className="flex-1 text-left">{item.label}</span>
              {/* Desktop Chevron Indicator */}
              <ChevronRight
                className={`hidden md:block h-3.5 w-3.5 transition-all duration-200 ${
                  isActive
                    ? "opacity-100 translate-x-0 text-orange-400/80"
                    : "opacity-0 -translate-x-2 text-stone-600 group-hover:opacity-100 group-hover:translate-x-0"
                }`}
              />
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
