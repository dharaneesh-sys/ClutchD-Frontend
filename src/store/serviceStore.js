import { create } from "zustand";
import api from "@/lib/api";
import { SERVICE_STATUS, issueTagToExpertise } from "@/lib/constants";
import { BackendHealth } from "@/lib/backendHealth";

export const useServiceStore = create((set, get) => ({
  activeRequest: null,
  history: [],
  isLoading: false,
  error: null,
  paymentId: null,
  
  createRequest: async (data) => {
    set({ isLoading: true, error: null });
    
    try {
      let mediaUrl = data.mediaUrl;
      
      // Handle file upload if media is a File object
      if (data.media instanceof File) {
        const formData = new FormData();
        formData.append("file", data.media);
        // Long timeout + retryable — photos on 4G through the funnel are slow
        // (same class as the Google-login fix).
        const uploadRes = await api.post("/uploads", formData, {
          headers: { "Content-Type": "multipart/form-data" },
          timeout: 60000,
          __isRetryable: true,
        });
        mediaUrl = uploadRes.data.url;
      }
      
      const payload = {
        issueTag: data.issueTag,
        expertise: issueTagToExpertise(data.issueTag),
        description: data.description,
        requestType: data.requestType,
        priceEstimate: data.priceEstimate,
        customerLat: data.customerLat,
        customerLng: data.customerLng,
        mediaUrl: mediaUrl,
        vehicleId: data.vehicleId,
        scheduledAt: data.scheduledAt || null,
      };

      const response = await api.post("/service/request", payload);
      
      const newRequest = response.data;
      set({ activeRequest: newRequest, isLoading: false });
      return newRequest;
      
    } catch (error) {
      const msg =
        error.response?.data?.detail ||
        (error.response ? "Request failed." : "Server unreachable. Please try again later.");
      set({ isLoading: false, error: msg });
      throw error;
    }
  },
  
  /**
   * Update request status. 
   * @param {string} status - New status
   * @param {object|null} mechanicData - Mechanic info if assigned
   * @param {boolean} fromServer - If true, skip the backend PATCH (already from server)
   * @param {object|null} pricingData - Pricing breakdown for payment_pending
   */
  updateRequestStatus: async (status, mechanicData = null, fromServer = false, pricingData = null) => {
    const currentReq = get().activeRequest;
    if (!currentReq) return;

    // Don't send PATCH if this update came from the server (WebSocket or poll)
    if (!fromServer) {
      try {
        await api.patch(`/service/request/${currentReq.id}/status`, { status, mechanicId: mechanicData?.id });
      } catch {
      }
    }
    
    // Update local state
    set(state => {
      if (!state.activeRequest) return state;
      return {
        activeRequest: {
          ...state.activeRequest,
          status,
          mechanic: mechanicData || state.activeRequest.mechanic,
          pricing: pricingData || state.activeRequest.pricing,
        }
      };
    });
  },
  
  completeRequest: async (paymentDetails) => {
    const currentReq = get().activeRequest;
    if (!currentReq) return;

    try {
      await api.post(`/service/request/${currentReq.id}/complete`, paymentDetails);
    } catch (error) {
      // completion endpoint failed — non-critical
    }

    set(state => {
      if (!state.activeRequest) return state;
      const completed = {
        ...state.activeRequest,
        status: SERVICE_STATUS.COMPLETED,
        payment: paymentDetails,
        completedAt: new Date().toISOString()
      };
      return {
        activeRequest: null,
        history: [completed, ...state.history]
      };
    });
  },
  
  /**
   * Move the request into escrow after payment is collected.
   * Payment is held until the customer explicitly releases it.
   */
  holdPayment: async (paymentDetails) => {
    const currentReq = get().activeRequest;
    if (!currentReq) return;

    const paymentId = paymentDetails?.transactionId || paymentDetails?.razorpay_payment_id || `pay_${Date.now()}`;

    // Best-effort backend call — works with or without the backend
    const backendUp = BackendHealth.isAvailable();
    if (backendUp) {
      try {
        await api.post(`/service/request/${currentReq.id}/hold`, paymentDetails);
      } catch {
        // non-critical — local state already updated
      }
    }

    set((state) => ({
      activeRequest: state.activeRequest
        ? {
            ...state.activeRequest,
            status: SERVICE_STATUS.PAYMENT_ESCROW,
            payment: paymentDetails,
            paymentId,
          }
        : null,
      paymentId,
    }));
  },

  /**
   * Release the escrowed payment to the mechanic and complete the service.
   * Called when the customer confirms satisfaction.
   */
  releasePayment: async () => {
    const currentReq = get().activeRequest;
    if (!currentReq) return;

    // First update to PAYMENT_RELEASED for visual feedback
    set((state) => ({
      activeRequest: state.activeRequest
        ? { ...state.activeRequest, status: SERVICE_STATUS.PAYMENT_RELEASED }
        : null,
    }));

    // Best-effort backend call
    const backendUp = BackendHealth.isAvailable();
    if (backendUp) {
      try {
        await api.post(`/service/request/${currentReq.id}/release`, {
          paymentId: currentReq.paymentId,
        });
      } catch {
        // non-critical
      }
    }

    // Transition to COMPLETED and move to history
    set((state) => {
      if (!state.activeRequest) return state;
      const completed = {
        ...state.activeRequest,
        status: SERVICE_STATUS.COMPLETED,
        payment: { ...state.activeRequest.payment, released: true },
        completedAt: new Date().toISOString(),
      };
      return {
        activeRequest: null,
        history: [completed, ...state.history],
      };
    });
  },

  /**
   * Flag the payment as disputed. Moves the request out of the
   * normal completion flow until the dispute is resolved.
   */
  disputePayment: async (reason) => {
    const currentReq = get().activeRequest;
    if (!currentReq) return;

    const backendUp = BackendHealth.isAvailable();
    if (backendUp) {
      try {
        await api.post(`/service/request/${currentReq.id}/dispute`, { reason });
      } catch {
        // non-critical
      }
    }

    set((state) => ({
      activeRequest: state.activeRequest
        ? {
            ...state.activeRequest,
            status: SERVICE_STATUS.PAYMENT_DISPUTE,
            disputeReason: reason,
          }
        : null,
    }));
  },

  cancelRequest: async () => {
    const currentReq = get().activeRequest;
    if (currentReq) {
      try {
        await api.post(`/service/request/${currentReq.id}/cancel`);
      } catch(e) {
        // best-effort
      }
    }
    set({ activeRequest: null, error: null });
  },

  updateVehicle: async (vehicleId, vehicle) => {
    const currentReq = get().activeRequest;
    if (!currentReq) return;

    set(state => {
      if (!state.activeRequest) return state;
      return {
        activeRequest: {
          ...state.activeRequest,
          vehicleId,
          vehicle,
        }
      };
    });

    // Best-effort backend call
    try {
      await api.patch(`/service/request/${currentReq.id}/vehicle`, { vehicleId });
    } catch {
      // non-critical — local state already updated
    }
  },

  /**
   * Restore active request from the server after page refresh.
   * Calls GET /jobs/incoming to find any active job for the current user.
   */
  restoreActiveRequest: async () => {
    try {
      const res = await api.get("/jobs/incoming");
      const jobs = res.data?.jobs || [];
      const myJobs = jobs.filter(j => !j.id.startsWith("demo-req-seeded-"));
      if (myJobs.length > 0) {
        set({ activeRequest: myJobs[0] });
      }
    } catch {
      // Not critical — user can create a new request
    }
  },

  clearError: () => set({ error: null }),
}));
