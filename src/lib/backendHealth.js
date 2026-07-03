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

export const BackendHealth = {
  /** Current known backend availability. null = unchecked, true/false = known. */
  isAvailable: () => _isAvailable,

  /**
   * Ping the backend health endpoint with a 5s timeout.
   * Returns true for any 2xx response, false otherwise.
   * Notifies listeners when the status changes from the previous value.
   */
  check: async () => {
    try {
      const healthUrl = `${API_BASE_URL.replace("/api", "")}/health`;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const res = await fetch(healthUrl, {
        method: "GET",
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const newStatus = res.ok;
      if (_isAvailable !== newStatus) {
        _isAvailable = newStatus;
        notifyListeners(newStatus);
      }
      return newStatus;
    } catch {
      if (_isAvailable !== false) {
        _isAvailable = false;
        notifyListeners(false);
      }
      return false;
    }
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
