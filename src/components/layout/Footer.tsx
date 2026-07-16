import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-border bg-surface mt-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted">
            © 2026 NovelTH — แพลตฟอร์มอ่านนิยายออนไลน์
          </p>
          <div className="flex gap-4">
            <Link
              href="/about"
              className="text-sm text-muted hover:text-foreground transition-colors"
            >
              เกี่ยวกับเรา
            </Link>
            <Link
              href="/privacy"
              className="text-sm text-muted hover:text-foreground transition-colors"
            >
              นโยบายความเป็นส่วนตัว
            </Link>
            <Link
              href="/terms"
              className="text-sm text-muted hover:text-foreground transition-colors"
            >
              ข้อกำหนดการใช้งาน
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
