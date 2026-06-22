"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/store/authStore";

export function AuthInit() {
  const checkAuth = useAuthStore((s) => s.checkAuth);

  useEffect(() => {
    // Skip refresh for demo users — their tokens can't validate against real backend
    try {
      const stored = JSON.parse(localStorage.getItem("auth-storage") || "{}");
      if (stored?.state?.user?.id?.startsWith?.("demo-")) return;
    } catch (e) {}
    checkAuth();
  }, [checkAuth]);

  return null;
}
