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
}));

export function useThemeStore() {
  return useThemeStoreZustand();
}
