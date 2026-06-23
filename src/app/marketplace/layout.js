"use client";

import { BottomNav } from "@/components/ui/BottomNav";

export default function MarketplaceLayout({ children }) {
  return (
    <div className="min-h-[100dvh] flex flex-col">
      <main className="flex-1 pb-20">{children}</main>
      <BottomNav />
    </div>
  );
}
