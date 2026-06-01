"use client";
import { useEffect } from "react";
import { useThemeStore } from "../../store/themeStore";

export function ThemeProvider({ children }) {
  const { theme } = useThemeStore();

  useEffect(() => {
    if (theme === "light") {
      document.documentElement.classList.add("light");
    } else {
      document.documentElement.classList.remove("light");
    }
  }, [theme]);

  return <>{children}</>;
}
