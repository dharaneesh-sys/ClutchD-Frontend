"use client";

import { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import { useServiceStore } from "../../../store/serviceStore";
import { useAuthStore } from "../../../store/authStore";
import { useTrackingStore } from "../../../store/trackingStore";
import { useThemeStore } from "../../../store/themeStore";
import { ServiceRequestPanel } from "../../../components/dashboard/ServiceRequestPanel";
import { ServiceStatusTracker } from "../../../components/dashboard/ServiceStatusTracker";
import { ProviderList } from "../../../components/dashboard/ProviderList";
import { PaymentModal } from "../../../components/dashboard/PaymentModal";
import { ReviewModal } from "../../../components/dashboard/ReviewModal";
import { NotificationBell } from "../../../components/ui/NotificationBell";
import { SOSButton } from "../../../components/ui/SOSButton";
import { PageTransition } from "../../../components/ui/PageTransition";
import { LogOut, User, History, Wrench } from "lucide-react";
import { SERVICE_STATUS } from "../../../lib/constants";
import api from "../../../lib/api";

const MapView = dynamic(
  () => import("../../../components/dashboard/MapView"),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full bg-stone-100 dark:bg-zinc-900 rounded-2xl animate-pulse" />
    ),
  }
);

// Lazy-loaded history component (Phase 6)
const ServiceHistory = dynamic(
  () => import("../../../components/dashboard/ServiceHistory").then(m => ({ default: m.ServiceHistory })),
  { ssr: false, loading: () => <div className="flex-1 flex items-center justify-center"><div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin border-amber-500 dark:border-emerald-500" /></div> }
);

export default function CustomerDashboard() {
  const { user, logout, isAuthenticated } = useAuthStore();
  const { activeRequest, createRequest, cancelRequest, restoreActiveRequest } = useServiceStore();
  const { theme } = useThemeStore();
  const isLight = theme === "light";
  const updateRequestStatus = useCallback(
    (...args) => useServiceStore.getState().updateRequestStatus(...args),
    []
  );
  const completeRequest = useCallback(
    (...args) => useServiceStore.getState().completeRequest(...args),
    []
  );

  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [reviewProviderName, setReviewProviderName] = useState("the professional");
  const [paymentAmount, setPaymentAmount] = useState(1200);
  const [activeTab, setActiveTab] = useState("request"); // "request" | "history"

  useEffect(() => {
    if (!isAuthenticated) {
      window.location.href = "/auth";
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      useTrackingStore.getState().requestGPSLocation();
    }
  }, [isAuthenticated]);

  // Restore active request on mount (handles page refresh)
  useEffect(() => {
    if (isAuthenticated && !activeRequest) {
      restoreActiveRequest();
    }
  }, [isAuthenticated]); // eslint-disable-line react-hooks/exhaustive-deps

  // Polling fallback: if WebSocket is unavailable, poll job status every 15s
  useEffect(() => {
    if (!activeRequest || !activeRequest.id) return;
    if (activeRequest.status === SERVICE_STATUS.COMPLETED) return;

    const poll = async () => {
      try {
        const res = await api.get(`/jobs/status/${activeRequest.id}`);
        const serverStatus = res.data?.status;
        if (serverStatus && serverStatus !== activeRequest.status) {
          updateRequestStatus(serverStatus, res.data?.mechanic, true);
        }
      } catch {
        // Silently ignore — WebSocket is the primary channel
      }
    };

    const interval = setInterval(() => {
      if (!document.hidden) poll();
    }, 15000);
    const onVisibility = () => { if (!document.hidden) poll(); };
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [activeRequest?.id, activeRequest?.status, updateRequestStatus]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-[100dvh] w-full flex items-center justify-center bg-[var(--background)]">
        <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin border-[var(--primary)]" />
      </div>
    );
  }

  const handleRequestSubmit = async (data) => {
    const location = useTrackingStore.getState().userLocation;
    const lat = Array.isArray(location) ? location[0] : undefined;
    const lng = Array.isArray(location) ? location[1] : undefined;
    await createRequest({
      ...data,
      customerLat: lat,
      customerLng: lng,
    });
  };

  const handlePaymentInitiate = (request) => {
    const req = request ?? useServiceStore.getState().activeRequest;
    const name =
      req?.mechanic?.name ?? activeRequest?.mechanic?.name ?? "the professional";
    setReviewProviderName(name);
    // Use finalized totalAmount from pricing if available, else estimate
    const finalAmount = req?.pricing?.totalAmount ?? req?.priceEstimate?.min ?? activeRequest?.priceEstimate?.min ?? 1200;
    setPaymentAmount(finalAmount);
    setIsPaymentOpen(true);
  };

  const handlePaymentSuccess = (paymentDetails) => {
    setIsPaymentOpen(false);
    completeRequest(paymentDetails);
    setIsReviewOpen(true);
  };

  const handleReviewSubmit = () => {
    setIsReviewOpen(false);
    setReviewProviderName("the professional");
  };

  const handleCancelRequest = () => {
    cancelRequest();
  };

  return (
    <PageTransition>
      <div className="min-h-[100dvh] w-full flex flex-col p-3 sm:p-4 lg:p-6 gap-4 lg:gap-6 relative z-10">
        <div
          className={`absolute -top-32 -right-32 w-[28rem] h-[28rem] rounded-full blur-[140px] pointer-events-none opacity-30 ${
            isLight ? "bg-yellow-400/20" : "bg-emerald-500/15"
          }`}
          style={{ animation: "float-drift 24s ease-in-out infinite" }}
        />
        <div
          className={`absolute bottom-0 -left-20 w-[22rem] h-[22rem] rounded-full blur-[120px] pointer-events-none opacity-20 ${
            isLight ? "bg-amber-300/15" : "bg-teal-400/10"
          }`}
          style={{ animation: "float-drift 28s ease-in-out infinite 5s" }}
        />

        <header className={`glass-lux flex justify-between items-center px-4 lg:px-6 py-3 lg:py-4 flex-shrink-0 relative z-50 ${isLight ? "" : ""}`}>
        <div className="flex items-center gap-2">
          <div className={`w-7 h-7 lg:w-8 lg:h-8 rounded-lg flex items-center justify-center text-white font-bold tracking-tighter ${isLight ? "bg-gradient-to-br from-yellow-400 to-yellow-600" : "bg-gradient-to-br from-emerald-400 to-emerald-600"}`}>
            M
          </div>
          <h1 className={`text-lg lg:text-xl font-bold tracking-tight hidden sm:block ${isLight ? "text-slate-900" : "text-white"}`}>
            ClutchD
          </h1>
        </div>

        <div className={`flex items-center gap-1 p-1 rounded-xl ${isLight ? "bg-slate-100" : "bg-white/5"}`}>
          <button
            onClick={() => setActiveTab("request")}
            className={`flex items-center gap-1.5 px-2.5 lg:px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === "request"
                ? (isLight ? "bg-white text-yellow-700 shadow-sm" : "bg-white/10 text-emerald-300")
                : (isLight ? "text-slate-500 hover:text-slate-700" : "text-white/40 hover:text-white/60")
            }`}
          >
            <Wrench size={14} />
            <span className="hidden xs:inline">Service</span>
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`flex items-center gap-1.5 px-2.5 lg:px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === "history"
                ? (isLight ? "bg-white text-yellow-700 shadow-sm" : "bg-white/10 text-emerald-300")
                : (isLight ? "text-slate-500 hover:text-slate-700" : "text-white/40 hover:text-white/60")
            }`}
          >
            <History size={14} />
            <span className="hidden xs:inline">History</span>
          </button>
        </div>

        <div className="flex items-center gap-2 lg:gap-4">
          <div className="hidden sm:flex flex-col items-end mr-2">
            <span className={`text-sm font-semibold ${isLight ? "text-slate-900" : "text-white"}`}>
              {user?.name || "Customer"}
            </span>
            <span className={`text-[10px] uppercase tracking-wider ${isLight ? "text-yellow-600" : "text-emerald-100/60"}`}>
              Customer Mode
            </span>
          </div>
          <NotificationBell />
          <div className={`w-9 h-9 lg:w-10 lg:h-10 rounded-full flex items-center justify-center ${isLight ? "bg-yellow-500/15 border border-yellow-500/30 text-yellow-600" : "bg-emerald-500/20 border border-emerald-500/30 text-emerald-300"}`}>
            <User size={16} />
          </div>
          <button
            onClick={logout}
            aria-label="Logout"
            className={`w-9 h-9 lg:w-10 lg:h-10 rounded-full flex items-center justify-center transition-colors ${isLight ? "bg-slate-100 hover:bg-red-50 border border-slate-200 hover:border-red-200 text-slate-500 hover:text-red-500" : "bg-white/5 hover:bg-red-500/20 border border-white/10 hover:border-red-500/30 text-white/70 hover:text-red-400"}`}
          >
            <LogOut size={15} />
          </button>
        </div>
      </header>

      {activeTab === "request" ? (
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6 pb-4 lg:pb-6">
          <div className="lg:col-span-7 xl:col-span-8 rounded-2xl overflow-hidden relative shadow-2xl min-h-[250px] sm:min-h-[350px] lg:min-h-[400px]">
            <MapView />

            <div className={`absolute top-4 left-4 z-[400] glass-lux px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-2 ${isLight ? "text-slate-700" : "text-white"}`}>
              <span className={`w-2 h-2 rounded-full animate-pulse ${isLight ? "bg-yellow-500" : "bg-emerald-400"}`} />
              Live Area Map
            </div>
          </div>

          <div className="lg:col-span-5 xl:col-span-4 flex flex-col gap-4 lg:gap-6">
            {!activeRequest ? (
              <>
                <ServiceRequestPanel onSubmit={handleRequestSubmit} />
                <ProviderList />
              </>
            ) : (
              <ServiceStatusTracker
                request={activeRequest}
                onComplete={handlePaymentInitiate}
                onCancel={handleCancelRequest}
              />
            )}
          </div>
        </div>
      ) : (
        <div className="flex-1 pb-4 lg:pb-6">
          <ServiceHistory />
        </div>
      )}

      <PaymentModal
        isOpen={isPaymentOpen}
        onClose={() => setIsPaymentOpen(false)}
        amount={paymentAmount}
        pricing={activeRequest?.pricing}
        jobId={activeRequest?.id}
        onSuccess={handlePaymentSuccess}
      />

      <ReviewModal
        isOpen={isReviewOpen}
        onClose={() => setIsReviewOpen(false)}
        providerName={reviewProviderName}
        onSubmit={handleReviewSubmit}
      />
      <SOSButton />
    </div>
    </PageTransition>
  );
}
