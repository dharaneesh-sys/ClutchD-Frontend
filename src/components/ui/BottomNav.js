"use client";

import { useRouter, usePathname } from "next/navigation";
import { Home, Grid3X3, Search, ShoppingCart, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCartStore } from "@/store/cartStore";

const NAV_ITEMS = [
  { icon: Home, label: "Home", path: "/marketplace" },
  { icon: Grid3X3, label: "Categories", path: "/marketplace/categories" },
  { icon: Search, label: "Search", path: "/marketplace/search" },
  { icon: ShoppingCart, label: "Cart", path: "/marketplace/cart", badge: true },
  { icon: User, label: "Profile", path: "/marketplace/profile" },
];

export function BottomNav() {
  const router = useRouter();
  const pathname = usePathname();
  const itemCount = useCartStore((state) => state.getItemCount());

  const isActive = (path) => {
    if (path === "/marketplace") {
      return pathname === "/marketplace";
    }
    return pathname.startsWith(path);
  };

  return (
    <nav
      className={cn(
        "fixed bottom-0 left-0 right-0 z-50",
        "lg:hidden",
        "bg-bg-card backdrop-blur-2xl",
        "border-t border-border-subtle",
        "pb-[env(safe-area-inset-bottom)]"
      )}
    >
      <div className="flex items-center justify-around h-16 px-2">
        {NAV_ITEMS.map(({ icon: Icon, label, path, badge }) => {
          const active = isActive(path);

          return (
            <button
              key={path}
              onClick={() => router.push(path)}
              className={cn(
                "relative flex flex-col items-center justify-center gap-0.5",
                "flex-1 h-full py-1 rounded-lg",
                "transition-colors duration-200",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
              )}
              aria-label={label}
              aria-current={active ? "page" : undefined}
            >
              <div className="relative">
                <Icon
                  size={22}
                  className={cn(
                    "transition-colors duration-200",
                    active ? "text-primary" : "text-text-muted"
                  )}
                />
                {badge && itemCount > 0 && (
                  <span
                    className={cn(
                      "absolute -top-1.5 -right-1.5",
                      "flex items-center justify-center",
                      "min-w-[18px] h-[18px] px-1",
                      "rounded-full",
                      "bg-danger text-white",
                      "text-[10px] font-bold leading-none",
                      "shadow-lg"
                    )}
                  >
                    {itemCount > 99 ? "99+" : itemCount}
                  </span>
                )}
              </div>
              <span
                className={cn(
                  "type-label-2",
                  "transition-colors duration-200",
                  active ? "text-primary" : "text-text-muted"
                )}
              >
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
