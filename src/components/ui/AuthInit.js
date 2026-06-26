"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/store/authStore";
export function AuthInit() {
  const checkAuth = useAuthStore((s) => s.checkAuth);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("auth-storage");
      if (!raw) return checkAuth();
      const stored = JSON.parse(raw);
      const userId = stored?.state?.user?.id || stored?.state?.userId;

      // Skip refresh for demo users — their tokens can't validate against real backend.
      // Demo mode can be toggled at runtime via the toolbar even when the static
      // DEMO_MODE flag is false, so we never clear persisted demo state on mount.
      if (typeof userId === "string" && userId.startsWith("demo-")) return;

      checkAuth();
    } catch (e) {
      checkAuth();
    }
  }, [checkAuth]);

  return null;
}
