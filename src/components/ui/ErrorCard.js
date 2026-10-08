"use client";

import { AlertTriangle } from "lucide-react";

export default function ErrorCard({ error, onRetry, className = "" }) {
  const message = error?.message || "An unexpected error occurred. Please try again.";

  return (
    <div className={`flex items-center justify-center min-h-screen px-4 bg-background ${className}`}>
      <div className="glass-lux rounded-2xl p-8 sm:p-12 text-center max-w-md w-full">
        <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-danger/10 flex items-center justify-center">
          <AlertTriangle className="w-8 h-8 text-danger" strokeWidth={2} />
        </div>
        <h2 className="text-xl font-bold text-foreground mb-2">Something Went Wrong</h2>
        <p className="text-muted mb-6 text-sm">{message}</p>
        <div className="flex flex-wrap justify-center gap-3">
          {onRetry && (
            <button
              onClick={onRetry}
              className="px-6 py-3 rounded-xl bg-primary hover:brightness-110 text-white font-semibold text-sm transition-all duration-200"
            >
              Try Again
            </button>
          )}
          <button
            onClick={() => window.location.assign("/auth")}
            className="px-6 py-3 rounded-xl border border-primary text-primary font-semibold text-sm transition-all duration-200 hover:bg-primary/10"
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
          className="mt-4 text-xs text-text-dim underline hover:text-text-muted transition-colors"
        >
          Clear app data and restart
        </button>
      </div>
    </div>
  );
}