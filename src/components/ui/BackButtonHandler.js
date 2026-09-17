"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  pushNavigation,
  getBackTarget,
  popNavigation,
} from "@/lib/backNavigation";

/**
 * Handles the Android hardware back button and back gesture.
 *
 * Resolution order when back fires:
 *  1. **Escape stack** — pages using <BackButton /> register a fallback
 *     route (upload page → seller dashboard, profile menu → dashboard, …);
 *     top of stack wins. Entries may instead carry a `close` callback so
 *     back closes an open modal/sheet before navigating.
 *  2. **Navigation context** (backNavigation.js):
 *     - auth page → confirm, then let Capacitor exit the app
 *     - dashboard → stay (don't fall back to auth); confirm before exit
 *     - marketplace / admin / general → browser back
 *  3. **No history** → confirm exit.
 *
 * Safe no-op when not inside a Capacitor WebView (e.g. browser dev).
 */
export function BackButtonHandler() {
  const pathname = usePathname();
  const router = useRouter();
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

    // Native confirm keeps this dependency-free. Re-armed after each use so
    // the prompt can fire again on a later press. Note: registering any
    // backButton listener disables Capacitor's default exit, so confirming
    // must call exitApp() explicitly.
    const confirmExit = async () => {
      if (typeof window === "undefined") return;
      if (window.__exitPromptOpen) return;
      window.__exitPromptOpen = true;
      const leave = window.confirm("Exit ClutchD?");
      window.__exitPromptOpen = false;
      if (leave) {
        try {
          const { App } = await import("@capacitor/app");
          await App.exitApp();
        } catch {
          // Browser/dev — nothing to exit.
        }
      }
    };

    async function setup() {
      try {
        const { App } = await import("@capacitor/app");
        const listener = await App.addListener("backButton", () => {
          // 1. Page-registered escape routes (BackButton components).
          const stack =
            typeof window !== "undefined" ? window.__backEscapeStack : null;
          if (stack && stack.length > 0) {
            const top = stack[stack.length - 1];
            if (top && typeof top.close === "function") {
              top.close();
              return;
            }
            if (top && top.fallback) {
              // SPA navigation — instant, keeps the WebView alive.
              router.push(top.fallback);
              return;
            }
          }

          const target = getBackTarget();

          switch (target.action) {
            case "exit":
              // Auth page — confirm before letting the app exit.
              confirmExit();
              break;

            case "stay":
              // Dashboard — don't navigate back to auth. Confirm so an
              // accidental press doesn't kill the app; confirming exits.
              confirmExit();
              break;

            case "back":
            default:
              if (window.history.length > 1) {
                window.history.back();
              } else {
                confirmExit();
              }
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
    // `router` and `pathname` are stable; effect intentionally mounts once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
