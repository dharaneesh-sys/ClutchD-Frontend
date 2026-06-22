/**
 * CSP-safe SVG marker system for Leaflet map.
 * Replaces raw.githubusercontent.com PNG markers with inline SVGs.
 * No external image dependencies — conforms to strict CSP.
 */

import L from "leaflet";

// ─── Color palette ──────────────────────────────────────────────────────────
const COLORS = {
  blue:   { fill: "#3b82f6", stroke: "#2563eb", glow: "rgba(59, 130, 246, 0.35)" },
  red:    { fill: "#ef4444", stroke: "#dc2626", glow: "rgba(239, 68, 68, 0.35)" },
  green:  { fill: "#22c55e", stroke: "#16a34a", glow: "rgba(34, 197, 94, 0.35)" },
  violet: { fill: "#8b5cf6", stroke: "#7c3aed", glow: "rgba(139, 92, 246, 0.35)" },
  orange: { fill: "#f59e0b", stroke: "#d97706", glow: "rgba(245, 158, 11, 0.35)" },
  emerald:{ fill: "#10b981", stroke: "#059669", glow: "rgba(16, 185, 129, 0.35)" },
};

// ─── Teardrop pin SVG generator ─────────────────────────────────────────────
function pinSVG(colorKey, innerHTML = "") {
  const c = COLORS[colorKey] || COLORS.emerald;
  const accent = colorKey === "blue"   ? "white" :
                 colorKey === "red"    ? "white" :
                 colorKey === "green"  ? "white" :
                 colorKey === "violet" ? "white" :
                 colorKey === "orange" ? "#1c1917" : "white";
  return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 44" width="28" height="44">
      <defs>
        <filter id="pin-shadow-${colorKey}" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="2.5" flood-color="rgba(0,0,0,0.4)"/>
        </filter>
      </defs>
      <path d="M14 0C6.8 0 1 5.8 1 13c0 9.5 13 29 13 29s13-19.5 13-29C27 5.8 21.2 0 14 0z"
            fill="${c.fill}" stroke="${c.stroke}" stroke-width="1.5"
            filter="url(#pin-shadow-${colorKey})"/>
      <circle cx="14" cy="13" r="8" fill="${accent}" opacity="0.9"/>
      ${innerHTML}
    </svg>
  `;
}

// ─── User-location dot (pulsing, circular) ──────────────────────────────────
function userDotSVG() {
  return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 36" width="36" height="36">
      <defs>
        <filter id="user-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2" result="blur"/>
          <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>
      <circle cx="18" cy="18" r="16" fill="rgba(59,130,246,0.15)" stroke="rgba(59,130,246,0.3)" stroke-width="1.5"/>
      <circle cx="18" cy="18" r="10" fill="#3b82f6" filter="url(#user-glow)"/>
      <circle cx="18" cy="18" r="4" fill="white"/>
    </svg>
  `;
}

// ─── Inner icon fragments ───────────────────────────────────────────────────
function wrenchIcon(color) {
  return `
    <g transform="translate(9, 9)" fill="${color}">
      <path d="M3.5 0L6.5 3l-1.5 1.5L5 5l1.5-1.5L9 6.5 7.5 8l1 1 2-2L6.5 2 8 .5 5.5-2z" transform="rotate(45 4.5 4)"/>
    </g>
  `;
}

function gearIcon(color) {
  return `
    <g transform="translate(8, 8)" fill="${color}">
      <path d="M4 0C2.5 0 1.5 1 1.5 2.5S2.5 5 4 5s2.5-1 2.5-2.5S5.5 0 4 0z"/>
      <path d="M4 1c-.8 0-1.5.7-1.5 1.5S3.2 4 4 4s1.5-.7 1.5-1.5S4.8 1 4 1z"/>
      <path d="M2 2h4M3 1l1-1M5 1l-1-1M2 4l1 1M5 4l-1 1" stroke="${color}" stroke-width="0.8"/>
    </g>
  `;
}

function buildingIcon(color) {
  return `
    <g transform="translate(10, 8)" fill="${color}">
      <rect x="0" y="3" width="8" height="7" rx="0.5"/>
      <rect x="1" y="0" width="6" height="4" rx="0.5"/>
      <rect x="2" y="4.5" width="1.5" height="2" rx="0.3"/>
      <rect x="4.5" y="4.5" width="1.5" height="2" rx="0.3"/>
      <rect x="2" y="7.5" width="1.5" height="2" rx="0.3"/>
      <rect x="4.5" y="7.5" width="1.5" height="2" rx="0.3"/>
    </g>
  `;
}

function targetIcon(color) {
  return `
    <g transform="translate(9, 9)" fill="none" stroke="${color}" stroke-width="1.2">
      <circle cx="5" cy="5" r="4.5"/>
      <circle cx="5" cy="5" r="2.5"/>
      <circle cx="5" cy="5" r="0.8" fill="${color}"/>
      <line x1="5" y1="0" x2="5" y2="1.5"/>
      <line x1="5" y1="8.5" x2="5" y2="10"/>
      <line x1="0" y1="5" x2="1.5" y2="5"/>
      <line x1="8.5" y1="5" x2="10" y2="5"/>
    </g>
  `;
}

// ─── Exported marker factories ──────────────────────────────────────────────

/** User's current location — pulsing blue dot */
export function createUserLocationIcon() {
  return L.divIcon({
    className: "marker-user-location",
    html: userDotSVG(),
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -10],
  });
}

/** Mechanic actively en-route to the user — red pin */
export function createMechanicIcon() {
  return L.divIcon({
    className: "marker-custom",
    html: pinSVG("red", wrenchIcon("white")),
    iconSize: [28, 44],
    iconAnchor: [14, 44],
    popupAnchor: [0, -44],
  });
}

/** Nearby available mechanic — green pin */
export function createNearbyMechanicIcon() {
  return L.divIcon({
    className: "marker-custom",
    html: pinSVG("green", gearIcon("white")),
    iconSize: [28, 44],
    iconAnchor: [14, 44],
    popupAnchor: [0, -44],
  });
}

/** Garage / workshop — violet pin */
export function createGarageIcon() {
  return L.divIcon({
    className: "marker-custom",
    html: pinSVG("violet", buildingIcon("white")),
    iconSize: [28, 44],
    iconAnchor: [14, 44],
    popupAnchor: [0, -44],
  });
}

/** Navigation target (customer location) — orange pin */
export function createTargetIcon() {
  return L.divIcon({
    className: "marker-custom",
    html: pinSVG("orange", targetIcon("#1c1917")),
    iconSize: [28, 44],
    iconAnchor: [14, 44],
    popupAnchor: [0, -44],
  });
}

/**
 * Generic marker by type — convenience getter.
 * @param {"user"|"mechanic"|"nearby_mechanic"|"garage"|"target"} type
 */
export function getMarkerIcon(type) {
  switch (type) {
    case "user":              return createUserLocationIcon();
    case "mechanic":          return createMechanicIcon();
    case "nearby_mechanic":   return createNearbyMechanicIcon();
    case "garage":            return createGarageIcon();
    case "target":            return createTargetIcon();
    default:                  return createNearbyMechanicIcon();
  }
}
