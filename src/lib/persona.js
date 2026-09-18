/**
 * Fleet persona flag.
 *
 * "Fleet" is a frontend persona: fleet accounts are customer-role on the
 * backend (FleetRegistrationForm runs on the dashboard). The role chip on
 * the login screen records the user's intent, so:
 *   - Picking the Fleet chip sets this flag → cold starts open the fleet
 *     dashboard (same behavior as a fresh login).
 *   - Picking any other chip clears it → normal role routing.
 * Flag lives in localStorage so it survives app restarts and session
 * restores. Cleared on logout via clearAllStorage().
 */
const KEY = "clutchd-fleet-persona";

export function isFleetPersona() {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(KEY) === "1";
  } catch {
    return false;
  }
}

export function setFleetPersona(active) {
  if (typeof window === "undefined") return;
  try {
    if (active) window.localStorage.setItem(KEY, "1");
    else window.localStorage.removeItem(KEY);
  } catch {
    // Storage unavailable — persona simply won't persist.
  }
}
