"use client";

import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export default function LoadingScreen({ label = "Loading...", className }) {
  return (
    <div className={cn("flex items-center justify-center min-h-screen", className)} style={{ backgroundColor: "var(--background)" }}>
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
        <p className="text-sm text-white/60 animate-pulse">{label}</p>
      </div>
    </div>
  );
}