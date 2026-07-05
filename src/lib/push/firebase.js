import { initializeApp, getApps, getApp } from "firebase/app";
import { getMessaging, isSupported } from "firebase/messaging";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

let app = null;
let messaging = null;

/** Initialise Firebase app (singleton). Returns null if env vars are missing. */
export function initFirebase() {
  if (app) return app;

  if (
    !firebaseConfig.apiKey ||
    !firebaseConfig.projectId ||
    !firebaseConfig.messagingSenderId ||
    !firebaseConfig.appId ||
    !firebaseConfig.authDomain
  ) {
    if (process.env.NODE_ENV === "development") {
      console.warn(
        "[firebase] Missing FCM env vars — push notifications disabled",
      );
    }
    return null;
  }

  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
  return app;
}

/** Get the Firebase Messaging instance (lazy, after init). */
export async function getMessagingInstance() {
  if (messaging) return messaging;

  const firebaseApp = initFirebase();
  if (!firebaseApp) return null;

  const supported = await isSupported();
  if (!supported) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[firebase] Firebase Messaging not supported in this env");
    }
    return null;
  }

  messaging = getMessaging(firebaseApp);
  return messaging;
}
