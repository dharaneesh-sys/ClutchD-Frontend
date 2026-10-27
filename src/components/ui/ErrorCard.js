"use client";

import { AlertTriangle } from "lucide-react";

export default function ErrorCard({ error, onRetry, className = "" }) {
  const message = error?.message || "An unexpected error occurred. Please try again.";

  return (
    <div className={`flex items-center justify-center min-h-screen px-4 bg-[var(--background)] ${className}`}>
      <div className="surface-card p-8 sm:p-10 text-center max-w-md w-full">
        <div className="w-14 h-14 mx-auto mb-5 rounded-full bg-[color-mix(in_srgb,var(--danger)_12%,transparent)] flex items-center justify-center">
          <AlertTriangle className="w-7 h-7 text-[var(--danger)]" strokeWidth={2} aria-hidden="true" />
        </div>
        <h2 className="text-xl font-semibold text-[var(--foreground)] mb-2">Something went wrong</h2>
        <p className="text-[var(--text-muted)] mb-6 text-sm">{message}</p>
        <div className="flex flex-wrap justify-center gap-3">
          {onRetry && (
            <button
              onClick={onRetry}
              className="min-h-[44px] px-6 rounded-xl bg-[var(--primary)] hover:bg-[var(--primary-dark)] text-[var(--on-primary)] font-semibold text-sm transition-colors"
            >
              Try Again
            </button>
          )}
          <button
            onClick={() => window.location.assign("/auth")}
            className="min-h-[44px] px-6 rounded-xl border border-[var(--primary)] text-[var(--primary-dark)] font-semibold text-sm transition-colors hover:bg-[var(--surface-soft)]"
          >
            Go to Login
          </button>
        </div>
        <button
          onClick={() => {
            try {
              localStorage.clear();
              sessionStorage.clear();
            } catch {}
            window.location.assign("/auth");
          }}
          className="mt-3 min-h-[44px] text-xs text-[var(--text-muted)] underline hover:text-[var(--foreground)] transition-colors"
        >
          Clear app data and restart
        </button>
      </div>
    </div>
  );
}