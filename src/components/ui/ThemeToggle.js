"use client";
import { useThemeStore } from "@/store/themeStore";
import { Sun, Moon } from "lucide-react";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const theme = useThemeStore((s) => s.theme);
  const toggleTheme = useThemeStore((s) => s.toggleTheme);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setMounted(true);
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  if (!mounted) return null;

  return (
    <button
      id="theme-toggle-btn"
      onClick={toggleTheme}
      aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
      className={`p-3 rounded-full transition-all duration-300 shadow-lg backdrop-blur-xl z-[9999] fixed bottom-8 right-8
        ${theme === "light"
          ? "bg-white/90 border-2 border-[#1E29B6] text-[#1E29B6] hover:bg-[#1E29B6]/5 hover-glow"
          : "bg-zinc-900/90 border-2 border-primary/40 text-primary-light hover:bg-zinc-800 hover-glow"
        }
      `}
      title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
    >
      {theme === "light" ? <Moon size={22} /> : <Sun size={22} />}
    </button>
  );
}
