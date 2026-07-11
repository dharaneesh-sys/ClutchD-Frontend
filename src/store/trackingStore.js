import { create } from "zustand";
import api from "@/lib/api";
import { MAP_DEFAULT_CENTER } from "@/lib/constants";
import { cacheLastLocation } from "@/lib/offline/offlineCache";
import { toCamelCase } from "@/lib/utils";
import { MOCK_MECHANICS, MOCK_GARAGES } from "@/lib/demo/mockData";

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

  setUserLocation: (coords) => {
    set({ userLocation: coords });
    cacheLastLocation(coords[0], coords[1]);
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
        get().fetchNearbyProviders();
        return true;
      }
    } catch (e) {
      console.warn("[trackingStore] IP geolocation fallback failed:", e);
    }
    return false;
  },

  /**
   * Fallback: use IP geolocation + mock data when backend is unreachable.
   * Fetches the IP-based location, then generates nearby providers from
   * the bundled mock dataset with computed distances.
   */
  _fallbackWithMockData: async () => {
    try {
      const res = await fetch("https://ip-api.com/json/");
      if (!res.ok) return false;
      const ipData = await res.json();
      if (ipData.status !== "success") return false;

      const center = [ipData.lat, ipData.lon];

      const nearbyM = MOCK_MECHANICS
        .filter((m) => m.available)
        .map((m) => toCamelCase({
          ...m,
          name: m.full_name,
          distance_km: parseFloat(haversineDistance(center[0], center[1], m.lat, m.lon).toFixed(2)),
        }));

      const nearbyG = MOCK_GARAGES.map((g) => toCamelCase({
        ...g,
        name: g.business_name,
        distance_km: parseFloat(haversineDistance(center[0], center[1], g.lat, g.lon).toFixed(2)),
      }));

      set({
        userLocation: center,
        gpsStatus: "granted",
        nearbyMechanics: nearbyM,
        nearbyGarages: nearbyG,
        isLoading: false,
        error: null,
      });
      cacheLastLocation(center[0], center[1]);
      return true;
    } catch (e) {
      console.warn("[trackingStore] _fallbackWithMockData failed:", e);
      return false;
    }
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
        const coords = [position.coords.latitude, position.coords.longitude];
        set({ userLocation: coords, gpsStatus: "granted" });
        cacheLastLocation(coords[0], coords[1]);
        get().fetchNearbyProviders();
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
      },
      (error) => {
        console.warn(`[trackingStore] GPS watchPosition error (code ${error.code}): ${error.message}`);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 5000 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  },
  
  /**
   * Merge two arrays of providers, deduplicating by `id`.
   * Items from `primary` come first, `secondary` items that don't share
   * an id with an existing primary item are appended.
   */
  _mergeProviders(primary, secondary) {
    const existingIds = new Set(primary.map((p) => p.id));
    const merged = [...primary];
    for (const item of secondary) {
      if (!existingIds.has(item.id)) {
        merged.push(item);
        existingIds.add(item.id);
      }
    }
    return merged;
  },

  fetchNearbyProviders: async () => {
    const center = get().userLocation;
    set({ isLoading: true, error: null });

    // 1. Immediately seed with mock data so providers are visible while
    //    the real API call is in-flight.
    const mockMechs = MOCK_MECHANICS
      .filter((m) => m.available)
      .map((m) => toCamelCase({
        ...m,
        name: m.full_name,
        distance_km: parseFloat(haversineDistance(center[0], center[1], m.lat, m.lon).toFixed(2)),
      }));
    const mockGarages = MOCK_GARAGES.map((g) => toCamelCase({
      ...g,
      name: g.business_name,
      distance_km: parseFloat(haversineDistance(center[0], center[1], g.lat, g.lon).toFixed(2)),
    }));

    // Set mock as initial visible data so providers render immediately
    // instead of showing a loading spinner while the real API call is in flight.
    set({ nearbyMechanics: mockMechs, nearbyGarages: mockGarages });

    try {
      const { data } = await api.get(`/providers/nearby?lat=${center[0]}&lng=${center[1]}`);
      // 2. Merge real backend data with mock data (real takes priority, mock
      //    fills gaps for providers the backend hasn't indexed yet).
      const realMechs = toCamelCase(data.mechanics || []);
      const realGarages = toCamelCase(data.garages || []);
      set({
        nearbyMechanics: get()._mergeProviders(realMechs, mockMechs),
        nearbyGarages: get()._mergeProviders(realGarages, mockGarages),
        isLoading: false,
      });
    } catch (error) {
      // 3. Backend unreachable — keep the mock data already set above.
      //    The _fallbackWithMockData would recompute distances if the
      //    user location changed, but since we already computed above
      //    with the current center, just clear loading state.
      set({ isLoading: false });
      if (!error.response) {
        console.warn("[trackingStore] Backend unreachable, showing mock providers:", error.message);
      }
    }
  },

  clearError: () => set({ error: null }),

  /**
   * Set the provider type filter for the nearby providers list.
   * @param {"all"|"mechanic"|"garage"} filter
   */
  setProviderFilter: (filter) => set({ providerFilter: filter }),
}));
