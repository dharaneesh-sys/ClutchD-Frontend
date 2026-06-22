import { describe, it, expect } from "vitest";
import {
  ROLES,
  SERVICE_STATUS,
  EXPERTISE_OPTIONS,
  ISSUE_TAGS,
  PAYMENT_METHODS,
  API_BASE_URL,
  WS_URL,
  DEMO_MODE,
  BUILD_MODE,
  MAP_DEFAULT_CENTER,
  MAP_DEFAULT_ZOOM,
  PLATFORM_FEE_PERCENT,
  PLATFORM_FEE_FLAT,
  GST_RATE,
  DISTANCE_FEE_PER_KM,
  CANCELLATION_FEE,
  FEE_CONSTANTS,
} from "../constants";

// ---------------------------------------------------------------------------
// ROLES
// ---------------------------------------------------------------------------
describe("ROLES", () => {
  it("has all expected roles", () => {
    expect(ROLES).toEqual({
      CUSTOMER: "customer",
      MECHANIC: "mechanic",
      GARAGE: "garage",
      ADMIN: "admin",
    });
  });
});

// ---------------------------------------------------------------------------
// SERVICE_STATUS
// ---------------------------------------------------------------------------
describe("SERVICE_STATUS", () => {
  it("has all expected status values", () => {
    expect(SERVICE_STATUS).toEqual({
      IDLE: "idle",
      SEARCHING: "searching",
      ASSIGNED: "assigned",
      EN_ROUTE: "en_route",
      IN_PROGRESS: "in_progress",
      PAYMENT_PENDING: "payment_pending",
      COMPLETED: "completed",
    });
  });
});

// ---------------------------------------------------------------------------
// EXPERTISE_OPTIONS
// ---------------------------------------------------------------------------
describe("EXPERTISE_OPTIONS", () => {
  it("is an array of { value, label } objects", () => {
    expect(Array.isArray(EXPERTISE_OPTIONS)).toBe(true);
    expect(EXPERTISE_OPTIONS.length).toBeGreaterThan(0);
    EXPERTISE_OPTIONS.forEach((opt) => {
      expect(opt).toHaveProperty("value");
      expect(opt).toHaveProperty("label");
      expect(typeof opt.value).toBe("string");
      expect(typeof opt.label).toBe("string");
    });
  });

  it("includes common expertise entries", () => {
    const values = EXPERTISE_OPTIONS.map((o) => o.value);
    expect(values).toContain("engine");
    expect(values).toContain("brakes");
    expect(values).toContain("electrical");
    expect(values).toContain("transmission");
  });
});

// ---------------------------------------------------------------------------
// ISSUE_TAGS
// ---------------------------------------------------------------------------
describe("ISSUE_TAGS", () => {
  it("is an array of { value, label } objects", () => {
    expect(Array.isArray(ISSUE_TAGS)).toBe(true);
    expect(ISSUE_TAGS.length).toBeGreaterThan(0);
    ISSUE_TAGS.forEach((tag) => {
      expect(tag).toHaveProperty("value");
      expect(tag).toHaveProperty("label");
    });
  });

  it("includes common issue tags", () => {
    const values = ISSUE_TAGS.map((t) => t.value);
    expect(values).toContain("flat_tire");
    expect(values).toContain("engine_failure");
    expect(values).toContain("other");
  });
});

// ---------------------------------------------------------------------------
// PAYMENT_METHODS
// ---------------------------------------------------------------------------
describe("PAYMENT_METHODS", () => {
  it("has UPI and card options", () => {
    const values = PAYMENT_METHODS.map((p) => p.value);
    expect(values).toContain("upi");
    expect(values).toContain("card");
  });

  it("each method has value, label, and icon", () => {
    PAYMENT_METHODS.forEach((m) => {
      expect(m).toHaveProperty("value");
      expect(m).toHaveProperty("label");
      expect(m).toHaveProperty("icon");
    });
  });
});

// ---------------------------------------------------------------------------
// API_BASE_URL
// ---------------------------------------------------------------------------
describe("API_BASE_URL", () => {
  it("defaults to localhost:8000/api", () => {
    expect(API_BASE_URL).toBe("http://localhost:8000/api");
  });

  it("is a string", () => {
    expect(typeof API_BASE_URL).toBe("string");
  });
});

// ---------------------------------------------------------------------------
// WS_URL (client-side test)
// ---------------------------------------------------------------------------
describe("WS_URL", () => {
  it("is a string starting with ws:// or wss://", () => {
    expect(WS_URL).toMatch(/^wss?:\/\//);
  });

  it("includes /ws path", () => {
    expect(WS_URL).toContain("/ws");
  });
});

// ---------------------------------------------------------------------------
// DEMO_MODE / BUILD_MODE
// ---------------------------------------------------------------------------
describe("DEMO_MODE", () => {
  it("defaults to true since NEXT_PUBLIC_DEMO_MODE is not 'false'", () => {
    // In test env without explicit env var, DEMO_MODE = true
    // because the code does: process.env.NEXT_PUBLIC_DEMO_MODE !== "false"
    expect(DEMO_MODE).toBe(true);
  });
});

describe("BUILD_MODE", () => {
  it("defaults to 'standalone'", () => {
    expect(BUILD_MODE).toBe("standalone");
  });
});

// ---------------------------------------------------------------------------
// Map defaults
// ---------------------------------------------------------------------------
describe("MAP_DEFAULT_CENTER", () => {
  it("is Coimbatore coordinates", () => {
    expect(Array.isArray(MAP_DEFAULT_CENTER)).toBe(true);
    expect(MAP_DEFAULT_CENTER).toEqual([11.0168, 76.9558]);
  });
});

describe("MAP_DEFAULT_ZOOM", () => {
  it("is 13", () => {
    expect(MAP_DEFAULT_ZOOM).toBe(13);
  });
});

// ---------------------------------------------------------------------------
// Fee / pricing constants
// ---------------------------------------------------------------------------
describe("Fee constants", () => {
  it("PLATFORM_FEE_PERCENT is 5", () => {
    expect(PLATFORM_FEE_PERCENT).toBe(5);
  });

  it("PLATFORM_FEE_FLAT is 40", () => {
    expect(PLATFORM_FEE_FLAT).toBe(40);
  });

  it("GST_RATE is 0.18", () => {
    expect(GST_RATE).toBe(0.18);
  });

  it("DISTANCE_FEE_PER_KM is 30", () => {
    expect(DISTANCE_FEE_PER_KM).toBe(30);
  });

  it("CANCELLATION_FEE is 30", () => {
    expect(CANCELLATION_FEE).toBe(30);
  });
});

// ---------------------------------------------------------------------------
// FEE_CONSTANTS
// ---------------------------------------------------------------------------
describe("FEE_CONSTANTS", () => {
  it("bundles all fee constants", () => {
    expect(FEE_CONSTANTS).toEqual({
      PLATFORM_FEE_PERCENT: 5,
      PLATFORM_FEE_FLAT: 40,
      GST_RATE: 0.18,
      DISTANCE_FEE_PER_KM: 30,
      CANCELLATION_FEE: 30,
    });
  });
});
