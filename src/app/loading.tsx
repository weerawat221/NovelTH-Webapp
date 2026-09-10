import { BookOpen } from "lucide-react";

export default function Loading() {
  return (
    <div className="flex-1 min-h-[60vh] flex flex-col items-center justify-center p-6 select-none animate-in fade-in duration-300">
      {/* ─── Glowing Icon Container ─── */}
      <div className="relative flex items-center justify-center mb-6">
        {/* Ambient glow */}
        <div className="absolute w-24 h-24 rounded-full bg-accent/20 blur-xl animate-pulse" />

        {/* Outer subtle rotating ring */}
        <div className="w-16 h-16 rounded-2xl border-2 border-accent/25 border-t-accent animate-spin" />

        {/* Center book icon with gentle breathing pulse */}
        <div className="absolute inset-0 flex items-center justify-center">
          <BookOpen className="w-7 h-7 text-accent animate-pulse" />
        </div>
      </div>

      {/* ─── Animated Loading Text ─── */}
      <div className="flex items-center gap-1 text-foreground/80 font-medium text-sm">
        <span>กำลังโหลด</span>
        <span className="inline-flex gap-1 items-center ml-1">
          <span className="w-1.5 h-1.5 rounded-full bg-accent animate-bounce [animation-delay:-0.3s]" />
          <span className="w-1.5 h-1.5 rounded-full bg-accent animate-bounce [animation-delay:-0.15s]" />
          <span className="w-1.5 h-1.5 rounded-full bg-accent animate-bounce" />
        </span>
      </div>

      <p className="text-muted text-xs mt-1.5 font-light tracking-wide">
        กรุณารอสักครู่...
      </p>
    </div>
  );
}
