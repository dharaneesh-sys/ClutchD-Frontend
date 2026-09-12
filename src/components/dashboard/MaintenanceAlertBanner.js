"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { AlertTriangle, ChevronDown, ChevronUp, X, Calendar, Wrench } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { cn } from "@/lib/utils";
import { getAllReminders } from "@/lib/maintenance/reminderEngine";
import api from "@/lib/api";

// ── Constants ──────────────────────────────────────────────────────
const DISMISSED_KEY = "clutchd_dismissed_reminders";
const AVG_KM_PER_YEAR = 15000;
const SEVERITY_ORDER = { critical: 0, high: 1, medium: 2 };

/**
 * Estimate mileage for a vehicle based on its year when real mileage is unknown.
 * Assumes ~15,000 km/year driven.
 */
function estimateMileage(vehicle) {
  if (vehicle.mileage != null && vehicle.mileage > 0) return vehicle.mileage;
  if (!vehicle.year) return 0;
  const yearsOld = new Date().getFullYear() - vehicle.year;
  return Math.max(0, yearsOld * AVG_KM_PER_YEAR);
}

/**
 * Enrich vehicle with estimated mileage and a plausible first-service date so
 * the reminder engine produces realistic results even for demo/partial data.
 */
function enrichVehicle(v) {
  return {
    ...v,
    mileage: estimateMileage(v),
    lastServiceDate: v.lastServiceDate || new Date(
      new Date().setFullYear(new Date().getFullYear() - 1)
    ).toISOString(),
  };
}

// ── Dismissal persistence ──────────────────────────────────────────

function getDismissedSet() {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(DISMISSED_KEY);
    return new Set(raw ? JSON.parse(raw) : []);
  } catch {
    return new Set();
  }
}

function persistDismissed(set) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(DISMISSED_KEY, JSON.stringify([...set]));
  } catch {
    // localStorage unavailable
  }
}

function reminderKey(vehicleId, serviceId) {
  return `${vehicleId}:${serviceId}`;
}

// ── Helpers ────────────────────────────────────────────────────────

/** Flatten aggregated reminders into a single sorted list. */
function flattenReminders(aggregated) {
  const flat = [];
  for (const entry of aggregated) {
    for (const svc of entry.services) {
      flat.push({ ...svc, vehicle: entry.vehicle });
    }
  }
  return flat.sort(
    (a, b) =>
      (SEVERITY_ORDER[a.severity] ?? 99) - (SEVERITY_ORDER[b.severity] ?? 99)
  );
}

/** Human-friendly distance formatter. */
function formatKm(km) {
  if (km == null) return "";
  if (km >= 1000) return `${(km / 1000).toFixed(1)}k km`;
  return `${Math.round(km)} km`;
}

/** Severity badge label and color. */
function severityLabel(sev) {
  switch (sev) {
    case "critical": return { label: "Critical", cls: "bg-red-500/15 text-red-400 border-red-500/25" };
    case "high":     return { label: "Due Soon", cls: "bg-warning/15 text-warning border-warning/25" };
    default:         return { label: "Upcoming", cls: "bg-blue-500/15 text-blue-400 border-blue-500/25" };
  }
}

// ── Component ──────────────────────────────────────────────────────

