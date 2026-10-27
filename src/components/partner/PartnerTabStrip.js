"use client";

import { cn } from "@/lib/utils";

/** Desktop (lg+) tab strip for partner dashboards; mobile uses DashboardTabBar. */
export function PartnerTabStrip({ tabs, active, onSelect, className }) {
  return (
    <div
      role="tablist"
      aria-label="Dashboard sections"
      className={cn(
        "hidden lg:flex w-fit items-center gap-1 rounded-2xl border border-[var(--border)] bg-[var(--surface-card)] p-1",
        className
      )}
    >
      {tabs.map(({ key, icon: Icon, label }) => {
        const isActive = active === key;
        return (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onSelect(key)}
            className={cn(
              "flex min-h-[44px] items-center gap-2 rounded-xl px-4 text-sm font-medium transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]",
              isActive
                ? "bg-[var(--surface-soft)] text-[var(--primary-dark)]"
                : "text-[var(--text-muted)] hover:bg-[var(--surface-soft)] hover:text-[var(--foreground)]"
            )}
          >
            <Icon size={16} aria-hidden="true" />
            {label}
          </button>
        );
      })}
    </div>
  );
}
