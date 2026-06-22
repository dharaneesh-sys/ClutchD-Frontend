import { describe, it, expect } from "vitest";
import {
  cn,
  formatCurrency,
  formatDate,
  formatTime,
  getInitials,
  estimatePrice,
  generateId,
} from "../utils";

// ---------------------------------------------------------------------------
// cn
// ---------------------------------------------------------------------------
describe("cn", () => {
  it("joins truthy class names", () => {
    expect(cn("a", "b", "c")).toBe("a b c");
  });

  it("filters out falsy values", () => {
    expect(cn("a", false, undefined, null, "", "b")).toBe("a b");
  });

  it("returns empty string for all falsy", () => {
    expect(cn(false, null, undefined, "")).toBe("");
  });
});

// ---------------------------------------------------------------------------
// formatCurrency
// ---------------------------------------------------------------------------
describe("formatCurrency", () => {
  it("formats a positive integer — ₹100 → '₹100'", () => {
    const result = formatCurrency(100);
    expect(result).toContain("₹");
    expect(result).toContain("100");
  });

  it("formats zero — ₹0", () => {
    const result = formatCurrency(0);
    expect(result).toContain("₹");
    expect(result).toContain("0");
  });

  it("formats a negative number", () => {
    const result = formatCurrency(-50);
    expect(result).toContain("₹");
    // The minus sign may appear before currency symbol depending on locale
    expect(result).toMatch(/[-−]/);
  });

  it("formats decimal values with fraction digits", () => {
    const result = formatCurrency(99.99);
    expect(result).toContain("₹");
    // minimumFractionDigits is 0, but if the value has cents they should show
    expect(result).toContain("99");
  });

  it("coerces null to 0", () => {
    const result = formatCurrency(null);
    expect(result).toContain("₹");
    expect(result).toContain("0");
  });

  it("produces NaN output for undefined", () => {
    // Number(undefined) → NaN, Intl formatter renders "NaN" in locale-aware format
    const result = formatCurrency(undefined);
    expect(result).toMatch(/NaN/i);
  });
});

// ---------------------------------------------------------------------------
// formatDate
// ---------------------------------------------------------------------------
describe("formatDate", () => {
  it('returns "—" for null', () => {
    expect(formatDate(null)).toBe("—");
  });

  it('returns "—" for undefined', () => {
    expect(formatDate(undefined)).toBe("—");
  });

  it('returns "—" for invalid date string', () => {
    expect(formatDate("not-a-date")).toBe("—");
  });

  it("formats a valid date string", () => {
    const result = formatDate("2024-01-15");
    expect(result).not.toBe("—");
    // en-IN locale format: "15 Jan, 2024" or "15 Jan 2024" (without comma)
    expect(result).toMatch(/15\s+Jan/);
    expect(result).toContain("2024");
  });

  it("accepts a Date object", () => {
    const d = new Date(2024, 5, 15); // June 15 2024
    const result = formatDate(d);
    expect(result).not.toBe("—");
    // June is "Jun" in en-IN
    expect(result).toMatch(/15\s+Jun/);
    expect(result).toContain("2024");
  });

  it("formats ISO string with time component", () => {
    const result = formatDate("2024-03-20T14:30:00Z");
    expect(result).not.toBe("—");
    expect(result).toMatch(/20\s+Mar/);
    expect(result).toContain("2024");
  });
});

// ---------------------------------------------------------------------------
// formatTime
// ---------------------------------------------------------------------------
describe("formatTime", () => {
  it('returns "—" for null', () => {
    expect(formatTime(null)).toBe("—");
  });

  it('returns "—" for undefined', () => {
    expect(formatTime(undefined)).toBe("—");
  });

  it('returns "—" for invalid date', () => {
    expect(formatTime("garbage")).toBe("—");
  });

  it("formats time from a date string", () => {
    const result = formatTime("2024-01-15T09:30:00Z");
    expect(result).not.toBe("—");
    // Expect some digits — the exact format depends on the runtime locale
    expect(result).toMatch(/\d/);
  });
});

// ---------------------------------------------------------------------------
// getInitials
// ---------------------------------------------------------------------------
describe("getInitials", () => {
  it('returns "??" for null/undefined', () => {
    expect(getInitials(null)).toBe("??");
    expect(getInitials(undefined)).toBe("??");
  });

  it('returns "??" for non-string', () => {
    expect(getInitials(42)).toBe("??");
  });

  it("extracts first two initials", () => {
    expect(getInitials("John Doe")).toBe("JD");
  });

  it("handles single name", () => {
    expect(getInitials("Alice")).toBe("A");
  });

  it("trims whitespace", () => {
    expect(getInitials("  bob   smith  ")).toBe("BS");
  });

  it("returns uppercase initials", () => {
    expect(getInitials("john doe")).toBe("JD");
  });
});

// ---------------------------------------------------------------------------
// estimatePrice
// ---------------------------------------------------------------------------
describe("estimatePrice", () => {
  it("returns correct range for flat_tire", () => {
    expect(estimatePrice("flat_tire")).toEqual({ min: 200, max: 800 });
  });

  it("returns correct range for engine_failure", () => {
    expect(estimatePrice("engine_failure")).toEqual({ min: 2000, max: 8000 });
  });

  it("returns correct range for transmission", () => {
    expect(estimatePrice("transmission")).toEqual({ min: 3000, max: 10000 });
  });

  it("returns fallback range for an unknown tag", () => {
    expect(estimatePrice("unknown_gremlin")).toEqual({ min: 500, max: 5000 });
  });

  it("returns fallback for null", () => {
    expect(estimatePrice(null)).toEqual({ min: 500, max: 5000 });
  });

  it("returns fallback for undefined", () => {
    expect(estimatePrice(undefined)).toEqual({ min: 500, max: 5000 });
  });
});

// ---------------------------------------------------------------------------
// generateId
// ---------------------------------------------------------------------------
describe("generateId", () => {
  it("returns a string", () => {
    expect(typeof generateId()).toBe("string");
  });

  it("returns a 9-character string", () => {
    expect(generateId()).toHaveLength(9);
  });

  it("returns unique values on successive calls", () => {
    const ids = new Set(Array.from({ length: 100 }, () => generateId()));
    expect(ids.size).toBe(100);
  });

  it("contains only alphanumeric characters", () => {
    const id = generateId();
    expect(id).toMatch(/^[a-z0-9]+$/);
  });
});
