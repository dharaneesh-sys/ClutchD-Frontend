"use client";

import { AlertTriangle } from "lucide-react";

export default function ErrorCard({ error, onRetry, className = "" }) {
  const message = error?.message || "An unexpected error occurred. Please try again.";

  return (
    <div className={`flex items-center justify-center min-h-screen px-4 bg-[var(--background)] ${className}`}>
      <div className="glass p-8 sm:p-12 text-center max-w-md w-full">
        <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-red-500/10 flex items-center justify-center">
          <AlertTriangle className="w-8 h-8 text-red-400" strokeWidth={2} />
        </div>
        <h2 className="text-xl font-bold text-[var(--foreground)] mb-2">Something Went Wrong</h2>
        <p className="text-[var(--foreground)]/60 mb-6 text-sm">{message}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="px-6 py-3 rounded-xl bg-[var(--primary)] hover:opacity-90 text-white font-semibold text-sm transition-all duration-200"
          >
            Try Again
          </button>
        )}
      </div>
    </div>
  );
}