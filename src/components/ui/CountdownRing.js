"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

function remainingMs(expiresAt, now) {
  const end = new Date(expiresAt).getTime();
  return Number.isFinite(end) ? Math.max(0, end - now) : null;
}

export function formatRemaining(ms) {
  const total = Math.ceil(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

/**
 * Countdown to a real server `expiresAt`. Ticks once a second while the page
 * is visible and pauses while hidden (it resyncs to the real clock when shown
 * again). It never fires an action on expiry — callers decide what to show.
 * `windowMs` is the full offer window used only to draw the ring.
 */
export function CountdownRing({ expiresAt, windowMs = 15 * 60 * 1000, size = 44, className }) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!expiresAt) return undefined;
    let timer = null;
    const start = () => {
      if (timer || (typeof document !== "undefined" && document.hidden)) return;
      setNow(Date.now());
      timer = setInterval(() => setNow(Date.now()), 1000);
    };
    const stop = () => {
      if (timer) clearInterval(timer);
      timer = null;
    };
    const onVisibility = () => (document.hidden ? stop() : start());
    start();
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      stop();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [expiresAt]);

  const ms = expiresAt ? remainingMs(expiresAt, now) : null;
  if (ms === null) return null;

  const expired = ms <= 0;
  const stroke = 4;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const fraction = Math.min(1, ms / windowMs);
  const label = expired ? "Expired" : formatRemaining(ms);

  return (
    <span
      role="timer"
      aria-live="off"
      aria-label={expired ? "Offer expired" : `Offer expires in ${label}`}
      className={cn("inline-flex items-center gap-2", className)}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true" className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--border)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={expired ? "var(--danger)" : fraction < 0.2 ? "var(--pending)" : "var(--primary)"}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - fraction)}
        />
      </svg>
      <span
        className={cn(
          "text-sm font-semibold tabular-nums",
          expired ? "text-[var(--danger-ink)]" : "text-[var(--foreground)]"
        )}
      >
        {label}
      </span>
    </span>
  );
}
