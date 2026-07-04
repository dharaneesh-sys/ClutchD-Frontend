/**
 * @fileoverview Maintenance reminder engine.
 *
 * Calculates service intervals based on mileage AND time (whichever comes first).
 * Uses localStorage for demo-mode persistence. Integrates with the existing
 * notificationStore / toastStore for displaying reminders.
 *
 * Exports:
 *   - checkMaintenance(vehicle)   — service status for one vehicle
 *   - getAllReminders(vehicles)   — aggregated reminders for all vehicles
 *   - updateServiceRecord(...)    — reset a service after it's performed
 *   - getServiceIntervals()       — interval definitions for UI display
 */

// ── Service interval definitions ───────────────────────────────────
// Mileage in km, time in months.  A mileage of null means time-only.
const SERVICE_INTERVALS = {
  oil_change: {
    id: "oil_change",
    label: "Oil Change",
    mileageKm: 5000,
    months: 6,
    severity: "high",
  },
  tire_rotation: {
    id: "tire_rotation",
    label: "Tire Rotation",
    mileageKm: 10000,
    months: 12,
    severity: "medium",
  },
  brake_inspection: {
    id: "brake_inspection",
    label: "Brake Inspection",
    mileageKm: 15000,
    months: 12,
    severity: "critical",
  },
  air_filter: {
    id: "air_filter",
    label: "Air Filter Replacement",
    mileageKm: 20000,
    months: 24,
    severity: "medium",
  },
  battery_check: {
    id: "battery_check",
    label: "Battery Check",
    mileageKm: null, // time-only interval
    months: 12,
    severity: "medium",
  },
};

// ── Storage helpers ────────────────────────────────────────────────
const STORAGE_KEY = "clutchd_maintenance";

/** Thresholds for "due_soon" status */
const DUE_SOON_THRESHOLD_KM = 500; // km remaining before overdue
const DUE_SOON_THRESHOLD_DAYS = 14; // days remaining before overdue

/** Read the full maintenance store from localStorage. */
function getStorage() {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

/** Persist the full maintenance store. */
function setStorage(data) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // localStorage unavailable (quota exceeded, private mode, etc.)
  }
}

/** Read the maintenance record for a single vehicle (create if missing). */
function getVehicleRecord(vehicleId) {
  const store = getStorage();
  if (!store[vehicleId]) {
    store[vehicleId] = { services: {} };
    setStorage(store);
  }
  return store[vehicleId];
}

/** Persist a single vehicle's maintenance record. */
function saveVehicleRecord(vehicleId, record) {
  const store = getStorage();
  store[vehicleId] = record;
  setStorage(store);
}

// ── Date arithmetic ────────────────────────────────────────────────

/** Add N months to a Date (handles year rollover). */
function addMonths(date, months) {
  const d = new Date(date);
  const targetMonth = d.getMonth() + months;
  d.setMonth(targetMonth);
  // setMonth handles wrapping (e.g. Jan + 12 = Jan next year)
  return d;
}

/** Whole days between two dates (positive = d2 is later than d1). */
function daysBetween(d1, d2) {
  const t1 = new Date(d1).getTime();
  const t2 = new Date(d2).getTime();
  return Math.floor((t2 - t1) / (1000 * 60 * 60 * 24));
}

/** Safely parse a date string — returns today on falsy/invalid input. */
function safeParseDate(dateStr) {
  if (!dateStr) return new Date();
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? new Date() : d;
}

// ── Exported API ───────────────────────────────────────────────────

/**
 * Evaluate all service intervals for a single vehicle.
 *
 * @param {Object} vehicle  Must include { id, mileage, lastServiceDate? }.
 *   The vehicle record is enriched the first time it is checked (the engine
 *   stores per-service "lastMileage" and "lastDate" in localStorage so
 *   subsequent checks are accurate).
 * @returns {Array<{
 *   serviceId:       string,
 *   label:           string,
 *   status:          "ok"|"due_soon"|"overdue",
 *   dueByMileage:    number|null,
 *   dueByDate:       string|null,   // ISO 8601
 *   milesRemaining:  number|null,
 *   daysRemaining:   number|null,
 *   severity:        string,
 * }>}
 */
