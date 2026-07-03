import { getToken, deleteToken, onMessage } from "firebase/messaging";
import { PushNotifications } from "@capacitor/push-notifications";
import { getMessagingInstance } from "./firebase.js";
import { isPlatform } from "../utils.js";

// ── Types ────────────────────────────────────────────────────────────
/**
 * @typedef {import("firebase/messaging").MessagePayload} MessagePayload
 * @typedef {(payload: MessagePayload) => void} PushHandler
 */

// ── Module state ──────────────────────────────────────────────────────
/** @type {Set<PushHandler>} */
const foregroundHandlers = new Set();
let foregroundCleanup = null;

// ── Web helpers ───────────────────────────────────────────────────────

/**
 * Request browser notification permission.
 * @returns {Promise<boolean>} true if granted
 */
async function requestWebPermission() {
  if (typeof Notification === "undefined") return false;

  const result = await Notification.requestPermission();
  return result === "granted";
}

/**
 * Register for push on web via FCM.
 * @returns {Promise<string|null>} FCM token or null
 */
async function registerWeb() {
  const granted = await requestWebPermission();
  if (!granted) return null;

  const messaging = await getMessagingInstance();
  if (!messaging) return null;

  const currentToken = await getToken(messaging, {
    vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
  });

  if (!currentToken) {
    console.warn("[push] No FCM registration token available");
    return null;
  }

  return currentToken;
}

/**
 * Unregister from push on web.
 * @param {string} token
 */
async function unregisterWeb(token) {
  const messaging = await getMessagingInstance();
  if (!messaging) return;

  try {
    await deleteToken(messaging);
  } catch (err) {
    console.warn("[push] Failed to delete web push token:", err);
  }
}

// ── Capacitor (mobile) helpers ────────────────────────────────────────

/**
 * Register for push on mobile via Capacitor PushNotifications plugin.
 * @returns {Promise<string|null>} push token or null
 */
async function registerCapacitor() {
  const permResult = await PushNotifications.requestPermissions();
  if (permResult.receive !== "granted") return null;

  await PushNotifications.register();

  return new Promise((resolve) => {
    const handler = (/** @type {any} */ result) => {
      PushNotifications.removeAllListeners();
      const token = result.value ?? null;
      resolve(token);
    };
    PushNotifications.addListener("registration", handler);
    // timeout after 10 s to avoid hanging
    setTimeout(() => {
      PushNotifications.removeAllListeners();
      resolve(null);
    }, 10_000);
  });
}

/**
 * Unregister from push on mobile.
 */
async function unregisterCapacitor() {
  try {
    await PushNotifications.unregister();
  } catch (err) {
    console.warn("[push] Failed to unregister Capacitor push:", err);
  }
}

// ── Public API ────────────────────────────────────────────────────────

/**
 * Register the FCM service worker (web only).
 * Called once during `registerForPush` — safe to call multiple times.
 */
async function registerFcmSw() {
  if (typeof navigator === "undefined") return;
  if (!("serviceWorker" in navigator)) return;

  try {
    const registration = await navigator.serviceWorker.register(
      "/firebase-messaging-sw.js",
      { scope: "/" },
    );
    if (process.env.NODE_ENV === "development") {
      console.log("[push] FCM SW registered:", registration.scope);
    }
  } catch (err) {
    console.warn("[push] FCM SW registration failed:", err);
  }
}

/**
 * Register this device for push notifications.
 *
 * - **Web**: requests browser permission, registers the FCM service worker,
 *   gets an FCM token.
 * - **Mobile (Capacitor)**: requests platform permission, registers via
 *   Capacitor PushNotifications plugin.
 *
 * @returns {Promise<string|null>} FCM / push token, or null if denied/error
 */
export async function registerForPush() {
  try {
    if (isPlatform("capacitor")) {
      return await registerCapacitor();
    }
    // Register the FCM service worker before requesting a token
    await registerFcmSw();
    return await registerWeb();
  } catch (err) {
    console.error("[push] registerForPush failed:", err);
    return null;
  }
}

/**
 * Unregister this device from push notifications.
 *
 * @param {string} [token] — FCM token (web); ignored for Capacitor
 */
export async function unregisterPush(token) {
  try {
    if (isPlatform("capacitor")) {
      await unregisterCapacitor();
    } else if (token) {
      await unregisterWeb(token);
    }
  } catch (err) {
    console.error("[push] unregisterPush failed:", err);
  }
}

/**
 * Register a handler for foreground push messages.
 *
 * On **web** this listens to `onMessage` from Firebase Messaging.
 * On **mobile** it listens to `pushNotificationReceived` from Capacitor.
 *
 * Returns an unsubscribe function.
 *
 * @param {PushHandler} handler
 * @returns {() => void} unsubscribe
 */
export function onPushReceived(handler) {
  foregroundHandlers.add(handler);

  // Wire foreground listener once
  if (!foregroundCleanup && typeof window !== "undefined") {
    if (isPlatform("capacitor")) {
      PushNotifications.addListener(
        "pushNotificationReceived",
        (notification) => {
          for (const h of foregroundHandlers) h(notification);
        },
      );
    } else {
      getMessagingInstance().then((messaging) => {
        if (!messaging) return;
        foregroundCleanup = onMessage(messaging, (payload) => {
          for (const h of foregroundHandlers) h(payload);
        });
      });
    }
  }

  return () => {
    foregroundHandlers.delete(handler);
  };
}

/**
 * Set up all push notification listeners (foreground + background).
 *
 * Call once at app bootstrap.
 *
 * @returns {Promise<() => void>} — a cleanup function to tear down listeners
 */
export async function setupPushListeners() {
  if (isPlatform("capacitor")) {
    // Foreground: handled by onPushReceived above
    // Background: handled by the OS / Capacitor automatically
    // Register listeners for notification tap actions
    await PushNotifications.addListener(
      "pushNotificationActionPerformed",
      (action) => {
        const data = action.notification.data;
        if (data?.deepLink) {
          window.location.href = data.deepLink;
        }
      },
    );
  }

  // Return a no-op cleanup — individual handlers manage their own lifecycle
  return () => {
    if (foregroundCleanup) {
      foregroundCleanup();
      foregroundCleanup = null;
    }
    foregroundHandlers.clear();
  };
}
