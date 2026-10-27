"use client";

import { useRouter } from "next/navigation";
import {
  Wrench, Calendar, Car, ShoppingBag, History, Home, Grid3X3, Search, ShoppingCart, User,
  MapPin, Wallet, LayoutDashboard, BarChart3, Building2, LifeBuoy, Plus, Briefcase,
} from "lucide-react";
import { cn } from "@/lib/utils";

/*
 * Authoritative nav matrix (DESIGN.md §0, plan "Navigation matrix"):
 *   customer 5 · marketplace 5 · mechanic 5 · garage 5 · seller 4 · admin = sidebar.
 * Keys double as `?tab=` deep-link values and must stay stable.
 */

export const DASHBOARD_TABS = [
  { key: "request", icon: Wrench, label: "Service" },
  { key: "schedule", icon: Calendar, label: "Schedule" },
  { key: "vehicles", icon: Car, label: "Vehicles" },
  { key: "history", icon: History, label: "History" },
  { key: "store", icon: ShoppingBag, label: "Store" },
];
export const CUSTOMER_TABS = DASHBOARD_TABS;

export const MARKETPLACE_TABS = [
  { key: "home", icon: Home, label: "Home", path: "/marketplace" },
  { key: "categories", icon: Grid3X3, label: "Categories", path: "/marketplace/categories" },
  { key: "search", icon: Search, label: "Search", path: "/marketplace/search" },
  { key: "cart", icon: ShoppingCart, label: "Cart", path: "/marketplace/cart" },
  { key: "profile", icon: User, label: "Profile", path: "/marketplace/profile" },
];

export const MECHANIC_TABS = [
  { key: "home", icon: Home, label: "Home", path: "/dashboard/mechanic?tab=home" },
  { key: "navigation", icon: MapPin, label: "Navigation", path: "/dashboard/mechanic?tab=navigation" },
  { key: "earnings", icon: Wallet, label: "Earnings", path: "/dashboard/mechanic?tab=earnings" },
  { key: "history", icon: History, label: "History", path: "/dashboard/mechanic?tab=history" },
  { key: "support", icon: LifeBuoy, label: "Support", path: "/dashboard/mechanic?tab=support" },
];

export const GARAGE_TABS = [
  { key: "dashboard", icon: Home, label: "Home", path: "/dashboard/garage?tab=dashboard" },
  { key: "jobs", icon: Briefcase, label: "Jobs", path: "/dashboard/garage?tab=jobs" },
  { key: "analytics", icon: BarChart3, label: "Analytics", path: "/dashboard/garage?tab=analytics" },
  { key: "profile", icon: Building2, label: "Garage", path: "/dashboard/garage?tab=profile" },
  { key: "support", icon: LifeBuoy, label: "Support", path: "/dashboard/garage?tab=support" },
];

export const SELLER_TABS = [
  { key: "dashboard", icon: LayoutDashboard, label: "Dashboard", path: "/dashboard/seller?tab=dashboard" },
  { key: "listings", icon: ShoppingBag, label: "Listings", path: "/dashboard/seller?tab=listings" },
  { key: "sales", icon: BarChart3, label: "Sales", path: "/dashboard/seller?tab=sales" },
  { key: "upload", icon: Plus, label: "Upload", path: "/dashboard/seller/upload" },
];

/** Legacy `?tab=` values that still deep-link to a current tab. */
export const TAB_ALIASES = {
  mechanic: { jobs: "home" },
  garage: {},
};

/**
 * Resolve a raw `?tab=` value against a tab set, honouring aliases.
 * Unknown values fall back to the first tab.
 */
export function resolveTab(tabs, raw, aliases = {}) {
  const key = Object.hasOwn(aliases, raw) ? aliases[raw] : raw;
  return tabs.some((t) => t.key === key) ? key : tabs[0].key;
}

/** Height of the bar (without the safe-area inset); content pads by this. */
export const TAB_BAR_HEIGHT = 64;

/**
 * Fixed bottom tab bar — one of the four approved glass surfaces.
 *
 * - Controlled mode (`active` + `onSelect`): tabs switch in place.
 * - Link mode (no `onSelect`): taps push the tab's `path`, or the customer
 *   dashboard deep link when a tab has none.
 */
export function DashboardTabBar({ active, onSelect, tabs = DASHBOARD_TABS, badges = {}, className, label = "Dashboard" }) {
  const router = useRouter();
  const linkMode = typeof onSelect !== "function";

  const handleSelect = (key) => {
    if (linkMode) {
      const tab = tabs.find((t) => t.key === key);
      router.push(tab?.path || `/dashboard/customer?tab=${key}`);
    } else {
      onSelect(key);
    }
  };

  return (
    <nav
      style={{ boxShadow: "var(--elevation-2)" }}
      className={cn(
        "fixed bottom-0 left-0 right-0 z-40",
        "bg-[var(--glass-overlay-bg)] backdrop-blur-[var(--glass-overlay-blur)]",
        "border-t border-[var(--glass-overlay-border)]",
        "pb-[env(safe-area-inset-bottom)] pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)]",
        className
      )}
      aria-label={label}
    >
      <div className="mx-auto flex h-16 w-full max-w-lg items-stretch justify-around px-1">
        {tabs.map(({ key, icon: Icon, label: tabLabel }) => {
          const isActive = active === key;
          const badge = badges[key];
          return (
            <button
              key={key}
              type="button"
              onClick={() => handleSelect(key)}
              className={cn(
                "relative flex min-h-[44px] min-w-[44px] flex-1 flex-col items-center justify-center gap-1 rounded-xl py-1.5",
                "transition-colors duration-150",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--ring)]"
              )}
              aria-label={tabLabel}
              aria-current={isActive ? "page" : undefined}
            >
              <span
                className={cn(
                  "relative flex h-8 w-14 items-center justify-center rounded-full transition-colors duration-150",
                  isActive ? "bg-[var(--surface-soft)] text-[var(--primary-dark)]" : "text-[var(--text-muted)]"
                )}
              >
                <Icon size={22} aria-hidden="true" />
                {Boolean(badge) && (
                  <span className="absolute -right-0.5 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[var(--danger)] px-1 text-[10px] font-bold leading-none text-[var(--on-primary)]">
                    {badge > 99 ? "99+" : badge}
                  </span>
                )}
              </span>
              <span
                className={cn(
                  "type-label-2 leading-none",
                  isActive ? "font-semibold text-[var(--primary-dark)]" : "text-[var(--text-muted)]"
                )}
              >
                {tabLabel}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
