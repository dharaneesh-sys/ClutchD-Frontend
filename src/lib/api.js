import axios from "axios";
import { API_BASE_URL } from "@/lib/constants";
import { getAccessToken, setAccessToken, clearAccessToken } from "@/lib/tokenStore";
import { refreshAccessToken, handleRefreshFailure } from "@/lib/authRefresh";


// Public API path prefixes that should NOT trigger auth redirect on 401.
// For these endpoints, the 401 is simply passed through so calling code
// can fall back to demo data instead of redirecting to /auth.
const PUBLIC_API_PATHS = ['/products', '/categories', '/health'];

// Access-token TTL mirrors authStore — keeps 401-refresh tokens expiring client-side.
const ACCESS_TTL_MS =
  (parseInt(process.env.NEXT_PUBLIC_ACCESS_TTL_MINUTES, 10) || 15) * 60 * 1000;

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
  maxContentLength: 10 * 1024 * 1024, // 10MB max response
  maxBodyLength: 10 * 1024 * 1024,    // 10MB max request
});

api.interceptors.request.use(
  async (config) => {

    if (typeof window !== "undefined") {
      const token = getAccessToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    const method = (config.method || "").toUpperCase();
    if (["POST", "PUT", "PATCH", "DELETE"].includes(method)) {
      config.headers["X-Requested-With"] = "XMLHttpRequest";
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — handle 401 with token refresh, and other errors
let pendingRequests = [];

function onTokenRefreshed(newToken) {
  pendingRequests.forEach((cb) => cb(newToken));
  pendingRequests = [];
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      const isAuthPage = typeof window !== "undefined" && window.location.pathname.startsWith("/auth");
      const isAuthRequest = originalRequest?.url?.includes("/auth/");
      const isRefreshRequest = originalRequest?.url?.includes("/auth/refresh");
      const isPublicEndpoint = PUBLIC_API_PATHS.some(path => originalRequest?.url?.startsWith(path));

      // Don't retry refresh requests, auth page requests, or public endpoints
      if (isAuthPage || isAuthRequest || isRefreshRequest || isPublicEndpoint) {
        return Promise.reject(error);
      }

      originalRequest._retry = true;

      // Single shared refresh (singleton promise inside refreshAccessToken —
      // concurrent 401s all await the same request instead of stampeding).
      try {
        const newToken = await refreshAccessToken();
        if (newToken) {
          onTokenRefreshed(newToken);
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return api(originalRequest);
        }
      } catch {
        // fall through to failure handling below
      }

      // Refresh failed — drop tokens and redirect (unless demo session).
      pendingRequests = [];
      handleRefreshFailure();
      // Reject with the ORIGINAL error so callers see the real failure.
      return Promise.reject(error);
    }

    return Promise.reject(error);
  }
);

// 429 rate-limit retry interceptor — exponential backoff, max 3 retries, then toast
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 429 && originalRequest) {
      const retryCount = originalRequest.__retryCount || 0;

      if (retryCount >= 3) {
        try {
          const { useToastStore } = await import('@/store/toastStore');
          useToastStore.getState().addToast(
            'warning',
            'Too many requests. Please slow down.',
            { duration: 5000 },
          );
        } catch (_) {
          // toastStore not available (SSR edge case) — degrade silently
        }
        return Promise.reject(error);
      }

      const method = (originalRequest.method || '').toLowerCase();
      const isRetryable =
        method === 'get' || method === 'head' || originalRequest.__isRetryable;
      if (!isRetryable) {
        return Promise.reject(error);
      }

      const retryAfter = parseInt(
        error.response.headers?.['retry-after'] || '1',
        10,
      );
      // Exponential backoff: retryAfter * 2^(attempt) * 1000ms
      const delay = retryAfter * Math.pow(2, retryCount) * 1000;

      originalRequest.__retryCount = retryCount + 1;

      return new Promise((resolve) => {
        setTimeout(() => {
          resolve(api(originalRequest));
        }, delay);
      });
    }

    return Promise.reject(error);
  },
);

// Network/5xx retry interceptor — transient funnel/DERP blips and slow-link timeouts.
// Registered last so it runs BEFORE the 429 and 401 handlers. Only handles errors
// those two ignore: no response at all (timeout/DNS/reset) or retryable 5xx/408.
// Retries idempotent requests (GET/HEAD or __isRetryable) with backoff, max 3.
// Non-idempotent requests (POST/PUT/PATCH/DELETE) are never auto-retried unless
// the call site marks them __isRetryable (safe when a repeat can't double-charge
// or double-create — e.g. Google OAuth verify, which only exchanges a token).
const NETWORK_RETRYABLE_STATUS = new Set([408, 425, 500, 502, 503, 504]);
const MAX_NETWORK_RETRIES = 3;
const NETWORK_RETRY_BASE_MS = 1500;

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (!originalRequest || originalRequest.__noRetry) {
      return Promise.reject(error);
    }

    const status = error.response?.status;
    const isNetworkError = !error.response;
    const isRetryableStatus =
      status !== undefined && NETWORK_RETRYABLE_STATUS.has(status);
    if (!isNetworkError && !isRetryableStatus) {
      return Promise.reject(error);
    }

    const method = (originalRequest.method || "").toLowerCase();
    const isIdempotent =
      method === "get" || method === "head" || originalRequest.__isRetryable;
    if (!isIdempotent) {
      return Promise.reject(error);
    }

    const retryCount = originalRequest.__networkRetryCount || 0;
    if (retryCount >= MAX_NETWORK_RETRIES) {
      return Promise.reject(error);
    }
    originalRequest.__networkRetryCount = retryCount + 1;

    const delay = NETWORK_RETRY_BASE_MS * Math.pow(2, retryCount);
    await new Promise((resolve) => setTimeout(resolve, delay));
    return api(originalRequest);
  },
);

export default api;

/**
 * Extract a user-readable error message from an Axios error.
 * Handles FastAPI's `{ detail: "..." }` and `{ detail: [{...}] }` formats.
 */
export function extractApiError(error, fallback = "Something went wrong.") {
  if (!error) return fallback;
  if (!error.response) return "Server unreachable. Please check your connection.";
  const detail = error.response?.data?.detail;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail) && detail.length > 0) {
    return detail.map(d => d.msg || d.message || JSON.stringify(d)).join("; ");
  }
  return error.response?.statusText || fallback;
}
