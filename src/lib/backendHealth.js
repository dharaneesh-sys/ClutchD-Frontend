import { API_BASE_URL } from "@/lib/constants";

let _isAvailable = null;
let _checkInterval = null;
let _listeners = [];

function notifyListeners(status) {
  _listeners.forEach((cb) => {
    try {
      cb(status);
    } catch {
      // Swallow listener errors so one bad listener doesn't break the chain
    }
  });
}

function stopPolling() {
  if (_checkInterval) {
    clearInterval(_checkInterval);
    _checkInterval = null;
  }
}

/**
 * Ping a single URL with a timeout. Returns true for any reachable response
 * (even 4xx/5xx — the server is up), false on network error or timeout.
 */
async function pingUrl(url, timeoutMs = 5000) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    const res = await fetch(url, {
      method: "GET",
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    // Any response (including 405, 503) means the server is reachable.
    // Only network errors / timeouts mean unavailable.
    return true;
  } catch {
    return false;
  }
}

export const BackendHealth = {
  /** Current known backend availability. null = unchecked, true/false = known. */
  isAvailable: () => _isAvailable,

  /**
   * Ping backend health endpoints with a 5s timeout per endpoint.
   * Checks both the general /health endpoint and the payments endpoint
   * (via a GET — expects any response as proof of reachability).
   * All endpoints must be reachable for the backend to be considered healthy.
   * Notifies listeners when the status changes from the previous value.
   */
  check: async () => {
    const baseUrl = API_BASE_URL.replace("/api", "");
    const healthUrl = `${baseUrl}/health`;
    const paymentsUrl = `${baseUrl}/payments/create`;

    const [healthReachable, paymentsReachable] = await Promise.all([
      pingUrl(healthUrl),
      pingUrl(paymentsUrl),
    ]);

    const newStatus = healthReachable && paymentsReachable;
    if (_isAvailable !== newStatus) {
      _isAvailable = newStatus;
      notifyListeners(newStatus);
    }
    return newStatus;
  },

  /** Start polling the health endpoint at the given interval (default 30s). */
  startPolling: (intervalMs = 30000) => {
    stopPolling();
    BackendHealth.check();
    _checkInterval = setInterval(() => BackendHealth.check(), intervalMs);
  },

  /** Stop polling the health endpoint. */
  stopPolling,

  /** Register a listener that fires on every status change. */
  onStatusChange: (callback) => {
    _listeners.push(callback);
  },

  /** Remove a previously registered listener. */
  removeListener: (callback) => {
    _listeners = _listeners.filter((cb) => cb !== callback);
  },
};
