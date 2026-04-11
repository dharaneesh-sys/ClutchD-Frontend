import { create } from "zustand";
import api from "../lib/api";
import { MAP_DEFAULT_CENTER } from "../lib/constants";

export const useTrackingStore = create((set, get) => ({
  userLocation: MAP_DEFAULT_CENTER,
  mechanicLocation: null,
  nearbyMechanics: [],
  nearbyGarages: [],
  isLoading: false,
  error: null,
  
  setUserLocation: (coords) => {
    set({ userLocation: coords });
    // Automatically refresh providers when location changes
    get().fetchNearbyProviders();
  },
  setMechanicLocation: (coords) => set({ mechanicLocation: coords }),
  
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
