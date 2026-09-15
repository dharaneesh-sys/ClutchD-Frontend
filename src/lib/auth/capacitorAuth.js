/**
 * Capacitor-native Google Sign-In via @capacitor-firebase/authentication plugin.
 *
 * Unlike the browser-based Google Identity Services (GIS) flow, this uses the
 * native Android Google Sign-In API which opens a system-level account picker
 * (not a browser popup). This is required inside Capacitor WebView where
 * browser popups are blocked and OAuth redirect URIs don't match.
 *
 * With skipNativeAuth: true, the plugin only returns the Google credential
 * (idToken). That idToken must be verified by OUR backend (POST /auth/oauth/google)
 * — a local Firebase sign-in alone can never call the real API.
 */
import { FirebaseAuthentication } from "@capacitor-firebase/authentication";

/**
 * Sign in with Google via the native Android system dialog (account picker).
 * Returns the Google idToken on success, or null if the user cancelled.
 * The idToken is meant to be sent to the backend's /auth/oauth/google endpoint.
 *
 * Always signs out of any cached Google session first — otherwise Credential
 * Manager silently reuses the previously chosen account and the picker never
 * shows (the "it signs in without asking" bug).
 */
export async function getGoogleIdTokenNative() {
  try {
    // Clear any cached credential so the account picker is always shown.
    try {
      await FirebaseAuthentication.signOut();
    } catch {
      // No cached session — fine.
    }
    const result = await FirebaseAuthentication.signInWithGoogle({
      useCredentialManager: false,
    });
    const credential = result.credential;
    if (!credential?.idToken) return null;
    return credential.idToken;
  } catch (error) {
    if (error.code === "CANCELED" || error.code === "auth/user-cancelled") {
      return null;
    }
    throw error;
  }
}

/**
 * @deprecated Legacy local-only flow — kept only for reference. Local Firebase
 * sessions cannot call the real API; use getGoogleIdTokenNative + backend
 * /auth/oauth/google instead.
 */
export async function signInWithGoogleNative() {
  const idToken = await getGoogleIdTokenNative();
  if (!idToken) return null;
  const { signInWithGoogleCredential } = await import("@/lib/auth/firebaseAuth");
  return await signInWithGoogleCredential(idToken);
}
