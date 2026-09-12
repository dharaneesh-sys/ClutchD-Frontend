const STORAGE_KEY = "clutchd_access_token";
const EXPIRY_KEY = "clutchd_token_expires_at";

// When false, the token lives in sessionStorage only (Remember Me unchecked).
// When true (default), it persists in localStorage across restarts.
let persistToLocal = true;

let token = null;
let tokenExpiresAt = 0;
// Restore from localStorage on module load (survives page refresh)
// Restore from storage on module load (survives page refresh).
// Prefer localStorage (remembered session), fall back to sessionStorage (tab session).
if (typeof window !== "undefined") {
  try {
    const saved =
      localStorage.getItem(STORAGE_KEY) || sessionStorage.getItem(STORAGE_KEY);
    const savedExpiry =
      localStorage.getItem(EXPIRY_KEY) || sessionStorage.getItem(EXPIRY_KEY);
    if (saved && savedExpiry) {
      const expiry = parseInt(savedExpiry, 10);
      if (Date.now() < expiry) {
        token = saved;
        tokenExpiresAt = expiry;
      } else {
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(EXPIRY_KEY);
        sessionStorage.removeItem(STORAGE_KEY);
        sessionStorage.removeItem(EXPIRY_KEY);
      }
    }
  } catch (e) {
    // storage unavailable — degrade gracefully
  }
}

function persist() {
  if (typeof window === "undefined") return;
  try {
    if (token && tokenExpiresAt) {
      // Tab session always mirrors the token so Remember-Me-off survives reloads.
      sessionStorage.setItem(STORAGE_KEY, token);
      sessionStorage.setItem(EXPIRY_KEY, String(tokenExpiresAt));
      if (persistToLocal) {
        localStorage.setItem(STORAGE_KEY, token);
        localStorage.setItem(EXPIRY_KEY, String(tokenExpiresAt));
      } else {
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(EXPIRY_KEY);
      }
    } else {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(EXPIRY_KEY);
      sessionStorage.removeItem(STORAGE_KEY);
      sessionStorage.removeItem(EXPIRY_KEY);
    }
  } catch (e) {
    // storage unavailable — degrade gracefully
  }
}

/**
 * Switch token persistence between localStorage (remembered) and
 * sessionStorage-only (this tab). Called from authStore.setRememberMe and
 * on every successful login/signup so the mode always matches the choice.
 */
export function setTokenPersistMode(remember) {
  persistToLocal = remember !== false;
  persist();
}

export function setAccessToken(newToken, ttlMs) {
  token = newToken;
  tokenExpiresAt = ttlMs ? Date.now() + ttlMs : 0;
  persist();
}

export function getAccessToken() {
  if (tokenExpiresAt && Date.now() >= tokenExpiresAt) {
    token = null;
    tokenExpiresAt = 0;
    persist();
    return null;
  }
  return token;
}

export function clearAccessToken() {
  token = null;
  tokenExpiresAt = 0;
  persist();
}


