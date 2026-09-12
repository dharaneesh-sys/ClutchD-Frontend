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
  PAYMENT_ESCROW: "payment_escrow",
  PAYMENT_RELEASED: "payment_released",
  PAYMENT_DISPUTE: "payment_dispute",
  COMPLETED: "completed",
};

/**
 * Escrow-specific sub-states for the payment escrow lifecycle.
 * @type {Object<string, string>}
 */
export const ESCROW_STATUS = {
  PAYMENT_ESCROW: "payment_escrow",
  PAYMENT_RELEASED: "payment_released",
  PAYMENT_DISPUTE: "payment_dispute",
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

  const isCapacitor = window.Capacitor || window.__CAPACITOR__;
  if (isCapacitor) {
    // In Capacitor, always use secure WebSocket with the backend host from API_BASE_URL
    const apiUrl = new URL(API_BASE_URL);
    return `wss://${apiUrl.host}/ws`;
  }

  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  return `${protocol}//${window.location.host}/ws`;
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

/**
 * Product categories for the marketplace.
 * Curated to 2 tiles: Accessories + Spare Parts (consolidated group for all
 * non-accessory replacement parts: engine, brake, electrical, suspension, filters).
 * @type {Array<{value: string, label: string, icon: string, description: string}>}
 */
export const PRODUCT_CATEGORIES = [
  { value: "accessories", label: "Accessories", icon: "Package", description: "Car care products, floor mats, covers, and interior accessories" },
  { value: "spare-parts", label: "Spare Parts", icon: "Wrench", description: "Engine, brake, electrical, suspension, filters and other replacement parts" },
];

/**
 * Predefined price range filter options.
 * @type {Array<{value: string, label: string}>}
 */
export const PRICE_RANGES = [
  { value: "0-500", label: "₹0 - ₹500" },
  { value: "500-1000", label: "₹500 - ₹1000" },
  { value: "1000-2000", label: "₹1000 - ₹2000" },
  { value: "2000+", label: "₹2000+" },
];

/**
 * Auto parts brand filter options.
 * @type {Array<{value: string, label: string}>}
 */
export const BRANDS = [
  { value: "bosch", label: "Bosch" },
  { value: "valeo", label: "Valeo" },
  { value: "ngk", label: "NGK" },
  { value: "denso", label: "Denso" },
  { value: "mico", label: "MICO" },
  { value: "tvs", label: "TVS" },
];

/**
 * Estimated delivery time filter options.
 * @type {Array<{value: string, label: string}>}
 */
export const DELIVERY_TIMES = [
  { value: "same-day", label: "Same Day" },
  { value: "1-day", label: "1 Day" },
  { value: "2-3-days", label: "2-3 Days" },
];

/**
 * Subscription plan definitions.
 * @type {Array<{id: string, name: string, price: number, period: string, features: string[], badge: string|null}>}
 */
export const SUBSCRIPTION_PLANS = [
  {
    id: "free",
    name: "Free",
    price: 0,
    period: "month",
    features: [
      "Basic service requests",
      "Standard support",
      "Real-time mechanic tracking",
      "Service history access",
    ],
    badge: null,
  },
  {
    id: "plus",
    name: "Plus",
    price: 499,
    period: "month",
    features: [
      "Priority dispatch",
      "24/7 customer support",
      "5% service discount",
      "All Free features",
    ],
    badge: "Popular",
  },
  {
    id: "pro",
    name: "Pro",
    price: 999,
    period: "month",
    features: [
      "Free annual vehicle inspection",
      "30% parts discount",
      "Priority dispatch",
      "24/7 customer support",
      "5% service discount",
      "All Plus features",
    ],
    badge: "Best Value",
  },
];

/**
 * Marketplace product sort options.
 * @type {Array<{value: string, label: string}>}
 */
export const SORT_OPTIONS = [
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
  { value: "rating", label: "Rating" },
  { value: "popularity", label: "Popularity" },
];

/**
 * Order status display labels for the marketplace.
 * @type {Object<string, string>}
 */
export const ORDER_STATUSES = {
  pending: "Pending",
  confirmed: "Confirmed",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

/**
 * Fleet/B2B service types with base pricing.
 * @type {Array<{value: string, label: string, basePrice: number}>}
 */
export const FLEET_SERVICE_TYPES = [
  { value: "general_service", label: "General Service", basePrice: 2500 },
  { value: "oil_change", label: "Oil Change", basePrice: 1800 },
  { value: "brake_inspection", label: "Brake Inspection", basePrice: 800 },
  { value: "brake_repair", label: "Brake Repair", basePrice: 3500 },
  { value: "tire_rotation", label: "Tire Rotation", basePrice: 600 },
  { value: "engine_diagnostic", label: "Engine Diagnostic", basePrice: 1500 },
  { value: "ac_service", label: "AC Service", basePrice: 2800 },
  { value: "transmission_check", label: "Transmission Check", basePrice: 2000 },
  { value: "battery_check", label: "Battery Check", basePrice: 500 },
  { value: "full_inspection", label: "Full Inspection", basePrice: 4000 },
];

/**
 * Bulk discount tiers for fleet/B2B volume bookings.
 * @type {Array<{minVehicles: number, discountPercent: number, label: string}>}
 */
export const BULK_DISCOUNT_TIERS = [
  { minVehicles: 0, discountPercent: 0, label: "Standard" },
  { minVehicles: 3, discountPercent: 5, label: "3+ Fleet" },
  { minVehicles: 5, discountPercent: 10, label: "5+ Fleet" },
  { minVehicles: 10, discountPercent: 15, label: "10+ Fleet" },
  { minVehicles: 20, discountPercent: 20, label: "20+ Fleet" },
];
