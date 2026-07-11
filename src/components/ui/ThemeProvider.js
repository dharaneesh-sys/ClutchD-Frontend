"use client";
import { useEffect, useSyncExternalStore } from "react";
import { useThemeStore } from "@/store/themeStore";

/** Snapshot of the <html> data-theme attribute set by the inline script. */
function getDocumentTheme() {
  if (typeof document === "undefined") return "light";
  return document.documentElement.getAttribute("data-theme") || "light";
}

export function ThemeProvider({ children }) {
  const storeTheme = useThemeStore((s) => s.theme);
  // Read what the inline script already set so we don't double-write
  const documentTheme = useSyncExternalStore(
    () => () => {}, // never subscribes — snapshot-only
    getDocumentTheme,
    () => "light",
  );

  useEffect(() => {
    // Only write if the store value differs from what the inline script set
    if (storeTheme !== documentTheme) {
      document.documentElement.setAttribute("data-theme", storeTheme);
    }
  }, [storeTheme, documentTheme]);

  return <>{children}</>;
}
