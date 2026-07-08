/**
 * Navigation context tracking for intelligent back navigation.
 *
 * Tracks navigation history with context awareness so the Capacitor
 * hardware back button knows where to navigate based on the current
 * page context rather than blindly going back through history.
 *
 * Contexts:
 *  - auth       → exit the app (don't stay on login/signup)
 *  - dashboard  → stay on dashboard (don't navigate away to auth)
 *  - marketplace → browser default back
 *  - admin      → browser default back
 *  - home       → browser default back
 *  - general    → browser default back
 *
 * Module-level singleton: shared across all importers within the same
 * JS module instance. Only call from client-side code.
 */

const MAX_STACK_SIZE = 50;

/** @type {Array<{path: string, context: string, timestamp: number}>} */
let navStack = [];

/**
 * Infer the navigation context from a URL path.
 *
 * @param {string} path - URL pathname
 * @returns {string} context label
 */
export function inferContext(path) {
  if (!path || path === "/") return "home";
  if (path.startsWith("/auth")) return "auth";
  if (path.startsWith("/dashboard")) return "dashboard";
  if (path.startsWith("/marketplace")) return "marketplace";
  if (path.startsWith("/admin")) return "admin";
  return "general";
}

/**
 * Push a navigation entry onto the tracking stack.
 * Called on every forward navigation (link click, router.push, etc.).
 *
 * @param {string} path - The new URL pathname
 */
export function pushNavigation(path) {
  if (typeof window === "undefined") return;

  const context = inferContext(path);
  navStack.push({ path, context, timestamp: Date.now() });

  // Keep the stack bounded
  if (navStack.length > MAX_STACK_SIZE) {
    navStack = navStack.slice(-MAX_STACK_SIZE);
  }
}

/**
 * Pop the current navigation entry.
 * Called when the browser navigates back/forward (popstate).
 *
 * @returns {{path: string, context: string, timestamp: number}|undefined}
 */
export function popNavigation() {
  if (typeof window === "undefined") return undefined;
  return navStack.pop();
}

/**
 * Reset the navigation stack (e.g. after logout).
 */
export function clearNavigation() {
  if (typeof window === "undefined") return;
  navStack = [];
}

/**
 * Read a copy of the navigation stack (for debugging).
 *
 * @returns {Array<{path: string, context: string, timestamp: number}>}
 */
export function getNavigationStack() {
  return [...navStack];
}

/**
 * Determine the appropriate back target based on the current navigation
 * context. Returns an action object the caller should execute.
 *
 * Rules:
 *  - Auth page          → exit the app
 *  - Dashboard, came from another dashboard → go back (stay in dashboard)
 *  - Dashboard, came from outside (auth, etc.) → stay (don't leave)
 *  - Marketplace, admin, home, general       → default browser back
 *
 * @returns {{action: "back"|"stay"|"exit"}}
 */
export function getBackTarget() {
  if (navStack.length < 1) {
    return { action: "exit" };
  }

  const current = navStack[navStack.length - 1];

  // ── Auth context → exit the app ─────────────────────────────────
  if (current.context === "auth") {
    return { action: "exit" };
  }

  // ── Dashboard context → stay on dashboard ───────────────────────
  if (current.context === "dashboard") {
    if (navStack.length >= 2) {
      const prev = navStack[navStack.length - 2];
      // Only go back if the previous entry was also a dashboard page
      // (e.g. navigating between dashboard roles or dashboard sub-views)
      if (prev.context === "dashboard") {
        return { action: "back" };
      }
    }
    // Came from outside dashboard (auth, home, etc.) → stay put
    return { action: "stay" };
  }

  // ── All other contexts → browser default back ───────────────────
  return { action: "back" };
}