export function checkMaintenance(vehicle) {
  if (!vehicle || !vehicle.id) {
    console.warn("[reminderEngine] checkMaintenance called without a valid vehicle");
    return [];
  }

  const currentMileage = vehicle.mileage ?? 0;
  const vehicleRecord = getVehicleRecord(vehicle.id);
  const results = [];

  for (const [serviceId, interval] of Object.entries(SERVICE_INTERVALS)) {
    const serviceRecord = vehicleRecord.services[serviceId];

    // Baseline: if the vehicle has never been serviced for this type, use the
    // vehicle's initial mileage and lastServiceDate as the "last serviced at".
    const lastMileage = serviceRecord?.lastMileage ?? currentMileage;
    const rawLastDate = serviceRecord?.lastDate || vehicle.lastServiceDate;
    const lastDate = safeParseDate(rawLastDate);

    // ── Mileage check ──────────────────────────────────────────
    let milesRemaining = null;
    let dueByMileage = null;
    if (interval.mileageKm !== null) {
      dueByMileage = lastMileage + interval.mileageKm;
      milesRemaining = Math.max(0, dueByMileage - currentMileage);
    }

    // ── Time check ─────────────────────────────────────────────
    let dueByDate = null;
    let daysRemaining = null;
    if (interval.months) {
      dueByDate = addMonths(lastDate, interval.months);
      daysRemaining = Math.max(0, daysBetween(new Date(), dueByDate));
    }

    // ── Status: whichever criterion is sooner wins ─────────────
    const mileageOverdue = interval.mileageKm !== null && currentMileage >= dueByMileage;
    const timeOverdue = dueByDate !== null && new Date() >= dueByDate;

    const mileageDueSoon =
      interval.mileageKm !== null && milesRemaining <= DUE_SOON_THRESHOLD_KM;
    const timeDueSoon =
      daysRemaining !== null && daysRemaining <= DUE_SOON_THRESHOLD_DAYS;

    let status;
    if (mileageOverdue || timeOverdue) {
      status = "overdue";
    } else if (mileageDueSoon || timeDueSoon) {
      status = "due_soon";
    } else {
      status = "ok";
    }

    results.push({
      serviceId,
      label: interval.label,
      status,
      dueByMileage,
      dueByDate: dueByDate ? dueByDate.toISOString() : null,
      milesRemaining,
      daysRemaining,
      severity: interval.severity,
    });
  }

  return results;
}

/**
 * Aggregate maintenance reminders across multiple vehicles.
 *
 * @param {Array<Object>} vehicles
 * @returns {Array<{
 *   vehicle:  { id, make, model, year, mileage },
 *   services: Array,
 * }>}
 */
export function getAllReminders(vehicles) {
  if (!Array.isArray(vehicles) || vehicles.length === 0) return [];

  return vehicles.map((vehicle) => ({
    vehicle: {
      id: vehicle.id,
      make: vehicle.make,
      model: vehicle.model,
      year: vehicle.year,
      mileage: vehicle.mileage,
    },
    services: checkMaintenance(vehicle),
  }));
}

/**
 * Record that a service was performed, resetting its interval clock.
 *
 * @param {string} vehicleId
 * @param {string} serviceId   — one of the SERVICE_INTERVALS keys
 * @param {{ mileage?: number, date?: string }} [options]
 */
export function updateServiceRecord(vehicleId, serviceId, options = {}) {
  if (!SERVICE_INTERVALS[serviceId]) {
    console.warn(`[reminderEngine] Unknown serviceId: "${serviceId}"`);
    return;
  }

  const record = getVehicleRecord(vehicleId);
  record.services[serviceId] = {
    lastMileage: options.mileage ?? 0,
    lastDate: options.date || new Date().toISOString().split("T")[0],
  };
  saveVehicleRecord(vehicleId, record);
}

/**
 * Get the service-interval definitions for UI display.
 *
 * @returns {Array<{ id, label, mileageKm, months, severity }>}
 */
export function getServiceIntervals() {
  return Object.values(SERVICE_INTERVALS);
}
