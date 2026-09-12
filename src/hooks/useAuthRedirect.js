"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";

const KNOWN_ROLES = new Set(["customer", "mechanic", "garage"]);

/**
 * Send already-authenticated users straight to their dashboard.
 * Used by `/` and `/auth` so a remembered session never parks on the
 * landing/login screen after a cold start. Waits for persist rehydration
 * + restore to finish first — no redirect while `_isRestoring`.
 */
export function useAuthRedirect() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const hydrated = useAuthStore((s) => s._hydrated);
  const restoring = useAuthStore((s) => s._isRestoring);

  useEffect(() => {
    if (!hydrated || restoring) return;
    if (!isAuthenticated || !user?.id) return;
    const dest =
      user.role === "admin"
        ? "/admin"
        : `/dashboard/${KNOWN_ROLES.has(user.role) ? user.role : "customer"}`;
    router.replace(dest);
  }, [hydrated, restoring, isAuthenticated, user, router]);
}
