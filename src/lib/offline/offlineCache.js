import { openDB } from "idb";

const DB_NAME = "clutchd-offline";
const DB_VERSION = 1;
const STORE_NAME = "cache";

let dbPromise = null;

function getDB() {
  if (typeof window === "undefined") return null;
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: "key" });
        }
      },
    });
  }
  return dbPromise;
}

function isDBAvailable() {
  return typeof window !== "undefined" && !!window.indexedDB;
}

/**
 * Save vehicle data to IndexedDB.
 * Accepts an array of vehicle objects or a single vehicle object.
 */
export async function cacheVehicleData(data) {
  if (!isDBAvailable()) return;
  try {
    const db = await getDB();
    const vehicles = Array.isArray(data) ? data : [data];
    await db.put(STORE_NAME, { key: "vehicles", data: vehicles, updatedAt: Date.now() });
  } catch (e) {
    console.warn("Failed to cache vehicles:", e);
  }
}

/**
 * Retrieve cached vehicles. Returns an empty array if nothing is cached.
 */
export async function getCachedVehicles() {
  if (!isDBAvailable()) return [];
  try {
    const db = await getDB();
    const entry = await db.get(STORE_NAME, "vehicles");
    return entry?.data ?? [];
  } catch (e) {
    console.warn("Failed to read cached vehicles:", e);
    return [];
  }
}

/**
 * Save user profile to IndexedDB.
 * Only safe fields are stored — no tokens, no payment data.
 */
export async function cacheUserProfile(profile) {
  if (!isDBAvailable() || !profile) return;
  try {
    const db = await getDB();
    const safe = {
      id: profile.id,
      name: profile.name,
      email: profile.email,
      phone: profile.phone,
      role: profile.role,
      emergency_contact: profile.emergency_contact,
    };
    await db.put(STORE_NAME, { key: "userProfile", data: safe, updatedAt: Date.now() });
  } catch (e) {
    console.warn("Failed to cache user profile:", e);
  }
}

/**
 * Retrieve cached user profile. Returns null if nothing is cached.
 */
export async function getCachedUserProfile() {
  if (!isDBAvailable()) return null;
  try {
    const db = await getDB();
    const entry = await db.get(STORE_NAME, "userProfile");
    return entry?.data ?? null;
  } catch (e) {
    console.warn("Failed to read cached profile:", e);
    return null;
  }
}

/**
 * Save last known GPS coordinates to IndexedDB.
 */
export async function cacheLastLocation(lat, lng) {
  if (!isDBAvailable()) return;
  try {
    const db = await getDB();
    await db.put(STORE_NAME, {
      key: "lastLocation",
      data: { lat, lng },
      updatedAt: Date.now(),
    });
  } catch (e) {
    console.warn("Failed to cache last location:", e);
  }
}

/**
 * Retrieve last cached GPS coordinates. Returns null if nothing is cached.
 */
export async function getLastLocation() {
  if (!isDBAvailable()) return null;
  try {
    const db = await getDB();
    const entry = await db.get(STORE_NAME, "lastLocation");
    return entry?.data ?? null;
  } catch (e) {
    console.warn("Failed to read cached location:", e);
    return null;
  }
}
