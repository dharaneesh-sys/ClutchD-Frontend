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
  Settings,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

const MENU_SECTIONS = [
  {
    label: "Account",
    items: [
      { icon: User, label: "Account Details", path: "/marketplace/profile/account" },
      { icon: Settings, label: "Edit Profile", path: "/marketplace/profile/edit" },
    ],
  },
  {
    label: "Activity",
    items: [
      { icon: ShoppingBag, label: "Orders", path: "/marketplace/profile/orders" },
      { icon: CreditCard, label: "Payments & Bills", path: "/marketplace/profile/payments" },
      { icon: Wrench, label: "My Services", path: "/marketplace/profile/services" },
    ],
  },
  {
    label: "Support & Safety",
    items: [
      { icon: ShieldCheck, label: "Safety", path: "/marketplace/profile/safety" },
      { icon: HelpCircle, label: "Help", path: "/marketplace/profile/help" },
    ],
  },
  {
    label: "Community",
    items: [
      { icon: Gift, label: "Refer & Earn", path: "/marketplace/profile/refer" },
      { icon: HeartHandshake, label: "ClutchD Care", path: "/marketplace/profile/care" },
    ],
  },
];

export function ProfileMenu({ className }) {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <div className={cn("space-y-5", className)}>
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
          </div>
        </div>
      ))}
    </div>
  );
}
