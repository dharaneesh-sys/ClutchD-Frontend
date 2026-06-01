"use client";

import { useEffect } from "react";
import { useAuthStore } from "../../store/authStore";

const MIGRATION_KEY = "clutchd_token_migrated";

export function AuthInit() {
  const checkAuth = useAuthStore((s) => s.checkAuth);

  useEffect(() => {
    if (typeof window !== "undefined" && !localStorage.getItem(MIGRATION_KEY)) {
      localStorage.removeItem("clutchd_token");
      localStorage.setItem(MIGRATION_KEY, "1");
    }
    checkAuth();
  }, [checkAuth]);

  return null;
}
