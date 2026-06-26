import { create } from "zustand";
import { persist } from "zustand/middleware";
import api from "@/lib/api";
import { connectWebSocket, disconnectWebSocket } from "@/lib/socket";
import { setAccessToken, getAccessToken, clearAccessToken } from "@/lib/tokenStore";

// Proactive refresh: refresh the access token at 80% of its TTL.
// Default access token TTL is 15 min (from backend config); override via env.
const ACCESS_TTL_MS =
  (parseInt(process.env.NEXT_PUBLIC_ACCESS_TTL_MINUTES, 10) || 15) * 60 * 1000;
const REFRESH_AT_MS = ACCESS_TTL_MS * 0.8; // e.g. 12 min for a 15-min token

let refreshTimer = null;

function scheduleProactiveRefresh() {
  clearProactiveRefresh();
  refreshTimer = setTimeout(async () => {
    try {
      const res = await api.post("/auth/refresh");
      const newToken = res.data.token;
      if (typeof window !== "undefined" && newToken) {
        setAccessToken(newToken);
        connectWebSocket(newToken);
      }
      scheduleProactiveRefresh();
    } catch {
      // Refresh failed — the 401 interceptor in api.js will handle logout
    }
  }, REFRESH_AT_MS);
}

function clearProactiveRefresh() {
  if (refreshTimer) {
    clearTimeout(refreshTimer);
    refreshTimer = null;
  }
}

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      _hydrated: false,
      isLoading: false,
      error: null,

      /**
       * Validate the current session on app startup.
       * Attempts to refresh the access token using the httpOnly refresh cookie.
       * If successful, the user stays logged in; otherwise they are logged out.
       */
      checkAuth: async () => {
        if (!get().isAuthenticated) return;
        // Demo users have fake tokens — skip refresh against real backend
        if (get().user?.id?.startsWith?.("demo-")) return;

        try {
          const res = await api.post("/auth/refresh");
          const newToken = res.data.token;
          if (typeof window !== "undefined" && newToken) {
            setAccessToken(newToken);
            connectWebSocket(newToken);
            scheduleProactiveRefresh();
          }
        } catch (error) {
          const status = error.response?.status;
          if (status === 401 || status === 403) {
            if (typeof window !== "undefined") {
              clearAccessToken();
              disconnectWebSocket();
            }
            set({ user: null, isAuthenticated: false, error: null });
          }
        }
      },

      login: async (email, password, role) => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await api.post("/auth/login", { email, password, role });
          
          if (response.data.token && typeof window !== "undefined") {
            setAccessToken(response.data.token);
            connectWebSocket(response.data.token);
            scheduleProactiveRefresh();
          }
          
          set({ user: response.data.user, isAuthenticated: true, _hydrated: true, isLoading: false });
          return response.data.user;
          
        } catch (error) {
          const msg =
            error.response?.data?.detail ||
            (error.response ? "Login failed. Please try again." : "Server unreachable. Please check your connection.");
          set({ isLoading: false, error: msg });
          return null;
        }
      },

      loginWithGoogle: async (credential, role = null, state = null) => {
        set({ isLoading: true, error: null });

        const safeRole =
          typeof role === "string" ? role.toLowerCase() : null;

        try {
          const response = await api.post("/auth/oauth/google", {
            credential,
            role: safeRole || undefined,
            state: state || undefined,
          });

          if (response.data.token && typeof window !== "undefined") {
            setAccessToken(response.data.token);
            connectWebSocket(response.data.token);
            scheduleProactiveRefresh();
          }

          set({
            user: response.data.user,
            isAuthenticated: true,
            _hydrated: true,
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
            setAccessToken(response.data.token);
            connectWebSocket(response.data.token);
            scheduleProactiveRefresh();
          }
          
          set({ user: response.data.user, isAuthenticated: true, _hydrated: true, isLoading: false });
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
        clearProactiveRefresh();
        try {
          await api.post("/auth/logout");
        } catch (e) {
          // ignore
        }
        if (typeof window !== "undefined") {
          clearAccessToken();
          disconnectWebSocket();
        }
        set({ user: null, isAuthenticated: false, _hydrated: true, error: null });
      },

      clearError: () => set({ error: null }),
      setUser: (user) => set({ user, isAuthenticated: !!user, _hydrated: true }),
      updateUserData: (userData) => set((state) => ({ user: { ...state.user, ...userData } })),
      setDemoUser: (user) => {
        if (typeof window !== "undefined") {
          const { setAccessToken } = require("../lib/tokenStore");
          setAccessToken("demo-jwt-token-12345");
        }
        set({ user, isAuthenticated: !!user, _hydrated: true, isLoading: false, error: null });
      },
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({
        userId: state.user?.id,
        userRole: state.user?.role,
        isAuthenticated: state.isAuthenticated,
        _hydrated: state._hydrated,
      }),
      onRehydrateStorage: () => (state) => {
        // Reconstruct minimal user from persisted fields; full user fetched via checkAuth()
        if (state?.userId) {
          state.user = { id: state.userId, role: state.userRole };
        }
        // Mark hydration complete so redirect guards don't fire before state is restored
        useAuthStore.setState({ _hydrated: true });
      },
    }
  )
);
