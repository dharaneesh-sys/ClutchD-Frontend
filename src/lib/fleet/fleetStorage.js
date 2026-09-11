/**
 * Fleet/B2B localStorage persistence for demo mode.
 *
 * In demo mode (when BackendHealth.isAvailable() is false), all fleet
 * registration and account data is persisted in localStorage. This module
 * provides a CRUD-like interface that abstracts the storage backend.
 */

const STORAGE_KEY = "clutchd-fleet-registration";
const FLEET_VEHICLES_KEY = "clutchd-fleet-vehicles";
const FLEET_SERVICE_HISTORY_KEY = "clutchd-fleet-service-history";

/**
 * Seed data for a fresh fleet demo account.
 */
function createDefaultFleet() {
  return {
    id: "fleet-demo-" + Date.now(),
    companyName: "FleetCorp Logistics",
    fleetSize: 12,
    contactName: "Vikram R.",
    contactEmail: "vikram@fleetcorp.demo",
    contactPhone: "+91 98765 43299",
    businessAddress: "55, Sathy Road, Saravanampatti, Coimbatore",
    gstin: "33AABCU9603R1ZL",
    registeredAt: new Date().toISOString(),
    // Fleet vehicles
    vehicles: [
      { id: "fv-1", make: "Tata", model: "Ace", year: 2022, plate: "TN 38 AB 1001", type: "light_truck", status: "active" },
      { id: "fv-2", make: "Tata", model: "Ace", year: 2023, plate: "TN 38 AB 1002", type: "light_truck", status: "active" },
      { id: "fv-3", make: "Ashok Leyland", model: "Dost", year: 2021, plate: "TN 38 CD 2001", type: "light_truck", status: "active" },
      { id: "fv-4", make: "Mahindra", model: "Bolero", year: 2020, plate: "TN 38 EF 3001", type: "suv", status: "active" },
    ],
    // Service history
    serviceHistory: [
      {
        id: "fsh-1",
        vehicleId: "fv-1",
        vehicleName: "Tata Ace (TN 38 AB 1001)",
        serviceType: "oil_change",
        description: "Regular oil change + filter replacement",
        status: "completed",
        date: "2026-06-20T10:00:00Z",
        amount: 3200,
        providerName: "Green Drive Service",
      },
      {
        id: "fsh-2",
        vehicleId: "fv-2",
        vehicleName: "Tata Ace (TN 38 AB 1002)",
        serviceType: "brake_repair",
        description: "Brake pad replacement front wheels",
        status: "completed",
        date: "2026-06-18T14:30:00Z",
        amount: 4500,
        providerName: "Green Drive Service",
      },
      {
        id: "fsh-3",
        vehicleId: "fv-3",
        vehicleName: "Ashok Leyland Dost (TN 38 CD 2001)",
        serviceType: "engine_diagnostic",
        description: "Check engine light diagnostic + ECU reset",
        status: "completed",
        date: "2026-06-15T09:00:00Z",
        amount: 1800,
        providerName: "Kumar's Garage",
      },
      {
        id: "fsh-4",
        vehicleId: "fv-4",
        vehicleName: "Mahindra Bolero (TN 38 EF 3001)",
        serviceType: "ac_service",
        description: "AC gas recharge + vent cleaning",
        status: "completed",
        date: "2026-06-10T11:00:00Z",
        amount: 2800,
        providerName: "Priya Auto Works",
      },
    ],
    // Bulk discount info
    tier: "silver",
    totalJobsCompleted: 47,
    totalSpent: 189500,
    discountRate: 10, // percent
    priorityDispatch: true,
  };
}

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
 * Initialize demo fleet data if no registration exists yet.
 * Returns the (existing or newly-created) fleet account.
 */
export function initDemoFleet() {
  const existing = getFleetRegistration();
  if (existing) return existing;
  const fleet = createDefaultFleet();
  saveFleetRegistration(fleet);
  saveFleetVehicles(fleet.vehicles);
  saveFleetServiceHistory(fleet.serviceHistory);
  return fleet;
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


// TODO(BACKEND_CONTRACTS §2 fleet): wire POST /fleet/register, GET/POST /fleet/vehicles, GET/POST /fleet/bookings; keep demo seed as offline fallback.
