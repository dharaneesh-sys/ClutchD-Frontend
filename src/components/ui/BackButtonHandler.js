"use client";

import { useEffect } from "react";

/**
 * Handles the Android hardware back gesture so it navigates back through
 * the history stack instead of exiting the app.
 *
 * Safe no-op when not inside a Capacitor WebView (e.g. browser dev).
 */
export function BackButtonHandler() {
  useEffect(() => {
    let handle = null;

    async function setup() {
      try {
        const { App } = await import("@capacitor/app");
        const listener = await App.addListener("backButton", () => {
          if (window.history.length > 1) {
            window.history.back();
          }
          // If no history, default Android exit behavior applies.
        });
        handle = listener;
      } catch {
        // Not inside Capacitor — nothing to do.
      }
    }

    setup();

    return () => {
      if (handle) {
        handle.remove();
      }
    };
  }, []);

  return null;
}