export function MaintenanceAlertBanner() {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dismissed, setDismissed] = useState(new Set());
  const [expanded, setExpanded] = useState(false);

  /** Fetch vehicles on mount. */
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await api.get("/vehicles");
        if (!cancelled) setVehicles(Array.isArray(res.data) ? res.data : []);
      } catch {
        // Vehicle endpoint not available — empty state is handled below
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  /** Hydrate dismissed set from localStorage. */
  useEffect(() => { setDismissed(getDismissedSet()); }, []);

  /** Dismiss a specific reminder. */
  const dismiss = useCallback((vehicleId, serviceId) => {
    setDismissed((prev) => {
      const next = new Set(prev);
      next.add(reminderKey(vehicleId, serviceId));
      persistDismissed(next);
      return next;
    });
  }, []);

  // ── Derived: enriched + filtered + sorted reminders ──────────────
  const reminders = useMemo(() => {
    if (vehicles.length === 0) return [];
    const enriched = vehicles.map(enrichVehicle);
    const all = flattenReminders(getAllReminders(enriched));
    return all.filter(
      (r) => !dismissed.has(reminderKey(r.vehicle.id, r.serviceId))
    );
  }, [vehicles, dismissed]);

  // Nothing to show — bail silently (keeping layout stable with min-h-0)
  if (loading || reminders.length === 0) return null;

  const top = reminders[0];
  const remaining = reminders.slice(1);
  const badge = severityLabel(top.severity);

  return (
    <GlassCard
      variant="glass"
      className={cn(
        "mb-4 overflow-hidden transition-all duration-200",
        top.status === "overdue"
          ? "border-red-500/20"
          : "border-amber-500/15"
      )}
    >
      {/* ── Primary alert row ─────────────────────────────────── */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => setExpanded((e) => !e)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setExpanded((prev) => !prev);
          }
        }}
        className={cn(
          "w-full flex items-center gap-3 px-4 py-3 text-left cursor-pointer",
          "transition-colors hover:bg-surface-soft/50",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 rounded-t-2xl"
        )}
        aria-expanded={expanded}
        aria-label={expanded ? "Collapse maintenance schedule" : "Expand maintenance schedule"}
      >
        {/* Severity icon */}
        <span className={cn(
          "shrink-0 w-9 h-9 rounded-full flex items-center justify-center",
          top.status === "overdue"
            ? "bg-red-500/15 text-red-400"
            : "bg-warning/15 text-warning"
        )}>
          <AlertTriangle size={16} />
        </span>

        {/* Reminder text */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-text-primary truncate">
            {top.vehicle.make} {top.vehicle.model}
            {top.vehicle.year ? ` (${top.vehicle.year})` : ""}
            {" — "}
            {top.label}
          </p>
          <p className="text-xs text-text-muted mt-0.5">
            {top.status === "overdue"
              ? "Overdue — schedule service now"
              : top.milesRemaining != null
                ? `Due in ${formatKm(top.milesRemaining)}`
                : top.daysRemaining != null
                  ? `Due in ${top.daysRemaining} day${top.daysRemaining === 1 ? "" : "s"}`
                  : "Maintenance recommended"}
          </p>
        </div>

        {/* Severity badge */}
        <span className={cn(
          "shrink-0 hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border",
          badge.cls
        )}>
          {badge.label}
        </span>

        {/* Expand indicator */}
        {remaining.length > 0 && (
          <span className="shrink-0 text-text-muted">
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </span>
        )}

        {/* Dismiss (top reminder only) */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            dismiss(top.vehicle.id, top.serviceId);
          }}
          className={cn(
            "shrink-0 w-7 h-7 rounded-full flex items-center justify-center",
            "text-text-muted hover:text-text-primary hover:bg-surface-soft transition-colors"
          )}
          aria-label="Dismiss reminder"
        >
          <X size={14} />
        </button>
      </div>

      {/* ── Expanded: full schedule ──────────────────────────── */}
      {expanded && (
        <div className="border-t border-border-subtle divide-y divide-border-subtle/50">
          {/* Remaining reminders */}
          {remaining.map((r) => {
            const rBadge = severityLabel(r.severity);
            return (
              <div
                key={reminderKey(r.vehicle.id, r.serviceId)}
                className="flex items-center gap-3 px-4 py-2.5"
              >
                <span className={cn(
                  "shrink-0 w-7 h-7 rounded-full flex items-center justify-center",
                  r.status === "overdue"
                    ? "bg-red-500/15 text-red-400"
                    : "bg-surface-soft text-text-muted"
                )}>
                  <Wrench size={13} />
                </span>

                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-text-primary truncate">
                    {r.vehicle.make} {r.vehicle.model}
                    {" — "}
                    {r.label}
                  </p>
                  <p className="text-[11px] text-text-muted mt-0.5">
                    {r.status === "overdue"
                      ? "Overdue"
                      : r.milesRemaining != null
                        ? `${formatKm(r.milesRemaining)} remaining`
                        : r.daysRemaining != null
                          ? `${r.daysRemaining} day${r.daysRemaining === 1 ? "" : "s"} remaining`
                          : "Upcoming"}
                  </p>
                </div>

                <span className={cn(
                  "shrink-0 px-1.5 py-0.5 rounded-full text-[10px] font-semibold border",
                  rBadge.cls
                )}>
                  {rBadge.label}
                </span>

                <button
                  type="button"
                  onClick={() => dismiss(r.vehicle.id, r.serviceId)}
                  className={cn(
                    "shrink-0 w-6 h-6 rounded-full flex items-center justify-center",
                    "text-text-dim hover:text-text-primary hover:bg-surface-soft transition-colors"
                  )}
                  aria-label={`Dismiss ${r.label} reminder`}
                >
                  <X size={12} />
                </button>
              </div>
            );
          })}

          {/* Empty state for expanded list when only top was shown */}
          {remaining.length === 0 && (
            <div className="flex items-center gap-2 px-4 py-3 text-xs text-text-muted">
              <Calendar size={14} />
              <span>No other upcoming reminders</span>
            </div>
          )}
        </div>
      )}
    </GlassCard>
  );
}
