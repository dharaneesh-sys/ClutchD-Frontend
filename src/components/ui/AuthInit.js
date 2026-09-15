"use client";

import { useEffect, useRef } from "react";
import { useAuthStore } from "@/store/authStore";
import { registerOnlineFlush } from "@/lib/offline/requestQueue";

/**
 * AuthInit runs once on mount.
 *
 * Attempts to restore the user's session via the httpOnly refresh cookie
 * (POST /auth/refresh). If the backend returns a valid token, the user is
 * automatically logged in without needing to re-enter credentials.
 *
 * restoreSession was previously DISABLED because error #185 (Maximum update
 * depth exceeded) was triggered by cascading store setState() calls on app
 * start. The root cause was getFilteredProviders() in trackingStore.js —
 * a getter function that returned new array references every call, violating
 * React 19's useSyncExternalStore caching requirement. With that function
 * removed and stable primitive selectors in ProviderList.jsx, session restore
 * is now safe to re-enable.
 */
export function AuthInit() {
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;

    const start = () => {
      if (ran.current) return;
      ran.current = true;
      // Pre-warm the funnel connection: the TLS handshake through
      // *.ts.net takes 6-9s cold from Indian ISPs. Starting it during the
      // splash screen means the first REAL request reuses the warm socket
      // (axios/React-Native keep-alive) instead of paying the handshake
      // again. Fire-and-forget with NO timeout games — unlike the previous
      // broken speed experiment, this cannot fail a request: it only adds
      // one extra harmless GET that nobody waits on.
      try {
        const base = process.env.NEXT_PUBLIC_API_URL;
        if (base) {
          fetch(new URL("/health", base).toString(), {
            method: "GET",
            cache: "no-store",
            // Deliberately NO AbortSignal.timeout — an aborted socket is not
            // reusable, which defeated the whole purpose last time.
          }).catch(() => {});
        }
      } catch {}
      useAuthStore.getState().restoreSession();
      registerOnlineFlush();
    };

    // Wait for zustand-persist rehydration: on a cold start (especially the
    // Capacitor WebView) storage is slower than mount, so calling
    // restoreSession() immediately would see empty state and bail out,
    // losing the session. Go at once only if already hydrated.
    const alreadyHydrated =
      useAuthStore.getState()._hydrated ||
      useAuthStore.persist?.hasHydrated?.() === true;
    if (alreadyHydrated) {
      start();
      return;
    }
    const unsub = useAuthStore.persist?.onFinishHydration?.(() => start());
    // Safety net in case hydration never fires — don't block the app.
    const t = setTimeout(() => {
      if (typeof unsub === "function") unsub();
      start();
    }, 3000);
    return () => {
      clearTimeout(t);
      if (typeof unsub === "function") unsub();
    };
  }, []);

  // Refresh the session when the native app returns to foreground.
  // Covers background→foreground after hours (token TTL is 15 min).
  // Web builds never fire this event — the effect below is a no-op there.
  useEffect(() => {
    let removeListener = null;
    let cancelled = false;
    (async () => {
      try {
        if (typeof window === "undefined" || !window.Capacitor?.isNativePlatform?.()) return;
        if (!window.Capacitor.isNativePlatform()) return;
        const { App } = await import("@capacitor/app");
        if (cancelled) return;
        const sub = await App.addListener("resume", () => {
          const st = useAuthStore.getState();
          if (st.isAuthenticated && st.user?.id) st.restoreSession();
        });
        removeListener = () => sub.remove();
      } catch (e) {
        console.debug("[AuthInit] native resume unavailable:", e?.message);
      }
    })();
    return () => {
      cancelled = true;
      try {
        removeListener?.();
      } catch (e) {
        console.debug("[AuthInit] resume cleanup:", e?.message);
      }
    };
  }, []);

  return null;
}
