let token = null;

export function setAccessToken(newToken) {
  token = newToken;
}

export function getAccessToken() {
  return token;
}

export function clearAccessToken() {
  token = null;
}
