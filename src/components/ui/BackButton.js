"use client";

import { useEffect } from "react";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

/**
 * Visible in-app back button for sub-pages.
 *
 * - Renders an arrow button (+ optional label) that navigates to `fallback`,
 *   or browser-back when no fallback is given.
 * - Registers the page in the hardware-back escape stack: while this page is
 *   mounted, Android back / back gesture pops to `fallback` instead of
 *   exiting the app (handled cooperatively in BackButtonHandler).
 * - `fallback` defaults to browser-back when history exists, else "/".
 */
export function BackButton({
  fallback = "",
  label = "",
  className = "",
  size = 20,
}) {
  const router = useRouter();

  // Register the escape route for the hardware back button / gesture.
  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const stack = (window.__backEscapeStack = window.__backEscapeStack || []);
    const entry = { fallback: fallback || null };
    stack.push(entry);
    return () => {
      const i = stack.indexOf(entry);
      if (i >= 0) stack.splice(i, 1);
    };
  }, [fallback]);

  const goBack = () => {
    if (fallback) {
      router.push(fallback);
      return;
    }
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push("/");
    }
  };

  return (
    <button
      type="button"
      onClick={goBack}
      aria-label={label || "Go back"}
      className={`inline-flex items-center justify-center gap-1.5 rounded-xl p-2 text-text-muted transition-colors hover:bg-surface-soft hover:text-text-primary active:scale-95 ${className}`}
    >
      <ArrowLeft size={size} />
      {label ? <span className="text-sm font-semibold">{label}</span> : null}
    </button>
  );
}
