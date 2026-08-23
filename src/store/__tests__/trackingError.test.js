import { describe, it, expect, vi, beforeEach } from "vitest";

// ---------------------------------------------------------------------------
// Hoisted mocks — vi.mock is hoisted above imports, so use vi.hoisted()
// (same convention as socket.test.js)
// ---------------------------------------------------------------------------
const mockCacheLastLocation = vi.hoisted(() => vi.fn());

vi.mock("@/lib/api", () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
  },
  extractApiError: vi.fn(() => "error"),
}));

vi.mock("@/lib/offline/offlineCache", () => ({
  cacheLastLocation: mockCacheLastLocation,
}));

// Import the REAL store after mocks — we exercise fetchNearbyProviders'
// error-state semantics against real zustand state.
import api from "@/lib/api";
import { useTrackingStore } from "@/store/trackingStore";
import { MAP_DEFAULT_CENTER } from "@/lib/constants";

function resetStore() {
  useTrackingStore.setState({
    userLocation: MAP_DEFAULT_CENTER,
    mechanicLocation: null,
    navigationTarget: null,
    nearbyMechanics: [],
    nearbyGarages: [],
    isLoading: false,
    error: null,
    gpsStatus: "idle",
    estimatedArrival: null,
    providerFilter: "all",
  });
}

describe("trackingStore.fetchNearbyProviders error surface", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetStore();
  });

  it("sets a string error and clears lists when the request rejects", async () => {
    api.get.mockRejectedValueOnce({ message: "Network Error" });

    await useTrackingStore.getState().fetchNearbyProviders();

    const s = useTrackingStore.getState();
    expect(typeof s.error).toBe("string");
    expect(s.error.length).toBeGreaterThan(0);
    expect(s.nearbyMechanics).toEqual([]);
    expect(s.nearbyGarages).toEqual([]);
    // finally must ALWAYS reset isLoading, even on rejection
    expect(s.isLoading).toBe(false);
  });

  it("surfaces the backend message when the API response carries one", async () => {
    api.get.mockRejectedValueOnce({
      response: { data: { message: "No providers near you" } },
    });

    await useTrackingStore.getState().fetchNearbyProviders();

    expect(useTrackingStore.getState().error).toBe("No providers near you");
  });

  it("retry clears the previous error and repopulates providers", async () => {
    api.get.mockRejectedValueOnce({ message: "Network Error" });
    await useTrackingStore.getState().fetchNearbyProviders();
    expect(useTrackingStore.getState().error).not.toBeNull();

    api.get.mockResolvedValueOnce({
      data: { mechanics: [{ id: 1, name: "Ravi" }], garages: [] },
    });
    await useTrackingStore.getState().fetchNearbyProviders();

    const s = useTrackingStore.getState();
    // Cleared at the start of the next fetch
    expect(s.error).toBeNull();
    expect(s.nearbyMechanics).toHaveLength(1);
    expect(s.isLoading).toBe(false);
  });

  // Negative control: proves the assertions above detect an unwired catch —
  // a successful request must NOT set an error.
  it("does not set error on success (sensitivity control)", async () => {
    api.get.mockResolvedValueOnce({ data: { mechanics: [], garages: [] } });

    await useTrackingStore.getState().fetchNearbyProviders();

    const s = useTrackingStore.getState();
    expect(s.error).toBeNull();
    expect(s.isLoading).toBe(false);
  });
});
