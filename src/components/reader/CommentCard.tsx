"use client";

import { useState } from "react";
import { CornerDownRight, EyeOff, Eye, Trash2, Shield, Pencil, X, Check, Smile } from "lucide-react";
import { relativeTime } from "@/lib/utils/relativeTime";
import type { CommentWithUser, ReadingTheme } from "@/types/novel";
import UserLink from "@/components/common/UserLink";
import AuthorLink from "@/components/common/AuthorLink";

const MAX_COMMENT_LENGTH = 1000;

const commentThemes = {
  dark: {
    text: "text-white/90",
    body: "text-white/75",
    muted: "text-white/30",
    border: "border-white/10",
    bgInput: "bg-white/5 text-white/80 placeholder:text-white/25",
    buttonBg: "bg-white/5 hover:bg-white/10 border-white/10 text-white/40 hover:text-white/50",
    buttonBgActive: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    replyBorder: "border-white/5",
    textareaBorder: "border-white/10 focus:ring-[#e09050]/50",
  },
  light: {
    text: "text-gray-900",
    body: "text-gray-800",
    muted: "text-gray-500",
    border: "border-gray-200",
    bgInput: "bg-gray-50 text-gray-900 placeholder:text-gray-400",
    buttonBg: "bg-gray-100 hover:bg-gray-200 border-gray-200 text-gray-500 hover:text-gray-700",
    buttonBgActive: "bg-amber-500/20 text-amber-600 border-amber-500/30",
    replyBorder: "border-gray-200",
    textareaBorder: "border-gray-200 focus:ring-[#e09050]/50",
  },
  warm: {
    text: "text-[#3d3529]",
    body: "text-[#4a3f31]",
    muted: "text-[#8c7a64]",
    border: "border-[#3d3529]/15",
    bgInput: "bg-[#eaddcd]/40 text-[#3d3529] placeholder:text-[#8c7a64]/60",
    buttonBg: "bg-[#eaddcd]/30 hover:bg-[#eaddcd]/60 border-[#3d3529]/15 text-[#8c7a64] hover:text-[#3d3529]",
    buttonBgActive: "bg-amber-500/20 text-amber-700 border-amber-500/30",
    replyBorder: "border-[#3d3529]/10",
    textareaBorder: "border-[#3d3529]/15 focus:ring-[#e09050]/50",
  }
};

// ─── Helper: check if the current user owns this comment ───
function isOwnComment(
  comment: CommentWithUser,
  currentUserId: number | null,
  currentCommenterType: "user" | "author" | "admin"
): boolean {
  if (!currentUserId) return false;
  if (comment.commenter_type !== currentCommenterType) return false;

  switch (currentCommenterType) {
    case "admin":
      return comment.admin_id === currentUserId;
    case "author":
      return comment.author_id === currentUserId;
    case "user":
      return comment.user_id === currentUserId;
    default:
      return false;
  }
}

interface CommentCardProps {
  comment: CommentWithUser;
  onReply: (parentId: number) => void;
  theme?: ReadingTheme;
  isNovelAuthor?: boolean;
  isAdmin?: boolean;
  currentUserId?: number | null;
  currentCommenterType?: "user" | "author" | "admin";
  onHide?: (commentId: number) => void;
  onUnhide?: (commentId: number) => void;
  onDelete?: (commentId: number, replyCount: number) => void;
  onEdit?: (commentId: number, newText: string, isSpoiler: boolean) => Promise<boolean>;
  onOwnHide?: (commentId: number) => void;
  onOwnUnhide?: (commentId: number) => void;
  onOwnDelete?: (commentId: number, replyCount: number) => void;
}

