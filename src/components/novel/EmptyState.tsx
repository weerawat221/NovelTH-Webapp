import { BookX } from "lucide-react";

interface EmptyStateProps {
  title?: string;
  description?: string;
}

export default function EmptyState({
  title = "ไม่พบนิยาย",
  description = "ลองเปลี่ยนตัวกรองหรือค้นหาด้วยคำอื่น",
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      {/* ─── Illustration ─── */}
      <div className="relative mb-6">
        <div className="h-24 w-24 rounded-full bg-accent-light flex items-center justify-center">
          <BookX className="h-12 w-12 text-accent/60" strokeWidth={1.5} />
        </div>
        {/* Decorative dots */}
        <div className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-accent/20" />
        <div className="absolute -bottom-2 -left-2 h-4 w-4 rounded-full bg-accent/10" />
      </div>

      <h3 className="text-lg font-semibold text-foreground mb-1">{title}</h3>
      <p className="text-sm text-muted max-w-xs">{description}</p>
    </div>
  );
}
