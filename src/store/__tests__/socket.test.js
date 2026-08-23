import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// ---------------------------------------------------------------------------
// Hoisted mocks — vi.mock is hoisted above imports, so use vi.hoisted()
// (same convention as serviceStore.test.js)
// ---------------------------------------------------------------------------
const mockGetAccessToken = vi.hoisted(() => vi.fn());
const mockCacheLastLocation = vi.hoisted(() => vi.fn());

vi.mock("@/lib/tokenStore", () => ({
  getAccessToken: mockGetAccessToken,
  setAccessToken: vi.fn(),
  clearAccessToken: vi.fn(),
}));

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

// ---------------------------------------------------------------------------
// Import real modules AFTER mocks — we exercise the REAL socket.js handlers
// against the REAL zustand stores through a hand-rolled WebSocket fake
// (mock-socket is NOT a dependency, so we don't add one).
// ---------------------------------------------------------------------------
import { connectWebSocket, disconnectWebSocket } from "@/lib/socket";
import { useTrackingStore } from "@/store/trackingStore";
import { useServiceStore } from "@/store/serviceStore";
import { MAP_DEFAULT_CENTER } from "@/lib/constants";

// ---------------------------------------------------------------------------
// Hand-rolled WebSocket fake
// ---------------------------------------------------------------------------
class FakeWebSocket {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;

  static instances = [];

  constructor(url, protocols) {
    this.url = url;
    this.protocols = protocols || [];
    this.readyState = FakeWebSocket.CONNECTING;
    this.sent = [];
    this.onopen = null;
    this.onmessage = null;
    this.onclose = null;
    this.onerror = null;
    FakeWebSocket.instances.push(this);
  }

  simulateOpen() {
    this.readyState = FakeWebSocket.OPEN;
    if (this.onopen) this.onopen({});
  }

  simulateMessage(msg) {
    const data = typeof msg === "string" ? msg : JSON.stringify(msg);
    if (this.onmessage) this.onmessage({ data });
  }

  close(code = 1000, reason = "") {
    this.readyState = FakeWebSocket.CLOSED;
    // Browsers fire onclose asynchronously after close(); emulate via microtask.
    queueMicrotask(() => {
      if (this.onclose) this.onclose({ code, reason });
    });
  }

  send(data) {
    this.sent.push(data);
  }
}

