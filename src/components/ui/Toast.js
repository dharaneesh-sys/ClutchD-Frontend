"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  Info,
  AlertTriangle,
} from "lucide-react";

const ICONS = {
  success: CheckCircle2,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
};

// Semantic, opaque toasts (DESIGN.md §0): a tinted left rule on a flat card.
const TYPE_CLASSES = {
  success: "border-l-[var(--success)]",
  error: "border-l-[var(--danger)]",
  warning: "border-l-[var(--pending)]",
  info: "border-l-[var(--primary)]",
};

const ICON_CLASSES = {
  success: "text-[var(--success)]",
  error: "text-[var(--danger)]",
  warning: "text-[var(--pending)]",
  info: "text-[var(--primary-dark)]",
};

const TOAST_ROLES = {
  success: "status",
  error: "alert",
  warning: "alert",
  info: "status",
};

const PROGRESS_COLORS = {
  success: "var(--success)",
  error: "var(--danger)",
  warning: "var(--pending)",
  info: "var(--primary)",
};

export function Toast({ toast, onDismiss }) {
  const Icon = ICONS[toast.type] || Info;
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    if (toast.persistent || toast.duration <= 0) return;

    const startTime = Date.now();
    const duration = toast.duration;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const pct = Math.max(0, 100 - (elapsed / duration) * 100);
      setProgress(pct);
      if (pct > 0) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [toast.persistent, toast.duration]);

  useEffect(() => {
    if (toast.persistent || toast.duration <= 0) return;
    const timer = setTimeout(() => onDismiss(toast.id), toast.duration);
    return () => clearTimeout(timer);
  }, [toast, onDismiss]);

  return (
    <div
      className={cn(
        "flex items-start gap-3 p-4 rounded-2xl border border-[var(--border)] border-l-4 bg-[var(--surface-card)] animate-fade-in-up",
        "min-w-[min(300px,calc(100vw-32px))] max-w-md shadow-[var(--shadow-card)] relative overflow-hidden",
        TYPE_CLASSES[toast.type] || TYPE_CLASSES.info
      )}
      role={TOAST_ROLES[toast.type] || "status"}
    >
      {/* Progress bar */}
      {!toast.persistent && toast.duration > 0 && (
        <div
          className="absolute bottom-0 left-0 h-1 transition-all duration-75 ease-linear"
          style={{
            width: `${progress}%`,
            backgroundColor: PROGRESS_COLORS[toast.type] || PROGRESS_COLORS.info,
          }}
        />
      )}

      <div className={cn("flex-shrink-0 mt-0.5", ICON_CLASSES[toast.type])}>
        <Icon size={20} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-[var(--foreground)]">
          {toast.message}
        </p>
        {toast.action && (
          <button
            onClick={() => {
              toast.action.onClick();
              onDismiss(toast.id);
            }}
            className={cn(
              "mt-2 text-sm font-medium underline underline-offset-2 transition-colors",
              "text-[var(--primary-dark)]"
            )}
          >
            {toast.action.label}
          </button>
        )}
      </div>
      <button
        onClick={() => onDismiss(toast.id)}
        className={cn(
          "flex-shrink-0 -m-2 p-3 rounded-lg transition-colors",
          "text-[var(--text-muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-soft)]"
        )}
        aria-label="Dismiss"
      >
        <XCircle size={16} />
      </button>
    </div>
  );
}