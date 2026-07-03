"use client";

import { useEffect, useRef } from "react";
import { useAuthStore } from "@/store/authStore";
import { useNotificationStore } from "@/store/notificationStore";

/**
 * Initialises push notification registration after the user logs in.
 *
 * This component is mounted once in the root layout and reacts to auth state
 * changes. When the user transitions from unauthenticated → authenticated,
 * it automatically registers for push notifications (permission request is
 * triggered by the browser prompt inside pushService).
 */
export function PushInit() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const pushEnabled = useNotificationStore((s) => s.pushEnabled);
  const registerPushToken = useNotificationStore((s) => s.registerPushToken);
  const prevAuth = useRef(isAuthenticated);

  useEffect(() => {
    // Transition: was not authenticated → now authenticated
    if (isAuthenticated && !prevAuth.current && !pushEnabled) {
      registerPushToken();
    }
    prevAuth.current = isAuthenticated;
  }, [isAuthenticated, pushEnabled, registerPushToken]);

  return null;
}
