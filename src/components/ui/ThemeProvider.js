"use client";
import { useEffect, useSyncExternalStore } from "react";
import { useThemeStore, themeStore } from "@/store/themeStore";

const STORAGE_KEY = "clutchd_theme";

/** Snapshot of the <html> data-theme attribute set by the inline script. */
function getDocumentTheme() {
  if (typeof document === "undefined") return "light";
  return document.documentElement.getAttribute("data-theme") || "light";
}

function hasExplicitOverride() {
  try {
    return localStorage.getItem(STORAGE_KEY) !== null;
  } catch {
    return false;
  }
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
    if (storeTheme !== documentTheme) {
      document.documentElement.setAttribute("data-theme", storeTheme);
      document.documentElement.classList.toggle("dark", storeTheme === "dark");
    }
  }, [storeTheme, documentTheme]);

  // Listen for system color scheme changes when no explicit override is set
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e) => {
      if (!hasExplicitOverride()) {
        themeStore.setState({ theme: e.matches ? "dark" : "light" });
      }
    };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  return <>{children}</>;
}
