/**
 * Vitest setup — runs before every test file.
 *
 * Provides a localStorage mock for zustand persist middleware,
 * which accesses localStorage during store creation (module import time).
 * Without this, tests fail with:
 *   "Cannot read properties of undefined (reading 'setItem')"
 */
if (typeof globalThis.localStorage === "undefined") {
  const store = {};
  globalThis.localStorage = {
    getItem: (key) => store[key] ?? null,
    setItem: (key, value) => { store[key] = String(value); },
    removeItem: (key) => { delete store[key]; },
    clear: () => { Object.keys(store).forEach((k) => delete store[k]); },
    get length() { return Object.keys(store).length; },
    key: (index) => Object.keys(store)[index] ?? null,
  };
}
