import { create } from "zustand";
import { persist } from "zustand/middleware";
import api from "@/lib/api";
import { connectWebSocket, disconnectWebSocket } from "@/lib/socket";
import { setAccessToken, getAccessToken, clearAccessToken, setTokenPersistMode } from "@/lib/tokenStore";
import { cacheUserProfile } from "@/lib/offline/offlineCache";
import { useToastStore } from "@/store/toastStore";

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

const SESSION_MIRROR_KEY = "auth-session";

/**
 * Mirror the user into sessionStorage when Remember Me is off.
 * Zustand persist skips localStorage in that mode (see partialize), so this
 * keeps the session alive for the tab lifetime without persisting restarts.
 */
function writeSessionMirror(user) {
  if (typeof window === "undefined") return;
  try {
    if (user) sessionStorage.setItem(SESSION_MIRROR_KEY, JSON.stringify({ user }));
    else sessionStorage.removeItem(SESSION_MIRROR_KEY);
  } catch (e) {
    console.warn("[authStore] session mirror write failed:", e);
  }
}

function readSessionMirror() {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(SESSION_MIRROR_KEY);
    if (!raw) return null;
    const mirror = JSON.parse(raw);
    return mirror?.user?.id ? mirror.user : null;
  } catch (e) {
    console.warn("[authStore] session mirror read failed:", e);
    return null;
  }
}

/**
 * Apply the Remember-Me choice after a successful auth: route the access
 * token to localStorage vs sessionStorage-only and keep localStorage free
 * of auth-storage when the session must not survive a restart.
 */
function applyRememberChoice(remember, user) {
  setTokenPersistMode(remember);
  if (!remember && typeof window !== "undefined") {
    try {
      localStorage.removeItem("auth-storage");
    } catch (e) {
      console.warn("[authStore] auth-storage clear failed:", e);
    }
    writeSessionMirror(user);
    // The trailing set() re-persists an (empty) snapshot — drop the key
    // again once it lands so session-only auth leaves no auth-storage trace.
    if (typeof queueMicrotask === "function") {
      queueMicrotask(() => {
        try {
          const raw = localStorage.getItem("auth-storage");
          if (raw && !JSON.parse(raw)?.state?.userId) {
            localStorage.removeItem("auth-storage");
          }
        } catch (e) {
          console.warn("[authStore] auth-storage sweep failed:", e);
        }
      });
    }
  }
}

/**
 * Send the user to /auth?expired=1 after the refresh token is rejected.
 * Dispatches the SPA navigation event first, then hard-redirects as a
 * fallback in case no navigation listener is mounted on this page.
 */
