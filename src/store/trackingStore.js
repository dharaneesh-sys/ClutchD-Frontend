import { create } from "zustand";
import api from "@/lib/api";
import { MAP_DEFAULT_CENTER } from "@/lib/constants";

export const useTrackingStore = create((set, get) => ({
  userLocation: MAP_DEFAULT_CENTER,
  mechanicLocation: null,
  navigationTarget: null,
  nearbyMechanics: [],
  nearbyGarages: [],
  isLoading: false,
  error: null,
  gpsStatus: "idle", // "idle" | "requesting" | "granted" | "denied" | "unavailable"
  
  setUserLocation: (coords) => {
    set({ userLocation: coords });
    // Automatically refresh providers when location changes
    get().fetchNearbyProviders();
  },
  setMechanicLocation: (coords) => set({ mechanicLocation: coords }),
  setNavigationTarget: (coords) => set({ navigationTarget: coords }),

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
        get().fetchNearbyProviders();
        return true;
      }
    } catch {
      // Silent — IP geolocation is a best-effort fallback
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
        const coords = [position.coords.latitude, position.coords.longitude];
        set({ userLocation: coords, gpsStatus: "granted" });
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
      },
      (error) => {
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 5000 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  },
  
  fetchNearbyProviders: async () => {
    const center = get().userLocation;
    set({ isLoading: true, error: null });
    
    try {
      const { data } = await api.get(`/providers/nearby?lat=${center[0]}&lng=${center[1]}`);
      set({ 
        nearbyMechanics: data.mechanics || [], 
        nearbyGarages: data.garages || [],
        isLoading: false,
      });
    } catch (error) {
      const msg =
        error.response?.data?.detail ||
        (error.response ? "Failed to load nearby providers." : "Server unreachable.");
      set({ 
        nearbyMechanics: [], 
        nearbyGarages: [],
        isLoading: false,
        error: msg,
      });
    }
  },

  clearError: () => set({ error: null }),
}));
