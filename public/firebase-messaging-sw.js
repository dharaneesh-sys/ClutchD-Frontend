// ═══════════════════════════════════════════════════════════════════════
// Firebase Cloud Messaging — Service Worker (Web Push)
//
// Handles background push messages and notification-click interactions
// for the ClutchD app.
//
// IMPORTANT:
//   • This file must be served from the root of the app (public/).
//   • The Firebase SDK is loaded from the CDN (not bundled), because
//     service workers are scoped to their own global context and cannot
//     share modules with the main app bundle.
// ═══════════════════════════════════════════════════════════════════════

// ---- Import Firebase Messaging SW SDK (v11+ compat) ----
// The CDN import is the standard pattern for service-worker FCM.
importScripts(
  "https://www.gstatic.com/firebasejs/11.6.0/firebase-app-compat.js",
);
importScripts(
  "https://www.gstatic.com/firebasejs/11.6.0/firebase-messaging-compat.js",
);

// ---- Firebase initialisation ----
// Config is passed via query params from pushService.registerFcmSw().
const _cfg = Object.fromEntries(
  new URL(self.location.href).searchParams.entries(),
);
// eslint-disable-next-line no-undef
firebase.initializeApp({
  apiKey: _cfg.apiKey || undefined,
  projectId: _cfg.projectId || undefined,
  messagingSenderId: _cfg.senderId || undefined,
  appId: _cfg.appId || undefined,
});

// ---- Messaging instance ----
// eslint-disable-next-line no-undef
const messaging = firebase.messaging();

// ---- Background message handler ----
// Shown when the app is in the background / closed.
messaging.onBackgroundMessage((payload) => {
  const {
    notification = {},
    data = {},
    // eslint-disable-next-line no-undef
  } = /** @type {any} */ (payload);

  /** @type {NotificationOptions} */
  const options = {
    body: notification.body || "",
    icon: notification.icon || "/icon-192.png",
    badge: "/favicon.svg",
    data,
    // Let the 'notificationclick' event handle the navigation
    requireInteraction: true,
  };

  self.registration.showNotification(
    notification.title || "ClutchD",
    options,
  );
});

// ---- Notification click — deep-link navigation ----
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const data = event.notification.data || {};
  const deepLink = data.deepLink || data.url || "/";

  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((windowClients) => {
        // Focus an existing window if one exists
        for (const client of windowClients) {
          if (client.url.startsWith(self.location.origin) && "focus" in client) {
            return client.focus().then((c) => c.navigate(deepLink));
          }
        }
        // Otherwise open a new window/tab
        return clients.openWindow(deepLink);
      }),
  );
});
