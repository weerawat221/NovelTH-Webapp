import React from "react";
import Link from "next/link";
import { BookOpen } from "lucide-react";

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  footerText?: string;
  footerLinkText?: string;
  footerLinkHref?: string;
}

export default function AuthLayout({
  children,
  title,
  subtitle,
  footerText,
  footerLinkText,
  footerLinkHref,
}: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 py-12 bg-background">
      {/* Top Logo */}
      <div className="mb-6 text-center">
        <Link href="/" className="inline-flex items-center gap-2 group">
          <div className="h-10 w-10 rounded-xl bg-accent/10 flex items-center justify-center group-hover:bg-accent/20 transition-colors">
            <BookOpen className="h-6 w-6 text-accent" strokeWidth={2.2} />
          </div>
          <span className="text-2xl font-bold tracking-tight text-foreground">
            Novel<span className="text-accent">TH</span>
          </span>
        </Link>
      </div>

      {/* Main Card */}
      <div className="w-full max-w-md bg-surface border border-border rounded-xl shadow-xl overflow-hidden transition-colors">
        <div className="p-6 sm:p-8">
          <div className="text-center mb-6">
            <h1 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">
              {title}
            </h1>
            {subtitle && (
              <p className="text-sm text-muted mt-1.5">{subtitle}</p>
            )}
          </div>

          {children}
        </div>

        {/* Card Footer for switching login/register */}
        {footerText && footerLinkText && footerLinkHref && (
          <div className="px-6 py-4 bg-surface-hover/60 border-t border-border text-center text-sm text-muted">
            {footerText}{" "}
            <Link
              href={footerLinkHref}
              className="font-medium text-accent hover:text-accent-hover transition-colors underline-offset-4 hover:underline"
            >
              {footerLinkText}
            </Link>
          </div>
        )}
      </div>

      {/* Bottom Home Link */}
      <div className="mt-6 text-center">
        <Link
          href="/"
          className="text-xs text-muted hover:text-foreground transition-colors"
        >
          ← กลับสู่หน้าหลัก
        </Link>
      </div>
    </div>
  );
}
