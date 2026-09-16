"use client";

import { useRouter, usePathname } from "next/navigation";
import {
  Home, Grid3X3, Search, ShoppingCart, User, Settings,
  Sun, Moon, UserCircle, Package, Heart, AlertTriangle, Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useCartStore } from "@/store/cartStore";
import { useThemeStore } from "@/store/themeStore";
import { useState, useEffect, useRef } from "react";
import { useSOS } from "@/components/ui/useSOS";

const NAV_ITEMS = [
  { icon: Home, label: "Home", path: "/marketplace" },
  { icon: Grid3X3, label: "Categories", path: "/marketplace/categories" },
  { icon: Search, label: "Search", path: "/marketplace/search" },
  { icon: ShoppingCart, label: "Cart", path: "/marketplace/cart", badge: true },
  { icon: User, label: "Profile", path: "/marketplace/profile" },
  { icon: Settings, label: "Menu", settings: true },
];

export function BottomNav() {
  const router = useRouter();
  const pathname = usePathname();
  const itemCount = useCartStore((state) => state.getItemCount());
  const theme = useThemeStore((s) => s.theme);
  const toggleTheme = useThemeStore((s) => s.toggleTheme);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const sos = useSOS();
  const settingsRef = useRef(null);
  const popoverRef = useRef(null);

  const isActive = (path) => {
    if (path === "/marketplace") {
      return pathname === "/marketplace";
    }
    return pathname.startsWith(path);
  };

  // Close popover on outside click and Escape key
  useEffect(() => {
    if (!isSettingsOpen) return;

    const handleClickOutside = (e) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target) &&
        settingsRef.current &&
        !settingsRef.current.contains(e.target)
      ) {
        setIsSettingsOpen(false);
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === "Escape") setIsSettingsOpen(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isSettingsOpen]);

  // Close popover on route change
  useEffect(() => {
    /* eslint-disable-next-line react-hooks/set-state-in-effect */
    setIsSettingsOpen(false);
  }, [pathname]);

  return (
    <nav
      className={cn(
        "fixed bottom-0 left-0 right-0 z-40",
        "lg:hidden",
        "bg-bg-card backdrop-blur-2xl",
        "border-t border-border-subtle",
        "pb-[env(safe-area-inset-bottom)]"
      )}
    >
      <div className="flex items-center justify-around h-16 px-2">
        {NAV_ITEMS.map(({ icon: Icon, label, path, badge, settings }) => {
          // Settings button renders with popover
          if (settings) {
            return (
              <div
                key="menu"
                ref={settingsRef}
                className="relative flex flex-1 items-center justify-center h-full"
              >
                <button
                  onClick={() => setIsSettingsOpen((prev) => !prev)}
                  className={cn(
                    "flex flex-col items-center justify-center gap-0.5",
                    "w-full h-full py-1 rounded-lg",
                    "transition-colors duration-200",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
                  )}
                  aria-label="Menu"
                  aria-haspopup="true"
                  aria-expanded={isSettingsOpen}
                >
                  <div className="relative">
                    <Icon
                      size={22}
                      className={cn(
                        "transition-colors duration-200",
                        isSettingsOpen ? "text-primary" : "text-text-muted"
                      )}
                    />
                  </div>
                  <span
                    className={cn(
                      "type-label-2",
                      "transition-colors duration-200",
                      isSettingsOpen ? "text-primary" : "text-text-muted"
                    )}
                  >
                    {label}
                  </span>
                </button>

                {/* Settings Popover */}
                {isSettingsOpen && (
                  <div
                    ref={popoverRef}
                    className={cn(
                      "absolute bottom-full right-0 mb-3",
                      "min-w-[220px]",
                      "bg-bg-card backdrop-blur-2xl",
                      "border border-border-subtle",
                      "rounded-xl shadow-2xl",
                      "p-3 z-[9999]",
                      "animate-scale-in"
                    )}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {/* Profile navigation links */}
                    <div className="flex flex-col gap-0.5 mb-2 pb-2 border-b border-border-subtle">
                      <button
                        onClick={(e) => { e.stopPropagation(); router.push("/marketplace/profile"); setIsSettingsOpen(false); }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/5 transition-colors"
                      >
                        <UserCircle size={18} className="text-text-muted" />
                        <span className="text-sm font-medium text-foreground">My Profile</span>
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); router.push("/marketplace/profile/orders"); setIsSettingsOpen(false); }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/5 transition-colors"
                      >
                        <Package size={18} className="text-text-muted" />
                        <span className="text-sm font-medium text-foreground">Orders</span>
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); router.push("/marketplace/profile/favorites"); setIsSettingsOpen(false); }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/5 transition-colors"
                      >
                        <Heart size={18} className="text-text-muted" />
                        <span className="text-sm font-medium text-foreground">Favorites</span>
                      </button>
                    </div>

                    {/* Emergency SOS row — inline 2-tap confirm, no overlay */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        sos.handleSOS();
                      }}
                      disabled={sos.loading || sos.status === "sent" || sos.status === "queued"}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-red-500/10 transition-colors text-left"
                      aria-label="Emergency SOS"
                    >
                      {sos.loading ? (
                        <Loader2 size={18} className="text-red-400 animate-spin" />
                      ) : (
                        <AlertTriangle size={18} className="text-red-400" />
                      )}
                      <span className="text-sm font-semibold text-red-400">
                        {sos.loading
                          ? "Sending SOS..."
                          : sos.status === "sent"
                            ? "Help En Route!"
                            : sos.status === "queued"
                              ? "SOS Queued"
                              : sos.status === "confirming"
                                ? "Tap again to confirm"
                                : "Emergency SOS"}
                      </span>
                    </button>
                    {sos.queuedMsg && (
                      <p className="px-3 pb-1 text-xs text-[var(--primary-light)]">{sos.queuedMsg}</p>
                    )}

                    {/* Theme row */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleTheme();
                      }}
                      className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-white/5 transition-colors"
                    >
                      <span className="text-sm font-medium text-foreground">Theme</span>
                      <span className="flex items-center gap-2 text-sm text-text-muted">
                        {theme === "light" ? <Sun size={16} /> : <Moon size={16} />}
                        {theme === "light" ? "Light" : "Dark"}
                      </span>
                    </button>

                  </div>
                )}
              </div>
            );
          }

          // Regular nav items
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
