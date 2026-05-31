"use client";

import { useEffect } from "react";
import { useAuthStore } from "../../store/authStore";

export function AuthInit() {
  const checkAuth = useAuthStore((s) => s.checkAuth);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("clutchd_token");
    }
    checkAuth();
  }, [checkAuth]);

  return null;
}
