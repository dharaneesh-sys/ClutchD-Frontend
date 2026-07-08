"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import {
  pushNavigation,
  getBackTarget,
  popNavigation,
} from "@/lib/backNavigation";

/**
 * Handles the Android hardware back gesture with navigation context awareness.
 *
 * Tracks navigation history via `usePathname` (forward navigation) and
 * `popstate` events (browser back/forward). When the Capacitor back button
 * fires, it consults `getBackTarget()` to decide the correct action based
 * on the current page context instead of blindly going back:
 *
 *  - **Auth page** → exit the app (let Capacitor default handle it)
 *  - **Dashboard** → stay on the dashboard (don't navigate back to auth)
 *  - **Marketplace, admin, etc.** → default browser back
 *
 * Safe no-op when not inside a Capacitor WebView (e.g. browser dev).
 */
export function BackButtonHandler() {
  const pathname = usePathname();
  const initialized = useRef(false);
  const wasPopState = useRef(false);

  // ── Track popstate events (browser back/forward navigation) ──────
  useEffect(() => {
    const handlePopState = () => {
      wasPopState.current = true;
      popNavigation();
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  // ── Track pathname changes (forward navigation) ──────────────────
  useEffect(() => {
    // First mount: push the initial pathname
    if (!initialized.current) {
      initialized.current = true;
      pushNavigation(pathname);
      return;
    }

    // If the pathname change was caused by a popstate (browser back/forward),
    // the popstate handler already managed the tracking stack — skip.
    if (wasPopState.current) {
      wasPopState.current = false;
      return;
    }

    // Forward navigation via Next.js router / link clicks
    pushNavigation(pathname);
  }, [pathname]);

  // ── Capacitor hardware back button handler ───────────────────────
  useEffect(() => {
    let handle = null;

    async function setup() {
      try {
        const { App } = await import("@capacitor/app");
        const listener = await App.addListener("backButton", () => {
          const target = getBackTarget();

          switch (target.action) {
            case "exit":
              // Let Capacitor default behavior exit the app.
              break;

            case "stay":
              // Stay on the current page (dashboard context — prevents
              // navigating back to auth/login after login).
              break;

            case "back":
            default:
              if (window.history.length > 1) {
                window.history.back();
              }
              // If no history, Capacitor default exit applies.
              break;
          }
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
