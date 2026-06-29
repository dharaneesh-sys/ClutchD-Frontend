"use client";

import { useState, useEffect, useRef } from "react";
import { Settings, Sun, Moon } from "lucide-react";
import { useThemeStore } from "@/store/themeStore";
import { useDemoMode } from "@/lib/demo/demoContext";
import { cn } from "@/lib/utils";

export function SettingsButton() {
  const { theme, toggleTheme } = useThemeStore();
  const { isDemoMode, enableDemo, disableDemo } = useDemoMode();
  const [isOpen, setIsOpen] = useState(false);
  const btnRef = useRef(null);
  const popRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    const handleClick = (e) => {
      if (
        popRef.current && !popRef.current.contains(e.target) &&
        btnRef.current && !btnRef.current.contains(e.target)
      ) {
        setIsOpen(false);
      }
    };
    const handleKey = (e) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [isOpen]);

  const handleDemoToggle = () => {
    if (isDemoMode) {
      disableDemo();
    } else {
      enableDemo("customer");
    }
  };

  return (
    <div className="fixed bottom-20 right-6 z-[9999]">
      {/* Button */}
      <button
        ref={btnRef}
        onClick={() => setIsOpen((p) => !p)}
        className={cn(
          "flex items-center justify-center",
          "w-12 h-12 rounded-full",
          "bg-bg-card backdrop-blur-2xl",
          "border border-border-subtle",
          "shadow-2xl",
          "transition-all duration-200",
          "hover:scale-105 active:scale-95",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
          isOpen && "ring-2 ring-primary/40"
        )}
        aria-label="Settings"
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        <Settings
          size={22}
          className={cn(
            "transition-all duration-300",
            isOpen ? "text-primary rotate-90" : "text-text-muted"
          )}
        />
      </button>

      {/* Popover */}
      {isOpen && (
        <div
          ref={popRef}
          className={cn(
            "absolute bottom-full right-0 mb-2",
            "min-w-[200px]",
            "bg-bg-card backdrop-blur-2xl",
            "border border-border-subtle",
            "rounded-xl shadow-2xl",
            "p-2",
            "animate-scale-in"
          )}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Arrow pointing down to the gear button */}
          <div className="absolute -bottom-[6px] right-[18px] w-3 h-3 rotate-45 bg-bg-card border-r border-b border-border-subtle" />
          {/* Theme toggle */}
          <button
            onClick={(e) => { e.stopPropagation(); toggleTheme(); }}
            className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-white/5 transition-colors"
          >
            <span className="text-sm font-medium text-foreground">Theme</span>
            <span className="flex items-center gap-2 text-sm text-text-muted">
              {theme === "light" ? <Sun size={16} /> : <Moon size={16} />}
              {theme === "light" ? "Light" : "Dark"}
            </span>
          </button>

          <div className="h-px bg-border-subtle my-1" />

          {/* Demo mode toggle */}
          <button
            onClick={(e) => { e.stopPropagation(); handleDemoToggle(); }}
            className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-white/5 transition-colors"
          >
            <span className="text-sm font-medium text-foreground">Demo Mode</span>
            <span
              className={cn(
                "text-xs font-medium px-2 py-0.5 rounded-full",
                isDemoMode
                  ? "bg-primary/20 text-primary-light"
                  : "bg-white/10 text-muted"
              )}
            >
              {isDemoMode ? "ON" : "OFF"}
            </span>
          </button>
        </div>
      )}
    </div>
  );
}
