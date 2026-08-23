/**
 * Push notification type-toast mapping and foreground handler.
 *
 * Maps incoming push notification data payloads to toast notifications
 * with appropriate severity and deep-link actions.
 * Call `initPushHandlers()` once at app bootstrap.
 */
import { useToastStore } from "@/store/toastStore";
import { useAuthStore } from "@/store/authStore";
import { onPushReceived } from "./pushService";

// ── Severity → store method ───────────────────────────────────────────

/** @type {Object<string, "success"|"error"|"info"|"warning">} */
const SEVERITY_METHOD = {
  success: "success",
  error: "error",
  warning: "warning",
  info: "info",
};

// ── Type → toast config map ───────────────────────────────────────────

/**
 * Placeholder for role-aware dashboard links. Expanded against the
 * signed-in user's role at notification time (see `resolveConfig`).
 */
const ROLE_DASHBOARD = "/dashboard/{role}";

/**
 * Push notification type to toast configuration.
 *
 * @type {Object<string, {severity: string, defaultMsg: string, deepLink: string|null}>}
 */
export const PUSH_TYPE_MAP = {
  NEW_JOB: {
    severity: "info",
    defaultMsg: "New job available nearby",
    deepLink: "/dashboard/mechanic",
  },
  JOB_ASSIGNED: {
    severity: "success",
    defaultMsg: "A job has been assigned to you",
    deepLink: "/dashboard/customer",
  },
  STATUS_UPDATE: {
    severity: "info",
    defaultMsg: "Job status has been updated",
    deepLink: ROLE_DASHBOARD,
  },
  ORDER_SHIPPED: {
    severity: "success",
    defaultMsg: "Your order has been shipped",
    deepLink: "/marketplace/orders",
  },
  PAYMENT_RECEIVED: {
    severity: "success",
    defaultMsg: "Payment received successfully",
    deepLink: ROLE_DASHBOARD,
  },
  MAINTENANCE_REMINDER: {
    severity: "warning",
    defaultMsg: "Vehicle maintenance reminder",
    deepLink: ROLE_DASHBOARD,
  },
};

/** Fallback for unknown notification types */
const FALLBACK_CONFIG = {
  severity: "info",
  defaultMsg: "New notification",
  deepLink: null,
};

// ── Helpers ───────────────────────────────────────────────────────────

/**
 * Extract the notification data payload from an FCM or Capacitor message.
 *
 * FCM foreground messages from `onMessage` deliver custom data in
 * `payload.data`. Capacitor uses `notification.data` (for foreground)
 * or direct `data` on the event object.
 *
 * @param {import("firebase/messaging").MessagePayload|Object} payload
 * @returns {{type?: string, title?: string, body?: string, deepLink?: string}}
 */
function extractData(payload) {
  // Capacitor shape: { notification: { data: { ... } } }
  if (payload.notification && typeof payload.notification === "object") {
    const n = /** @type {any} */ (payload.notification);
    if (n.data) return n.data;
  }
  // FCM shape: { data: { ... } }
  if (payload.data) return payload.data;

  // Fallback: the payload itself (some Capacitor versions)
  return payload || {};
}

/**
 * Resolve the toast configuration for a push notification data object.
 *
 * @param {{type?: string, title?: string, body?: string}} data
 * @returns {{severity: string, message: string, deepLink: string|null}}
 */
function resolveConfig(data) {
  const mapping = (data.type && PUSH_TYPE_MAP[data.type]) || FALLBACK_CONFIG;

  // Prefer the notification body/title from the payload, fall back to
  // the type-specific default message.
  const message = data.body || data.title || mapping.defaultMsg;

  // Allow the payload to override the deep link (e.g. a dynamic route)
  let deepLink = data.deepLink || mapping.deepLink || null;

  // Expand the role placeholder against the signed-in user. With no user
  // signed in there is no meaningful dashboard to open — drop the link.
  if (deepLink && deepLink.includes("{role}")) {
    const role = useAuthStore.getState().user?.role;
    deepLink = role ? deepLink.replace("{role}", role) : null;
  }

  return {
    severity: mapping.severity,
    message,
    deepLink,
  };
}

// ── Public API ────────────────────────────────────────────────────────

/**
 * Handle a foreground push notification by displaying a toast.
 *
 * Reads the notification data payload, resolves the toast config from
 * `PUSH_TYPE_MAP`, and shows a toast via `useToastStore`. If a deep-link
 * route is configured, the toast includes a "View" action button.
 *
 * @param {import("firebase/messaging").MessagePayload|Object} payload
 */
export function handleForegroundPush(payload) {
  const data = extractData(payload);
  const { severity, message, deepLink } = resolveConfig(data);

  const toastOptions = {};

  // Attach a "View" action that navigates via deep link when available
  if (deepLink) {
    toastOptions.action = {
      label: "View",
      onClick: () => {
        window.location.href = deepLink;
      },
    };
  }

  const store = useToastStore.getState();
  const method = SEVERITY_METHOD[severity] || "info";
  store[method](message, toastOptions);
}

/**
 * Initialise foreground push notification handlers.
 *
 * Registers `handleForegroundPush` as the handler for foreground
 * messages, showing toast notifications for incoming push data.
 *
 * Call once at app bootstrap.
 *
 * @returns {() => void} Cleanup function to unregister the handler
 */
export function initPushHandlers() {
  return onPushReceived(handleForegroundPush);
}
