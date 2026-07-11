import { create } from "zustand";
import { persist } from "zustand/middleware";
import api from "@/lib/api";
import { connectWebSocket, disconnectWebSocket } from "@/lib/socket";
import { setAccessToken, getAccessToken, clearAccessToken } from "@/lib/tokenStore";
import { cacheUserProfile } from "@/lib/offline/offlineCache";

/**
 * Clear ALL client-side storage — localStorage, sessionStorage, and cookies
 * related to auth. Called on full logout or session teardown.
 */
function clearAllStorage() {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem("auth-storage");
    sessionStorage.removeItem("demo_token");
    // Clear cookies that may contain lingering session markers
    document.cookie.split(";").forEach((c) => {
      const [name] = c.trim().split("=");
      if (name && (name.includes("auth") || name.includes("token") || name.includes("session"))) {
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
      }
    });
  } catch (e) {
    console.warn("[authStore] clearAllStorage best-effort failed:", e);
  }
}

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
      _isRestoring: true,
      isLoading: false,
      error: null,

      /**
       * Attempt to restore the session on app startup using the httpOnly
       * refresh cookie. The refresh cookie is set server-side on login and
       * survives page reloads. This runs once in AuthInit.
       *
       * Sets _isRestoring = false when done so page guards can proceed.
       * Does NOT redirect on failure — the page guard handles that.
       */
      restoreSession: async () => {
        const { user, isAuthenticated } = get();
        if (!isAuthenticated || !user?.id) {
          set({ _isRestoring: false });
          return;
        }
        // Demo & Firebase-only users have fake tokens — skip refresh against real backend
        if (typeof user.id === "string" && (user.id.startsWith("demo-") || user.id.startsWith("firebase-"))) {
          set({ _isRestoring: false });
          return;
        }
        try {
          const res = await api.post("/auth/refresh");
          const newToken = res.data.token;
          if (typeof window !== "undefined" && newToken) {
            setAccessToken(newToken);
            connectWebSocket(newToken);
            scheduleProactiveRefresh();
          }
          const userData = res.data.user || user;
          set({ user: userData, isAuthenticated: true, _isRestoring: false });
        } catch (error) {
          const status = error.response?.status;
          if (status === 401 || status === 403) {
            if (typeof window !== "undefined") {
              clearAccessToken();
              disconnectWebSocket();
            }
            set({ user: null, isAuthenticated: false, error: null, _isRestoring: false });
          } else {
            // Network error — allow the user to stay logged in
            // with their cached data; the 401 interceptor handles real failures
            set({ _isRestoring: false });
          }
        }
      },

      /**
       * Clear everything — memory state AND all client-side storage.
       * Used for a hard logout that removes every trace of auth.
       */
      clearSession: () => {
        clearProactiveRefresh();
        disconnectWebSocket();
        clearAccessToken();
        clearAllStorage();
        set({ user: null, isAuthenticated: false, _hydrated: false, _isRestoring: false, error: null, isLoading: false });
      },

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

          // Single set() call after await — no pre-await mutation to avoid
          // React 19 flushSync cascade (#185). Both error clearing and user
          // data are set together so useSyncExternalStore only fires once.
          set({ user: response.data.user, isAuthenticated: true, _hydrated: true, isLoading: false, error: null });
          cacheUserProfile(response.data.user);
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
            error: null,
          });
          cacheUserProfile(response.data.user);
          return response.data.user;
        } catch (error) {
          // Backend OAuth failed — fall through to Firebase Auth signInWithCredential
          // (no popup needed — we already have the credential from GSI)
          try {
            const { signInWithGoogleCredential } = await import(
              "@/lib/auth/firebaseAuth"
            );
            const firebaseUser = await signInWithGoogleCredential(credential);

            if (!firebaseUser) {
              set({ isLoading: false, error: null });
              return null;
            }

            const localUser = {
              id: firebaseUser.uid,
              name: firebaseUser.displayName || "Google User",
              email: firebaseUser.email || "",
              avatar: firebaseUser.photoURL || null,
              role: safeRole || "customer",
              provider: "firebase",
            };

            if (typeof window !== "undefined") {
              setAccessToken("firebase-local-jwt-token");
            }

            set({
              user: localUser,
              isAuthenticated: true,
              _hydrated: true,
              isLoading: false,
            });
            cacheUserProfile(localUser);
            return localUser;
          } catch (fbError) {
            const msg = "Google sign-in failed. Please try again.";
            set({ isLoading: false, error: msg });
            return null;
          }
        }
      },

      /**
       * Sign in with Google via Firebase Auth popup.
       * Used as a fallback when the backend is unavailable (503),
       * or as a standalone Firebase-first sign-in path.
       *
       * Opens a Firebase Auth popup, creates a local user from the
       * Firebase user data, and sets a local JWT-like token so API
       * interceptors can recognise the session.
       *
       * Returns the user object on success, or null if the popup was
       * closed or sign-in failed.
       */
      firebaseSignIn: async (role = null) => {

        try {
          const { signInWithGoogle } = await import(
            "@/lib/auth/firebaseAuth"
          );
          const firebaseUser = await signInWithGoogle();

          if (!firebaseUser) {
            // User closed the popup — quiet exit, no error
            set({ isLoading: false, error: null });
            return null;
          }

          // Build a local user from Firebase profile data
          const localUser = {
            id: `firebase-${firebaseUser.uid}`,
            name: firebaseUser.displayName || "Google User",
            email: firebaseUser.email || "",
            avatar: firebaseUser.photoURL || null,
            role: role || "customer",
            provider: "firebase",
          };

          if (typeof window !== "undefined") {
            setAccessToken("firebase-local-jwt-token");
          }

          set({
            user: localUser,
            isAuthenticated: true,
            _hydrated: true,
            isLoading: false,
            error: null,
          });
          cacheUserProfile(localUser);
          return localUser;
        } catch (error) {
          const msg =
            error.code === "auth/popup-closed-by-user"
              ? null
              : "Google sign-in via Firebase failed. Please try again.";
          set({ isLoading: false, error: msg });
          return null;
        }
      },

      /**
       * Sign in with Google via Capacitor native Firebase Auth plugin.
       * Opens a native Android system dialog (account picker).
       * Only available when running inside Capacitor WebView.
       */
      loginWithGoogleCapacitor: async (role) => {
        set({ isLoading: true, error: null });

        try {
          const { signInWithGoogleNative } = await import(
            "@/lib/auth/capacitorAuth"
          );
          const firebaseUser = await signInWithGoogleNative();

          if (!firebaseUser) {
            set({ isLoading: false, error: null });
            return null;
          }

          const localUser = {
            id: `firebase-${firebaseUser.uid}`,
            name: firebaseUser.displayName || "Google User",
            email: firebaseUser.email || "",
            avatar: firebaseUser.photoURL || null,
            role: role || "customer",
            provider: "firebase",
          };

          if (typeof window !== "undefined") {
            setAccessToken("firebase-local-jwt-token");
          }

          set({
            user: localUser,
            isAuthenticated: true,
            _hydrated: true,
            isLoading: false,
            error: null,
          });
          cacheUserProfile(localUser);
          return localUser;
        } catch (error) {
          console.error("[authStore] loginWithGoogleCapacitor error:", error);
          const msg =
            error.message || "Google sign-in failed. Please try again.";
          set({ isLoading: false, error: msg });
          return null;
        }
      },

      signup: async (data, role) => {

        try {
          const payload = { ...data, role };
          const response = await api.post("/auth/signup", payload);

          if (response.data.token && typeof window !== "undefined") {
            setAccessToken(response.data.token);
            connectWebSocket(response.data.token);
            scheduleProactiveRefresh();
          }

          set({ user: response.data.user, isAuthenticated: true, _hydrated: true, isLoading: false, error: null });
          cacheUserProfile(response.data.user);
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
          console.warn("[authStore] Logout API call failed (state cleared anyway):", e);
        }
        if (typeof window !== "undefined") {
          clearAccessToken();
          disconnectWebSocket();
        }
        set({ user: null, isAuthenticated: false, _hydrated: true, error: null });
      },

      clearError: () => set({ error: null }),
      setUser: (user) => {
        set({ user, isAuthenticated: !!user, _hydrated: true });
        if (user) cacheUserProfile(user);
      },
      updateUserData: (userData) =>
        set((state) => {
          const updated = { ...state.user, ...userData };
          cacheUserProfile(updated);
          return { user: updated };
        }),
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({
        userId: state.user?.id,
        userRole: state.user?.role,
        isAuthenticated: state.isAuthenticated,
        _hydrated: state._hydrated,
        user: state.user?.name ? { id: state.user.id, role: state.user.role, name: state.user.name, email: state.user.email, phone: state.user.phone } : undefined,
      }),
      // Merge persisted state over current state, ensuring _hydrated and _isRestoring
      // are correct WITHOUT a separate post-hydration setState call.
      // This avoids a redundant synchronous store update (onRehydrateStorage → setState)
      // that can cascade into React's render cycle and trigger
      // "Maximum update depth exceeded" (#185) in Zustand 5 + React 19.
      merge: (persistedState, currentState) => {
        // Reconstruct minimal user from persisted fields if full user not persisted
        if (persistedState?.userId && !persistedState?.user) {
          currentState = { ...currentState, user: { id: persistedState.userId, role: persistedState.userRole } };
        }
        const merged = { ...currentState, ...persistedState };
        // Ensure _hydrated is true after rehydration so page guards can proceed
        if (!merged._hydrated && (merged.user || merged.isAuthenticated)) {
          merged._hydrated = true;
        }
        // _isRestoring is set to false immediately so AuthInit does NOT need
        // to fire a second setState() — prevents React 19's flushSync cascade
        // that triggers "Maximum update depth exceeded" (error #185) when
        // useEffect calls setState right after the merge.
        merged._isRestoring = false;
        return merged;
      },
      onRehydrateStorage: () => () => {
        // setState intentionally omitted — _hydrated/_isRestoring are handled
        // by the merge function above to prevent redundant re-renders
      },
    }
  )
);
