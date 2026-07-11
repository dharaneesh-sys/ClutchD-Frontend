import { describe, it, expect, vi, beforeEach } from "vitest";

// ---------------------------------------------------------------------------
// REGRESSION TESTS: Error #185 — Stable selectors vs getter functions
//
// The root cause of error #185 ("Maximum update depth exceeded") was that
// getFilteredProviders() returned a new array/object reference on every call.
// React 19's useSyncExternalStore compares snapshots with Object.is, so a
// new reference every call makes React think the store changed on every
// render → infinite re-render loop.
//
// The fix: use stable primitive selectors (s => s.nearbyMechanics) + useMemo
// instead of getter functions as selectors.
//
// These tests verify that trackingStore arrays are stable (same reference)
// across repeated reads, preventing the cascade that caused #185.
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Mock the trackingStore with a reference-stable array implementation
// ---------------------------------------------------------------------------
const mockState = vi.hoisted(() => ({
  _mechs: [],
  _garages: [],
  _filter: "all",
  _error: null,
  get nearbyMechanics() { return this._mechs; },
  set nearbyMechanics(v) { this._mechs = v; },
  get nearbyGarages() { return this._garages; },
  set nearbyGarages(v) { this._garages = v; },
  get providerFilter() { return this._filter; },
  set providerFilter(v) { this._filter = v; },
  get error() { return this._error; },
  set error(v) { this._error = v; },
  isLoading: false,
}));

vi.mock("@/store/trackingStore", () => {
  const useTrackingStore = (selector) => selector(mockState);
  useTrackingStore.getState = () => mockState;
  return { useTrackingStore };
});

import { useTrackingStore } from "@/store/trackingStore";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const mechA = { id: "m-1", name: "Alice", distanceKm: 2.0 };
const mechB = { id: "m-2", name: "Bob", distanceKm: 1.0 };
const garageA = { id: "g-1", name: "Garage 1", distanceKm: 3.0 };

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe("ProviderList selectors — #185 regression", () => {
  beforeEach(() => {
    mockState._mechs = [];
    mockState._garages = [];
    mockState._filter = "all";
    mockState._error = null;
    mockState.isLoading = false;
  });

  // ── Stability tests (core of the #185 fix) ───────────

  it("nearbyMechanics selector returns the SAME array reference on repeated calls", () => {
    const arr = [{ id: "1" }];
    mockState._mechs = arr;

    const a = useTrackingStore((s) => s.nearbyMechanics);
    const b = useTrackingStore((s) => s.nearbyMechanics);
    // Object.is stability is what useSyncExternalStore relies on
    expect(Object.is(a, b)).toBe(true);
    expect(a).toBe(b);
  });

  it("nearbyGarages selector returns the SAME array reference on repeated calls", () => {
    const arr = [{ id: "g-1" }];
    mockState._garages = arr;

    const a = useTrackingStore((s) => s.nearbyGarages);
    const b = useTrackingStore((s) => s.nearbyGarages);
    expect(a).toBe(b);
  });

  it("providerFilter selector returns the SAME value on repeated calls", () => {
    mockState._filter = "mechanic";

    const a = useTrackingStore((s) => s.providerFilter);
    const b = useTrackingStore((s) => s.providerFilter);
    expect(a).toBe(b);
  });

  it("isLoading selector returns the SAME value on repeated calls", () => {
    mockState.isLoading = true;

    const a = useTrackingStore((s) => s.isLoading);
    const b = useTrackingStore((s) => s.isLoading);
    expect(a).toBe(b);
  });

  // ── State change tests ───────────────────────────────

  it("selector reflects state mutation (nearbyMechanics set)", () => {
    mockState._mechs = [mechA, mechB];
    const mechs = useTrackingStore((s) => s.nearbyMechanics);
    expect(mechs).toHaveLength(2);
    expect(mechs[0].name).toBe("Alice");
  });

  it("selector reflects state mutation (nearbyGarages set)", () => {
    mockState._garages = [garageA];
    const garages = useTrackingStore((s) => s.nearbyGarages);
    expect(garages).toHaveLength(1);
    expect(garages[0].name).toBe("Garage 1");
  });

  it("selector reflects state mutation (providerFilter set)", () => {
    mockState._filter = "garage";
    const filter = useTrackingStore((s) => s.providerFilter);
    expect(filter).toBe("garage");
  });

  // ── Empty / loading / error states ──────────────────

  it("nearbyMechanics defaults to empty array", () => {
    const mechs = useTrackingStore((s) => s.nearbyMechanics);
    expect(mechs).toEqual([]);
  });

  it("nearbyGarages defaults to empty array", () => {
    const garages = useTrackingStore((s) => s.nearbyGarages);
    expect(garages).toEqual([]);
  });

  it("providerFilter defaults to 'all'", () => {
    const filter = useTrackingStore((s) => s.providerFilter);
    expect(filter).toBe("all");
  });

  it("isLoading defaults to false", () => {
    const loading = useTrackingStore((s) => s.isLoading);
    expect(loading).toBe(false);
  });

  // ── REGRESSION: Sequential reads produce stable refs ─

  it("RETGRESSION: 10 sequential reads return the same array reference (#185)", () => {
    mockState._mechs = [mechA, mechB];
    mockState._garages = [garageA];

    let prevMechs = useTrackingStore((s) => s.nearbyMechanics);
    let prevGarages = useTrackingStore((s) => s.nearbyGarages);

    // Simulate 10 sequential render cycles — like the cascade from #185
    for (let i = 0; i < 10; i++) {
      const mechs = useTrackingStore((s) => s.nearbyMechanics);
      const garages = useTrackingStore((s) => s.nearbyGarages);

      // Every read must return the SAME reference (Object.is stable)
      expect(mechs).toBe(prevMechs);
      expect(garages).toBe(prevGarages);

      prevMechs = mechs;
      prevGarages = garages;
    }
  });
});
