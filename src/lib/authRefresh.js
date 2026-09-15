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

  const attempt = () =>
    api.post(
      "/auth/refresh",
      {},
      {
        headers: { "X-Refresh-Token": getRefreshToken() || "" },
        __noRetry: true, // network-retry interceptor must not replay refreshes
      },
    );

  inflight = attempt()
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
      // A network-level failure (timeout / DNS / no response) means we never
      // reached the server — the tokens are still VALID, just unverifiable
      // right now. The funnel path can take 6-8s cold, so one retry first:
      const isNetworkError = !err.response;
      if (!isNetworkError) {
        // Real HTTP error (401/403/etc.) — tokens are genuinely dead.
        inflight = null;
        clearAccessToken();
        clearRefreshToken();
        throw err;
      }
      // Retry once after a short backoff before giving up.
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          attempt()
            .then((res) => {
              inflight = null;
              const newToken = res.data?.token;
              const newRefresh = res.data?.refresh_token;
              if (!newToken) {
                clearAccessToken();
                clearRefreshToken();
                reject(new Error("Refresh response missing token"));
                return;
              }
              setAccessToken(newToken, ACCESS_TTL_MS);
              if (newRefresh) setRefreshToken(newRefresh);
              resolve(newToken);
            })
            .catch((retryErr) => {
              inflight = null;
              if (retryErr.response) {
                // Second attempt reached the server and got rejected.
                clearAccessToken();
                clearRefreshToken();
              }
              // Pure network failure twice: KEEP tokens — the session is
              // still valid, just unreachable. Next successful call path
              // will refresh normally.
              reject(retryErr);
            });
        }, 1500);
      });
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
