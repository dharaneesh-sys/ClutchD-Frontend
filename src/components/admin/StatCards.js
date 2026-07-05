"use client";

import { useState, useEffect } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { BackendHealth } from "@/lib/backendHealth";
import { getMockAdminStats } from "@/lib/mock/adminMockData";
import { fetchAnalytics } from "@/services/adminService";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Users,
  Wrench,
  IndianRupee,
  Settings,
} from "lucide-react";

// ─── Trend Indicator ────────────────────────────────────────────────────────

function TrendIndicator({ trend }) {
  if (!trend || trend === "—" || trend === "0") {
    return (
      <span className="flex items-center gap-1 text-xs text-text-muted">
        <Minus size={12} />
        <span>—</span>
      </span>
    );
  }
  const cleaned = String(trend).replace(/[+\-%]/g, "");
  const num = parseFloat(cleaned);
  if (isNaN(num) || num === 0) {
    return (
      <span className="flex items-center gap-1 text-xs text-text-muted">
        <Minus size={12} />
        <span>—</span>
      </span>
    );
  }
  const isUp = String(trend).startsWith("+") || num > 0;
  return (
    <span
      className={`flex items-center gap-1 text-xs font-semibold ${
        isUp ? "text-green-400" : "text-red-400"
      }`}
    >
      {isUp ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
      <span>
        {isUp ? "+" : ""}
        {num.toFixed(1)}%
      </span>
    </span>
  );
}

// ─── Card Configuration ─────────────────────────────────────────────────────

const statCardMeta = [
  {
    label: "Total Users",
    key: "totalUsers",
    trendKey: "totalUsersTrend",
    icon: Users,
    format: (v) => v?.toLocaleString("en-IN") || "0",
    iconBg: "bg-blue-500/10",
    iconColor: "text-blue-400",
  },
  {
    label: "Total Jobs",
    key: "totalJobs",
    trendKey: "totalJobsTrend",
    icon: Wrench,
    format: (v) => v?.toLocaleString("en-IN") || "0",
    iconBg: "bg-emerald-500/10",
    iconColor: "text-emerald-400",
  },
  {
    label: "Revenue",
    key: "revenue",
    trendKey: "revenueTrend",
    icon: IndianRupee,
    format: (v) =>
      `₹${((v || 0) / 100).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`,
    iconBg: "bg-amber-500/10",
    iconColor: "text-amber-400",
  },
  {
    label: "Active Mechanics",
    key: "activeMechanics",
    trendKey: "activeMechanicsTrend",
    icon: Settings,
    format: (v) => v?.toLocaleString("en-IN") || "0",
    iconBg: "bg-purple-500/10",
    iconColor: "text-purple-400",
  },
];

// ─── Skeleton ───────────────────────────────────────────────────────────────

function StatCardsSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
      {[1, 2, 3, 4].map((i) => (
        <GlassCard key={i} className="p-5">
          <div className="animate-pulse space-y-3">
            <div className="h-3 w-20 rounded bg-white/10" />
            <div className="h-7 w-24 rounded bg-white/10" />
            <div className="h-3 w-16 rounded bg-white/5" />
          </div>
        </GlassCard>
      ))}
    </div>
  );
}

// ─── StatCards ──────────────────────────────────────────────────────────────

/**
 * Admin stat cards with backend health gating.
 *
 * - When BackendHealth.isAvailable() === true → calls fetchAnalytics() API
 * - When backend is unreachable or the API returns a 503 → falls back to
 *   mock data persisted in localStorage (getMockAdminStats)
 * - Trend arrows show direction & magnitude of change
 */
export function StatCards() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    let cancelled = false;

    function normalizeStats(raw) {
      if (!raw) return raw;
      return {
        totalUsers: raw.totalUsers,
        totalJobs: raw.totalJobs ?? raw.jobsCompleted,
        revenue: raw.revenue ?? raw.totalRevenue,
        activeMechanics: raw.activeMechanics ?? raw.activeProviders,
        totalUsersTrend: raw.totalUsersTrend ?? null,
        totalJobsTrend: raw.totalJobsTrend ?? null,
        revenueTrend: raw.revenueTrend ?? null,
        activeMechanicsTrend: raw.activeMechanicsTrend ?? null,
      };
    }

    async function loadStats() {
      const backendUp = BackendHealth.isAvailable();

      if (backendUp === true) {
        try {
          const data = await fetchAnalytics();
          if (!cancelled) {
            setStats(normalizeStats(data));
          }
          return;
        } catch {
          // API failed — fall through to mock
        }
      }

      // Backend unavailable or API errored — localStorage mock data
      if (!cancelled) {
        setStats(normalizeStats(getMockAdminStats()));
      }
    }

    loadStats();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!stats) {
    return <StatCardsSkeleton />;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
      {statCardMeta.map((meta) => {
        const Icon = meta.icon;
        return (
          <GlassCard key={meta.key} className="p-5">
            <div className="flex items-start justify-between mb-3">
              <p className="text-xs font-medium uppercase tracking-wider text-text-muted">
                {meta.label}
              </p>
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-lg ${meta.iconBg}`}
              >
                <Icon size={14} className={meta.iconColor} />
              </div>
            </div>
            <p className="mb-1 text-2xl font-bold tracking-tight text-text-primary">
              {meta.format(stats[meta.key])}
            </p>
            <TrendIndicator trend={stats[meta.trendKey]} />
          </GlassCard>
        );
      })}
    </div>
  );
}
