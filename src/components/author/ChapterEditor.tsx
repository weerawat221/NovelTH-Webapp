"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, Save, Send, Eye, Clock, Loader2, Sparkles, Check } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

interface ChapterEditorProps {
  novelId: number;
  novelName: string;
  chapterNo: number;
  initialData?: {
    chapter_id: number;
    chapter_title: string;
    content: string;
    status: "draft" | "published" | "scheduled";
    scheduled_at: string | null;
  };
}

export default function ChapterEditor({ novelId, novelName, chapterNo, initialData }: ChapterEditorProps) {
  const isEdit = !!initialData;
  const router = useRouter();
  const supabase = createClient();

  const [activeChapterId, setActiveChapterId] = useState<number | null>(initialData?.chapter_id || null);
  const [title, setTitle] = useState(initialData?.chapter_title || "");
  const [content, setContent] = useState(initialData?.content || "");

  // Save State
  const [dirty, setDirty] = useState(false);
  const [autosaveStatus, setAutosaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [lastSaved, setLastSaved] = useState<Date | null>(initialData ? new Date() : null);
  const [manualSaving, setManualSaving] = useState(false);

  // UI Modes
  const [isPreview, setIsPreview] = useState(false);
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);

  // Publish Modal State
  const [publishType, setPublishType] = useState<"now" | "schedule">("now");
  const [scheduleDate, setScheduleDate] = useState("");
  const [notifyFollowers, setNotifyFollowers] = useState(true);
  const [publishing, setPublishing] = useState(false);

  // Trigger Dirty state on change
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value);
    setDirty(true);
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    setDirty(true);
  };

  // Warn before exit
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (dirty) {
        e.preventDefault();
        e.returnValue = "คุณยังมีงานที่ยังไม่เสร็จสิ้น ต้องการออกจากหน้านี้หรือไม่?";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [dirty]);

  // Autosave Timer: Save after 10 seconds of inactivity
  useEffect(() => {
    if (!dirty) return;

    setAutosaveStatus("idle");
    const timer = setTimeout(() => {
      saveDraft(true);
    }, 10000);

    return () => clearTimeout(timer);
  }, [title, content, dirty]);

  // Core Save Draft logic
  const saveDraft = async (isAutosave = false) => {
    if (!dirty && isAutosave) return;

    if (!isAutosave) setManualSaving(true);
    else setAutosaveStatus("saving");

    try {
      let currentChapterId = activeChapterId;

      // 1. Upsert Chapter metadata
      if (currentChapterId === null) {
        const { data, error } = await supabase
          .from("chapter")
          .insert({
            novel_id: novelId,
            chapter_no: chapterNo,
            chapter_title: title.trim() || `ตอนที่ ${chapterNo}`,
            status: "draft",
            published_at: null,
          })
          .select("chapter_id")
          .single();

        if (error) throw error;
        currentChapterId = data.chapter_id;
        setActiveChapterId(data.chapter_id);

        // Replace history state with edit path to avoid duplicates on refresh
        window.history.replaceState(
          null,
          "",
          `/author/novel/${novelId}/chapter/${currentChapterId}/edit`
        );
      } else {
        const { error } = await supabase
          .from("chapter")
          .update({
            chapter_title: title.trim() || `ตอนที่ ${chapterNo}`,
            status: "draft",
          })
          .eq("chapter_id", currentChapterId);

        if (error) throw error;
      }

      // 2. Upsert Chapter text content
      const { error: contentError } = await supabase
        .from("chapter_content")
        .upsert({
          chapter_id: currentChapterId,
          content: content,
          updated_at: new Date().toISOString(),
        });

      if (contentError) throw contentError;

      // 3. Bump novel updated_at so the dashboard reflects the latest edit time
      await supabase
        .from("novel")
        .update({ updated_at: new Date().toISOString() })
        .eq("novel_id", novelId);

      setDirty(false);
      setLastSaved(new Date());
      setAutosaveStatus("saved");

      if (!isAutosave) {
        toast.success("บันทึกฉบับร่างเรียบร้อยแล้ว");
      }
    } catch (err) {
      console.error(err);
      setAutosaveStatus("error");
      if (!isAutosave) {
        toast.error("บันทึกฉบับร่างไม่สำเร็จ");
      }
    } finally {
      if (!isAutosave) setManualSaving(false);
    }
  };

  // Publish Chapter Submit
  const handlePublishSubmit = async () => {
    setPublishing(true);
    let currentChapterId = activeChapterId;

    try {
      // 1. Ensure chapter meta exists (if not saved as draft yet)
      if (currentChapterId === null) {
        const { data, error } = await supabase
          .from("chapter")
          .insert({
            novel_id: novelId,
            chapter_no: chapterNo,
            chapter_title: title.trim() || `ตอนที่ ${chapterNo}`,
            status: "draft",
          })
          .select("chapter_id")
          .single();

        if (error) throw error;
        currentChapterId = data.chapter_id;
        setActiveChapterId(data.chapter_id);
      }

      // 2. Save current content
      const { error: contentError } = await supabase
        .from("chapter_content")
        .upsert({
          chapter_id: currentChapterId,
          content: content,
          updated_at: new Date().toISOString(),
        });

      if (contentError) throw contentError;

      // 3. Update status & publish dates
      const isSchedule = publishType === "schedule";
      const scheduledTime = isSchedule ? new Date(scheduleDate).toISOString() : null;

      const { error: publishError } = await supabase
        .from("chapter")
        .update({
          chapter_title: title.trim() || `ตอนที่ ${chapterNo}`,
          status: isSchedule ? "scheduled" : "published",
          published_at: isSchedule ? null : new Date().toISOString(),
          scheduled_at: scheduledTime,
        })
        .eq("chapter_id", currentChapterId);

      if (publishError) throw publishError;

      // 4. Bump novel updated_at so the dashboard reflects the latest publish time
      await supabase
        .from("novel")
        .update({ updated_at: new Date().toISOString() })
        .eq("novel_id", novelId);

      setDirty(false);
      toast.success(isSchedule ? "ตั้งเวลาการเผยแพร่ตอนสำเร็จ" : "เผยแพร่ตอนนิยายสำเร็จแล้ว!");
      setIsPublishModalOpen(false);

      router.push(`/author/novel/${novelId}/chapters`);
      router.refresh();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "การเผยแพร่ล้มเหลว กรุณาลองใหม่อีกครั้ง");
    } finally {
      setPublishing(false);
    }
  };

  // Word/Character Counts
  const characterCount = content.length;
  const wordCount = content.trim() ? content.trim().split(/\s+/).filter(Boolean).length : 0;

  // Format save status string
  const getAutosaveText = () => {
    if (autosaveStatus === "saving") return "กำลังบันทึกอัตโนมัติ...";
    if (autosaveStatus === "error") return "เกิดข้อผิดพลาดในการบันทึก";
    if (lastSaved) {
      return `บันทึกฉบับร่างแล้ว เมื่อ ${lastSaved.toLocaleTimeString("th-TH", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      })}`;
    }
    return "ยังไม่มีการบันทึก";
  };

  return (
    <div className="min-h-screen bg-[#141210] flex flex-col">
      {/* ─── Sticky Header ─── */}
      <header className="sticky top-0 z-40 bg-[#1c1917]/90 backdrop-blur-md border-b border-white/5 py-3 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">

          {/* Back & Info */}
          <div className="flex items-center gap-3 min-w-0">
            <Link
              href={`/author/novel/${novelId}/chapters`}
              className="p-2 rounded-xl text-white/40 hover:text-white/80 hover:bg-white/5 transition-colors shrink-0"
              onClick={(e) => {
                if (dirty && !confirm("คุณต้องการย้อนกลับโดยไม่ได้บันทึกการเปลี่ยนแปลงล่าสุดหรือไม่?")) {
                  e.preventDefault();
                }
              }}
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[10px] sm:text-xs font-semibold text-accent truncate max-w-[120px] sm:max-w-xs">
                  {novelName}
                </span>
                <span className="text-white/20">|</span>
                <span className="text-[10px] sm:text-xs font-bold text-white/50">
                  ตอนที่ {chapterNo}
                </span>
              </div>
              <p className="text-[10px] text-white/40 truncate hidden sm:block mt-0.5">
                {getAutosaveText()}
              </p>
            </div>
          </div>

          {/* Action Tools */}
          <div className="flex items-center gap-2">
            {/* Preview Toggle */}
            <button
              onClick={() => setIsPreview(!isPreview)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${isPreview
                ? "bg-accent text-white shadow-md shadow-accent/15"
                : "border border-white/10 text-white/60 hover:text-white hover:bg-white/5"
                }`}
            >
              <Eye className="h-3.5 w-3.5" />
              <span>{isPreview ? "แก้ไขเนื้อหา" : "ดูตัวอย่างอ่าน"}</span>
            </button>

            {/* Save Draft Button */}
            <button
              onClick={() => saveDraft(false)}
              disabled={manualSaving || autosaveStatus === "saving"}
              className="hidden sm:inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl border border-white/10 text-white/80 hover:text-white hover:bg-white/5 disabled:opacity-35 transition-colors cursor-pointer"
            >
              {manualSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
              <span>บันทึกแบบร่าง</span>
            </button>

            {/* Publish Trigger */}
            <button
              onClick={() => setIsPublishModalOpen(true)}
              className="inline-flex items-center justify-center gap-1.5 px-4.5 py-2 rounded-xl bg-[#e09050] hover:bg-[#c97c3a] text-white text-xs font-bold shadow-md hover:shadow-lg transition-all duration-200"
            >
              <Send className="h-3.5 w-3.5" />
              <span>เผยแพร่ตอน</span>
            </button>
          </div>
        </div>
      </header>

      {/* ─── Main Content Container ─── */}
      <main className="flex-1 w-full max-w-4xl mx-auto px-4 py-8 flex flex-col">
        {isPreview ? (
          /* ─── Preview Screen ─── */
          <div className="flex-1 space-y-6 animate-in fade-in duration-200">
            <div className="text-center py-6 border-b border-white/5">
              <h1 className="text-2xl md:text-3xl font-bold text-white/90">
                {title.trim() || `ตอนที่ {chapterNo}`}
              </h1>
              <p className="text-xs text-white/40 mt-3 font-semibold">
                (โหมดแสดงตัวอย่างบนรูปแบบการอ่านนิยายจริง)
              </p>
            </div>

            <div className="mx-auto max-w-2xl px-2 py-4">
              <div className="text-base md:text-lg text-white/80 leading-relaxed font-sans space-y-5 whitespace-pre-wrap select-none">
                {content.trim() ? (
                  content.split("\n").map((para, idx) => (
                    <p key={idx} className="mb-4">
                      {para}
                    </p>
                  ))
                ) : (
                  <p className="text-center text-white/30 text-sm py-12">
                    ไม่มีเนื้อหาสำหรับแสดงตัวอย่าง
                  </p>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* ─── Editor Screen ─── */
          <div className="flex-1 flex flex-col space-y-4 animate-in fade-in duration-200">

            {/* Title Input */}
            <input
              type="text"
              value={title}
              onChange={handleTitleChange}
              placeholder="ใส่ชื่อตอน..."
              className="w-full bg-transparent text-white/95 placeholder-white/20 border-none outline-none font-extrabold text-2xl md:text-3xl py-2 px-1 focus:ring-0 focus:outline-none"
            />

            {/* Markdown Info tip */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.02] border border-white/5 text-[10px] text-white/40 w-fit">
              <Sparkles className="h-3 w-3 text-accent" />
              <span>แนะนำ: เขียนบรรทัดเว้นบรรทัดเพื่อให้อ่านง่ายขึ้นบนหน้ามือถือ</span>
            </div>

            {/* Textarea Area */}
            <div className="flex-1 flex flex-col relative min-h-[400px]">
              <textarea
                value={content}
                onChange={handleContentChange}
                placeholder="พิมพ์เนื้อหาบทเรียนนิยายที่นี่..."
                className="w-full flex-1 bg-transparent text-white/80 placeholder-white/10 text-base leading-relaxed border-none outline-none resize-none focus:ring-0 focus:outline-none py-2 px-1 overflow-y-auto"
                style={{ fontFamily: "inherit" }}
              />
            </div>

            {/* Footer Status Indicators */}
            <div className="flex items-center justify-between border-t border-white/5 pt-4 text-xs text-white/40 mt-auto">
              <span>{getAutosaveText()}</span>
              <div className="flex items-center gap-4">
                <span>อักษร: <strong className="text-white/60 font-semibold">{characterCount.toLocaleString()}</strong> ตัว</span>
                <span>คำ: <strong className="text-white/60 font-semibold">{wordCount.toLocaleString()}</strong> คำ</span>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ─── Publish Config Modal ─── */}
      {isPublishModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-[#0c0a09]/80 backdrop-blur-sm"
            onClick={() => setIsPublishModalOpen(false)}
          />

          <div className="relative w-full max-w-md bg-[#171513] border border-white/10 rounded-2xl p-6 shadow-2xl z-10 animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-base font-bold text-white/90">
              ตัวเลือกการเผยแพร่ตอน
            </h3>

            <div className="mt-5 space-y-4">
              {/* Type Selectors */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-white/50 uppercase tracking-wider">
                  ตั้งค่าเวลาเผยแพร่
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPublishType("now")}
                    className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${publishType === "now"
                      ? "bg-accent/10 border-accent text-accent"
                      : "border-white/5 bg-[#1c1917] text-white/50 hover:text-white/85"
                      }`}
                  >
                    เผยแพร่ทันที
                  </button>
                  <button
                    type="button"
                    onClick={() => setPublishType("schedule")}
                    className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${publishType === "schedule"
                      ? "bg-accent/10 border-accent text-accent"
                      : "border-white/5 bg-[#1c1917] text-white/50 hover:text-white/85"
                      }`}
                  >
                    ตั้งเวลาเผยแพร่
                  </button>
                </div>
              </div>

              {/* Schedule time input */}
              {publishType === "schedule" && (
                <div className="space-y-2 animate-in slide-in-from-top-1.5 duration-100">
                  <label className="block text-xs font-bold text-white/50">
                    เลือกวันและเวลาเผยแพร่
                  </label>
                  <input
                    type="datetime-local"
                    value={scheduleDate}
                    onChange={(e) => setScheduleDate(e.target.value)}
                    required
                    min={new Date(Date.now() + 5 * 60 * 1000).toISOString().slice(0, 16)} // at least 5 mins in the future
                    className="w-full bg-[#1c1917] border border-white/5 text-white/80 text-xs font-semibold rounded-xl px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-accent/50 cursor-pointer"
                  />
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-white/5">
              <button
                type="button"
                onClick={() => setIsPublishModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold rounded-xl border border-white/10 text-white/60 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handlePublishSubmit}
                disabled={publishing || (publishType === "schedule" && !scheduleDate)}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-[#e09050] text-white hover:bg-[#c97c3a] disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
              >
                {publishing && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                <span>{publishType === "schedule" ? "บันทึกและตั้งเวลา" : "ยืนยันการเผยแพร่"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
