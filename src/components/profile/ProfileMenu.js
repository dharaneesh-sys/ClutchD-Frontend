"use client";

import { useRouter, usePathname } from "next/navigation";
import {
  User,
  HelpCircle,
  ShoppingBag,
  CreditCard,
  Wrench,
  ShieldCheck,
  Gift,
  HeartHandshake,
  Heart,
  CreditCard as CardIcon,
  Settings,
  ChevronRight,
  Crown,
  Zap,
  ShieldAlert,
  AlertTriangle,
  Loader2,
  LayoutDashboard as LayoutDashboardIcon,
  Store as StoreIcon,
} from "lucide-react";
import { useSOS } from "@/components/ui/useSOS";
import { useAuthStore } from "@/store/authStore";
import { cn } from "@/lib/utils";

/** Role → dashboard route, shown as the first Activity entry. */
const DASHBOARD_BY_ROLE = {
  customer: { icon: LayoutDashboardIcon, label: "My Dashboard", path: "/dashboard/customer" },
  seller: { icon: StoreIcon, label: "Seller Dashboard", path: "/dashboard/seller" },
  mechanic: { icon: LayoutDashboardIcon, label: "Provider Dashboard", path: "/dashboard/mechanic" },
  garage: { icon: LayoutDashboardIcon, label: "Business Dashboard", path: "/dashboard/garage" },
};

const MENU_SECTIONS = [
  {
    label: "Account",
    items: [
      { icon: User, label: "Account Details", path: "/marketplace/profile/account" },
      { icon: Settings, label: "Edit Profile", path: "/marketplace/profile/edit" },
      { icon: Crown, label: "Subscription", path: "/marketplace/profile/subscription" },
    ],
  },
  {
    label: "Activity",
    items: [
      { icon: ShoppingBag, label: "Orders", path: "/marketplace/profile/orders" },
      { icon: CreditCard, label: "Payments & Bills", path: "/marketplace/profile/payments" },
      { icon: Wrench, label: "My Services", path: "/marketplace/profile/services" },
      { icon: ShieldAlert, label: "Warranty Claims", path: "/marketplace/profile/warranty" },
      { icon: Heart, label: "Favorites", path: "/marketplace/profile/favorites" },
      { icon: Zap, label: "Quick Actions", path: "/marketplace/profile/quick-actions" },
    ],
  },
  {
    label: "Rewards",
    items: [
      { icon: CardIcon, label: "ClutchD Card", path: "/marketplace/profile/clutchd-card" },
      { icon: Gift, label: "Refer & Earn", path: "/marketplace/profile/refer" },
    ],
  },
  {
    label: "Support & Safety",
    items: [
      { icon: Settings, label: "Settings", path: "/marketplace/profile/settings" },
      { icon: ShieldCheck, label: "Safety", path: "/marketplace/profile/safety" },
      { icon: HelpCircle, label: "Help", path: "/marketplace/profile/help" },
    ],
  },
  {
    label: "Community",
    items: [
      { icon: HeartHandshake, label: "ClutchD Care", path: "/marketplace/profile/care" },
    ],
  },
];

export function ProfileMenu({ className }) {
  const router = useRouter();
  const pathname = usePathname();
  const sos = useSOS();
  const role = useAuthStore((s) => s.user?.role);
  const dashboardEntry = DASHBOARD_BY_ROLE[role] || DASHBOARD_BY_ROLE.customer;
  const sosDisabled = sos.loading || sos.status === "sent" || sos.status === "queued";
  const sosLabel =
    sos.loading
      ? "Sending SOS..."
      : sos.status === "sent"
        ? "Help En Route!"
        : sos.status === "queued"
          ? "SOS Queued"
          : sos.status === "confirming"
            ? "Tap again to confirm"
            : "Emergency SOS";
  return (
    <div className={cn("space-y-5", className)}>
      {/* Role dashboard entry */}
      <button
        onClick={() => router.push(dashboardEntry.path)}
        className="glass-lux rounded-2xl w-full flex items-center gap-3 px-4 py-3.5 text-left transition-all duration-200 hover:bg-white/[0.03]"
      >
        <div className="flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center bg-primary/[0.12] text-primary-light">
          <dashboardEntry.icon size={17} />
        </div>
        <span className="flex-1 text-sm font-semibold">{dashboardEntry.label}</span>
        <ChevronRight size={16} className="flex-shrink-0 text-text-muted" />
      </button>

      {MENU_SECTIONS.map((section) => (
        <div key={section.label}>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted px-1 mb-2">
            {section.label}
          </h3>
          <div className="glass-lux rounded-2xl overflow-hidden divide-y divide-white/[0.04]">
            {section.items.map((item) => {
              const isActive = pathname === item.path;
              return (
                <button
                  key={item.path}
                  onClick={() => router.push(item.path)}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3.5 text-left transition-all duration-200",
                    isActive
                      ? "bg-primary/[0.08] text-primary-light"
                      : "text-foreground hover:bg-white/[0.03]"
                  )}
                >
                  <div
                    className={cn(
                      "flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center",
                      isActive
                        ? "bg-primary/[0.15] text-primary-light"
                        : "bg-white/[0.05] text-text-muted"
                    )}
                  >
                    <item.icon size={17} />
                  </div>
                  <span className="flex-1 text-sm font-medium">{item.label}</span>
                  <ChevronRight
                    size={16}
                    className={cn(
                      "flex-shrink-0 transition-colors",
                      isActive ? "text-primary-light" : "text-text-muted"
                    )}
                  />
                </button>
              );
            })}
            {section.label === "Support & Safety" && (
              <button
                type="button"
                onClick={sos.handleSOS}
                disabled={sosDisabled}
                aria-label="Emergency SOS"
                className="w-full flex items-center gap-3 px-4 py-3.5 text-left transition-all duration-200 text-red-400 hover:bg-red-500/[0.06]"
              >
                <div className="flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center bg-red-500/[0.12] text-red-400">
                  {sos.loading ? (
                    <Loader2 size={17} className="animate-spin" />
                  ) : (
                    <AlertTriangle size={17} />
                  )}
                </div>
                <span className="flex-1 text-sm font-semibold">{sosLabel}</span>
                <ChevronRight size={16} className="flex-shrink-0 text-red-400/60" />
              </button>
            )}
            {section.label === "Support & Safety" && sos.queuedMsg && (
              <p className="px-4 py-2 text-xs text-orange-400 bg-orange-500/[0.06]">
                {sos.queuedMsg}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
