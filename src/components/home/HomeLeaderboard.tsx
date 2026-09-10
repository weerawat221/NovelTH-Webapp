import Link from "next/link";
import Image from "next/image";
import { Trophy, Award, Crown, Eye, BookOpen, Sparkles, ChevronRight, User } from "lucide-react";
import type { TopAuthor, TopReader } from "@/types/novel";

interface HomeLeaderboardProps {
  topAuthors: TopAuthor[];
  topReaders: TopReader[];
}

export default function HomeLeaderboard({
  topAuthors,
  topReaders,
}: HomeLeaderboardProps) {
  return (
    <section className="py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/30 text-amber-400 shadow-lg shadow-amber-500/5">
            <Trophy className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-foreground flex items-center gap-2">
              หอเกียรติยศ
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                Top 5
              </span>
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              ร่วมยินดีกับนักเขียนยอดนิยมและนักอ่านตัวยงแห่งชุมชน NovelTH
            </p>
          </div>
        </div>

        {/* 2-Column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* ─── Column 1: Top Authors ─── */}
          <div className="relative overflow-hidden rounded-3xl bg-[#181614]/70 border border-white/[0.08] p-5 sm:p-6 backdrop-blur-xl shadow-2xl flex flex-col justify-between">
            {/* Ambient background glow */}
            <div className="pointer-events-none absolute -top-12 -right-12 h-40 w-40 rounded-full bg-amber-500/10 blur-3xl" />

            <div>
              {/* Header */}
              <div className="flex items-center justify-between pb-4 border-b border-white/[0.06]">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    <Sparkles className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white/95">ผู้แต่งดีเด่น</h3>
                    <p className="text-[11px] text-white/40">5 อันดับผู้แต่งที่มียอดผู้เข้าชมมากที่สุด</p>
                  </div>
                </div>
              </div>

              {/* Author List */}
              <div className="mt-4 space-y-2.5">
                {topAuthors.length > 0 ? (
                  topAuthors.map((author, index) => {
                    const rank = index + 1;
                    return (
                      <Link
                        key={author.author_id}
                        href={`/author/${author.username}`}
                        className="group flex items-center justify-between p-3 rounded-2xl bg-white/[0.02] hover:bg-white/[0.06] border border-white/[0.03] hover:border-amber-500/30 transition-all duration-200 hover:scale-[1.01]"
                      >
                        {/* Rank & Profile */}
                        <div className="flex items-center gap-3.5 min-w-0">
                          {/* Rank Badge */}
                          <div className="shrink-0 flex items-center justify-center w-7">
                            {rank === 1 ? (
                              <div className="h-7 w-7 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 text-black font-black text-xs flex items-center justify-center shadow-md shadow-amber-500/30">
                                <Crown className="h-4 w-4" />
                              </div>
                            ) : rank === 2 ? (
                              <div className="h-6 w-6 rounded-lg bg-gradient-to-br from-slate-200 to-slate-400 text-slate-900 font-black text-xs flex items-center justify-center shadow-sm">
                                2
                              </div>
                            ) : rank === 3 ? (
                              <div className="h-6 w-6 rounded-lg bg-gradient-to-br from-amber-700 to-amber-800 text-amber-100 font-black text-xs flex items-center justify-center shadow-sm">
                                3
                              </div>
                            ) : (
                              <span className="text-xs font-bold text-white/30">{rank}</span>
                            )}
                          </div>

                          {/* Avatar */}
                          <div className="relative h-11 w-11 shrink-0 rounded-2xl overflow-hidden bg-[#24201d] border border-white/10 group-hover:border-amber-500/40 transition-colors">
                            {author.profile_image ? (
                              <Image
                                src={author.profile_image}
                                alt={author.pen_name}
                                fill
                                sizes="44px"
                                className="object-cover"
                              />
                            ) : (
                              <div className="h-full w-full flex items-center justify-center text-white/50 bg-gradient-to-br from-[#2a2522] to-[#1f1b19] font-bold text-sm">
                                {author.pen_name.charAt(0).toUpperCase()}
                              </div>
                            )}
                          </div>

                          {/* Info */}
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-white/90 group-hover:text-amber-400 transition-colors truncate">
                              {author.pen_name}
                            </p>
                            <p className="text-[11px] text-white/40 truncate">
                              @{author.username}
                            </p>
                          </div>
                        </div>

                        {/* Total Views Metric */}
                        <div className="shrink-0 flex items-center gap-1.5 pl-3">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                            <Eye className="h-3.5 w-3.5" />
                            {author.total_views.toLocaleString("th-TH")} วิว
                          </span>
                          <ChevronRight className="h-4 w-4 text-white/20 group-hover:text-amber-400 group-hover:translate-x-0.5 transition-all" />
                        </div>
                      </Link>
                    );
                  })
                ) : (
                  <div className="py-8 text-center text-xs text-white/30">
                    ยังไม่มีข้อมูลผู้แต่งดีเด่น
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ─── Column 2: Top Readers ─── */}
          <div className="relative overflow-hidden rounded-3xl bg-[#181614]/70 border border-white/[0.08] p-5 sm:p-6 backdrop-blur-xl shadow-2xl flex flex-col justify-between">
            {/* Ambient background glow */}
            <div className="pointer-events-none absolute -top-12 -right-12 h-40 w-40 rounded-full bg-emerald-500/10 blur-3xl" />

            <div>
              {/* Header */}
              <div className="flex items-center justify-between pb-4 border-b border-white/[0.06]">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <Award className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white/95">ผู้อ่านดีเด่น</h3>
                    <p className="text-[11px] text-white/40">5 อันดับผู้ที่อ่านตอนนิยายเยอะที่สุด</p>
                  </div>
                </div>
              </div>

              {/* Reader List */}
              <div className="mt-4 space-y-2.5">
                {topReaders.length > 0 ? (
                  topReaders.map((reader, index) => {
                    const rank = index + 1;
                    const displayName = reader.full_name || reader.username;
                    return (
                      <Link
                        key={reader.user_id}
                        href={`/user/${reader.username}`}
                        className="group flex items-center justify-between p-3 rounded-2xl bg-white/[0.02] hover:bg-white/[0.06] border border-white/[0.03] hover:border-emerald-500/30 transition-all duration-200 hover:scale-[1.01]"
                      >
                        {/* Rank & Profile */}
                        <div className="flex items-center gap-3.5 min-w-0">
                          {/* Rank Badge */}
                          <div className="shrink-0 flex items-center justify-center w-7">
                            {rank === 1 ? (
                              <div className="h-7 w-7 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 text-black font-black text-xs flex items-center justify-center shadow-md shadow-emerald-500/30">
                                <Crown className="h-4 w-4" />
                              </div>
                            ) : rank === 2 ? (
                              <div className="h-6 w-6 rounded-lg bg-gradient-to-br from-slate-200 to-slate-400 text-slate-900 font-black text-xs flex items-center justify-center shadow-sm">
                                2
                              </div>
                            ) : rank === 3 ? (
                              <div className="h-6 w-6 rounded-lg bg-gradient-to-br from-amber-700 to-amber-800 text-amber-100 font-black text-xs flex items-center justify-center shadow-sm">
                                3
                              </div>
                            ) : (
                              <span className="text-xs font-bold text-white/30">{rank}</span>
                            )}
                          </div>

                          {/* Avatar */}
                          <div className="relative h-11 w-11 shrink-0 rounded-2xl overflow-hidden bg-[#24201d] border border-white/10 group-hover:border-emerald-500/40 transition-colors">
                            {reader.profile_image ? (
                              <Image
                                src={reader.profile_image}
                                alt={displayName}
                                fill
                                sizes="44px"
                                className="object-cover"
                              />
                            ) : (
                              <div className="h-full w-full flex items-center justify-center text-white/50 bg-gradient-to-br from-[#2a2522] to-[#1f1b19] font-bold text-sm">
                                {displayName.charAt(0).toUpperCase()}
                              </div>
                            )}
                          </div>

                          {/* Info */}
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-white/90 group-hover:text-emerald-400 transition-colors truncate">
                              {displayName}
                            </p>
                            <p className="text-[11px] text-white/40 truncate">
                              @{reader.username}
                            </p>
                          </div>
                        </div>

                        {/* Chapters Read Metric */}
                        <div className="shrink-0 flex items-center gap-1.5 pl-3">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            <BookOpen className="h-3.5 w-3.5" />
                            {reader.chapters_read.toLocaleString("th-TH")} ตอน
                          </span>
                          <ChevronRight className="h-4 w-4 text-white/20 group-hover:text-emerald-400 group-hover:translate-x-0.5 transition-all" />
                        </div>
                      </Link>
                    );
                  })
                ) : (
                  <div className="py-8 text-center text-xs text-white/30">
                    ยังไม่มีข้อมูลผู้อ่านดีเด่น
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
