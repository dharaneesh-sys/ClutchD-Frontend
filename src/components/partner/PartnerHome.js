"use client";

import { AlertTriangle } from "lucide-react";
import { StatTile } from "@/components/ui/StatTile";
import { QuickActionTile } from "@/components/ui/QuickActionTile";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { ListRow } from "@/components/ui/ListRow";
import { StatusPill } from "@/components/ui/StatusPill";
import { Button } from "@/components/ui/Button";
import { issueLabel, timeLabel } from "./format";

export function PartnerStats({ tiles }) {
  return (
    <div className="grid grid-cols-3 gap-3">
      {tiles.map((t) => (
        <StatTile key={t.label} {...t} />
      ))}
    </div>
  );
}

export function QuickActions({ actions }) {
  return (
    <div className="grid grid-cols-3 gap-3 min-[390px]:grid-cols-5 lg:grid-cols-5">
      {actions.map((a) => (
        <QuickActionTile key={a.label} {...a} />
      ))}
    </div>
  );
}

export function UpcomingJobs({ jobs, onOpen }) {
  if (!jobs) return null;
  if (jobs.length === 0) {
    return <p className="rounded-2xl border border-[var(--border)] bg-[var(--surface-card)] p-4 text-sm text-[var(--text-muted)]">No active jobs.</p>;
  }
  return (
    <div className="divide-y divide-[var(--border)] overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface-card)]">
      {jobs.slice(0, 3).map((j) => (
        <ListRow key={j.id} title={issueLabel(j.issueTag)} subtitle={timeLabel(j.createdAt)} trailing={<StatusPill status={j.status} />} chevron onClick={onOpen} />
      ))}
    </div>
  );
}

/**
 * Shared partner home (mechanic + garage). Pure composition: every value is
 * passed in from real endpoints; missing values arrive as null → "—".
 */
export function PartnerHome({ availability, stats, actions, upcoming, hasError, onRetry, onOpenJobs }) {
  return (
    <div className="space-y-5">
      {availability}
      {hasError && (
        <div role="alert" className="flex items-center justify-between gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface-card)] p-3">
          <span className="flex items-center gap-2 text-sm text-[var(--danger-ink)]">
            <AlertTriangle size={16} aria-hidden="true" /> Some numbers couldn&apos;t load.
          </span>
          <Button variant="outline" size="sm" onClick={onRetry}>Retry</Button>
        </div>
      )}
      <PartnerStats tiles={stats} />
      <section className="space-y-3">
        <SectionHeader title="Quick actions" />
        <QuickActions actions={actions} />
      </section>
      {upcoming !== undefined && (
        <section className="space-y-3">
          <SectionHeader title="Active jobs" />
          <UpcomingJobs jobs={upcoming} onOpen={onOpenJobs} />
        </section>
      )}
    </div>
  );
}
