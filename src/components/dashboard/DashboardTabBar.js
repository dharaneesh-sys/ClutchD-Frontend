"use client";

import { useRouter } from "next/navigation";
import {
  Wrench, Calendar, Car, ShoppingBag, History,
  Briefcase, MapPin, DollarSign, LayoutDashboard, Users, BarChart3, Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";

export const DASHBOARD_TABS = [
  { key: "request", icon: Wrench, label: "Service" },
  { key: "schedule", icon: Calendar, label: "Schedule" },
  { key: "vehicles", icon: Car, label: "Vehicles" },
  { key: "history", icon: History, label: "History" },
  { key: "store", icon: ShoppingBag, label: "Parts Store" },
];

/** Mechanic's tabs — shown on profile pages so mechanics keep their own
 *  dashboard nav there (instead of the marketplace Parts Store nav).
 *  Each tab carries an explicit deep-link path. */
export const MECHANIC_TABS = [
  { key: "jobs", icon: Briefcase, label: "Jobs", path: "/dashboard/mechanic?tab=jobs" },
  { key: "navigation", icon: MapPin, label: "Navigation", path: "/dashboard/mechanic?tab=navigation" },
  { key: "earnings", icon: DollarSign, label: "Earnings", path: "/dashboard/mechanic?tab=earnings" },
  { key: "store", icon: ShoppingBag, label: "Parts Store", path: "/marketplace" },
];

/** Garage's tabs — same idea as MECHANIC_TABS for garage profile pages. */
export const GARAGE_TABS = [
  { key: "dashboard", icon: LayoutDashboard, label: "Dashboard", path: "/dashboard/garage?tab=dashboard" },
  { key: "profile", icon: Users, label: "Garage Profile", path: "/dashboard/garage?tab=profile" },
  { key: "analytics", icon: BarChart3, label: "Analytics", path: "/dashboard/garage?tab=analytics" },
  { key: "store", icon: ShoppingBag, label: "Parts Store", path: "/marketplace" },
];

/** Seller's tabs — so sellers keep their own dashboard nav on profile pages
 *  (instead of the marketplace Parts Store nav). */
export const SELLER_TABS = [
  { key: "dashboard", icon: LayoutDashboard, label: "Dashboard", path: "/dashboard/seller?tab=dashboard" },
  { key: "listings", icon: ShoppingBag, label: "My Listings", path: "/dashboard/seller?tab=listings" },
  { key: "sales", icon: BarChart3, label: "Sales", path: "/dashboard/seller?tab=sales" },
  { key: "upload", icon: Plus, label: "Upload", path: "/dashboard/seller/upload" },
];

/**
 * The customer dashboard's bottom tab bar.
 *
 * - Controlled mode (`active` + `onSelect`): used inside the customer
 *   dashboard — tabs switch in place.
 * - Link mode (no props): used on marketplace profile pages so the
 *   regular dashboard nav replaces the marketplace (parts-store) nav
 *   there; taps deep-link back to /dashboard/customer?tab=<key>.
 */
export function DashboardTabBar({ active, onSelect, tabs = DASHBOARD_TABS }) {
  const router = useRouter();
  const linkMode = typeof onSelect !== "function";

  const handleSelect = (key) => {
    if (linkMode) {
      // Tab may define an explicit deep-link path (e.g. mechanic tabs);
      // default to the customer dashboard deep-link.
      const tab = tabs.find((t) => t.key === key);
      router.push(tab?.path || `/dashboard/customer?tab=${key}`);
    } else {
      onSelect(key);
    }
  };

  return (
    <nav
      className={cn(
        "flex fixed bottom-0 left-0 right-0 z-40",
        "bg-bg-card/85 backdrop-blur-2xl",
        "border-t border-border-subtle",
        "pb-[env(safe-area-inset-bottom)]",
        "shadow-[0_-4px_20px_rgba(0,0,0,0.12)]"
      )}
      aria-label="Dashboard"
    >
      <div className="flex items-center justify-around h-14 px-1 max-w-lg mx-auto w-full">
        {tabs.map(({ key, icon: Icon, label }) => {
          const isActive = active === key;
          return (
            <button
              key={key}
              onClick={() => handleSelect(key)}
              className={cn(
                "relative flex flex-col items-center justify-center gap-0.5 flex-1 h-full py-1 rounded-xl transition-all duration-200",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
                isActive && "bg-surface-soft"
              )}
              aria-label={label}
              aria-current={isActive ? "page" : undefined}
            >
              <div
                className={cn(
                  "relative flex items-center justify-center w-7 h-7 rounded-lg transition-colors duration-200",
                  isActive ? "text-primary" : "text-text-muted"
                )}
              >
                <Icon size={22} />
              </div>
              <span
                className={cn(
                  "text-[10px] font-semibold leading-none transition-colors duration-200",
                  isActive ? "text-primary" : "text-text-muted"
                )}
              >
                {label}
              </span>
              {/* Active indicator line */}
              {isActive && (
                <span className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-6 h-0.5 rounded-full bg-primary" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
