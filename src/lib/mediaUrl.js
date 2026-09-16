import { API_BASE_URL } from "@/lib/constants";

/**
 * Resolve a backend-served media URL to an absolute URL.
 *
 * The backend returns relative paths for uploaded files (e.g.
 * "/static/uploads/abc.jpg"). In a browser those resolve against the page
 * origin and happen to work; inside the Capacitor APK the document origin is
 * https://localhost, so every relative image silently failed to load and fell
 * back to placeholders. This helper prefixes the API origin (same host the
 * app already talks to) unless the value is already absolute or a data/blob
 * URI.
 *
 * @param {string|null|undefined} url - Image URL from the backend, or null.
 * @returns {string|null} Absolute URL, or null when input is empty.
 */
export function resolveMediaUrl(url) {
  if (!url || typeof url !== "string") return null;
  if (/^(https?:\/\/|data:|blob:)/i.test(url)) return url;
  const origin = API_BASE_URL.replace(/\/api\/?$/, "");
  return `${origin}${url.startsWith("/") ? "" : "/"}${url}`;
}
