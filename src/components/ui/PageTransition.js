"use client";

import { cn } from "@/lib/utils";

export function PageTransition({ children, className }) {
  return (
    <div className={cn("w-full page-enter", className)}>
      {children}
    </div>
  );
}
