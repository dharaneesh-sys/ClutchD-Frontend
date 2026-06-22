'use client';
import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'clutchd_theme';

/**
 * Get initial theme from localStorage, with migration from old zustand persist key.
 */
function getInitialTheme() {
  if (typeof window !== 'undefined') {
    try {
      // New key
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === 'light' || stored === 'dark') return stored;

      // Migrate from old zustand persist key (theme-storage)
      const oldStore = localStorage.getItem('theme-storage');
      if (oldStore) {
        try {
          const parsed = JSON.parse(oldStore);
          if (parsed?.state?.theme === 'light' || parsed?.state?.theme === 'dark') {
            localStorage.setItem(STORAGE_KEY, parsed.state.theme);
            localStorage.removeItem('theme-storage');
            return parsed.state.theme;
          }
        } catch {
          // ignore parse errors
        }
      }
    } catch {
      // localStorage unavailable
    }
  }
  return 'dark';
}

export function useThemeStore() {
  const [theme, setThemeState] = useState(getInitialTheme);

  // Persist to localStorage whenever theme changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // localStorage unavailable
    }
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => (prev === 'dark' ? 'light' : 'dark'));
  }, []);

  const setTheme = useCallback((t) => {
    if (t === 'light' || t === 'dark') setThemeState(t);
  }, []);

  return { theme, toggleTheme, setTheme };
}
