import axios from "axios";
import { API_BASE_URL } from "@/lib/constants";
import { getAccessToken, setAccessToken, clearAccessToken } from "@/lib/tokenStore";
import { navigateToAuth } from "@/lib/navigation";
import { DEMO_MODE } from "@/lib/demo/demoFlag";

let _demoApiModule = null;

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
    // Check runtime demo mode (toggled via toolbar) in addition to static DEMO_MODE flag
    const isRuntimeDemo = typeof window !== "undefined" && (
      window.__DEMO_USER__ || sessionStorage.getItem("demo_token")
    );
    // Also intercept login/signup for demo email addresses so Demo123456 works
    // even when the demo toolbar hasn't been toggled yet
    const isAuthRequest = config.method === "post" && (
      config.url?.includes("/auth/login") || config.url?.includes("/auth/signup")
    );
    const reqData = typeof config.data === "string" ? (() => { try { return JSON.parse(config.data); } catch { return {}; } })() : (config.data || {});
    const isDemoEmailLogin = isAuthRequest && reqData.email?.endsWith?.("@demo.com");
    if (DEMO_MODE || isRuntimeDemo || isDemoEmailLogin) {
      if (!_demoApiModule) {
        _demoApiModule = await import("./demo/apiInterceptor");
      }
      const result = _demoApiModule.handleDemoApiRequest(
        config.method || "get",
        config.url,
        config.data,
        { params: config.params }
      );
      if (result) {
        config.adapter = () => Promise.resolve({
          data: result.data,
          status: 200,
          statusText: "OK",
          headers: {},
          config,
        });
      }
    }

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
let isRefreshing = false;
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

      // Don't retry refresh requests or auth page requests
      if (isAuthPage || isAuthRequest || isRefreshRequest) {
        return Promise.reject(error);
      }

      originalRequest._retry = true;

      if (!isRefreshing) {
        isRefreshing = true;
        try {
          const res = await api.post("/auth/refresh");
          const newToken = res.data.token;
          if (typeof window !== "undefined" && newToken) {
            setAccessToken(newToken);
          }
          isRefreshing = false;
          onTokenRefreshed(newToken);
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return api(originalRequest);
        } catch (refreshError) {
          isRefreshing = false;
          pendingRequests = [];
          
           const status = refreshError.response?.status;
           // Only force logout on explicit 401/403 credentials failure.
           if (status === 401 || status === 403) {
             if (typeof window !== "undefined") {
               // Don't redirect demo users — their tokens can't validate against real backend
               try {
                 const stored = JSON.parse(localStorage.getItem("auth-storage") || "{}");
                 if (stored?.state?.user?.id?.startsWith?.("demo-")) return Promise.reject(refreshError);
               } catch (e) {}
               clearAccessToken();
               navigateToAuth();
             }
           }
          return Promise.reject(refreshError);
        }
      }

      // Another request triggered refresh — queue this one
      return new Promise((resolve) => {
        pendingRequests.push((newToken) => {
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          resolve(api(originalRequest));
        });
      });
    }

    return Promise.reject(error);
  }
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
