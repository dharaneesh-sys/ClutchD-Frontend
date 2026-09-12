import api from "@/lib/api";
import {
  getRefreshToken,
  setAccessToken,
  setRefreshToken,
  clearAccessToken,
  clearRefreshToken,
} from "@/lib/tokenStore";
import { navigateToAuth } from "@/lib/navigation";

// Access-token TTL mirrors authStore — keeps 401-refresh tokens expiring client-side.
export const ACCESS_TTL_MS =
  (parseInt(process.env.NEXT_PUBLIC_ACCESS_TTL_MINUTES, 10) || 15) * 60 * 1000;

// Singleton in-flight refresh — every caller awaits the same request, so
// concurrent 401s never stampede the backend with parallel refresh calls.
let inflight = null;

/**
 * Refresh the access token using the persisted refresh token.
 *
 * Sends the token via X-Refresh-Token header (primary — Android WebViews block
 * third-party cookies, so the backend's clutchd_refresh cookie never sticks in
 * the Capacitor app). The backend also still accepts the cookie for browsers.
 *
 * Resolves with the new access token and stores both new tokens (refresh
 * tokens rotate on every use). Rejects with the underlying axios error on
 * failure — after clearing both tokens — so callers can distinguish 401
 * (session dead) from network errors (transient).
 */
export function refreshAccessToken() {
  if (inflight) return inflight;

  inflight = api
    .post(
      "/auth/refresh",
      {},
      {
        headers: { "X-Refresh-Token": getRefreshToken() || "" },
        __noRetry: true, // network-retry interceptor must not replay refreshes
      },
    )
    .then((res) => {
      inflight = null;
      const newToken = res.data?.token;
      const newRefresh = res.data?.refresh_token;
      if (!newToken) {
        clearAccessToken();
        clearRefreshToken();
        throw new Error("Refresh response missing token");
      }
      setAccessToken(newToken, ACCESS_TTL_MS);
      if (newRefresh) setRefreshToken(newRefresh);
      return newToken;
    })
    .catch((err) => {
      inflight = null;
      clearAccessToken();
      clearRefreshToken();
      throw err;
    });

  return inflight;
}

/**
 * Force-logout UX shared by the 401 interceptor and authStore: drop tokens
 * and bounce to /auth. Skipped for demo/firebase-only sessions whose tokens
 * can't validate against the real backend anyway.
 */
export function handleRefreshFailure() {
  if (typeof window === "undefined") return;
  try {
    const stored = JSON.parse(localStorage.getItem("auth-storage") || "{}");
    const uid = stored?.state?.user?.id || "";
    if (uid.startsWith("demo-") || uid.startsWith("firebase-")) return;
  } catch {
    // ignore parse errors
  }
  clearAccessToken();
  clearRefreshToken();
  navigateToAuth();
}
