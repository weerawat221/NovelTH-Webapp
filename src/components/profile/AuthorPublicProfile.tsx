import { BookOpen, Calendar, Eye, PenLine } from "lucide-react";
import type { NovelWithDetails } from "@/types/novel";
import NovelCard from "@/components/novel/NovelCard";

interface AuthorProfile {
  author_id: number;
  username: string;
  pen_name: string;
  full_name: string | null;
  bio: string | null;
  profile_image: string | null;
  status: string;
  created_at: string;
}

interface AuthorPublicProfileProps {
  profile: AuthorProfile;
  novels: NovelWithDetails[];
}

function formatJoinDate(dateStr: string): string {
  const normalized =
    dateStr.endsWith("Z") || dateStr.includes("+")
      ? dateStr
      : dateStr.replace(" ", "T") + "Z";
  return new Date(normalized).toLocaleDateString("th-TH", {
    year: "numeric",
    month: "long",
  });
}

export default function AuthorPublicProfile({
  profile,
  novels,
}: AuthorPublicProfileProps) {
  const initials = profile.pen_name.slice(0, 2).toUpperCase();
  const totalViews = novels.reduce((acc, n) => acc + n.view_count, 0);

  if (profile.status === "suspended") {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 flex flex-col items-center">
        {/* Suspended Profile Card */}
        <div className="w-full bg-[#171513]/60 border border-red-500/10 rounded-2xl backdrop-blur-sm p-10 flex flex-col items-center text-center shadow-2xl">
          {/* Avatar Icon */}
          <div className="relative mb-5">
            <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-red-500/20 bg-red-500/5 flex items-center justify-center shadow-inner">
              <span className="text-4xl text-red-500">🚫</span>
            </div>
            {/* Suspended badge */}
            <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 inline-flex items-center gap-1 px-3 py-0.5 rounded-full text-[10px] font-extrabold bg-red-950/80 border border-red-500/20 text-red-400 whitespace-nowrap shadow-md uppercase tracking-wider">
              Suspended
            </span>
          </div>

          {/* Warning Message */}
          <h1 className="text-xl font-black text-white/95 mt-3">
            บัญชีนักเขียนนี้ถูกระงับการใช้งาน
          </h1>
          <p className="text-xs text-white/40 mt-3 max-w-xs leading-relaxed">
            บัญชีนักเขียน <strong className="text-white/70">@{profile.username}</strong> ({profile.pen_name}) ถูกระงับการใช้งานและไม่สามารถเผยแพร่ผลงานต่อสาธารณะได้เนื่องจากละเมิดนโยบายของระบบ
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-10">
      {/* ─── Hero Card ─── */}
      <div className="relative bg-[#171513]/60 border border-white/5 rounded-2xl backdrop-blur-sm overflow-hidden mb-10">
        {/* Decorative gradient glow */}
        <div className="absolute top-0 right-0 w-72 h-72 bg-accent/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative p-6 sm:p-10">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            {/* Avatar */}
            <div className="relative shrink-0">
              <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full overflow-hidden border-2 border-accent/20 bg-[#1c1917] flex items-center justify-center shadow-2xl">
                {profile.profile_image ? (
                  <img
                    src={profile.profile_image}
                    alt={profile.pen_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-3xl font-bold text-white/40">
                    {initials}
                  </span>
                )}
              </div>
              {/* Author badge */}
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-accent/15 border border-accent/25 text-accent whitespace-nowrap shadow-md">
                <PenLine className="h-2.5 w-2.5" />
                นักเขียน
              </span>
            </div>

            {/* Info */}
            <div className="flex-1 text-center sm:text-left min-w-0">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white/95 leading-tight">
                {profile.pen_name}
              </h1>
              {profile.full_name && (
                <p className="text-sm text-white/35 mt-0.5">
                  {profile.full_name}
                </p>
              )}

              {/* Stats row */}
              <div className="flex flex-wrap justify-center sm:justify-start gap-x-5 gap-y-2 mt-4">
                <div className="flex items-center gap-1.5 text-xs text-white/45">
                  <BookOpen className="h-3.5 w-3.5 text-accent/70" />
                  <span>
                    <strong className="text-white/80 font-bold">
                      {novels.length}
                    </strong>{" "}
                    เรื่อง
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-white/45">
                  <Eye className="h-3.5 w-3.5 text-accent/70" />
                  <span>
                    <strong className="text-white/80 font-bold">
                      {totalViews.toLocaleString("th-TH")}
                    </strong>{" "}
                    วิวรวม
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-white/35">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>นักเขียนตั้งแต่ {formatJoinDate(profile.created_at)}</span>
                </div>
              </div>

              {/* Bio */}
              {profile.bio && (
                <p className="mt-4 text-sm text-white/55 leading-relaxed whitespace-pre-wrap max-w-2xl">
                  {profile.bio}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ─── Novels Section ─── */}
      <div>
        <div className="flex items-center gap-3 mb-6">
          <h2 className="text-base font-extrabold text-white/80">
            ผลงานทั้งหมด
          </h2>
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white/5 text-white/35 border border-white/5">
            {novels.length} เรื่อง
          </span>
        </div>

        {novels.length > 0 ? (
          <div className="flex flex-wrap gap-3">
            {novels.map((novel) => (
              <NovelCard key={novel.novel_id} novel={novel} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 border border-dashed border-white/10 rounded-2xl bg-white/[0.01]">
            <BookOpen className="h-10 w-10 text-white/15 mx-auto mb-3" />
            <p className="text-sm text-white/35 font-semibold">
              ยังไม่มีผลงานที่เผยแพร่
            </p>
            <p className="text-xs text-white/25 mt-1">
              นักเขียนยังไม่ได้เผยแพร่นิยายใดๆ
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
