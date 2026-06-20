"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/store/authStore";

const MIGRATION_KEY = "clutchd_token_migrated";

export function AuthInit() {
  const checkAuth = useAuthStore((s) => s.checkAuth);

  useEffect(() => {
    if (typeof window !== "undefined" && !localStorage.getItem(MIGRATION_KEY)) {
      localStorage.removeItem("clutchd_token");
      localStorage.setItem(MIGRATION_KEY, "1");
    }
    // Skip refresh for demo users — their tokens can't validate against real backend
    try {
      const stored = JSON.parse(localStorage.getItem("auth-storage") || "{}");
      if (stored?.state?.user?.id?.startsWith?.("demo-")) return;
    } catch (e) {}
    checkAuth();
  }, [checkAuth]);

  return null;
}
