"use client";

import { useEffect, useRef } from "react";
import { useAuthStore } from "@/store/authStore";

/**
 * AuthInit runs once on mount to restore the persisted session.
 * It calls restoreSession() which attempts a POST /auth/refresh
 * using the httpOnly refresh cookie. If the cookie is valid, the
 * access token is refreshed and the user stays logged in.
 *
 * This does NOT redirect on failure — page-level guards handle that
 * by checking _hydrated and _isRestoring.
 */
export function AuthInit() {
  const restoreSession = useAuthStore((s) => s.restoreSession);
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    try {
      const raw = localStorage.getItem("auth-storage");
      if (!raw) {
        // No persisted session — nothing to restore
        useAuthStore.setState({ _isRestoring: false });
        return;
      }
      const stored = JSON.parse(raw);
      const userId = stored?.state?.user?.id || stored?.state?.userId;

      // Demo users — skip refresh against real backend
      if (typeof userId === "string" && userId.startsWith("demo-")) {
        useAuthStore.setState({ _isRestoring: false });
        return;
      }

      // Attempt real session restore
      restoreSession();
    } catch {
      // If anything goes wrong, stop restoring so the page can render
      useAuthStore.setState({ _isRestoring: false });
    }
  }, [restoreSession]);

  return null;
}