export default function CommentCard({
  comment,
  onReply,
  theme = "dark",
  isNovelAuthor = false,
  isAdmin = false,
  currentUserId = null,
  currentCommenterType = "user",
  onHide,
  onUnhide,
  onDelete,
  onEdit,
  onOwnHide,
  onOwnUnhide,
  onOwnDelete,
}: CommentCardProps) {
  const [spoilerRevealed, setSpoilerRevealed] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(comment.comment_text);
  const [editSpoiler, setEditSpoiler] = useState(comment.is_spoiler);
  const [editSaving, setEditSaving] = useState(false);
  const t = commentThemes[theme];

  const isOwn = isOwnComment(comment, currentUserId, currentCommenterType);

  const handleSaveEdit = async () => {
    if (!onEdit || !editText.trim()) return;

    setEditSaving(true);
    const success = await onEdit(comment.comment_id, editText.trim(), editSpoiler);
    setEditSaving(false);
    if (success) {
      setIsEditing(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditText(comment.comment_text);
    setEditSpoiler(comment.is_spoiler);
  };

  return (
    <div className={`space-y-3 ${comment.status === "hidden" ? "opacity-60 bg-red-950/5 p-2.5 rounded-xl border border-red-500/10" : ""}`}>
      {/* Main comment */}
      <div className="flex gap-3">
        {/* Avatar */}
        <div className="shrink-0 mt-0.5">
          {comment.commenter_type === "admin" && comment.admin ? (
            <div className="h-8 w-8 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center shadow-sm" title="ผู้ดูแลระบบ">
              <Shield className="h-4 w-4 text-red-400" />
            </div>
          ) : comment.commenter_type === "author" && comment.author ? (
            <AuthorLink
              username={comment.author.username}
              displayName={comment.author.pen_name}
              avatarUrl={comment.author.profile_image}
              showName={false}
              size="md"
              theme={theme}
            />
          ) : (
            comment.user && (
              <UserLink
                username={comment.user.username}
                displayName={comment.user.username}
                avatarUrl={comment.user.profile_image}
                showName={false}
                size="md"
                theme={theme}
              />
            )
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {comment.commenter_type === "admin" && comment.admin ? (
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-red-400">
                  {comment.admin.full_name || comment.admin.username}
                </span>
                <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/20 uppercase tracking-wider">
                  Admin
                </span>
              </div>
            ) : comment.commenter_type === "author" && comment.author ? (
              <AuthorLink
                username={comment.author.username}
                displayName={comment.author.pen_name}
                showAvatar={false}
                size="md"
                theme={theme}
              />
            ) : (
              comment.user && (
                <UserLink
                  username={comment.user.username}
                  displayName={comment.user.username}
                  showAvatar={false}
                  size="md"
                  theme={theme}
                />
              )
            )}
            <span className={`text-[10px] ${t.muted}`}>
              {relativeTime(comment.comment_date)}
            </span>
            {comment.status === "hidden" && (
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/20">
                ถูกซ่อนอยู่
              </span>
            )}
          </div>

          {/* ─── Inline Edit Mode ─── */}
          {isEditing ? (
            <div className="space-y-2">
              <textarea
                value={editText}
                onChange={(e) => setEditText(e.target.value.slice(0, MAX_COMMENT_LENGTH))}
                rows={3}
                className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 resize-none ${t.bgInput} ${t.border} ${t.textareaBorder}`}
                autoFocus
              />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setEditSpoiler(!editSpoiler)}
                    className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] transition-colors cursor-pointer ${
                      editSpoiler ? t.buttonBgActive : t.buttonBg
                    }`}
                  >
                    <Smile className="h-3 w-3" />
                    สปอยล์
                  </button>
                  <span className={`text-[10px] ${t.muted} opacity-70`}>
                    {editText.length}/{MAX_COMMENT_LENGTH}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={handleCancelEdit}
                    disabled={editSaving}
                    className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer ${t.buttonBg} disabled:opacity-30`}
                  >
                    <X className="h-3 w-3" />
                    ยกเลิก
                  </button>
                  <button
                    onClick={handleSaveEdit}
                    disabled={!editText.trim() || editSaving}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold bg-[#e09050] text-white hover:bg-[#c97c3a] disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                  >
                    <Check className="h-3 w-3" />
                    {editSaving ? "กำลังบันทึก..." : "บันทึก"}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Comment text (with spoiler support) */}
              {comment.is_spoiler && !spoilerRevealed ? (
                <button
                  onClick={() => setSpoilerRevealed(true)}
                  className={`text-xs rounded-lg px-3 py-2 border backdrop-blur-sm transition-colors cursor-pointer ${t.body} ${t.buttonBg}`}
                >
                  ⚠️ ข้อความนี้มีสปอยล์ — คลิกเพื่อดู
                </button>
              ) : (
                <p className={`text-sm leading-relaxed whitespace-pre-wrap break-words ${t.body}`}>
                  {comment.comment_text}
                </p>
              )}
            </>
          )}

          {/* Action buttons (Reply & Moderation & Own actions) */}
          {!isEditing && (
            <div className="flex items-center gap-3 mt-1.5 flex-wrap">
              {/* Reply button */}
              {comment.parent_comment_id === null && comment.status !== "hidden" && (
                <button
                  onClick={() => onReply(comment.comment_id)}
                  className={`flex items-center gap-1 text-[11px] transition-colors cursor-pointer ${t.muted} hover:text-[#e09050]`}
                >
                  <CornerDownRight className="h-3 w-3" />
                  ตอบกลับ
                </button>
              )}

              {/* ── Own-comment actions ── */}
              {isOwn && (
                <>
                  {/* Edit */}
                  <button
                    onClick={() => {
                      setEditText(comment.comment_text);
                      setEditSpoiler(comment.is_spoiler);
                      setIsEditing(true);
                    }}
                    className={`flex items-center gap-1 text-[11px] transition-colors cursor-pointer ${t.muted} hover:text-[#e09050]`}
                  >
                    <Pencil className="h-3 w-3" />
                    แก้ไข
                  </button>

                  {/* Own Hide/Unhide */}
                  {comment.status === "hidden" ? (
                    onOwnUnhide && (
                      <button
                        onClick={() => onOwnUnhide(comment.comment_id)}
                        className={`flex items-center gap-1 text-[11px] transition-colors cursor-pointer ${t.muted} hover:text-emerald-500`}
                      >
                        <Eye className="h-3 w-3" />
                        เลิกซ่อน
                      </button>
                    )
                  ) : (
                    onOwnHide && (
                      <button
                        onClick={() => onOwnHide(comment.comment_id)}
                        className={`flex items-center gap-1 text-[11px] transition-colors cursor-pointer ${t.muted} hover:text-orange-500`}
                      >
                        <EyeOff className="h-3 w-3" />
                        ซ่อน
                      </button>
                    )
                  )}

                  {/* Own Delete */}
                  {onOwnDelete && (
                    <button
                      onClick={() => onOwnDelete(comment.comment_id, comment.replies?.length || 0)}
                      className={`flex items-center gap-1 text-[11px] transition-colors cursor-pointer ${t.muted} hover:text-red-500`}
                    >
                      <Trash2 className="h-3 w-3" />
                      ลบ
                    </button>
                  )}
                </>
              )}

              {/* ── Moderator actions (novel author / admin) — only show if NOT own comment ── */}
              {!isOwn && isNovelAuthor && (
                comment.status === "hidden" ? (
                  <button
                    onClick={() => onUnhide && onUnhide(comment.comment_id)}
                    className={`flex items-center gap-1 text-[11px] transition-colors cursor-pointer ${t.muted} hover:text-emerald-500`}
                  >
                    <Eye className="h-3 w-3" />
                    เลิกซ่อน
                  </button>
                ) : (
                  onHide && (
                    <button
                      onClick={() => onHide(comment.comment_id)}
                      className={`flex items-center gap-1 text-[11px] transition-colors cursor-pointer ${t.muted} hover:text-red-500`}
                    >
                      <EyeOff className="h-3 w-3" />
                      ซ่อนความคิดเห็น
                    </button>
                  )
                )
              )}

              {!isOwn && isAdmin && onDelete && (
                <button
                  onClick={() => onDelete(comment.comment_id, comment.replies?.length || 0)}
                  className={`flex items-center gap-1 text-[11px] transition-colors cursor-pointer ${t.muted} hover:text-red-500`}
                >
                  <Trash2 className="h-3 w-3" />
                  ลบ
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Replies (indented) */}
      {comment.replies && comment.replies.length > 0 && (
        <div className={`ml-11 space-y-3 border-l-2 ${t.replyBorder} pl-4`}>
          {comment.replies.map((reply) => (
            <ReplyCard
              key={reply.comment_id}
              reply={reply}
              theme={theme}
              isNovelAuthor={isNovelAuthor}
              isAdmin={isAdmin}
              currentUserId={currentUserId}
              currentCommenterType={currentCommenterType}
              onHide={onHide}
              onUnhide={onUnhide}
              onDelete={onDelete}
              onEdit={onEdit}
              onOwnHide={onOwnHide}
              onOwnUnhide={onOwnUnhide}
              onOwnDelete={onOwnDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Reply sub-card (simpler, no nesting) ─── */
function ReplyCard({
  reply,
  theme = "dark",
  isNovelAuthor = false,
  isAdmin = false,
  currentUserId = null,
  currentCommenterType = "user",
  onHide,
  onUnhide,
  onDelete,
  onEdit,
  onOwnHide,
  onOwnUnhide,
  onOwnDelete,
}: {
  reply: CommentWithUser;
  theme?: ReadingTheme;
  isNovelAuthor?: boolean;
  isAdmin?: boolean;
  currentUserId?: number | null;
  currentCommenterType?: "user" | "author" | "admin";
  onHide?: (commentId: number) => void;
  onUnhide?: (commentId: number) => void;
  onDelete?: (commentId: number, replyCount: number) => void;
  onEdit?: (commentId: number, newText: string, isSpoiler: boolean) => Promise<boolean>;
  onOwnHide?: (commentId: number) => void;
  onOwnUnhide?: (commentId: number) => void;
  onOwnDelete?: (commentId: number, replyCount: number) => void;
}) {
  const [spoilerRevealed, setSpoilerRevealed] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(reply.comment_text);
  const [editSpoiler, setEditSpoiler] = useState(reply.is_spoiler);
  const [editSaving, setEditSaving] = useState(false);
  const t = commentThemes[theme];

  const isOwn = isOwnComment(reply, currentUserId, currentCommenterType);

  const handleSaveEdit = async () => {
    if (!onEdit || !editText.trim()) return;
    setEditSaving(true);
    const success = await onEdit(reply.comment_id, editText.trim(), editSpoiler);
    setEditSaving(false);
    if (success) {
      setIsEditing(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditText(reply.comment_text);
    setEditSpoiler(reply.is_spoiler);
  };

  return (
    <div className={`flex gap-2.5 ${reply.status === "hidden" ? "opacity-60 bg-red-950/5 p-1.5 rounded-lg border border-red-500/5" : ""}`} id={`comment-${reply.comment_id}`}>
      {/* Avatar */}
      <div className="shrink-0 mt-0.5">
        {reply.commenter_type === "admin" && reply.admin ? (
          <div className="h-6 w-6 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center shadow-sm" title="ผู้ดูแลระบบ">
            <Shield className="h-3 w-3 text-red-400" />
          </div>
        ) : reply.commenter_type === "author" && reply.author ? (
          <AuthorLink
            username={reply.author.username}
            displayName={reply.author.pen_name}
            avatarUrl={reply.author.profile_image}
            showName={false}
            size="sm"
            theme={theme}
          />
        ) : (
          reply.user && (
            <UserLink
              username={reply.user.username}
              displayName={reply.user.username}
              avatarUrl={reply.user.profile_image}
              showName={false}
              size="sm"
              theme={theme}
            />
          )
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          {reply.commenter_type === "admin" && reply.admin ? (
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-red-400">
                {reply.admin.full_name || reply.admin.username}
              </span>
              <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/20 uppercase tracking-wider">
                Admin
              </span>
            </div>
          ) : reply.commenter_type === "author" && reply.author ? (
            <AuthorLink
              username={reply.author.username}
              displayName={reply.author.pen_name}
              showAvatar={false}
              size="sm"
              theme={theme}
            />
          ) : (
            reply.user && (
              <UserLink
                username={reply.user.username}
                displayName={reply.user.username}
                showAvatar={false}
                size="sm"
                theme={theme}
              />
            )
          )}
          <span className={`text-[10px] ${t.muted}`}>
            {relativeTime(reply.comment_date)}
          </span>
          {reply.status === "hidden" && (
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/20">
              ถูกซ่อนอยู่
            </span>
          )}
        </div>

        {/* ─── Inline Edit Mode ─── */}
        {isEditing ? (
          <div className="space-y-2">
            <textarea
              value={editText}
              onChange={(e) => setEditText(e.target.value.slice(0, MAX_COMMENT_LENGTH))}
              rows={2}
              className={`w-full border rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 resize-none ${t.bgInput} ${t.border} ${t.textareaBorder}`}
              autoFocus
            />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setEditSpoiler(!editSpoiler)}
                  className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] transition-colors cursor-pointer ${
                    editSpoiler ? t.buttonBgActive : t.buttonBg
                  }`}
                >
                  <Smile className="h-3 w-3" />
                  สปอยล์
                </button>
                <span className={`text-[10px] ${t.muted} opacity-70`}>
                  {editText.length}/{MAX_COMMENT_LENGTH}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={handleCancelEdit}
                  disabled={editSaving}
                  className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-semibold transition-colors cursor-pointer ${t.buttonBg} disabled:opacity-30`}
                >
                  <X className="h-3 w-3" />
                  ยกเลิก
                </button>
                <button
                  onClick={handleSaveEdit}
                  disabled={!editText.trim() || editSaving}
                  className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-semibold bg-[#e09050] text-white hover:bg-[#c97c3a] disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                >
                  <Check className="h-3 w-3" />
                  {editSaving ? "กำลังบันทึก..." : "บันทึก"}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <>
            {reply.is_spoiler && !spoilerRevealed ? (
              <button
                onClick={() => setSpoilerRevealed(true)}
                className={`text-[11px] rounded-lg px-2.5 py-1.5 border transition-colors cursor-pointer ${t.body} ${t.buttonBg}`}
              >
                ⚠️ สปอยล์ — คลิกเพื่อดู
              </button>
            ) : (
              <p className={`text-[13px] leading-relaxed whitespace-pre-wrap break-words ${t.body}`}>
                {reply.comment_text}
              </p>
            )}
          </>
        )}

        {/* Action buttons */}
        {!isEditing && (
          <div className="flex items-center gap-3 mt-1 text-[10px] flex-wrap">
            {/* ── Own-reply actions ── */}
            {isOwn && (
              <>
                {/* Edit */}
                <button
                  onClick={() => {
                    setEditText(reply.comment_text);
                    setEditSpoiler(reply.is_spoiler);
                    setIsEditing(true);
                  }}
                  className={`flex items-center gap-1 transition-colors cursor-pointer ${t.muted} hover:text-[#e09050]`}
                >
                  <Pencil className="h-3 w-3" />
                  แก้ไข
                </button>

                {/* Own Hide/Unhide */}
                {reply.status === "hidden" ? (
                  onOwnUnhide && (
                    <button
                      onClick={() => onOwnUnhide(reply.comment_id)}
                      className={`flex items-center gap-1 transition-colors cursor-pointer ${t.muted} hover:text-emerald-500`}
                    >
                      <Eye className="h-3 w-3" />
                      เลิกซ่อน
                    </button>
                  )
                ) : (
                  onOwnHide && (
                    <button
                      onClick={() => onOwnHide(reply.comment_id)}
                      className={`flex items-center gap-1 transition-colors cursor-pointer ${t.muted} hover:text-orange-500`}
                    >
                      <EyeOff className="h-3 w-3" />
                      ซ่อน
                    </button>
                  )
                )}

                {/* Own Delete */}
                {onOwnDelete && (
                  <button
                    onClick={() => onOwnDelete(reply.comment_id, 0)}
                    className={`flex items-center gap-1 transition-colors cursor-pointer ${t.muted} hover:text-red-500`}
                  >
                    <Trash2 className="h-3 w-3" />
                    ลบ
                  </button>
                )}
              </>
            )}

            {/* ── Moderator actions — only if NOT own ── */}
            {!isOwn && isNovelAuthor && (
              reply.status === "hidden" ? (
                <button
                  onClick={() => onUnhide && onUnhide(reply.comment_id)}
                  className={`flex items-center gap-1 transition-colors cursor-pointer ${t.muted} hover:text-emerald-500`}
                >
                  <Eye className="h-3 w-3" />
                  เลิกซ่อน
                </button>
              ) : (
                onHide && (
                  <button
                    onClick={() => onHide(reply.comment_id)}
                    className={`flex items-center gap-1 transition-colors cursor-pointer ${t.muted} hover:text-red-500`}
                  >
                    <EyeOff className="h-3 w-3" />
                    ซ่อนความคิดเห็น
                  </button>
                )
              )
            )}

            {!isOwn && isAdmin && onDelete && (
              <button
                onClick={() => onDelete(reply.comment_id, 0)}
                className={`flex items-center gap-1 transition-colors cursor-pointer ${t.muted} hover:text-red-500`}
              >
                <Trash2 className="h-3 w-3" />
                ลบ
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
