"use client";

import type { ReadingTheme } from "@/types/novel";


interface ReadingSettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  fontSize: number;
  lineHeight: number;
  theme: ReadingTheme;
  onFontSizeChange: (v: number) => void;
  onLineHeightChange: (v: number) => void;
  onThemeChange: (v: ReadingTheme) => void;
}

const themes: { key: ReadingTheme; label: string; bg: string; ring: string }[] = [
  { key: "light", label: "สว่าง", bg: "bg-white", ring: "ring-gray-300" },
  { key: "warm", label: "อุ่น", bg: "bg-[#f5f0e8]", ring: "ring-amber-400" },
  { key: "dark", label: "มืด", bg: "bg-[#1a1a1a]", ring: "ring-white/40" },
];

export default function ReadingSettingsPanel({
  isOpen,
  onClose,
  fontSize,
  lineHeight,
  theme,
  onFontSizeChange,
  onLineHeightChange,
  onThemeChange,
}: ReadingSettingsPanelProps) {
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-[90]" onClick={onClose} />

      {/* Panel */}
      <div className="absolute right-0 top-full mt-2 w-72 rounded-xl bg-[#252220] border border-white/10 shadow-2xl py-4 px-5 z-[91] animate-fadeIn">
        <h4 className="text-xs font-bold text-white/70 uppercase tracking-wider mb-4">
          ตั้งค่าการอ่าน
        </h4>

        {/* Font size */}
        <div className="mb-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-white/60">ขนาดตัวอักษร</span>
            <span className="text-xs text-[#e09050] font-semibold">{fontSize}px</span>
          </div>
          <input
            type="range"
            min={14}
            max={24}
            step={1}
            value={fontSize}
            onChange={(e) => onFontSizeChange(Number(e.target.value))}
            className="w-full h-1.5 rounded-full appearance-none cursor-pointer accent-[#e09050] bg-white/10"
          />
          <div className="flex justify-between mt-1">
            <span className="text-[10px] text-white/30">A</span>
            <span className="text-sm text-white/30 font-bold">A</span>
          </div>
        </div>

        {/* Line height */}
        <div className="mb-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-white/60">ระยะห่างบรรทัด</span>
            <span className="text-xs text-[#e09050] font-semibold">{lineHeight.toFixed(1)}</span>
          </div>
          <input
            type="range"
            min={1.4}
            max={2.4}
            step={0.1}
            value={lineHeight}
            onChange={(e) => onLineHeightChange(Number(e.target.value))}
            className="w-full h-1.5 rounded-full appearance-none cursor-pointer accent-[#e09050] bg-white/10"
          />
          <div className="flex justify-between mt-1">
            <span className="text-[10px] text-white/30">แคบ</span>
            <span className="text-[10px] text-white/30">กว้าง</span>
          </div>
        </div>

        {/* Theme */}
        <div>
          <span className="text-xs text-white/60 block mb-3">ธีมหน้าจอ</span>
          <div className="flex items-center gap-3 justify-center">
            {themes.map((t) => (
              <button
                key={t.key}
                onClick={() => onThemeChange(t.key)}
                className={`w-10 h-10 rounded-full ${t.bg} ring-2 transition-all cursor-pointer ${
                  theme === t.key
                    ? `${t.ring} scale-110 ring-offset-2 ring-offset-[#252220]`
                    : "ring-transparent hover:ring-white/20"
                }`}
                aria-label={t.label}
                title={t.label}
              />
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
