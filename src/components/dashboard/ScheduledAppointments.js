"use client";

import { useState, useEffect } from "react";
import { Calendar, Clock, AlertTriangle } from "lucide-react";
import { StatusPill } from "@/components/ui/StatusPill";
import { Skeleton } from "@/components/ui/Skeleton";
import { ISSUE_TAGS } from "@/lib/constants";
import { Button } from "@/components/ui/Button";
import { GlassCard } from "@/components/ui/GlassCard";
import { formatIndianPlate } from "@/lib/plateFormatter";
import { formatDate, formatTime } from "@/lib/utils";
import api from "@/lib/api";

export function ScheduledAppointments({ onBook }) {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const fetchAppointments = async () => {
      try {
        const res = await api.get("/jobs/history");
        if (cancelled) return;
        const all = res.data.jobs || [];
        // Jobs with a scheduledAt date that are not yet completed/cancelled
        const upcoming = all.filter(
          (j) =>
            j.scheduledAt &&
            j.status !== "completed" &&
            j.status !== "cancelled"
        );
        // Sort by scheduledAt ascending
        upcoming.sort(
          (a, b) => new Date(a.scheduledAt) - new Date(b.scheduledAt)
        );
        setAppointments(upcoming);
      } catch {
        if (!cancelled) setLoadError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchAppointments();
    return () => { cancelled = true; };
  }, []);

  return (
    <>
      <GlassCard className="p-4 sm:p-6">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-lg font-semibold text-[var(--foreground)] flex items-center gap-2">
            <Calendar size={18} aria-hidden="true" className="text-[var(--primary-dark)]" />
            Scheduled bookings
          </h2>
        </div>
        <p className="mb-4 text-xs text-[var(--text-muted)]">
          A booking records your preferred time. Dispatch at that exact time isn&apos;t automatic yet.
        </p>

        {loading ? (
          <div className="space-y-2" aria-busy="true" aria-label="Loading bookings">
            <Skeleton className="h-14 w-full rounded-xl" />
            <Skeleton className="h-14 w-full rounded-xl" />
          </div>
        ) : loadError ? (
          <div role="alert" className="flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] p-3 text-sm text-[var(--danger-ink)]">
            <AlertTriangle size={16} aria-hidden="true" />
            Couldn&apos;t load your bookings. Check your connection and try again.
          </div>
        ) : appointments.length > 0 ? (
          <div className="space-y-3">
            {appointments.slice(0, 3).map((apt) => (
              <div
                key={apt.id}
                className="flex items-center gap-3 p-3 rounded-xl border border-[var(--border)] bg-[var(--surface-card)]"
              >
                <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-[var(--surface-soft)] text-[var(--primary-dark)] shrink-0">
                  <Clock size={18} aria-hidden="true" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[var(--foreground)] truncate">
                    {ISSUE_TAGS.find((t) => t.value === apt.issueTag)?.label || apt.issueTag || "Service booking"}
                  </p>
                  <p className="text-xs text-[var(--text-muted)]">
                    {formatDate(apt.scheduledAt)} · {formatTime(apt.scheduledAt)}
                  </p>
                  {apt.vehicle?.license_plate && (
                    <p className="text-[11px] font-mono text-[var(--text-muted)] mt-0.5">
                      {formatIndianPlate(apt.vehicle.license_plate)}
                    </p>
                  )}
                </div>
                <StatusPill status={apt.status} />
              </div>
            ))}
            {appointments.length > 3 && (
              <p className="text-xs text-center text-[var(--text-muted)] pt-1">
                +{appointments.length - 3} more
              </p>
            )}
          </div>
        ) : (
          <div className="text-center py-6">
            <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 bg-[var(--surface-soft)] text-[var(--primary-dark)]">
              <Calendar size={22} aria-hidden="true" />
            </div>
            <p className="text-sm font-semibold text-[var(--foreground)] mb-1">
              No upcoming bookings
            </p>
            <p className="text-xs text-[var(--text-muted)] mb-5">
              Pick a preferred time for your next service.
            </p>
            <Button size="sm" onClick={onBook}>
              <Calendar size={14} aria-hidden="true" />
              Book a time
            </Button>
          </div>
        )}
      </GlassCard>

      {appointments.length > 0 && (
        <div className="mt-3 text-center">
          <Button size="sm" variant="outline" onClick={onBook}>
            <Calendar size={14} aria-hidden="true" />
            Book another
          </Button>
        </div>
      )}
    </>
  );
}
