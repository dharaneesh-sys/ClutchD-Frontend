// Application-wide constants

export const ROLES = {
  CUSTOMER: "customer",
  MECHANIC: "mechanic",
  GARAGE: "garage",
  ADMIN: "admin",
};

export const SERVICE_STATUS = {
  IDLE: "idle",
  SEARCHING: "searching",
  ASSIGNED: "assigned",
  EN_ROUTE: "en_route",
  IN_PROGRESS: "in_progress",
  PAYMENT_PENDING: "payment_pending",
  COMPLETED: "completed",
};

export const EXPERTISE_OPTIONS = [
  { value: "engine", label: "Engine Repair" },
  { value: "electrical", label: "Electrical Systems" },
  { value: "tires", label: "Tires & Wheels" },
  { value: "brakes", label: "Brake Systems" },
  { value: "transmission", label: "Transmission" },
  { value: "ac", label: "AC & Heating" },
  { value: "bodywork", label: "Body Work" },
  { value: "oil", label: "Oil & Fluids" },
  { value: "battery", label: "Battery Service" },
  { value: "suspension", label: "Suspension" },
  { value: "exhaust", label: "Exhaust System" },
  { value: "diagnostics", label: "Diagnostics" },
];

export const ISSUE_TAGS = [
  { value: "flat_tire", label: "Flat Tire" },
  { value: "engine_failure", label: "Engine Failure" },
  { value: "battery_dead", label: "Dead Battery" },
  { value: "overheating", label: "Overheating" },
  { value: "brake_issue", label: "Brake Issue" },
  { value: "oil_leak", label: "Oil Leak" },
  { value: "electrical", label: "Electrical Problem" },
  { value: "ac_not_working", label: "AC Not Working" },
  { value: "transmission", label: "Transmission Issue" },
  { value: "starting_issue", label: "Won't Start" },
  { value: "noise", label: "Strange Noise" },
  { value: "other", label: "Other" },
];

export const PAYMENT_METHODS = [
  { value: "upi", label: "UPI", icon: "Smartphone" },
  { value: "card", label: "Credit/Debit Card", icon: "CreditCard" },
];

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

// Demo mode flag
export const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE !== "false";

// Build output mode: "standalone" (default) or "export"
export const BUILD_MODE = process.env.NEXT_PUBLIC_BUILD_MODE || "standalone";

function getDefaultWsUrl() {
  if (typeof window === "undefined") {
    return "ws://127.0.0.1:8000/ws";
  }

  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  const hostname = window.location.hostname || "127.0.0.1";
  const port = process.env.NEXT_PUBLIC_WS_PORT || "8000";
  return `${protocol}//${hostname}:${port}/ws`;
}

export const WS_URL = process.env.NEXT_PUBLIC_WS_URL || getDefaultWsUrl();

export const MAP_DEFAULT_CENTER = [11.0168, 76.9558]; // Coimbatore
export const MAP_DEFAULT_ZOOM = 13;

// Fee and pricing constants
export const PLATFORM_FEE_PERCENT = 5;
export const PLATFORM_FEE_FLAT = 40;
export const GST_RATE = 0.18;
export const DISTANCE_FEE_PER_KM = 30;
export const CANCELLATION_FEE = 30;

/**
 * Validate critical environment variables at build/startup time.
 * - Required vars missing  → throws an error (fail fast)
 * - Optional vars missing  → logs a warning with the fallback value
 *
 * Runs only on the server side (including during `next build`).
 */
export function validateEnv() {
  if (typeof window !== "undefined") return; // client-side: skip

  const required = {
    NEXT_PUBLIC_API_URL: API_BASE_URL === "http://localhost:8000/api" ? null : API_BASE_URL,
  };

  const requiredMissing = Object.entries(required).filter(([, v]) => v === null);
  if (requiredMissing.length > 0) {
    throw new Error(
      `[env] Missing required environment variable(s): ${requiredMissing.map(([k]) => k).join(", ")}. ` +
      "Set them in .env.local or in your deployment dashboard."
    );
  }

  const optional = {
    NEXT_PUBLIC_GOOGLE_CLIENT_ID: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || null,
    NEXT_PUBLIC_ACCESS_TTL_MINUTES: process.env.NEXT_PUBLIC_ACCESS_TTL_MINUTES || null,
    NEXT_PUBLIC_DEMO_MODE: process.env.NEXT_PUBLIC_DEMO_MODE || null,
    NEXT_PUBLIC_BUILD_MODE: process.env.NEXT_PUBLIC_BUILD_MODE || null,
  };

  const optionalDefaults = {
    NEXT_PUBLIC_GOOGLE_CLIENT_ID: "(SSO disabled)",
    NEXT_PUBLIC_ACCESS_TTL_MINUTES: "15",
    NEXT_PUBLIC_DEMO_MODE: "true",
    NEXT_PUBLIC_BUILD_MODE: "standalone",
  };

  for (const [key, value] of Object.entries(optional)) {
    if (!value) {
      console.warn(
        `[env] Optional var ${key} is not set — using default "${optionalDefaults[key]}".`
      );
    }
  }
}

validateEnv();

export const FEE_CONSTANTS = {
  PLATFORM_FEE_PERCENT,
  PLATFORM_FEE_FLAT,
  GST_RATE,
  DISTANCE_FEE_PER_KM,
  CANCELLATION_FEE,
};
