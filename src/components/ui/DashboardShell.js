"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/ui/Logo";
import { ConnectionIndicator } from "@/components/ui/ConnectionIndicator";
import { NotificationBell } from "@/components/ui/NotificationBell";
import { useRouter } from "next/navigation";
import { User, Building2, Wrench, Truck, Gift, Menu, X, Store } from "lucide-react";
import { SubscriptionBadge } from "@/components/subscription/SubscriptionBadge";

const MODE_CONFIG = {
  customer: {
    icon: User,
    label: "Customer Mode",
    color: "primary",
    textClass: "text-[var(--primary-dark)] ",
    avatarClass: "bg-[var(--surface-soft)] border border-[var(--border)] text-[var(--primary-dark)] ",
  },
  garage: {
    icon: Building2,
    label: "Business Mode",
    color: "primary",
    textClass: "text-[var(--primary-dark)]",
    avatarClass: "bg-[var(--surface-soft)] border border-[var(--border)] text-[var(--primary-dark)]",
  },
  seller: {
    icon: Store,
    label: "Seller Mode",
    color: "primary",
    textClass: "text-[var(--primary-dark)]",
    avatarClass: "bg-[var(--surface-soft)] border border-[var(--border)] text-[var(--primary-dark)]",
  },
  mechanic: {
    icon: Wrench,
    label: "Provider Mode",
    color: "primary",
    textClass: "text-[var(--primary-dark)]",
    avatarClass: "bg-[var(--surface-soft)] border border-[var(--border)] text-[var(--primary-dark)]",
  },
  fleet: {
    icon: Truck,
    label: "Fleet Mode",
    color: "info",
    textClass: "text-[var(--primary-dark)]",
    avatarClass: "bg-[var(--surface-soft)] border border-[var(--border)] text-[var(--primary-dark)]",
  },
};

export function DashboardShell({
  children,
  title,
  subtitle,
  user,
  mode = "customer",
  sidebar,
  onReferral,
  className,
  hideMenu = false,
  hasBottomNav = false,
  desktopSidebar = false,
  greeting,
}) {
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const config = MODE_CONFIG[mode] || MODE_CONFIG.customer;
  const ModeIcon = config.icon;

  return (
    <div className={cn("min-h-[100dvh] w-full flex flex-col", className)}>
      {/* Header */}
      {/* Flat header: gear mark, optional greeting, bell, avatar. */}
      <header className={cn(
        "flex justify-between items-center gap-3 px-4 lg:px-6 py-3 lg:py-4 flex-shrink-0 relative z-50",
        "pt-[max(0.75rem,env(safe-area-inset-top))] pl-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))]",
        "bg-[var(--surface-card)] border-b border-[var(--border)]"
      )}>
        {/* Left: Logo (+ greeting on mobile) */}
        <div className="flex min-w-0 items-center gap-2 lg:gap-3">
          <Logo size="md" showText={!greeting} className={greeting ? "lg:hidden" : undefined} />
          {greeting && <Logo size="md" showText className="hidden lg:flex" />}
          {greeting && (
            <div className="min-w-0 lg:hidden">
              <p className="truncate text-xs text-[var(--text-muted)]">{greeting.eyebrow || "Welcome back"}</p>
              <p className="truncate text-base font-semibold text-[var(--foreground)]">{greeting.name}</p>
            </div>
          )}
        </div>

        {/* Center: Title/Subtitle (desktop only) */}
        <div className="hidden lg:flex flex-col items-center gap-0.5 flex-1">
          {title && (
            <h1 className={cn(
              "text-lg font-bold tracking-tight",
              "text-[var(--foreground)]"
            )}>
              {title}
            </h1>
          )}
          {subtitle && (
            <span className={cn(
              "text-[10px] uppercase tracking-wider font-medium",
              config.textClass
            )}>
              {subtitle}
            </span>
          )}
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 lg:gap-4">
          {/* User info (desktop) */}
          <div className="hidden lg:flex flex-col items-end mr-2">
            <div className="flex items-center gap-2">
              <span className={cn(
                "text-sm font-semibold",
                "text-[var(--foreground)]"
              )}>
                {user?.name || config.label}
              </span>
              <SubscriptionBadge variant="pill" showPlanName />
            </div>
            <span className={cn(
              "text-[10px] uppercase tracking-wider font-medium",
              config.textClass
            )}>
              {config.label}
            </span>
          </div>

          {/* Connection & Notifications */}
          <div className="hidden lg:block">
            <ConnectionIndicator />
          </div>
          <NotificationBell />

          {/* User avatar — clickable to profile */}
          <button
            onClick={() => router.push("/marketplace/profile")}
            aria-label="View profile"
            className={cn(
              "w-11 h-11 shrink-0 rounded-full flex items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]",
              config.avatarClass
            )}
          >
            <ModeIcon size={16} />
          </button>
          {/* Mobile menu button — only when sidebar nav is used */}
          {!hideMenu && (
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden flex h-11 w-11 items-center justify-center rounded-lg text-[var(--text-muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-soft)]"
              aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          )}
        </div>
      </header>

      {/* Mobile sidebar overlay — only when sidebar nav is used */}
      {!hideMenu && mobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-[var(--glass-overlay-scrim)]"
          onClick={() => setMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Mobile sidebar — only when sidebar nav is used */}
      {!hideMenu && mobileMenuOpen && (
        <aside className={cn(
          "lg:hidden fixed top-0 right-0 h-full w-64 z-50 flex flex-col pt-[env(safe-area-inset-top)]",
          "bg-[var(--surface-card)] border-l border-[var(--border)]"
        )}>
          <div className="p-4 border-b border-[var(--border)] flex items-center justify-between">
            <Logo size="md" showText />
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="flex h-11 w-11 items-center justify-center rounded-lg text-[var(--text-muted)] hover:bg-[var(--surface-soft)]"
              aria-label="Close menu"
            >
              <X size={20} />
            </button>
          </div>
          <nav className="flex-1 p-4 overflow-y-auto">
            {sidebar?.map((item, index) => (
              <button
                key={index}
                onClick={() => {
                  item.onClick?.();
                  setMobileMenuOpen(false);
                }}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors mb-2",
                  "text-[var(--text-muted)] hover:bg-[var(--surface-soft)] hover:text-[var(--foreground)]"
                )}
              >
                <item.icon size={18} />
                <span>{item.label}</span>
              </button>
            ))}

            {/* Profile Link */}
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                router.push("/marketplace/profile");
              }}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors mb-2",
                "text-[var(--text-muted)] hover:bg-[var(--surface-soft)] hover:text-[var(--foreground)]"
              )}
            >
              <User size={18} />
              <span>Profile</span>
            </button>

            {/* Referral Link */}
            {onReferral && (
              <button
                onClick={() => {
                  onReferral();
                  setMobileMenuOpen(false);
                }}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors mb-2",
                  "text-[var(--text-muted)] hover:bg-[var(--surface-soft)] hover:text-[var(--foreground)]"
                )}
              >
                <Gift size={18} />
                <span>Referral</span>
              </button>
            )}

          </nav>
        </aside>
      )}

      {/* Main content */}
      <main className={cn(
        "flex-1",
        // hasBottomNav: true = bar at every width; "mobile" = bar hidden at lg.
        hasBottomNav ? "pb-[calc(64px+env(safe-area-inset-bottom)+1rem)]" : "pb-4 lg:pb-6",
        hasBottomNav === "mobile" && "lg:pb-6",
        desktopSidebar && "lg:ml-16"
      )}>
        <div className="p-3 sm:p-4 lg:p-6">
          {children}
        </div>
      </main>
    </div>
  );
}