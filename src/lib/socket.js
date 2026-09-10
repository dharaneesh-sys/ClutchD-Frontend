import { WS_URL } from "@/lib/constants";
import { useTrackingStore } from "@/store/trackingStore";
import { getAccessToken } from "@/lib/tokenStore";

let wsInstance = null;
let reconnectTimer = null;
let reconnectAttempts = 0;
let heartbeatTimer = null;
let lastMessageAt = 0;
let lastToken = null;
let netListenersAttached = false;
const BASE_RECONNECT_DELAY = 3000;
const MAX_RECONNECT_DELAY = 30000;
const HEARTBEAT_INTERVAL_MS = 25000;
const STALE_SILENCE_MS = 60000;

export const connectWebSocket = (token) => {
  if (typeof window === "undefined") return null;
  // Don't reconnect if connecting or open
  if (wsInstance && (wsInstance.readyState === WebSocket.OPEN || wsInstance.readyState === WebSocket.CONNECTING)) {
    return wsInstance;
  }

  // Close any existing stale connection
  if (wsInstance) {
    try { 
      wsInstance.onclose = null; // Prevent triggering an automatic reconnect loop
      wsInstance.close(); 
    } catch (_) { /* ignore */ }
    wsInstance = null;
  }

  // Clear pending reconnects
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }

  if (token) lastToken = token;

  const url = WS_URL;
  
  try {
    // Pass token as Sec-WebSocket-Protocol header (preferred, no URL leakage to logs/history).
    // Backend falls back to query param for backward compatibility.
    wsInstance = new window.WebSocket(url, token ? [token] : []);
  } catch (err) {
    console.warn("[WebSocket] Failed to create connection", err);
    return null;
  }

  wsInstance.onopen = () => {
    console.warn("[WebSocket] Connected successfully");
    reconnectAttempts = 0; // Reset on successful connection
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
    lastMessageAt = Date.now();
    startHeartbeat();
    attachNetListeners();
  };

  wsInstance.onmessage = (event) => {
    lastMessageAt = Date.now();
    try {
      const data = JSON.parse(event.data);
      
      // Handle real-time mechanic location updates
      if (data.type === "LOCATION_UPDATE" && data.payload?.coords) {
        useTrackingStore.getState().setMechanicLocation(data.payload.coords);
      }
      
      // Handle service status updates from server — pass fromServer=true to avoid duplicate PATCH
      if (data.type === "STATUS_UPDATE") {
        import("../store/serviceStore").then((m) => {
          m.useServiceStore.getState().updateRequestStatus(
            data.payload.status,
            data.payload.mechanic,
            true, // fromServer — skip backend PATCH
            data.payload.pricing // pricing breakdown for payment_pending
          );
        }).catch(() => {}); // Silently ignore — primary data flow is WebSocket/PATCH
      }

      // Handle notification count updates
      if (data.type === "NOTIFICATION_UPDATE") {
        import("../store/notificationStore").then((m) => {
          if (m.useNotificationStore) {
            m.useNotificationStore.getState().setUnreadCount(data.payload.unreadCount);
          }
        }).catch(() => {});
      }

      // Handle real-time chat messages
      if (data.type === "CHAT_MESSAGE" && data.payload) {
        import("../store/chatStore").then((m) => {
          m.useChatStore.getState().receiveMessage(data.payload.jobId, data.payload);
        }).catch(() => {});
      }

      // Handle chat read receipts
      if (data.type === "CHAT_READ" && data.payload?.jobId) {
        import("../store/chatStore").then((m) => {
          m.useChatStore.getState().markRead(data.payload.jobId);
        }).catch(() => {});
      }
    } catch (err) {
      console.warn("[WebSocket] Failed to parse message", err);
    }
  };

  wsInstance.onclose = (event) => {
    console.warn("[WebSocket] Disconnected", event.code);
    wsInstance = null;
    
    // Don't reconnect if closed intentionally (1000) or auth failed (4401)
    if (event.code === 1000 || event.code === 4401) {
      reconnectAttempts = 0;
      return;
    }

    // Don't reconnect if user logged out
    if (!getAccessToken()) {
      reconnectAttempts = 0;
      return;
    }

    // Exponential backoff, capped — reconnect forever while logged in.
    // A dead server/funnel flap longer than a couple of minutes must NOT kill
    // realtime permanently (previous code gave up after 5 attempts, ~93s).
    scheduleReconnect();
  };

  wsInstance.onerror = (error) => {
    console.warn("[WebSocket] Error occurred", error);
  };

  return wsInstance;
};

