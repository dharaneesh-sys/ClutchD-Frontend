"use client";

import React from "react";
import { AlertTriangle } from "lucide-react";

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("[ErrorBoundary]", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const errorMessage =
        this.state.error?.message || "An unexpected error occurred.";

      return (
        <div className="flex items-center justify-center min-h-screen px-4 bg-background">
          <div className="glass-lux p-8 sm:p-12 text-center max-w-md w-full">
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-red-500/10 flex items-center justify-center">
              <AlertTriangle className="w-8 h-8 text-red-400" strokeWidth={2} />
            </div>
            <h2 className="text-xl font-bold text-foreground mb-2">
              Something went wrong
            </h2>
            <p className="text-sm text-text-muted mb-6">{errorMessage}</p>

            {/* Expandable error details */}
            {this.state.error && (
              <details className="mb-6 text-left">
                <summary className="cursor-pointer text-xs text-text-muted hover:text-foreground transition-colors select-none">
                  Error details
                </summary>
                <pre className="mt-2 p-3 rounded-lg bg-surface-soft text-xs text-text-muted overflow-auto max-h-32 whitespace-pre-wrap break-all">
                  {this.state.error.stack || this.state.error.message}
                </pre>
              </details>
            )}

            <button
              onClick={() => this.setState({ hasError: false, error: null })}
              className="px-6 py-3 rounded-xl bg-primary hover:opacity-90 text-white font-semibold text-sm transition-all duration-200"
            >
              Try Again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
