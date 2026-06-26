"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/ui/Logo";
import { ConnectionIndicator } from "@/components/ui/ConnectionIndicator";
import { NotificationBell } from "@/components/ui/NotificationBell";
import { useAuthStore } from "@/store/authStore";
import { useRouter } from "next/navigation";
import { LogOut, User, Building2, Wrench, Gift, Menu, X } from "lucide-react";

const MODE_CONFIG = {
  customer: {
    icon: User,
    label: "Customer Mode",
    color: "yellow",
    textClass: "text-yellow-600 dark:text-yellow-100/60",
    avatarClass: "bg-yellow-500/15 dark:bg-yellow-500/20 border border-yellow-500/30 text-yellow-600 dark:text-yellow-300",
  },
  garage: {
    icon: Building2,
    label: "Business Mode",
    color: "amber",
    textClass: "text-amber-600 dark:text-amber-100/60",
    avatarClass: "bg-amber-500/15 dark:bg-amber-500/20 border border-amber-500/30 text-amber-600 dark:text-amber-300",
  },
  mechanic: {
    icon: Wrench,
    label: "Provider Mode",
    color: "emerald",
    textClass: "text-emerald-600 dark:text-emerald-100/60",
    avatarClass: "bg-emerald-500/15 dark:bg-emerald-500/20 border border-emerald-500/30 text-emerald-600 dark:text-emerald-300",
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
  hideMobileMenu = false,
  hasBottomNav = false,
  desktopSidebar = false,
}) {
  const { logout } = useAuthStore();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const config = MODE_CONFIG[mode] || MODE_CONFIG.customer;
  const ModeIcon = config.icon;

  const handleLogout = () => {
    logout();
    router.push("/auth");
  };

  return (
    <div className={cn("min-h-[100dvh] w-full flex flex-col", className)}>
      {/* Header */}
      <header className={cn(
        "glass-lux flex justify-between items-center px-4 lg:px-6 py-3 lg:py-4 flex-shrink-0 relative z-50",
        "border-b border-border-subtle"
      )}>
        {/* Left: Logo */}
        <div className="flex items-center gap-2 lg:gap-3">
          <Logo size="md" showText />
        </div>

        {/* Center: Title/Subtitle (desktop only) */}
        <div className="hidden lg:flex flex-col items-center gap-0.5 flex-1">
          {title && (
            <h1 className={cn(
              "text-lg font-bold tracking-tight",
              "text-text-primary"
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
            <span className={cn(
              "text-sm font-semibold",
              "text-text-primary"
            )}>
              {user?.name || config.label}
            </span>
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

          {/* User avatar */}
          <div className={cn(
            "w-9 h-9 lg:w-10 lg:h-10 rounded-full flex items-center justify-center",
            config.avatarClass
          )}>
            <ModeIcon size={16} />
          </div>

          {/* Logout button — always visible */}
          <button
            onClick={handleLogout}
            aria-label="Logout"
            className={cn(
              "flex w-9 h-9 lg:w-10 lg:h-10 rounded-full items-center justify-center transition-colors",
              "bg-surface-soft hover:bg-red-50 dark:hover:bg-red-500/20 border border-border-subtle hover:border-red-200 dark:hover:border-red-500/30 text-text-muted hover:text-red-500 dark:hover:text-red-400"
            )}
          >
            <LogOut size={15} />
          </button>

          {/* Mobile menu button — only when sidebar nav is used */}
          {!hideMobileMenu && (
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10"
              aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          )}
        </div>
      </header>

      {/* Mobile sidebar overlay — only when sidebar nav is used */}
      {!hideMobileMenu && mobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/50"
          onClick={() => setMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Mobile sidebar — only when sidebar nav is used */}
      {!hideMobileMenu && mobileMenuOpen && (
        <aside className={cn(
          "lg:hidden fixed top-0 right-0 h-full w-64 z-50 glass-strong flex flex-col",
          "bg-bg-card border-l border-border-subtle"
        )}>
          <div className="p-4 border-b flex items-center justify-between">
            <Logo size="md" showText />
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="p-2 rounded-lg hover:bg-white/10"
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
                  "text-text-muted hover:bg-surface-soft hover:text-text-primary"
                )}
              >
                <item.icon size={18} />
                <span>{item.label}</span>
              </button>
            ))}

            {/* Referral Link */}
            {onReferral && (
              <button
                onClick={() => {
                  onReferral();
                  setMobileMenuOpen(false);
                }}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors mb-2",
                  "text-text-muted hover:bg-surface-soft hover:text-text-primary"
                )}
              >
                <Gift size={18} />
                <span>Referral</span>
              </button>
            )}

            <button
              onClick={handleLogout}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors mt-4",
                "text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10"
              )}
            >
              <LogOut size={18} />
              <span>Logout</span>
            </button>
          </nav>
        </aside>
      )}

      {/* Main content */}
      <main className={cn(
        "flex-1",
        hasBottomNav ? "pb-20" : "pb-4 lg:pb-6",
        desktopSidebar && "lg:ml-16"
      )}>
        <div className="p-3 sm:p-4 lg:p-6">
          {children}
        </div>
      </main>
    </div>
  );
}