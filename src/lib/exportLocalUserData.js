// Local "Download My Data" export that works with the backend OFF.
//
// Aggregates the app's known localStorage keys (cart, theme, fleet,
// subscription, warranty, certifications, maintenance) into a single JSON
// file downloaded via Blob + anchor. No npm deps. Auth tokens and secrets
// are deliberately excluded — this exports user data, not credentials.

export const LOCAL_DATA_EXPORT_KEYS = [
  "clutchd_cart",
  "clutchd_theme",
  "theme-storage",
  "clutchd-fleet-store",
  "clutchd-fleet-registration",
  "clutchd-fleet-vehicles",
  "clutchd-fleet-service-history",
  "clutchd-subscription-store",
  "clutchd_subscription",
  "clutchd_warranty_claims",
  "clutchd_certifications",
  "clutchd_certifications_seeded",
  "clutchd_maintenance",
];

function readKey(storage, key) {
  let raw = null;
  try {
    raw = storage.getItem(key);
  } catch {
    return { found: false };
  }
  if (raw === null || raw === undefined) return { found: false };
  try {
    return { found: true, value: JSON.parse(raw) };
  } catch {
    // Non-JSON string value (e.g. plain theme name) — keep it raw.
    return { found: true, value: raw };
  }
}

export function collectLocalUserData(storage) {
  const store =
    storage ?? (typeof window !== "undefined" ? window.localStorage : null);
  const data = {};
  if (!store) return { exportedAt: new Date().toISOString(), data };
  for (const key of LOCAL_DATA_EXPORT_KEYS) {
    const entry = readKey(store, key);
    if (entry.found) data[key] = entry.value;
  }
  return { exportedAt: new Date().toISOString(), data };
}

export function buildLocalUserDataFilename(date = new Date()) {
  const day = date.toISOString().slice(0, 10);
  return `clutchd-my-data_${day}.json`;
}

export function downloadLocalUserData() {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return null;
  }
  const payload = collectLocalUserData(window.localStorage);
  const keys = Object.keys(payload.data);
  if (keys.length === 0) return null;
  const filename = buildLocalUserDataFilename();
  const content = JSON.stringify(payload, null, 2);
  const blob = new Blob([content], { type: "application/json;charset=utf-8" });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  if (link.parentNode) link.parentNode.removeChild(link);
  window.URL.revokeObjectURL(url);
  return { filename, exportedKeys: keys };
}
