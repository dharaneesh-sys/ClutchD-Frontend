import { create } from "zustand";
import { persist } from "zustand/middleware";
import api from "../lib/api";
import { connectWebSocket, disconnectWebSocket } from "../lib/socket";

export const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (email, password) => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await api.post("/auth/login", { email, password });
          
          if (response.data.token && typeof window !== "undefined") {
            localStorage.setItem("clutchd_token", response.data.token);
            connectWebSocket(response.data.token);
          }
          
          set({ user: response.data.user, isAuthenticated: true, isLoading: false });
          return response.data.user;
          
        } catch (error) {
          const msg =
            error.response?.data?.detail ||
            (error.response ? "Login failed. Please try again." : "Server unreachable. Please check your connection.");
          set({ isLoading: false, error: msg });
          return null;
        }
      },

      loginWithGoogle: async (credential, role = null) => {
        set({ isLoading: true, error: null });

        const safeRole =
          typeof role === "string" ? role.toLowerCase() : null;

        try {
          const response = await api.post("/auth/oauth/google", {
            credential,
            role: safeRole || undefined,
          });

          if (response.data.token && typeof window !== "undefined") {
            localStorage.setItem("clutchd_token", response.data.token);
            connectWebSocket(response.data.token);
          }

          set({
            user: response.data.user,
            isAuthenticated: true,
            isLoading: false,
          });
          return response.data.user;
        } catch (error) {
          const msg =
            error.response?.data?.detail ||
            (error.response ? "Google login failed." : "Server unreachable. Please check your connection.");
          set({ isLoading: false, error: msg });
          return null;
        }
      },

      signup: async (data, role) => {
        set({ isLoading: true, error: null });
        
        try {
          const payload = { ...data, role };
          const response = await api.post("/auth/signup", payload);
          
          if (response.data.token && typeof window !== "undefined") {
            localStorage.setItem("clutchd_token", response.data.token);
            connectWebSocket(response.data.token);
          }
          
          set({ user: response.data.user, isAuthenticated: true, isLoading: false });
          return response.data.user;
          
        } catch (error) {
          const msg =
            error.response?.data?.detail ||
            (error.response ? "Signup failed. Please try again." : "Server unreachable. Please check your connection.");
          set({ isLoading: false, error: msg });
          return null;
        }
      },

      logout: async () => {
        try {
          await api.post("/auth/logout");
        } catch (e) {
          // ignore
        }
        if (typeof window !== "undefined") {
          localStorage.removeItem("clutchd_token");
          disconnectWebSocket();
        }
        set({ user: null, isAuthenticated: false, error: null });
        // Navigate to auth page
        if (typeof window !== "undefined") {
          window.location.href = "/auth";
        }
      },

      clearError: () => set({ error: null }),
      setUser: (user) => set({ user, isAuthenticated: !!user }),
      updateUserData: (userData) => set((state) => ({ user: { ...state.user, ...userData } })),
    }),
    {
      name: "auth-storage",
    }
  )
);
