"use client";

import { useState, useEffect } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import {
  getMockDailyJobs,
  getMockWeeklyRevenue,
  getMockMonthlyTrends,
} from "@/lib/mock/adminMockData";
import { formatCurrency } from "@/lib/utils";

// ─── Mini CSS Bar Chart ────────────────────────────────────────────────────

/**
 * Pure CSS bar chart — no library dependencies.
 * Renders a flex row of vertical bars with hover tooltips.
 */
function CSSBarChart({
  data,
  dataKey = "value",
  labelKey = "label",
  height = 120,
  barColor,
  formatValue,
  formatLabel,
}) {
  if (!data || data.length === 0) return null;

  const values = data.map((d) => d[dataKey]);
  const max = Math.max(...values);
  const range = max || 1;

  return (
    <div
      className="flex items-end gap-1.5"
      style={{ height, direction: "ltr" }}
    >
      {data.map((d, i) => {
        const v = d[dataKey];
        const pct = ((v - 0) / range) * 100;
        const clampedPct = Math.max(1, pct);
        return (
          <div
            key={i}
            className="relative flex flex-1 flex-col items-center justify-end h-full group"
          >
            {/* Tooltip */}
            <div className="pointer-events-none absolute -top-7 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded border border-border-subtle bg-surface px-2 py-1 text-[10px] font-medium text-text-primary opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
              {formatValue ? formatValue(v, d) : v}
            </div>

            {/* Bar */}
            <div
              className="w-full cursor-pointer rounded-t transition-all duration-300 group-hover:opacity-80"
              style={{
                height: `${clampedPct}%`,
                backgroundColor: barColor || "var(--primary, #10b981)",
                minHeight: 2,
              }}
            />

            {/* Label */}
            <span className="mt-1 w-full truncate text-center text-[9px] text-text-muted">
              {formatLabel ? formatLabel(d[labelKey]) : d[labelKey]}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ─── SVG Sparkline ──────────────────────────────────────────────────────────

/**
 * Tiny inline SVG line chart showing the trend direction at a glance.
 */
function Sparkline({ data, dataKey = "value", color, width = 80, height = 24 }) {
  if (!data || data.length < 2) return null;

  const values = data.map((d) => d[dataKey]);
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;
  const pad = 2;

  const points = values
    .map((v, i) => {
      const x = pad + (i / (values.length - 1)) * (width - 2 * pad);
      const y = height - pad - ((v - min) / range) * (height - 2 * pad);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  const stroke = color || "var(--primary, #10b981)";

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className="shrink-0"
      aria-hidden="true"
    >
      <polyline
        points={points}
        fill="none"
        stroke={stroke}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// ─── Formatting helpers ─────────────────────────────────────────────────────

const fmt = {
  jobs: (v) => `${v} jobs`,
  revenue: (v) => formatCurrency(v / 100),
};

// ─── TrendCharts ────────────────────────────────────────────────────────────

/**
 * Mini trend charts for the admin dashboard.
 *
 * Displays 4 chart cards in a 2×2 grid:
 *   1. Daily Job Volume   – 7-day bar chart  (primary green)
 *   2. Weekly Revenue      – 5-week bar chart (amber)
 *   3. Monthly Job Volume  – 6-month bar chart (blue)
 *   4. Monthly Revenue     – 6-month bar chart (primary green)
 *
 * All data is mock/static — no backend dependency.
 * Charts are pure CSS/SVG — no chart library required.
 */
export function TrendCharts() {
  const [dailyJobs, setDailyJobs] = useState([]);
  const [weeklyRevenue, setWeeklyRevenue] = useState([]);
  const [monthlyTrends, setMonthlyTrends] = useState([]);

  useEffect(() => {
    setDailyJobs(getMockDailyJobs());
    setWeeklyRevenue(getMockWeeklyRevenue());
    setMonthlyTrends(getMockMonthlyTrends());
  }, []);

  if (dailyJobs.length === 0) return null;

  return (
    <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-2">
      {/* ── Daily Job Volume ──────────────────────────────────────────── */}
      <GlassCard className="p-5">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h4 className="text-sm font-semibold text-text-primary">
              Daily Job Volume
            </h4>
            <p className="mt-0.5 text-[10px] text-text-muted">Last 7 days</p>
          </div>
          <Sparkline data={dailyJobs} dataKey="value" />
        </div>
        <CSSBarChart
          data={dailyJobs}
          dataKey="value"
          height={100}
          barColor="var(--primary, #10b981)"
          formatValue={fmt.jobs}
        />
      </GlassCard>

      {/* ── Weekly Revenue ────────────────────────────────────────────── */}
      <GlassCard className="p-5">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h4 className="text-sm font-semibold text-text-primary">
              Weekly Revenue
            </h4>
            <p className="mt-0.5 text-[10px] text-text-muted">Last 5 weeks</p>
          </div>
          <Sparkline data={weeklyRevenue} dataKey="value" color="#f59e0b" />
        </div>
        <CSSBarChart
          data={weeklyRevenue}
          dataKey="value"
          height={100}
          barColor="#f59e0b"
          formatValue={fmt.revenue}
        />
      </GlassCard>

      {/* ── Monthly Job Volume ────────────────────────────────────────── */}
      <GlassCard className="p-5">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h4 className="text-sm font-semibold text-text-primary">
              Monthly Job Volume
            </h4>
            <p className="mt-0.5 text-[10px] text-text-muted">H1 2025</p>
          </div>
          <Sparkline
            data={monthlyTrends}
            dataKey="jobs"
            color="#3b82f6"
          />
        </div>
        <CSSBarChart
          data={monthlyTrends}
          dataKey="jobs"
          height={100}
          barColor="#3b82f6"
          formatValue={fmt.jobs}
        />
      </GlassCard>

      {/* ── Monthly Revenue Trend ─────────────────────────────────────── */}
      <GlassCard className="p-5">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h4 className="text-sm font-semibold text-text-primary">
              Revenue Trend
            </h4>
            <p className="mt-0.5 text-[10px] text-text-muted">H1 2025</p>
          </div>
          <Sparkline
            data={monthlyTrends}
            dataKey="revenue"
            color="var(--primary, #10b981)"
          />
        </div>
        <CSSBarChart
          data={monthlyTrends}
          dataKey="revenue"
          height={100}
          barColor="var(--primary, #10b981)"
          formatValue={fmt.revenue}
        />
      </GlassCard>
    </div>
  );
}
