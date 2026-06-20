let token = null;
let tokenExpiresAt = 0;

const DEMO_TOKEN_TTL_MS = 60 * 60 * 1000;

export function setAccessToken(newToken, ttlMs) {
  token = newToken;
  tokenExpiresAt = ttlMs ? Date.now() + ttlMs : 0;
}

export function getAccessToken() {
  if (tokenExpiresAt && Date.now() >= tokenExpiresAt) {
    token = null;
    tokenExpiresAt = 0;
    return null;
  }
  return token;
}

export function clearAccessToken() {
  token = null;
  tokenExpiresAt = 0;
}

export function setDemoAccessToken(newToken) {
  setAccessToken(newToken, DEMO_TOKEN_TTL_MS);
}

export function refreshDemoToken() {
  if (token && tokenExpiresAt && Date.now() >= tokenExpiresAt - DEMO_TOKEN_TTL_MS * 0.2) {
    tokenExpiresAt = Date.now() + DEMO_TOKEN_TTL_MS;
  }
}
