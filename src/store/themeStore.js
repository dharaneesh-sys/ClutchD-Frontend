'use client';
import { create } from 'zustand';

const STORAGE_KEY = 'clutchd_theme';

function getInitialTheme() {
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === 'light' || stored === 'dark') return stored;

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

    // No stored preference — check system preference
    try {
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      if (mq.matches) return 'dark';
    } catch {
      // matchMedia unavailable
    }
  }
  return 'light';
}

const useThemeStoreZustand = create((set, get) => ({
  theme: getInitialTheme(),
  toggleTheme: () => {
    const next = get().theme === 'dark' ? 'light' : 'dark';
    try { localStorage.setItem(STORAGE_KEY, next); } catch {}
    set({ theme: next });
  },
  setTheme: (t) => {
    if (t === 'light' || t === 'dark') {
      try { localStorage.setItem(STORAGE_KEY, t); } catch {}
      set({ theme: t });
    }
  },

  followSystemTheme: () => {
    try { localStorage.removeItem(STORAGE_KEY); } catch {}
    if (typeof window !== 'undefined') {
      try {
        const mq = window.matchMedia('(prefers-color-scheme: dark)');
        set({ theme: mq.matches ? 'dark' : 'light' });
      } catch {
        set({ theme: 'light' });
      }
    }
  },
}));

export function useThemeStore(selector) {
  return useThemeStoreZustand(selector);
}

/**
 * True when the user (or a previous session) made an explicit light/dark
 * choice stored in localStorage. When false, the app is following the OS
 * preference and server-saved settings may safely realign the theme.
 */
export function hasExplicitThemePreference() {
  if (typeof window === 'undefined') return false;
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    return v === 'light' || v === 'dark';
  } catch {
    return false;
  }
}

export { useThemeStoreZustand as themeStore };
