"use client";

import { useEffect, useRef } from "react";
import { useAuthStore } from "@/store/authStore";
import { useNotificationStore } from "@/store/notificationStore";
import {
  setupPushListeners,
  onPushReceived,
} from "@/lib/push/pushService";
import { handleForegroundPush } from "@/lib/push/pushNotificationHandler";

/**
 * Initialises push notification listeners and auth-gated registration.
 *
 * Mounted once in the root layout:
 * 1. Bootstraps foreground push listeners (toast notifications + deep-links)
 *    and platform-specific listeners (Capacitor tap actions).
 * 2. Reacts to auth state changes — auto-registers for push when the user
 *    transitions from unauthenticated → authenticated.
 */
export function PushInit() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const pushEnabled = useNotificationStore((s) => s.pushEnabled);
  const registerPushToken = useNotificationStore((s) => s.registerPushToken);
  const prevAuth = useRef(isAuthenticated);

  // ── Bootstrap push listeners once on mount ──────────────────────────
  useEffect(() => {
    // Register foreground push → toast handler (synchronous)
    const unsubHandler = onPushReceived(handleForegroundPush);

    // Set up platform listeners (e.g. Capacitor notification-tap actions)
    const setupPromise = setupPushListeners();

    return () => {
      // Unsubscribe the foreground handler immediately
      unsubHandler();

      // Await the resolved cleanup, then invoke it
      setupPromise.then((cleanup) => cleanup());
    };
  }, []);

  // ── Auth-triggered push token registration ──────────────────────────
  useEffect(() => {
    if (isAuthenticated && !prevAuth.current && !pushEnabled) {
      // Defer to break React 19 flushSync cascade on login (error 185)
      const id = setTimeout(() => registerPushToken(), 0);
      prevAuth.current = isAuthenticated;
      return () => clearTimeout(id);
    }
    prevAuth.current = isAuthenticated;
  }, [isAuthenticated, pushEnabled, registerPushToken]);

  return null;
}
