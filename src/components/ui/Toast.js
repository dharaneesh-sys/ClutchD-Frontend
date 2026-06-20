"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { useThemeStore } from "@/store/themeStore";
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

const TYPE_CLASSES = {
  success: "border-primary/30 bg-primary/10",
  error: "border-red-500/30 bg-red-500/10",
  warning: "border-amber-500/30 bg-amber-500/10",
  info: "border-blue-500/30 bg-blue-500/10",
};

const ICON_CLASSES = {
  success: "text-primary-light",
  error: "text-red-400",
  warning: "text-amber-400",
  info: "text-blue-400",
};

const TOAST_ROLES = {
  success: "status",
  error: "alert",
  warning: "alert",
  info: "status",
};

const PROGRESS_CLASSES = {
  success: "bg-primary",
  error: "bg-red-500",
  warning: "bg-amber-500",
  info: "bg-blue-500",
};

export function Toast({ toast, onDismiss }) {
  const { theme } = useThemeStore();
  const isLight = theme === "light";
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
        "flex items-start gap-3 p-4 rounded-2xl border glass-strong animate-fade-in-up",
        "min-w-[300px] max-w-md shadow-xl relative overflow-hidden",
        TYPE_CLASSES[toast.type]
      )}
      role={TOAST_ROLES[toast.type] || "status"}
    >
      {/* Progress bar */}
      {!toast.persistent && toast.duration > 0 && (
        <div
          className="absolute bottom-0 left-0 h-1 transition-all duration-75 ease-linear"
          style={{
            width: `${progress}%`,
            backgroundColor: `var(--color-${PROGRESS_CLASSES[toast.type].replace("bg-", "")})`,
          }}
        />
      )}

      <div className={cn("flex-shrink-0 mt-0.5", ICON_CLASSES[toast.type])}>
        <Icon size={20} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-text-primary">
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
              "text-icon-highlight"
            )}
          >
            {toast.action.label}
          </button>
        )}
      </div>
      <button
        onClick={() => onDismiss(toast.id)}
        className={cn(
          "flex-shrink-0 p-1 rounded-lg transition-colors",
          "text-text-dim hover:text-text-primary hover:bg-surface-soft"
        )}
        aria-label="Dismiss"
      >
        <XCircle size={16} />
      </button>
    </div>
  );
}