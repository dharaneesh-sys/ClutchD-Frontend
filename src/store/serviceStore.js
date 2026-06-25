import { create } from "zustand";
import api from "@/lib/api";
import { SERVICE_STATUS } from "@/lib/constants";

export const useServiceStore = create((set, get) => ({
  activeRequest: null,
  history: [],
  isLoading: false,
  error: null,
  
  createRequest: async (data) => {
    set({ isLoading: true, error: null });
    
    try {
      let mediaUrl = data.mediaUrl;
      
      // Handle file upload if media is a File object
      if (data.media instanceof File) {
        const formData = new FormData();
        formData.append("file", data.media);
        const uploadRes = await api.post("/uploads", formData, {
          headers: { "Content-Type": "multipart/form-data" }
        });
        mediaUrl = uploadRes.data.url;
      }
      
      const payload = {
        issueTag: data.issueTag,
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
