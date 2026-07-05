"use client";

import { useMemo } from "react";
import {
  Package,
  Truck,
  CheckCircle2,
  Store,
  Hand,
  RotateCcw,
  XCircle,
} from "lucide-react";
import { cn, formatTime } from "@/lib/utils";

// ─── Flow definitions ──────────────────────────────────────────────────

const FLOWS = {
  delivery: [
    { status: "pending",    label: "Order Placed",     icon: Package },
    { status: "confirmed",  label: "Confirmed",         icon: RotateCcw },
    { status: "shipped",    label: "Shipped",           icon: Truck },
    { status: "delivered",  label: "Delivered",         icon: CheckCircle2 },
  ],
  bopis: [
    { status: "pending",          label: "Order Placed",      icon: Package },
    { status: "confirmed",        label: "Confirmed",         icon: RotateCcw },
    { status: "ready_for_pickup", label: "Ready for Pickup",  icon: Store },
    { status: "picked_up",        label: "Picked Up",         icon: Hand },
  ],
};

/**
 * Build a lookup from status string → timestamp.
 * statusHistory entries may use `timestamp` or `createdAt`.
 */
function buildTimestampMap(statusHistory) {
  const map = {};
  if (!statusHistory || !Array.isArray(statusHistory)) return map;
  for (const entry of statusHistory) {
    if (entry.status) {
      map[entry.status] = entry.timestamp || entry.createdAt || null;
    }
  }
  return map;
}

/**
 * Determine the current step index from the order status.
 * Handles `cancelled` — shows progress up to the cancelled step.
 */
function resolveCurrentIndex(steps, currentStatus) {
  if (!currentStatus) return -1;

  if (currentStatus === "cancelled") {
    // Show progress up to whatever was the last non-cancelled step
    return -2; // special sentinel
  }

  const idx = steps.findIndex((s) => s.status === currentStatus);
  return idx >= 0 ? idx : -1;
}

// ─── Sub-components ───────────────────────────────────────────────────

function TimelineStep({ step, state, timestamp, isLast }) {
  const Icon = step.icon;

  const stateClasses = {
    completed: {
      dot: "bg-emerald-400 border-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.45)]",
      line: "bg-emerald-400/60",
      text: "text-emerald-300",
      icon: "text-emerald-900",
      desc: "",
    },
    current: {
      dot: "bg-primary border-primary shadow-[0_0_12px_rgba(16,185,129,0.55)]",
      line: "bg-primary/40",
      text: "text-primary-light",
      icon: "text-primary",
      desc: "text-text-muted font-medium",
    },
    pending: {
      dot: "bg-surface-container border-white/15",
      line: "bg-white/8",
      text: "text-text-dim",
      icon: "text-text-dim/40",
      desc: "text-text-dim/60",
    },
    cancelled: {
      dot: "bg-rose-500/30 border-rose-500/50",
      line: "bg-rose-500/20",
      text: "text-rose-400",
      icon: "text-rose-400",
      desc: "text-rose-400/60",
    },
  };

  const s = stateClasses[state] || stateClasses.pending;

  return (
    <div className="flex gap-3.5 group">
      {/* Dot column */}
      <div className="flex flex-col items-center shrink-0">
        {/* Dot */}
        <div
          className={cn(
            "relative z-10 flex items-center justify-center w-8 h-8 rounded-full border-2 transition-all duration-300",
            s.dot,
            state === "current" && "animate-pulse-ring"
          )}
        >
          <Icon
            size={14}
            className={cn(
              "shrink-0 transition-colors duration-300",
              s.icon
            )}
          />
        </div>

        {/* Connecting line */}
        {!isLast && (
          <div
            className={cn(
              "w-0.5 flex-1 min-h-[2rem] transition-colors duration-300",
              s.line
            )}
          />
        )}
      </div>

      {/* Content */}
      <div className={cn("pb-6 pt-0.5 min-w-0", isLast && "pb-0")}>
        <p
          className={cn(
            "text-sm font-semibold transition-colors duration-300",
            s.text
          )}
        >
          {step.label}
        </p>
        {timestamp && (
          <p className="text-[0.6875rem] text-text-dim mt-0.5 tabular-nums">
            {formatTime(timestamp)}
          </p>
        )}
        {state === "current" && !timestamp && (
          <p className={cn("text-[0.6875rem] mt-0.5", s.desc)}>
            In progress
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────

/**
 * OrderTimeline — visual order status progression timeline.
 *
 * @param {Object}   props
 * @param {string}   props.status          - Current order status (e.g. "shipped")
 * @param {Array}    [props.statusHistory] - [{ status, timestamp }] for per-step timestamps
 * @param {"delivery"|"bopis"} [props.flowType="delivery"] - Order flow
 * @param {string}   [props.className]     - Additional classes
 */
export function OrderTimeline({
  status,
  statusHistory,
  flowType = "delivery",
  className,
}) {
  const steps = useMemo(() => FLOWS[flowType] || FLOWS.delivery, [flowType]);

  const timestampMap = useMemo(
    () => buildTimestampMap(statusHistory),
    [statusHistory]
  );

  const currentIndex = useMemo(
    () => resolveCurrentIndex(steps, status),
    [steps, status]
  );

  const isCancelled = status === "cancelled";

  return (
    <div className={cn("relative", className)}>
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted">
          Order Timeline
        </h3>
        {flowType === "bopis" && (
          <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[0.5625rem] font-semibold uppercase tracking-wider text-primary-light">
            BOPIS
          </span>
        )}
      </div>

      {/* Timeline */}
      <div className="relative">
        {steps.map((step, index) => {
          const isLast = index === steps.length - 1;

          let state;
          if (isCancelled) {
            // Show all steps as cancelled if they were reached, else pending
            const stepTs = timestampMap[step.status];
            state = stepTs ? "cancelled" : "pending";
          } else if (currentIndex === -1) {
            // Status not found in steps — treat all as pending
            state = "pending";
          } else if (index < currentIndex) {
            state = "completed";
          } else if (index === currentIndex) {
            state = "current";
          } else {
            state = "pending";
          }

          return (
            <TimelineStep
              key={step.status}
              step={step}
              state={state}
              timestamp={timestampMap[step.status]}
              index={index}
              isLast={isLast}
            />
          );
        })}

        {/* Cancelled banner */}
        {isCancelled && (
          <div className="flex items-center gap-2 mt-2 ml-11 rounded-lg bg-rose-500/10 px-3 py-2 border border-rose-500/20">
            <XCircle size={14} className="shrink-0 text-rose-400" />
            <span className="text-xs font-medium text-rose-300">
              Order cancelled
            </span>
          </div>
        )}
      </div>

      {/* Pulse ring animation keyframes — injected once */}
      <style jsx>{`
        @keyframes pulse-ring {
          0% {
            box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.5);
          }
          40% {
            box-shadow: 0 0 0 8px rgba(16, 185, 129, 0);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(16, 185, 129, 0);
          }
        }
        .animate-pulse-ring {
          animation: pulse-ring 2s ease-out infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .animate-pulse-ring {
            animation: none;
          }
        }
      `}</style>
    </div>
  );
}
