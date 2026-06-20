"use client";

import { cn } from "@/lib/utils";

const sizeClasses = {
  sm: "w-5 h-5 text-xs",
  md: "w-7 h-7 text-sm",
  lg: "w-10 h-10 text-base",
};

const textSizeClasses = {
  sm: "text-sm",
  md: "text-lg",
  lg: "text-xl",
};

export function Logo({
  size = "md",
  className,
  showText = false,
}) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div
        className={cn(
          "rounded-xl flex items-center justify-center text-white font-bold tracking-tighter",
          "bg-gradient-to-br from-[var(--primary)] to-[var(--primary-dark)]",
          "shadow-lg shadow-[var(--primary)]/20",
          sizeClasses[size]
        )}
        aria-hidden="true"
      >
        C
      </div>
      {showText && (
        <span
          className={cn(
            "font-bold tracking-tight",
            "text-[var(--foreground)]",
            textSizeClasses[size]
          )}
        >
          ClutchD
        </span>
      )}
    </div>
  );
}