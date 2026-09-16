"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  User,
  Mail,
  Shield,
  Phone,
  Calendar,
  ShoppingBag,
  Wrench,
  Gift,
  ChevronRight,
  Pencil,
} from "lucide-react";
import { cn, getInitials, formatDate } from "@/lib/utils";
import { useAuthStore } from "@/store/authStore";
import { Button } from "@/components/ui/Button";
import { ProfileMenu } from "@/components/profile/ProfileMenu";
import SplashScreen from "@/components/ui/SplashScreen";

export default function ProfilePage() {
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const _hydrated = useAuthStore((s) => s._hydrated);
  const router = useRouter();
  const [stats, setStats] = useState({ orders: null, active: null, referral: null });

  useEffect(() => {
    if (_hydrated && !isAuthenticated) {
      router.push("/auth");
    }
  }, [_hydrated, isAuthenticated, router]);

  // Real quick-stats: orders count, active service jobs, referral earnings.
  // Each fetch is independent and fails soft — tiles show "—" only when the
  // request errors, never a fake number.
  useEffect(() => {
    if (!isAuthenticated || !user?.id || user?.id?.startsWith?.("demo-")) return;
    let cancelled = false;
    (async () => {
      try {
        const api = (await import("@/lib/api")).default;
        const { toCamelCase } = await import("@/lib/utils");
        const [ordersRes, jobsRes, refRes] = await Promise.allSettled([
          api.get("/orders"),
          api.get("/jobs/history"),
          api.get("/referral/history"),
        ]);
        if (cancelled) return;
        const next = { orders: null, active: null, referral: null };
        if (ordersRes.status === "fulfilled") {
          const orders = toCamelCase(ordersRes.value?.data?.orders ?? []);
          next.orders = orders.length;
        }
        if (jobsRes.status === "fulfilled") {
          const jobs = toCamelCase(
            Array.isArray(jobsRes.value?.data) ? jobsRes.value.data : jobsRes.value?.data?.jobs ?? [],
          );
          next.active = jobs.filter((j) =>
            ["searching", "assigned", "en_route", "in_progress"].includes(j.status),
          ).length;
        }
        if (refRes.status === "fulfilled") {
          const totalEarned = refRes.value?.data?.total_earned ?? refRes.value?.data?.totalEarned ?? 0;
          next.referral = `₹${Number(totalEarned || 0).toLocaleString("en-IN")}`;
        }
        setStats(next);
      } catch {
        // stats are best-effort — leave nulls ("—")
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, user?.id]);

  if (!_hydrated) {
    return <SplashScreen />;
  }

  const displayName = user?.name || user?.email || "Guest";
  const displayEmail = user?.email || "—";
  const displayPhone = user?.phone || "—";
  const displayRole = user?.role
    ? user.role.charAt(0).toUpperCase() + user.role.slice(1)
    : "—";
  const memberSince = user?.createdAt;

  return (
    <div className="p-4 sm:p-5 space-y-5 animate-fade-in-up">
      {/* Profile Header Card */}
      <div className="glass-lux rounded-2xl p-5 relative overflow-hidden">
        {/* Decorative gradient */}
        <div className="absolute -top-20 -right-20 w-40 h-40 rounded-full bg-primary/[0.06] blur-3xl pointer-events-none" />

        <div className="flex items-start gap-4 relative">
          {/* Avatar */}
          <div className="flex-shrink-0">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 ring-2 ring-white/10 flex items-center justify-center">
              {user?.name ? (
                <span className="text-lg font-bold text-primary-light">
                  {getInitials(user.name)}
                </span>
              ) : (
                <User size={28} className="text-primary-light" />
              )}
            </div>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold text-foreground truncate">
              {displayName}
            </h2>
            <div className="flex flex-col gap-1 mt-1.5">
              <span className="inline-flex items-center gap-1.5 text-xs text-text-muted">
                <Mail size={12} className="shrink-0" />
                {displayEmail}
              </span>
              {displayPhone !== "—" && (
                <span className="inline-flex items-center gap-1.5 text-xs text-text-muted">
                  <Phone size={12} className="shrink-0" />
                  {displayPhone}
                </span>
              )}
              <span className="inline-flex items-center gap-1.5 text-xs text-text-muted capitalize">
                <Shield size={12} className="shrink-0" />
                {displayRole}
              </span>
              {memberSince && memberSince !== "—" && (
                <span className="inline-flex items-center gap-1.5 text-xs text-text-muted">
                  <Calendar size={12} className="shrink-0" />
                  Member since {formatDate(memberSince)}
                </span>
              )}
            </div>
          </div>

          {/* Auth status */}
          <span
            className={cn(
              "flex-shrink-0 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1",
              "text-[0.625rem] font-semibold tracking-wide uppercase",
              isAuthenticated
                ? "bg-warning/15 text-warning"
                : "bg-warning/15 text-warning"
            )}
          >
            <span
              className={cn(
                "w-1.5 h-1.5 rounded-full",
                isAuthenticated ? "bg-warning" : "bg-warning"
              )}
            />
            {isAuthenticated ? "Active" : "Guest"}
          </span>
        </div>

        {/* Edit Profile button */}
        <div className="mt-4">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => router.push("/marketplace/profile/edit")}
            className="w-full"
          >
            <Pencil size={14} className="mr-1.5" />
            Edit Profile
          </Button>
        </div>
      </div>

      {/* Quick Stats — values sourced from real API data */}
      <div className="grid grid-cols-3 gap-3">
        <div className="glass-lux rounded-2xl p-4 text-center">
          <div className="w-8 h-8 rounded-lg bg-primary/[0.12] flex items-center justify-center mx-auto mb-2">
            <ShoppingBag size={16} className="text-primary-light" />
          </div>
          <p className="text-lg font-bold text-foreground">
            {stats.orders ?? "—"}
          </p>
          <p className="text-[10px] font-medium text-text-muted uppercase tracking-wider mt-0.5">
            Orders
          </p>
        </div>
        <div className="glass-lux rounded-2xl p-4 text-center">
          <div className="w-8 h-8 rounded-lg bg-warning/10 flex items-center justify-center mx-auto mb-2">
            <Wrench size={16} className="text-warning" />
          </div>
          <p className="text-lg font-bold text-foreground">
            {stats.active ?? "—"}
          </p>
          <p className="text-[10px] font-medium text-text-muted uppercase tracking-wider mt-0.5">
            Active
          </p>
        </div>
        <div className="glass-lux rounded-2xl p-4 text-center">
          <div className="w-8 h-8 rounded-lg bg-[var(--color-primary-rgb)]/15[0.12] flex items-center justify-center mx-auto mb-2">
            <Gift size={16} className="text-icon-highlight" />
          </div>
          <p className="text-lg font-bold text-foreground">
            {stats.referral ?? "—"}
          </p>
          <p className="text-[10px] font-medium text-text-muted uppercase tracking-wider mt-0.5">
            Referral
          </p>
        </div>
      </div>

      {/* Quick Action: View Account Details */}
      <button
        onClick={() => router.push("/marketplace/profile/account")}
        className="glass-lux rounded-2xl p-4 w-full flex items-center gap-3 hover:bg-white/[0.03] transition-colors text-left"
      >
        <div className="w-10 h-10 rounded-xl bg-primary/[0.12] flex items-center justify-center flex-shrink-0">
          <User size={18} className="text-primary-light" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground">Account Details</p>
          <p className="text-xs text-text-muted mt-0.5">View and manage your account information</p>
        </div>
        <ChevronRight size={18} className="text-text-muted flex-shrink-0" />
      </button>

      {/* Profile Menu Sections (hidden on lg+ where sidebar shows it) */}
      <div className="lg:hidden">
        <ProfileMenu />
      </div>
    </div>
  );
}
