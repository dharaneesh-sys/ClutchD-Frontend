// Navigation event system for non-React contexts (e.g., axios interceptors)
// React components should listen for 'clutchd:navigate' event and use router.push

export const NAVIGATION_EVENT = "clutchd:navigate";

export function navigateTo(path) {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(NAVIGATION_EVENT, { detail: { path } }));
  }
}

export function navigateToAuth() {
  navigateTo("/auth");
}

export function navigateToDashboard(role) {
  navigateTo(`/dashboard/${role}`);
}

// Hook for React components to handle navigation events
export function useNavigationListener(router) {
  if (typeof window === "undefined") return;

  // Using useEffect would be better but this is a utility function
  // Components should use useEffect to add/remove listeners
}

export function addNavigationListener(callback) {
  if (typeof window !== "undefined") {
    window.addEventListener(NAVIGATION_EVENT, callback);
  }
}

export function removeNavigationListener(callback) {
  if (typeof window !== "undefined") {
    window.removeEventListener(NAVIGATION_EVENT, callback);
  }
}