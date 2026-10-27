"use client";

import { useMemo, useState } from "react";
import { History, AlertTriangle } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatusPill } from "@/components/ui/StatusPill";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { cn } from "@/lib/utils";
import { money, issueLabel, timeLabel } from "./format";

const FILTERS = [
  { key: "all", label: "All" },
  { key: "completed", label: "Completed" },
  { key: "cancelled", label: "Cancelled" },
];

/**
 * Provider job history from GET /jobs/history (completed + cancelled).
 * Pure: `jobs` null = loading, `error` true = failed. No actions on rows.
 */
export function ProviderHistory({ jobs, error, onRetry }) {
  const [filter, setFilter] = useState("all");
  const shown = useMemo(() => (jobs || []).filter((j) => filter === "all" || j.status === filter), [jobs, filter]);

  if (error) {
    return (
      <div role="alert" className="flex flex-col items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface-card)] p-6 text-center">
        <AlertTriangle size={24} aria-hidden="true" className="text-[var(--danger)]" />
        <p className="text-sm text-[var(--danger-ink)]">Couldn&apos;t load your history.</p>
        {onRetry && <Button variant="outline" size="sm" onClick={onRetry}>Retry</Button>}
      </div>
    );
  }
  if (jobs === null || jobs === undefined) {
    return <div className="space-y-2" aria-busy="true"><Skeleton className="h-16 w-full rounded-2xl" /><Skeleton className="h-16 w-full rounded-2xl" /></div>;
  }

  return (
    <div className="space-y-3">
      <div role="group" aria-label="Filter history" className="flex gap-2 overflow-x-auto">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            aria-pressed={filter === f.key}
            onClick={() => setFilter(f.key)}
            className={cn(
              "min-h-[44px] shrink-0 rounded-full border px-4 text-sm font-medium",
              filter === f.key ? "border-[var(--primary)] bg-[var(--surface-soft)] text-[var(--primary-dark)]" : "border-[var(--border)] bg-[var(--surface-card)] text-[var(--text-muted)]"
            )}
          >
            {f.label}
          </button>
        ))}
      </div>
      {shown.length === 0 ? (
        <EmptyState icon={History} title={filter === "cancelled" ? "No cancelled jobs" : "No completed jobs yet"} description="Your finished jobs will appear here." />
      ) : (
        <ul className="divide-y divide-[var(--border)] overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface-card)]">
          {shown.map((j) => (
            <li key={j.id} data-testid="provider-history-row" className="flex items-center gap-3 px-4 py-3">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-[var(--foreground)]">{issueLabel(j.issueTag)}</p>
                <p className="text-xs text-[var(--text-muted)]">{timeLabel(j.createdAt)}</p>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1">
                <StatusPill status={j.status} />
                {j.status === "completed" && (
                  <span className="text-xs text-[var(--foreground)]">
                    {money(j.pricing?.totalAmount)} · {j.isPaid ? "Paid" : "Unpaid"}
                  </span>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
