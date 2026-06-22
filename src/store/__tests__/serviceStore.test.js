import { describe, it, expect, vi, beforeEach } from "vitest";

// ---------------------------------------------------------------------------
// Hoisted mocks — vi.mock is hoisted above imports, so use vi.hoisted()
// ---------------------------------------------------------------------------
const mockPost = vi.hoisted(() => vi.fn());
const mockPatch = vi.hoisted(() => vi.fn());
const mockGet = vi.hoisted(() => vi.fn());

vi.mock("@/lib/api", () => ({
  default: {
    post: mockPost,
    patch: mockPatch,
    get: mockGet,
  },
}));

// ---------------------------------------------------------------------------
// Import store AFTER mocks
// ---------------------------------------------------------------------------
import { useServiceStore } from "@/store/serviceStore";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const mockRequest = {
  id: "sr-1",
  issueTag: "flat_tire",
  description: "Left front tire is flat.",
  requestType: "mechanic",
  status: "idle",
  mechanic: null,
  pricing: null,
};

function resetStore() {
  useServiceStore.setState({
    activeRequest: null,
    history: [],
    isLoading: false,
    error: null,
  });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe("serviceStore", () => {
  beforeEach(() => {
    resetStore();
    vi.clearAllMocks();
  });

  // ── createRequest ───────────────────────────────────
  describe("createRequest", () => {
    const basePayload = {
      issueTag: "flat_tire",
      description: "Left front tire is completely flat.",
      requestType: "mechanic",
      priceEstimate: { min: 200, max: 800 },
      customerLat: 11.0168,
      customerLng: 76.9558,
      mediaUrl: undefined,
      vehicleId: "v-1",
      scheduledAt: null,
    };

    it("creates a service request without media upload", async () => {
      const created = { ...mockRequest, status: "searching" };
      mockPost.mockResolvedValueOnce({ data: created });

      const result = await useServiceStore.getState().createRequest(basePayload);

      expect(mockPost).toHaveBeenCalledWith("/service/request", {
        issueTag: "flat_tire",
        description: "Left front tire is completely flat.",
        requestType: "mechanic",
        priceEstimate: { min: 200, max: 800 },
        customerLat: 11.0168,
        customerLng: 76.9558,
        mediaUrl: undefined,
        vehicleId: "v-1",
        scheduledAt: null,
      });
      expect(useServiceStore.getState().activeRequest).toEqual(created);
      expect(useServiceStore.getState().isLoading).toBe(false);
      expect(result).toEqual(created);
    });

    it("uploads media file before creating the request", async () => {
      const file = new File(["photo-binary"], "tire.jpg", { type: "image/jpeg" });
      const payloadWithFile = { ...basePayload, media: file };

      // Upload response
      mockPost.mockResolvedValueOnce({ data: { url: "https://cdn.example.com/tire.jpg" } });
      // Create request response
      const created = { ...mockRequest, status: "searching", mediaUrl: "https://cdn.example.com/tire.jpg" };
      mockPost.mockResolvedValueOnce({ data: created });

      const result = await useServiceStore.getState().createRequest(payloadWithFile);

      // First POST → upload
      expect(mockPost).toHaveBeenNthCalledWith(
        1,
        "/uploads",
        expect.any(FormData),
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      // Second POST → create request with the returned mediaUrl
      expect(mockPost).toHaveBeenNthCalledWith(2, "/service/request", {
        ...basePayload,
        mediaUrl: "https://cdn.example.com/tire.jpg",
      });
      expect(result.mediaUrl).toBe("https://cdn.example.com/tire.jpg");
      expect(useServiceStore.getState().activeRequest).toEqual(created);
    });

    it("does not upload if media is not a File object", async () => {
      const payloadWithUrl = { ...basePayload, media: "https://existing.url/photo.jpg" };
      const created = { ...mockRequest, status: "searching" };
      mockPost.mockResolvedValueOnce({ data: created });

      await useServiceStore.getState().createRequest(payloadWithUrl);

      // Only one POST — the service request, no upload
      expect(mockPost).toHaveBeenCalledTimes(1);
      expect(mockPost).toHaveBeenCalledWith("/service/request", {
        ...basePayload,
        mediaUrl: undefined, // The media field is not passed; mediaUrl stays undefined
      });
    });

    it("throws on API error and sets error state", async () => {
      mockPost.mockRejectedValueOnce({
        response: { data: { detail: "Service unavailable" } },
      });

      await expect(
        useServiceStore.getState().createRequest(basePayload)
      ).rejects.toThrow();

      expect(useServiceStore.getState().isLoading).toBe(false);
      expect(useServiceStore.getState().error).toBe("Service unavailable");
    });

    it("sets network error when server unreachable", async () => {
      mockPost.mockRejectedValueOnce(new Error("Network Error"));

      await expect(
        useServiceStore.getState().createRequest(basePayload)
      ).rejects.toThrow();

      expect(useServiceStore.getState().error).toBe(
        "Server unreachable. Please try again later."
      );
    });
  });

  // ── updateRequestStatus ────────────────────────────
  describe("updateRequestStatus", () => {
    it("patches backend and updates local state", async () => {
      useServiceStore.setState({ activeRequest: { ...mockRequest, status: "searching" } });
      mockPatch.mockResolvedValueOnce({ data: {} });

      await useServiceStore.getState().updateRequestStatus("assigned", { id: "m-1", name: "Bob" });

      expect(mockPatch).toHaveBeenCalledWith("/service/request/sr-1/status", {
        status: "assigned",
        mechanicId: "m-1",
      });
      expect(useServiceStore.getState().activeRequest.status).toBe("assigned");
      expect(useServiceStore.getState().activeRequest.mechanic).toEqual({
        id: "m-1",
        name: "Bob",
      });
    });

    it("skips PATCH when fromServer=true", async () => {
      useServiceStore.setState({ activeRequest: { ...mockRequest, status: "searching" } });

      await useServiceStore.getState().updateRequestStatus("en_route", null, true);

      expect(mockPatch).not.toHaveBeenCalled();
      expect(useServiceStore.getState().activeRequest.status).toBe("en_route");
    });

    it("does nothing when there is no active request", async () => {
      await useServiceStore.getState().updateRequestStatus("completed");

      expect(mockPatch).not.toHaveBeenCalled();
    });

    it("still updates local state even if PATCH fails", async () => {
      useServiceStore.setState({ activeRequest: { ...mockRequest, status: "searching" } });
      mockPatch.mockRejectedValueOnce(new Error("Network error"));

      await useServiceStore.getState().updateRequestStatus("in_progress");

      // Local state should still update despite API failure
      expect(useServiceStore.getState().activeRequest.status).toBe("in_progress");
    });
  });

  // ── completeRequest ────────────────────────────────
  describe("completeRequest", () => {
    it("completes request and moves it to history", async () => {
      useServiceStore.setState({
        activeRequest: { ...mockRequest, status: "payment_pending" },
        history: [],
      });
      const paymentDetails = { method: "upi", amount: 500 };
      mockPost.mockResolvedValueOnce({ data: {} });

      await useServiceStore.getState().completeRequest(paymentDetails);

      expect(mockPost).toHaveBeenCalledWith("/service/request/sr-1/complete", paymentDetails);
      expect(useServiceStore.getState().activeRequest).toBeNull();
      expect(useServiceStore.getState().history).toHaveLength(1);
      expect(useServiceStore.getState().history[0].status).toBe("completed");
      expect(useServiceStore.getState().history[0].payment).toEqual(paymentDetails);
      expect(useServiceStore.getState().history[0].completedAt).toBeDefined();
    });

    it("does nothing when no active request", async () => {
      await useServiceStore.getState().completeRequest({ method: "card" });

      expect(mockPost).not.toHaveBeenCalled();
    });
  });

  // ── cancelRequest ──────────────────────────────────
  describe("cancelRequest", () => {
    it("cancels active request and clears state", async () => {
      useServiceStore.setState({
        activeRequest: { ...mockRequest, status: "searching" },
        error: "some error",
      });
      mockPost.mockResolvedValueOnce({ data: {} });

      await useServiceStore.getState().cancelRequest();

      expect(mockPost).toHaveBeenCalledWith("/service/request/sr-1/cancel");
      expect(useServiceStore.getState().activeRequest).toBeNull();
      expect(useServiceStore.getState().error).toBeNull();
    });

    it("still clears state even if cancel API fails", async () => {
      useServiceStore.setState({ activeRequest: { ...mockRequest, status: "searching" } });
      mockPost.mockRejectedValueOnce(new Error("Network error"));

      await useServiceStore.getState().cancelRequest();

      expect(useServiceStore.getState().activeRequest).toBeNull();
    });

    it("does nothing when no active request", async () => {
      await useServiceStore.getState().cancelRequest();

      expect(mockPost).not.toHaveBeenCalled();
    });
  });

  // ── restoreActiveRequest ───────────────────────────
  describe("restoreActiveRequest", () => {
    it("restores the most recent active job", async () => {
      const job = { id: "sr-2", issueTag: "engine_failure", status: "assigned" };
      mockGet.mockResolvedValueOnce({ data: { jobs: [job] } });

      await useServiceStore.getState().restoreActiveRequest();

      expect(mockGet).toHaveBeenCalledWith("/jobs/incoming");
      expect(useServiceStore.getState().activeRequest).toEqual(job);
    });

    it("does not set activeRequest when no jobs returned", async () => {
      mockGet.mockResolvedValueOnce({ data: { jobs: [] } });

      await useServiceStore.getState().restoreActiveRequest();

      expect(useServiceStore.getState().activeRequest).toBeNull();
    });

    it("silently fails on network error", async () => {
      mockGet.mockRejectedValueOnce(new Error("Network error"));

      await useServiceStore.getState().restoreActiveRequest();

      expect(useServiceStore.getState().activeRequest).toBeNull();
    });
  });

  // ── clearError ─────────────────────────────────────
  describe("clearError", () => {
    it("resets error to null", () => {
      useServiceStore.setState({ error: "Something went wrong" });

      useServiceStore.getState().clearError();

      expect(useServiceStore.getState().error).toBeNull();
    });
  });
});
