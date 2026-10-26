/**
 * Fleet/B2B localStorage cache for real account data.
 *
 * The backend owns fleet registration, vehicles and bookings. This module
 * mirrors successful API responses so the dashboard can paint instantly on
 * reload while the live request completes.
 */

const STORAGE_KEY = "clutchd-fleet-registration";
const FLEET_VEHICLES_KEY = "clutchd-fleet-vehicles";
const FLEET_SERVICE_HISTORY_KEY = "clutchd-fleet-service-history";

/**
 * Read the fleet registration from localStorage.
 * Returns null if no registration exists.
 */
export function getFleetRegistration() {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/**
 * Save (create or update) the fleet registration in localStorage.
 */
export function saveFleetRegistration(fleetData) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(fleetData));
  } catch (e) {
    console.warn("[fleetStorage] Failed to save registration:", e);
  }
}

/**
 * Clear the fleet registration from localStorage.
 */
export function clearFleetRegistration() {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // best-effort
  }
}

/**
 * Get fleet vehicles from localStorage, or from the registration data.
 */
export function getFleetVehicles() {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(FLEET_VEHICLES_KEY);
    if (raw) return JSON.parse(raw);
    // Fall back to vehicles embedded in the fleet registration
    const fleet = getFleetRegistration();
    return fleet?.vehicles || [];
  } catch {
    return [];
  }
}

/**
 * Save fleet vehicles to localStorage.
 */
export function saveFleetVehicles(vehicles) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(FLEET_VEHICLES_KEY, JSON.stringify(vehicles));
  } catch (e) {
    console.warn("[fleetStorage] Failed to save vehicles:", e);
  }
}

/**
 * Get service history from localStorage, or from registration data.
 */
export function getFleetServiceHistory() {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(FLEET_SERVICE_HISTORY_KEY);
    if (raw) return JSON.parse(raw);
    const fleet = getFleetRegistration();
    return fleet?.serviceHistory || [];
  } catch {
    return [];
  }
}

/**
 * Save service history to localStorage.
 */
export function saveFleetServiceHistory(history) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(
      FLEET_SERVICE_HISTORY_KEY,
      JSON.stringify(history)
    );
  } catch (e) {
    console.warn("[fleetStorage] Failed to save service history:", e);
  }
}

/**
 * Calculate bulk discount tier from total spend.
 */
export function getFleetTier(totalSpent) {
  if (totalSpent >= 500000) return { name: "platinum", discountRate: 20, label: "Platinum" };
  if (totalSpent >= 200000) return { name: "gold", discountRate: 15, label: "Gold" };
  if (totalSpent >= 100000) return { name: "silver", discountRate: 10, label: "Silver" };
  return { name: "bronze", discountRate: 5, label: "Bronze" };
}

// Fleet registration, vehicles and bookings are backend-owned; this module only caches real responses.
