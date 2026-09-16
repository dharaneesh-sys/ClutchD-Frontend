import { create } from "zustand";
import api from "@/lib/api";
import { MAP_DEFAULT_CENTER } from "@/lib/constants";
import { cacheLastLocation } from "@/lib/offline/offlineCache";
import { toCamelCase } from "@/lib/utils";
import { useAuthStore } from "@/store/authStore";

/**
 * Haversine formula to calculate distance between two GPS coordinates.
 * @returns {number} Distance in kilometers.
 */
function haversineDistance(lat1, lng1, lat2, lng2) {
  const R = 6371; // Earth's mean radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Calculate estimated time of arrival in seconds based on distance
 * and an assumed average speed of 30 km/h.
 * @returns {number} ETA in seconds.
 */
function calculateETA(userLat, userLng, mechLat, mechLng) {
  const distanceKm = haversineDistance(userLat, userLng, mechLat, mechLng);
  const speedKmh = 30; // Average urban speed assumption
  return Math.round((distanceKm / speedKmh) * 3600);
}

export { calculateETA, haversineDistance };

export const useTrackingStore = create((set, get) => ({
  userLocation: MAP_DEFAULT_CENTER,
  mechanicLocation: null,
  navigationTarget: null,
  nearbyMechanics: [],
  nearbyGarages: [],
  isLoading: false,
  error: null,
  gpsStatus: "idle", // "idle" | "requesting" | "granted" | "denied" | "unavailable"
  estimatedArrival: null, // seconds | null
  providerFilter: "all", // "all" | "mechanic" | "garage"
  _lastProviderCheckIn: null, // { at, lat, lng } — throttle state for provider check-ins

  setUserLocation: (coords) => {
    set({ userLocation: coords });
    cacheLastLocation(coords[0], coords[1]);
    // Providers check in their new position to the backend on every change
    // (no-op for customers); then refresh the nearby lists.
    get().checkInProviderLocation();
    // Automatically refresh providers when location changes
    get().fetchNearbyProviders();
  },
    setMechanicLocation: (coords) => {
    set({ mechanicLocation: coords });
    const { userLocation } = get();
    if (userLocation && coords) {
      set({
        estimatedArrival: calculateETA(
          userLocation[0],
          userLocation[1],
          coords[0],
          coords[1]
        ),
      });
    }
  },
  setNavigationTarget: (coords) => set({ navigationTarget: coords }),
  setEstimatedArrival: (seconds) => set({ estimatedArrival: seconds }),

  /**
   * Fallback to IP-based geolocation when GPS is unavailable/denied.
   * Uses ip-api.com (free tier, no API key required, 45 RPM limit).
   */
  _fallbackIPGeolocation: async () => {
    try {
      const res = await fetch("https://ip-api.com/json/");
      if (!res.ok) return;
      const data = await res.json();
      if (data.status === "success" && data.lat && data.lon) {
        const coords = [data.lat, data.lon];
        set({ userLocation: coords, gpsStatus: "granted" });
        cacheLastLocation(coords[0], coords[1]);
        get().checkInProviderLocation();
        get().fetchNearbyProviders();
        return true;
      }
    } catch (e) {
      console.warn("[trackingStore] IP geolocation fallback failed:", e);
    }
    return false;
  },

  /**
   * Request the user's location via the browser Geolocation API.
   *
   * Strategy:
   *   1. Primary — WiFi/cell-tower positioning (enableHighAccuracy: false).
   *      Returns in 1-5s, works indoors, accurate to ~50m. This is the
   *      standard approach for initial location on mobile + desktop.
   *   2. Fallback — IP geolocation if the browser has no GPS hardware or
   *      the user denied permission.
   *
   * GPS (enableHighAccuracy: true) is only used by watchGPSLocation for
   * active en-route tracking where meter-level precision matters.
   */
  requestGPSLocation: () => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      set({ gpsStatus: "unavailable" });
      get()._fallbackIPGeolocation();
      return;
    }

    set({ gpsStatus: "requesting" });

    navigator.geolocation.getCurrentPosition(
      (position) => {
        // setUserLocation performs the provider check-in + nearby refresh.
        get().setUserLocation([position.coords.latitude, position.coords.longitude]);
        set({ gpsStatus: "granted" });
      },
      (error) => {
        console.warn(`Geolocation error (code ${error.code}): ${error.message}`);
        set({ gpsStatus: error.code === 1 ? "denied" : "unavailable" });
        // Best-effort IP fallback when GPS fails
        get()._fallbackIPGeolocation();
      },
      // WiFi/cell positioning: fast, works indoors, ~50m accuracy
      { enableHighAccuracy: false, timeout: 15000, maximumAge: 120000 }
    );
  },

  /**
   * Providers (mechanic/garage) check in their current GPS position to the
   * backend on every login, so the nearby search always sees where they
   * actually are — not their stale signup location. Customers don't send
   * anything here; their coordinates are only ever query parameters.
   *
   * Throttled: at most one push per 60s, unless the position jumped >100m
   * since the last push (so genuine movement reports immediately while GPS
   * jitter never spams the endpoint). Silent best-effort: failures never
   * block the dashboard.
   */
  checkInProviderLocation: async () => {
    try {
      const role = useAuthStore.getState().user?.role;
      if (role !== "mechanic" && role !== "garage") return;
      const [lat, lng] = get().userLocation;
      if (lat == null || lng == null) return;

      const now = Date.now();
      const last = get()._lastProviderCheckIn;
      if (last) {
        const movedKm = haversineDistance(last.lat, last.lng, lat, lng);
        const movedFar = movedKm > 0.1; // >100m since last push
        const waitedEnough = now - last.at >= 60_000;
        if (!movedFar && !waitedEnough) return;
        if (movedFar && now - last.at < 10_000) return; // even big jumps: max 1 push / 10s
      }
      set({ _lastProviderCheckIn: { at: now, lat, lng } });

      await api.put("/providers/location", { latitude: lat, longitude: lng });
    } catch {
      // Never block login/dashboard on a location check-in failure.
    }
  },

  /**
   * Watch GPS position continuously (useful for mechanic en-route tracking).
   * Returns a cleanup function to stop watching.
   */
  watchGPSLocation: () => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      return () => {};
    }

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const coords = [position.coords.latitude, position.coords.longitude];
        set({ userLocation: coords, gpsStatus: "granted" });
        cacheLastLocation(coords[0], coords[1]);
        // Continuous check-in while the provider is on the road (watch mode):
        // throttled inside checkInProviderLocation's callers by GPS jitter.
        get().checkInProviderLocation();
      },
      (error) => {
        console.warn(`[trackingStore] GPS watchPosition error (code ${error.code}): ${error.message}`);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 5000 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  },
  
  fetchNearbyProviders: async () => {
    const center = get().userLocation;
    // Retry clears any previous error before the next attempt.
    set({ isLoading: true, error: null });

    try {
      const { data } = await api.get(`/providers/nearby?lat=${center[0]}&lng=${center[1]}`);
      set({
        nearbyMechanics: toCamelCase(data.mechanics || []),
        nearbyGarages: toCamelCase(data.garages || []),
      });
    } catch (err) {
      set({
        nearbyMechanics: [],
        nearbyGarages: [],
        error:
          err.response?.data?.message ||
          "Couldn't load nearby professionals. Check your connection and try again.",
      });
      if (!err.response) {
        console.warn("[trackingStore] Backend unreachable:", err.message);
      }
    } finally {
      set({ isLoading: false });
    }
  },

  clearError: () => set({ error: null }),

  /**
   * Set the provider type filter for the nearby providers list.
   * @param {"all"|"mechanic"|"garage"} filter
   */
  setProviderFilter: (filter) => set({ providerFilter: filter }),
}));
