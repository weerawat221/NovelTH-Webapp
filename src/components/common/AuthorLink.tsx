"use client";

import Link from "next/link";
import React from "react";
import { User } from "lucide-react";

interface AuthorLinkProps {
  username: string;
  displayName: string;
  avatarUrl?: string | null;
  showAvatar?: boolean;
  showName?: boolean;
  size?: "sm" | "md" | "lg";
  theme?: "dark" | "light" | "warm";
  className?: string;
}

export default function AuthorLink({
  username,
  displayName,
  avatarUrl,
  showAvatar = true,
  showName = true,
  size = "md",
  theme = "dark",
  className = "",
}: AuthorLinkProps) {
  // Styles based on theme
  const themeMutedColor = {
    dark: "text-white/30 bg-white/10",
    light: "text-gray-500 bg-black/10",
    warm: "text-[#8c7a64] bg-[#eaddcd]/40",
  }[theme];

  // Sizes mapping
  const sizeClasses = {
    sm: {
      avatar: "h-6 w-6",
      icon: "h-3 w-3",
      text: "text-[11px]",
    },
    md: {
      avatar: "h-8 w-8",
      icon: "h-4 w-4",
      text: "text-xs font-semibold",
    },
    lg: {
      avatar: "h-10 w-10",
      icon: "h-5 w-5",
      text: "text-sm font-semibold",
    },
  }[size];

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <Link
      href={`/author/${username}`}
      onClick={handleClick}
      className={`inline-flex items-center gap-2 group transition-all ${className}`}
    >
      {showAvatar && (
        <div className="shrink-0">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={displayName}
              className={`${sizeClasses.avatar} rounded-full object-cover border border-white/5`}
            />
          ) : (
            <div className={`${sizeClasses.avatar} rounded-full flex items-center justify-center ${themeMutedColor}`}>
              <User className={sizeClasses.icon} />
            </div>
          )}
        </div>
      )}
      {showName && (
        <span className={`${sizeClasses.text} text-[#e09050] group-hover:underline group-hover:text-[#c97c3a] transition-colors leading-none`}>
          {displayName}
        </span>
      )}
    </Link>
  );
}
