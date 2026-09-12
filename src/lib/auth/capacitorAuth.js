/**
 * Capacitor-native Google Sign-In via @capacitor-firebase/authentication plugin.
 *
 * Unlike the browser-based Google Identity Services (GIS) flow, this uses the
 * native Android Google Sign-In API which opens a system-level account picker
 * (not a browser popup). This is required inside Capacitor WebView where
 * browser popups are blocked and OAuth redirect URIs don't match.
 *
 * With skipNativeAuth: true, the plugin only returns the Google credential
 * (idToken). The actual Firebase Auth sign-in is done via the Firebase Web
 * SDK (signInWithCredential) using the web app config (env vars), bypassing
 * the native OAuth client configuration entirely.
 */
import { FirebaseAuthentication } from "@capacitor-firebase/authentication";

/**
 * Sign in with Google via the Capacitor native plugin.
 * Opens a native Android system dialog (account picker), NOT a browser popup.
 * Returns the Firebase user on success or null if cancelled.
 */
export async function signInWithGoogleNative() {
  try {
    const result = await FirebaseAuthentication.signInWithGoogle({
      useCredentialManager: false,
    });
    const credential = result.credential;
    if (!credential?.idToken) return null;

    // Complete sign-in via Firebase Web SDK using the ID token from native
    const { signInWithGoogleCredential } = await import(
      "@/lib/auth/firebaseAuth"
    );
    return await signInWithGoogleCredential(credential.idToken);
  } catch (error) {
    if (error.code === "CANCELED" || error.code === "auth/user-cancelled") {
      return null;
    }
    throw error;
  }
}
