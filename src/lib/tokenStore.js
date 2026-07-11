

let token = null;
let tokenExpiresAt = 0;



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


