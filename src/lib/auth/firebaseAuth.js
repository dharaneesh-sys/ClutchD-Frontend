import { getAuth, signInWithPopup, GoogleAuthProvider, signInWithCredential } from "firebase/auth";
import { initFirebase } from "@/lib/push/firebase";

/**
 * Sign in with Google using an existing Google ID token (credential).
 *
 * Uses signInWithCredential to authenticate with Firebase without opening
 * a popup — the GSI button already returned the credential.
 *
 * Returns { uid, displayName, email, photoURL } on success.
 * Throws on error — caller is responsible for catching.
 */
export async function signInWithGoogleCredential(googleIdToken) {
  const app = initFirebase();
  if (!app) {
    if (process.env.NODE_ENV === "development") {
      console.warn(
        "[firebaseAuth] Firebase app not initialised — missing env vars",
      );
    }
    return null;
  }

  const auth = getAuth(app);
  const credential = GoogleAuthProvider.credential(googleIdToken);

  try {
    const result = await signInWithCredential(auth, credential);
    const user = result.user;
    return {
      uid: user.uid,
      displayName: user.displayName,
      email: user.email,
      photoURL: user.photoURL,
    };
  } catch (error) {
    // Re-throw so the caller can surface a meaningful message
    throw error;
  }
}

/**
 * Sign in with Google via Firebase Auth popup.
 *
 * Reuses the Firebase app instance from @/lib/push/firebase (Task 1).
 * Returns { uid, displayName, email, photoURL } on success.
 * Returns null when the user closes the popup (graceful handling of
 * auth/popup-closed-by-user).
 * Throws for other errors — caller is responsible for catching.
 */
export async function signInWithGoogle() {
  const app = initFirebase();
  if (!app) {
    if (process.env.NODE_ENV === "development") {
      console.warn(
        "[firebaseAuth] Firebase app not initialised — missing env vars",
      );
    }
    return null;
  }

  const auth = getAuth(app);
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });

  try {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;
    return {
      uid: user.uid,
      displayName: user.displayName,
      email: user.email,
      photoURL: user.photoURL,
    };
  } catch (error) {
    if (error.code === "auth/popup-closed-by-user") {
      return null;
    }
    // Re-throw other errors so the caller can surface a meaningful message
    throw error;
  }
}
