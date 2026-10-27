"use client";

import { Logo } from "@/components/ui/Logo";

/**
 * In-app splash: blue hero with the recoloured gear mark. Callers render it
 * while auth bootstrap is pending (`!_hydrated`), so it shows for as long as
 * the app is actually waiting — not only while a session is being restored.
 * The background matches the native Android launch colour to avoid a flash.
 */
export default function SplashScreen({ subtitle = "Doorstep Two-Wheeler Service & Spare Parts" }) {
  return (
    <div
      role="status"
      aria-label="Loading ClutchD"
      className="relative min-h-[100dvh] w-full overflow-hidden bg-[linear-gradient(180deg,var(--splash-bg)_0%,var(--splash-bg-deep)_100%)]"
    >
      <div className="relative flex min-h-[100dvh] flex-col items-center justify-center gap-5 px-6 text-center">
        <span className="flex h-24 w-24 items-center justify-center rounded-3xl border border-[var(--glass-overlay-border)] bg-[var(--glass-overlay-bg)] shadow-[var(--shadow-card)] backdrop-blur-[var(--glass-overlay-blur)]">
          <Logo size="lg" />
        </span>
        <div>
          <p className="text-3xl font-bold tracking-tight text-[var(--on-splash)]">ClutchD</p>
          <p className="mt-2 max-w-xs text-sm font-medium text-[var(--on-splash-muted)]">{subtitle}</p>
        </div>
        <div
          aria-hidden="true"
          className="mt-4 h-1 w-32 overflow-hidden rounded-full bg-[var(--on-splash-track)]"
        >
          <span className="block h-full w-1/3 rounded-full bg-[var(--on-splash)] animate-[splash-progress_1.2s_ease-in-out_infinite] motion-reduce:animate-none motion-reduce:w-full motion-reduce:opacity-60" />
        </div>
      </div>
    </div>
  );
}