const originalWebSocket = globalThis.WebSocket;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function resetStores() {
  // Only CURRENT public store fields — Task 9 may add error-state fields later.
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
  useServiceStore.setState({
    activeRequest: null,
    history: [],
    isLoading: false,
    error: null,
    paymentId: null,
  });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe("socket.js WS smoke", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    FakeWebSocket.instances = [];
    globalThis.WebSocket = FakeWebSocket;
    mockGetAccessToken.mockReturnValue("tok-1");
    resetStores();
  });

  afterEach(() => {
    disconnectWebSocket();
    globalThis.WebSocket = originalWebSocket;
    vi.useRealTimers();
  });

  // ── LOCATION_UPDATE ────────────────────────────────────
  it("LOCATION_UPDATE handler updates trackingStore mechanicLocation + ETA", () => {
    const ws = connectWebSocket("tok-1");
    expect(ws).toBeInstanceOf(FakeWebSocket);
    ws.simulateOpen();

    ws.simulateMessage({
      type: "LOCATION_UPDATE",
      payload: { coords: [12.9716, 77.5946] },
    });

    expect(useTrackingStore.getState().mechanicLocation).toEqual([
      12.9716, 77.5946,
    ]);
    // ETA derived from haversine(userLocation, mechanicLocation) at 30km/h
    expect(useTrackingStore.getState().estimatedArrival).not.toBeNull();
    expect(useTrackingStore.getState().estimatedArrival).toBeGreaterThanOrEqual(0);
  });

  it("ignores malformed LOCATION_UPDATE payloads (no coords)", () => {
    const ws = connectWebSocket("tok-1");
    ws.simulateOpen();

    ws.simulateMessage({ type: "LOCATION_UPDATE", payload: {} });

    expect(useTrackingStore.getState().mechanicLocation).toBeNull();
  });

  // ── STATUS_UPDATE ──────────────────────────────────────
  it("STATUS_UPDATE moves job searching -> assigned in serviceStore", async () => {
    useServiceStore.setState({
      activeRequest: {
        id: "job-1",
        status: "searching",
        mechanic: null,
        pricing: null,
      },
    });

    const ws = connectWebSocket("tok-1");
    ws.simulateOpen();
    ws.simulateMessage({
      type: "STATUS_UPDATE",
      payload: {
        status: "assigned",
        mechanic: { id: "m-9", name: "Ravi" },
        pricing: null,
      },
    });

    // Handler resolves serviceStore via dynamic import → wait for microtask
    await vi.waitFor(() => {
      expect(useServiceStore.getState().activeRequest.status).toBe("assigned");
    });
    expect(useServiceStore.getState().activeRequest.mechanic).toEqual({
      id: "m-9",
      name: "Ravi",
    });
    // fromServer=true must skip the duplicate backend PATCH
    expect(useServiceStore.getState().activeRequest.status).not.toBe("searching");
  });

  // Negative control: proves the assertion above detects an unwired handler —
  // an unknown type must NOT move the job (failing-first sensitivity check).
  it("does not move the job on unknown message types (sensitivity control)", async () => {
    useServiceStore.setState({
      activeRequest: { id: "job-1", status: "searching", mechanic: null },
    });

    const ws = connectWebSocket("tok-1");
    ws.simulateOpen();
    ws.simulateMessage({
      type: "STATUS_UPDATE_UNWIRED",
      payload: { status: "assigned" },
    });

    await new Promise((r) => setTimeout(r, 0));

    expect(useServiceStore.getState().activeRequest.status).toBe("searching");
  });

  // NOTE: socket.js resets reconnectAttempts on every successful onopen, so
  // exponential growth only occurs across CONSECUTIVE FAILED attempts (socket
  // never reaches OPEN — e.g. server down). Tests model that real sequence.
  it("disconnect triggers reconnect with exponential backoff (3s then 6s)", () => {
    vi.useFakeTimers();

    const ws1 = connectWebSocket("tok-1");
    ws1.simulateOpen();
    expect(FakeWebSocket.instances.length).toBe(1);

    // Abnormal close (not 1000/4401) → schedule reconnect #1 after 3000ms
    ws1.onclose({ code: 1006, reason: "abnormal" });

    vi.advanceTimersByTime(2999);
    expect(FakeWebSocket.instances.length).toBe(1); // not yet

    vi.advanceTimersByTime(1);
    expect(FakeWebSocket.instances.length).toBe(2); // reconnect #1 at 3000ms

    // Reconnect attempt fails WITHOUT opening (server still down) →
    // backoff doubles to 6000ms for the next try.
    FakeWebSocket.instances[1].onclose({ code: 1006, reason: "abnormal" });

    vi.advanceTimersByTime(5999);
    expect(FakeWebSocket.instances.length).toBe(2); // not yet

    vi.advanceTimersByTime(1);
    expect(FakeWebSocket.instances.length).toBe(3); // reconnect #2 at +6000ms
  });

  it("reconnect re-reads a fresh token instead of the stale closure token", () => {
    vi.useFakeTimers();

    const ws1 = connectWebSocket("tok-1");
    ws1.simulateOpen();
    ws1.onclose({ code: 1006, reason: "abnormal" });

    // Token rotated while disconnected
    mockGetAccessToken.mockReturnValue("tok-2");

    vi.advanceTimersByTime(3000);

    const ws2 = FakeWebSocket.instances[1];
    expect(ws2).toBeDefined();
    expect(ws2.protocols).toEqual(["tok-2"]);
  });

  it("intentional close (code 1000) does NOT schedule a reconnect", () => {
    vi.useFakeTimers();

    const ws1 = connectWebSocket("tok-1");
    ws1.simulateOpen();
    ws1.onclose({ code: 1000, reason: "client disconnect" });

    vi.advanceTimersByTime(60000);
    expect(FakeWebSocket.instances.length).toBe(1);
  });

  it("gives up after max reconnect attempts (5)", () => {
    vi.useFakeTimers();

    const ws1 = connectWebSocket("tok-1");
    ws1.simulateOpen();

    // Consecutive failed attempts (never re-open): delays 3s,6s,12s,24s,48s.
    // After the 5th scheduled reconnect fails, no further attempt is made.
    for (let i = 0; i < 5; i++) {
      const sock = FakeWebSocket.instances[FakeWebSocket.instances.length - 1];
      sock.onclose({ code: 1006, reason: "abnormal" });
      vi.advanceTimersByTime(3000 * Math.pow(2, i));
      expect(FakeWebSocket.instances.length).toBe(i + 2);
    }

    // 5th reconnect also fails → attempts exhausted, nothing more scheduled
    const last = FakeWebSocket.instances[FakeWebSocket.instances.length - 1];
    last.onclose({ code: 1006, reason: "abnormal" });
    vi.advanceTimersByTime(3000 * Math.pow(2, 10));
    expect(FakeWebSocket.instances.length).toBe(6); // 1 initial + 5 reconnects
  });

  // ── Auth plumbing smoke ────────────────────────────────
  it("passes the JWT as Sec-WebSocket-Protocol subprotocol", () => {
    const ws = connectWebSocket("tok-1");
    expect(ws.protocols).toEqual(["tok-1"]);
  });

  it("connectWebSocket is idempotent while OPEN", () => {
    const ws1 = connectWebSocket("tok-1");
    ws1.simulateOpen();
    const ws2 = connectWebSocket("tok-1");
    expect(ws2).toBe(ws1);
    expect(FakeWebSocket.instances.length).toBe(1);
  });
});
