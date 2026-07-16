import { Calendar, BookOpen } from "lucide-react";

interface UserProfile {
  user_id: number;
  username: string;
  full_name: string | null;
  profile_image: string | null;
  status: string;
  created_at: string;
}

interface UserPublicProfileProps {
  profile: UserProfile;
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

export default function UserPublicProfile({ profile }: UserPublicProfileProps) {
  const displayName = profile.full_name || profile.username;
  const initials = displayName.slice(0, 2).toUpperCase();

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
            บัญชีนี้ถูกระงับการใช้งาน
          </h1>
          <p className="text-xs text-white/40 mt-3 max-w-xs leading-relaxed">
            บัญชีผู้ใช้ <strong className="text-white/70">@{profile.username}</strong> ถูกระงับการเข้าถึงชั่วคราวหรือถาวรเนื่องจากละเมิดนโยบายของระบบ
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-16 flex flex-col items-center">
      {/* Profile Card */}
      <div className="w-full bg-[#171513]/60 border border-white/5 rounded-2xl backdrop-blur-sm p-8 flex flex-col items-center text-center">
        {/* Avatar */}
        <div className="relative mb-5">
          <div className="w-28 h-28 rounded-full overflow-hidden border-2 border-white/10 bg-[#1c1917] flex items-center justify-center shadow-2xl">
            {profile.profile_image ? (
              <img
                src={profile.profile_image}
                alt={displayName}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-3xl font-bold text-white/40">
                {initials}
              </span>
            )}
          </div>
          {/* Reader badge */}
          <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#1c1917] border border-white/10 text-white/40 whitespace-nowrap shadow-md">
            <BookOpen className="h-2.5 w-2.5" />
            นักอ่าน
          </span>
        </div>

        {/* Name */}
        <h1 className="text-2xl font-extrabold text-white/90 mt-3">
          {displayName}
        </h1>
        <p className="text-sm text-white/35 mt-1">@{profile.username}</p>

        {/* Divider */}
        <div className="w-16 h-px bg-white/10 my-5" />

        {/* Join date */}
        <div className="flex items-center gap-1.5 text-xs text-white/35">
          <Calendar className="h-3.5 w-3.5" />
          <span>สมาชิกตั้งแต่ {formatJoinDate(profile.created_at)}</span>
        </div>
      </div>
    </div>
  );
}