export const disconnectWebSocket = () => {
  reconnectAttempts = 0;
  stopHeartbeat();
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
  if (wsInstance) {
    wsInstance.close(1000, "Client disconnect");
    wsInstance = null;
  }
};

/**
 * Send mechanic GPS location to the server for real-time tracking.
 */
export const sendMechanicLocation = (lat, lon) => {
  if (wsInstance && wsInstance.readyState === WebSocket.OPEN) {
    wsInstance.send(JSON.stringify({ type: "MECHANIC_LOCATION", lat, lon }));
  }
};

/**
 * Send an arbitrary JSON message over the WebSocket.
 * Returns true if sent, false if the socket is not connected.
 * Used by chatService and any other module that needs to push WS messages.
 */
export const sendWSMessage = (data) => {
  if (wsInstance && wsInstance.readyState === WebSocket.OPEN) {
    wsInstance.send(JSON.stringify(data));
    return true;
  }
  return false;
};

/**
 * Check if the WebSocket is currently connected.
 */
export const isConnected = () => {
  return wsInstance !== null && wsInstance.readyState === WebSocket.OPEN;
};

/**
 * Get current connection state for UI indicators.
 */
export const getConnectionState = () => {
  if (!wsInstance) return "disconnected";
  switch (wsInstance.readyState) {
    case WebSocket.CONNECTING: return "connecting";
    case WebSocket.OPEN: return "connected";
    case WebSocket.CLOSING: return "closing";
    case WebSocket.CLOSED: return "disconnected";
    default: return "disconnected";
  }
};

/**
 * Schedule a reconnect with capped exponential backoff (3s doubling, max 30s).
 * Retries forever while the user is logged in — never permanently gives up.
 */
function scheduleReconnect() {
  if (typeof window === "undefined") return;
  if (!getAccessToken()) {
    reconnectAttempts = 0;
    return;
  }
  if (reconnectTimer) return; // already scheduled
  const delay = Math.min(
    BASE_RECONNECT_DELAY * Math.pow(2, reconnectAttempts),
    MAX_RECONNECT_DELAY,
  );
  reconnectAttempts++;
  console.warn(`[WebSocket] Reconnecting in ${delay / 1000}s (attempt ${reconnectAttempts})`);
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    // Re-read the token from memory so we use the latest refreshed token,
    // not a stale one captured in a closure.
    connectWebSocket(getAccessToken() || lastToken);
  }, delay);
}

function stopHeartbeat() {
  if (heartbeatTimer) {
    clearInterval(heartbeatTimer);
    heartbeatTimer = null;
  }
}

function startHeartbeat() {
  stopHeartbeat();
  if (typeof window === "undefined") return;
  heartbeatTimer = setInterval(() => {
    if (wsInstance && wsInstance.readyState === WebSocket.OPEN) {
      // App-level keepalive — backend ignores unknown types safely.
      // Keeps NAT/proxy bindings fresh on slow mobile links.
      try {
        wsInstance.send(JSON.stringify({ type: "PING", at: Date.now() }));
      } catch (_) { /* ignore */ }
      // Half-dead socket guard: OPEN but silent for 60s+ → force reconnect.
      if (Date.now() - lastMessageAt > STALE_SILENCE_MS) {
        console.warn("[WebSocket] Stale silent socket — forcing reconnect");
        try {
          wsInstance.onclose = null;
          wsInstance.close();
        } catch (_) { /* ignore */ }
        wsInstance = null;
        scheduleReconnect();
      }
    }
  }, HEARTBEAT_INTERVAL_MS);
}

function attachNetListeners() {
  if (netListenersAttached || typeof window === "undefined") return;
  netListenersAttached = true;
  if (typeof window.addEventListener === "function") {
    window.addEventListener("online", () => {
      console.warn("[WebSocket] Browser online — reconnecting now");
      reconnectNow();
    });
  }
  if (typeof document !== "undefined" && typeof document.addEventListener === "function") {
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") reconnectNow();
    });
  }
  // Capacitor: app returning from background — socket usually died while suspended.
  import("@capacitor/app").then(({ App }) => {
    App.addListener("resume", () => reconnectNow());
  }).catch(() => {}); // web — plugin absent, window events suffice
}

/**
 * Reconnect immediately if not already live. Safe to call on online/resume/
 * visibility events and backend-recovery hooks.
 */
export const reconnectNow = () => {
  if (typeof window === "undefined") return;
  if (wsInstance && (wsInstance.readyState === WebSocket.OPEN || wsInstance.readyState === WebSocket.CONNECTING)) {
    return; // already live
  }
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
  connectWebSocket(getAccessToken() || lastToken);
};
