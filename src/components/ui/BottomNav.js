"use client";

import { usePathname } from "next/navigation";
import { useCartStore } from "@/store/cartStore";
import { DashboardTabBar, MARKETPLACE_TABS } from "@/components/dashboard/DashboardTabBar";

/** Active marketplace tab for a path (Home is exact; the rest match by prefix). */
export function marketplaceTabFor(pathname = "") {
  if (pathname === "/marketplace" || pathname === "/marketplace/") return "home";
  const hit = MARKETPLACE_TABS.find((t) => t.key !== "home" && pathname.startsWith(t.path));
  return hit?.key;
}

/**
 * Marketplace store bottom nav: exactly Home, Categories, Search, Cart,
 * Profile (plan nav matrix). Theme/SOS/help live in the header overflow
 * (`MarketplaceMenu`), not in a sixth item.
 */
export function BottomNav() {
  const pathname = usePathname();
  const itemCount = useCartStore((state) => state.getItemCount());

  return (
    <DashboardTabBar
      tabs={MARKETPLACE_TABS}
      active={marketplaceTabFor(pathname)}
      badges={{ cart: itemCount }}
      label="Store"
      className="lg:hidden"
    />
  );
}
