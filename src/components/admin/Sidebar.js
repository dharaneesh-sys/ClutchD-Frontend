"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { UserCircle, Briefcase, AlertTriangle, BarChart3, Users, FileCheck, Wrench, Building2, CreditCard, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/authStore";
import api from "@/lib/api";
import { Logo } from "@/components/ui/Logo";

const NAV_ITEMS = [
  { name: "Overview", icon: BarChart3, path: "/admin" },
  { name: "Users & Providers", icon: Users, path: "/admin/users" },
  { name: "Mechanics", icon: Wrench, path: "/admin/mechanics" },
  { name: "Garages", icon: Building2, path: "/admin/garages" },
  { name: "Active Jobs", icon: Briefcase, path: "/admin/jobs" },
  { name: "Payments", icon: CreditCard, path: "/admin/payments" },
  { name: "KYC Verifications", icon: FileCheck, path: "/admin/kyc", badgeKey: "kyc" },
  { name: "Disputes", icon: AlertTriangle, path: "/admin/disputes", badgeKey: "disputes" },
];

export function Sidebar({ currentPath = "/admin", onClose }) {
  const { logout } = useAuthStore();
  const [badgeCounts, setBadgeCounts] = useState({ kyc: null, disputes: null });

  useEffect(() => {
    const fetchBadges = async () => {
      try {
        const [kycRes, disputesRes] = await Promise.allSettled([
          api.get("/admin/kyc/pending"),
          api.get("/admin/disputes", { params: { status: "open" } }),
        ]);
        const kyc = kycRes.status === "fulfilled" ? (kycRes.value.data.applications || []).length : null;
        const disputes = disputesRes.status === "fulfilled" ? (disputesRes.value.data.disputes || []).length : null;
        setBadgeCounts({ kyc, disputes });
      } catch {
        // silently fail
      }
    };
    fetchBadges();
  }, []);

  return (
    <div className="w-full h-full flex flex-col pt-6 bg-[var(--surface)] border-r border-border-subtle">
      <div className="px-6 mb-8 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Logo size="md" showText />
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="lg:hidden p-2 rounded-xl hover:bg-[var(--foreground)]/5 transition-colors"
            aria-label="Close sidebar"
          >
            <X size={18} />
          </button>
        )}
      </div>

      <nav className="flex-1 px-4 space-y-2">
        {NAV_ITEMS.map((item) => {
          const isActive = currentPath === item.path;
          const Icon = item.icon;
          const badge = item.badgeKey ? badgeCounts[item.badgeKey] : null;

          return (
            <Link
              key={item.path}
              href={item.path}
              onClick={onClose}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "flex items-center justify-between px-4 py-3 rounded-xl transition-all group",
                isActive
                  ? "bg-surface-soft text-icon-highlight"
                  : "text-text-muted hover:bg-bg-card hover:text-text-primary"
              )}
            >
              <div className="flex items-center gap-3">
                <Icon size={18} className={isActive ? "opacity-100" : "opacity-70 group-hover:opacity-100"} />
                <span className="font-medium text-sm">{item.name}</span>
              </div>

              {badge !== null && badge > 0 && (
                <span className={cn(
                  "text-[10px] font-bold px-2 py-0.5 rounded-full min-w-[20px] text-center",
                  isActive
                      ? "bg-surface-mid text-icon-highlight"
                      : "bg-surface-soft text-text-primary"
                )}>
                  {badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className={`p-4 border-t mx-4 mb-4 ${"border-border-subtle"}`}>
        <button
          onClick={logout}
          className="flex items-center gap-3 w-full px-4 py-3 text-red-400/80 hover:bg-red-400/10 hover:text-red-400 rounded-xl transition-all text-sm font-medium"
        >
          <UserCircle size={18} />
          Logout Admin
        </button>
      </div>
    </div>
  );
}
