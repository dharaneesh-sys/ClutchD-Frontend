"use client";

import { useEffect, useRef } from "react";
import { useAuthStore } from "@/store/authStore";

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
    ran.current = true;
    useAuthStore.getState().restoreSession();
  }, []);

  return null;
}
