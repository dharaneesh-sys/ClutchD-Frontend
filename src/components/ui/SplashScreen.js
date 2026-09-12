"use client";

import { Loader2 } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { Logo } from "@/components/ui/Logo";

export default function SplashScreen() {
  const _isRestoring = useAuthStore((s) => s._isRestoring);

  if (!_isRestoring) return null;

  return (
    <div className="min-h-[100dvh] w-full flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-6">
        <Logo size="lg" showText />
        <Loader2 className="w-6 h-6 animate-spin text-foreground/60" />
      </div>
    </div>
  );
}