function redirectToExpired() {
  if (typeof window === "undefined") return;
  try {
    window.dispatchEvent(
      new CustomEvent("clutchd:navigate", { detail: { path: "/auth?expired=1" } }),
    );
  } catch (e) {
    console.warn("[authStore] navigate event failed:", e);
  }
  setTimeout(() => {
    try {
      if (!window.location.pathname.startsWith("/auth")) {
        window.location.assign("/auth?expired=1");
      }
    } catch (e) {
      console.warn("[authStore] expired redirect failed:", e);
    }
  }, 150);
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
        setAccessToken(newToken, ACCESS_TTL_MS);
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
      rememberMe: true,
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
          // Session-only (Remember Me off) sessions live in sessionStorage.
          const mirrored = readSessionMirror();
          if (mirrored) {
            set({ user: mirrored, isAuthenticated: true, _isRestoring: false });
            return;
          }
          set({ _isRestoring: false });
          return;
        }
        const uid = typeof user.id === "string" ? user.id : "";
        // Demo users have fake tokens — skip refresh against real backend
        if (uid.startsWith("demo-")) {
          set({ _isRestoring: false });
          return;
        }
        const isFirebase = uid.startsWith("firebase-");
        try {
          const res = await api.post("/auth/refresh");
          const newToken = res.data.token;
          if (typeof window !== "undefined" && newToken) {
            setAccessToken(newToken, ACCESS_TTL_MS);
            connectWebSocket(newToken);
            scheduleProactiveRefresh();
          }
          const userData = res.data.user || user;
          set({ user: userData, isAuthenticated: true, _isRestoring: false });
        } catch (error) {
          const status = error.response?.status;
          if (status === 401 || status === 403) {
            if (isFirebase) {
              // Explicit Firebase fallback (BACKEND_CONTRACTS §1): keep the
              // cached user so the app stays usable, but say so out loud —
              // never a silent local login.
              useToastStore.getState().warning(
                "Backend unavailable. Continuing with your Google (Firebase) session — some features may be limited.",
              );
              set({ _isRestoring: false });
              return;
            }
            if (typeof window !== "undefined") {
              clearAccessToken();
              disconnectWebSocket();
              writeSessionMirror(null);
            }
            clearProactiveRefresh();
            set({ user: null, isAuthenticated: false, error: null, _isRestoring: false });
            redirectToExpired();
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
        writeSessionMirror(null);
        set({ user: null, isAuthenticated: false, _hydrated: false, _isRestoring: false, error: null, isLoading: false });
      },

      /**
       * Remember-Me toggle (LoginCard checkbox, default true).
       * When false, auth is sessionStorage-only: the token mirror and the
       * session mirror stay in this tab, and nothing persists to localStorage.
       */
      setRememberMe: (value) => {
        const remember = value !== false;
        set({ rememberMe: remember });
        setTokenPersistMode(remember);
        if (!remember && typeof window !== "undefined") {
          // Drop the key AFTER set() so the persist write it triggers is wiped.
          try {
            localStorage.removeItem("auth-storage");
          } catch (e) {
            console.warn("[authStore] auth-storage clear failed:", e);
          }
        }
      },

      /**
       * Validate the current session on app startup.
       * Delegates to restoreSession() — the single source of truth for the
       * withCredentials refresh flow (BACKEND_CONTRACTS §1).
       */
      checkAuth: async () => {
        await get().restoreSession();
      },

      login: async (email, password, role, opts) => {
        set({ isLoading: true, error: null });

        try {
          const response = await api.post("/auth/login", { email, password, role });

          const remember = opts?.rememberMe ?? get().rememberMe ?? true;
          if (response.data.token && typeof window !== "undefined") {
            setAccessToken(response.data.token, ACCESS_TTL_MS);
            connectWebSocket(response.data.token);
            scheduleProactiveRefresh();
            applyRememberChoice(remember, response.data.user);
          }

          // Single set() call after await — no pre-await mutation to avoid
          // React 19 flushSync cascade (#185). Both error clearing and user
          // data are set together so useSyncExternalStore only fires once.
          set({ user: response.data.user, isAuthenticated: true, _hydrated: true, isLoading: false, error: null, rememberMe: remember });
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

      loginWithGoogle: async (credential, role = null, state = null, opts) => {
        set({ isLoading: true, error: null });

        const safeRole =
          typeof role === "string" ? role.toLowerCase() : null;

        try {
          const response = await api.post("/auth/oauth/google", {
            credential,
            role: safeRole || undefined,
            state: state || undefined,
          });

          const remember = opts?.rememberMe ?? get().rememberMe ?? true;
          if (response.data.token && typeof window !== "undefined") {
            setAccessToken(response.data.token, ACCESS_TTL_MS);
            connectWebSocket(response.data.token);
            scheduleProactiveRefresh();
            applyRememberChoice(remember, response.data.user);
          }

          set({
            user: response.data.user,
            isAuthenticated: true,
            _hydrated: true,
            isLoading: false,
            error: null,
            rememberMe: remember,
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
              id: `firebase-${firebaseUser.uid}`,
              name: firebaseUser.displayName || "Google User",
              email: firebaseUser.email || "",
              avatar: firebaseUser.photoURL || null,
              role: safeRole || "customer",
              provider: "firebase",
            };

            if (typeof window !== "undefined") {
              setAccessToken("firebase-local-jwt-token", ACCESS_TTL_MS);
            }
            // Explicit fallback (BACKEND_CONTRACTS §1): the backend OAuth
            // failed, so say so instead of silently logging in locally.
            useToastStore.getState().warning(
              "Backend unavailable. Continuing with your Google (Firebase) session — some features may be limited.",
            );

            applyRememberChoice(opts?.rememberMe ?? get().rememberMe ?? true, localUser);
            set({
              user: localUser,
              isAuthenticated: true,
              _hydrated: true,
              isLoading: false,
              error: null,
              rememberMe: opts?.rememberMe ?? get().rememberMe ?? true,
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
            setAccessToken("firebase-local-jwt-token", ACCESS_TTL_MS);
          }

          applyRememberChoice(get().rememberMe ?? true, localUser);
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
          if (error.code === "auth/popup-closed-by-user") {
            set({ isLoading: false, error: null });
          } else if (error.code === "auth/popup-blocked") {
            useToastStore.getState().warning(
              "Pop-up was blocked. Please allow pop-ups for this site and try again.",
            );
            set({ isLoading: false, error: null });
          } else {
            const msg = "Google sign-in via Firebase failed. Please try again.";
            set({ isLoading: false, error: msg });
          }
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
            setAccessToken("firebase-local-jwt-token", ACCESS_TTL_MS);
          }

          applyRememberChoice(get().rememberMe ?? true, localUser);
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

      signup: async (data, role, opts) => {

        try {
          const payload = { ...data, role };
          const response = await api.post("/auth/signup", payload);

          const remember = opts?.rememberMe ?? get().rememberMe ?? true;
          if (response.data.token && typeof window !== "undefined") {
            setAccessToken(response.data.token, ACCESS_TTL_MS);
            connectWebSocket(response.data.token);
            scheduleProactiveRefresh();
            applyRememberChoice(remember, response.data.user);
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
          writeSessionMirror(null);
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
      partialize: (state) => {
        // Remember-Me-off sessions are sessionStorage-only: persist nothing
        // to localStorage so a restart signs the user out.
        if (state.rememberMe === false) return {};
        // Persist the user whenever an id exists (backend users may lack
        // `name` — gating on name dropped those sessions on restart).
        const u = state.user;
        return {
          userId: u?.id,
          userRole: u?.role,
          isAuthenticated: state.isAuthenticated,
          _hydrated: state._hydrated,
          rememberMe: state.rememberMe ?? true,
          user: u?.id
            ? {
                id: u.id,
                role: u.role,
                name: u.name ?? u.fullName ?? null,
                email: u.email ?? null,
                phone: u.phone ?? null,
              }
            : undefined,
        };
      },
      // Merge persisted state over current state, ensuring _hydrated and _isRestoring
      // are correct WITHOUT a separate post-hydration setState call.
      // This avoids a redundant synchronous store update (onRehydrateStorage → setState)
      // that can cascade into React's render cycle and trigger
      // "Maximum update depth exceeded" (#185) in Zustand 5 + React 19.
      merge: (persistedState, currentState) => {
        const merged = { ...currentState };
        // Apply only defined persisted values — a `user: undefined` entry
        // must NOT wipe the reconstructed user below.
        if (persistedState) {
          for (const [k, v] of Object.entries(persistedState)) {
            if (v !== undefined) merged[k] = v;
          }
        }
        // Reconstruct minimal user from persisted fields if full user not persisted
        if (!merged.user && persistedState?.userId) {
          merged.user = { id: persistedState.userId, role: persistedState.userRole };
        }
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



