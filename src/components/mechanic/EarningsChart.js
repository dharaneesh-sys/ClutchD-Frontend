"use client";

import { AlertTriangle } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { AreaChart, Area } from "@/components/charts/area-chart";
import { money } from "@/components/partner/format";

/**
 * Weekly earnings from GET /providers/earnings?period=week (passed in by the
 * dashboard's overview fetch). Chart points are only the real daily entries;
 * the breakdown lists the same rows. No rent/incentive/payout rows.
 */
export function EarningsChart({ earnings, error, onRetry }) {
  if (error) {
    return (
      <GlassCard role="alert" className="flex flex-col items-center gap-3 p-6 text-center">
        <AlertTriangle size={24} aria-hidden="true" className="text-[var(--danger)]" />
        <p className="text-sm text-[var(--danger-ink)]">Couldn&apos;t load earnings.</p>
        {onRetry && <Button variant="outline" size="sm" onClick={onRetry}>Retry</Button>}
      </GlassCard>
    );
  }
  const loading = earnings === null || earnings === undefined;
  const rows = earnings?.data || [];

  return (
    <GlassCard className="flex flex-col p-4 sm:p-6">
      <div className="mb-4 flex items-end justify-between">
        <div>
          <h2 className="text-lg font-semibold text-[var(--foreground)]">Earnings</h2>
          <p className="text-sm text-[var(--text-muted)]">This week</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-[var(--text-muted)]">Total</p>
          <p data-testid="earnings-total" className="text-2xl font-semibold text-[var(--foreground)]">{loading ? "—" : money(earnings.total, 0)}</p>
        </div>
      </div>

      <div className="h-[200px] w-full">
        {loading ? (
          <Skeleton className="h-full w-full rounded-xl" />
        ) : rows.length === 0 ? (
          <p className="flex h-full items-center justify-center text-sm text-[var(--text-muted)]">No earnings this week</p>
        ) : (
          <AreaChart data={rows} xDataKey="name" className="h-full w-full">
            <Area dataKey="earnings" stroke="var(--primary)" fill="var(--primary)" fillOpacity={0.15} />
          </AreaChart>
        )}
      </div>

      {rows.length > 0 && (
        <ul className="mt-4 divide-y divide-[var(--border)] border-t border-[var(--border)]">
          {rows.map((r) => (
            <li key={r.date} className="flex justify-between py-2 text-sm">
              <span className="text-[var(--text-muted)]">{r.name} · {r.date}</span>
              <span className="font-medium text-[var(--foreground)]">{money(r.earnings, 0)}</span>
            </li>
          ))}
        </ul>
      )}
    </GlassCard>
  );
}
