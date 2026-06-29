"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { BottomNav } from "@/components/ui/BottomNav";

export default function MarketplaceLayout({ children }) {
  const router = useRouter();

  const handleBack = () => {
    if (typeof window !== "undefined" && window.history.length <= 1) {
      router.push("/dashboard");
    } else {
      router.back();
    }
  };

  return (
    <div className="min-h-[100dvh] flex flex-col">
      <button
        onClick={handleBack}
        className="fixed top-4 left-4 flex items-center justify-center w-10 h-10 rounded-full bg-bg-card backdrop-blur-2xl border border-border-subtle shadow-2xl transition-all duration-200 hover:scale-105 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
        aria-label="Go back"
      >
        <ArrowLeft size={20} className="text-text-muted" />
      </button>
      <main className="flex-1 pt-14 pb-20">{children}</main>
      <BottomNav />
    </div>
  );
}
