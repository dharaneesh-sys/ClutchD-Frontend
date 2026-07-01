"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import "leaflet/dist/leaflet.css";
import "react-leaflet-cluster/dist/assets/MarkerCluster.css";
import "react-leaflet-cluster/dist/assets/MarkerCluster.Default.css";
import { useServiceStore } from "@/store/serviceStore";
import { useAuthStore } from "@/store/authStore";
import { useTrackingStore } from "@/store/trackingStore";
import { useDemoMode } from "@/lib/demo/demoMode";
import { ServiceRequestPanel } from "@/components/dashboard/ServiceRequestPanel";
import { ServiceStatusTracker } from "@/components/dashboard/ServiceStatusTracker";
import { ProviderList } from "@/components/dashboard/ProviderList";
import { PaymentModal } from "@/components/dashboard/PaymentModal";
import { ReviewModal } from "@/components/dashboard/ReviewModal";
import { NotificationBell } from "@/components/ui/NotificationBell";
import { SOSButton } from "@/components/ui/SOSButton";
import { DashboardShell } from "@/components/ui/DashboardShell";
import { History, Wrench, Calendar, ShoppingBag } from "lucide-react";
import { SERVICE_STATUS } from "@/lib/constants";
import { ScheduleBookingModal } from "@/components/dashboard/ScheduleBookingModal";
import api from "@/lib/api";
import { NAVIGATION_EVENT } from "@/lib/navigation";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/ui/Logo";

const MapView = dynamic(
  () => import("../../../components/dashboard/MapView"),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full bg-stone-100 dark:bg-zinc-900 rounded-2xl animate-pulse" />
    ),
  }
);

const ServiceHistory = dynamic(
  () => import("../../../components/dashboard/ServiceHistory").then(m => ({ default: m.ServiceHistory })),
  { ssr: false, loading: () => <div className="flex-1 flex items-center justify-center"><div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin border-amber-500 dark:border-primary" /></div> }
);

const MarketplaceHome = dynamic(
  () => import("@/app/marketplace/page"),
  { ssr: false, loading: () => <div className="w-full h-64 animate-pulse bg-surface-container-low rounded-2xl" /> }
);

const TABS = [
  { key: "request", icon: Wrench, label: "Service" },
  { key: "schedule", icon: Calendar, label: "Schedule" },
  { key: "store", icon: ShoppingBag, label: "Parts Store" },
  { key: "history", icon: History, label: "History" },
];

export default function CustomerDashboard() {
  const { user, logout, isAuthenticated, _hydrated } = useAuthStore();
  const { activeRequest, createRequest, cancelRequest, restoreActiveRequest } = useServiceStore();
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
  const [activeTab, setActiveTab] = useState("request"); // "request" | "history" | "schedule" | "store"
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [isScheduleLoading, setIsScheduleLoading] = useState(false);
  const paymentTriggeredRef = useRef(false);

  const { isDemoMode, isTourActive } = useDemoMode();
  const router = useRouter();

  useEffect(() => {
    if (_hydrated && !isAuthenticated) {
      router.push("/auth");
    }
  }, [_hydrated, isAuthenticated, router]);

  // Listen for navigation events from non-React contexts (e.g., axios interceptors)
  useEffect(() => {
    const handleNavigation = (event) => {
      const { path } = event.detail;
      if (path) {
        router.push(path);
      }
    };
    window.addEventListener(NAVIGATION_EVENT, handleNavigation);
    return () => window.removeEventListener(NAVIGATION_EVENT, handleNavigation);
  }, [router]);

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

  useEffect(() => {
    if (isDemoMode && isTourActive && activeRequest?.status === "payment_pending" && 
        !isPaymentOpen && !paymentTriggeredRef.current) {
      paymentTriggeredRef.current = true;
      const timer = setTimeout(() => {
        handlePaymentInitiate(activeRequest);
      }, 600);
      return () => clearTimeout(timer);
    }
    if (activeRequest?.status !== "payment_pending") {
      paymentTriggeredRef.current = false;
    }
  }, [isDemoMode, isTourActive, activeRequest?.status, isPaymentOpen]); // eslint-disable-line react-hooks/exhaustive-deps

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
  }, [activeRequest?.id, activeRequest?.status, updateRequestStatus]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!_hydrated || !isAuthenticated) {
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

  const handleScheduleSubmit = async (scheduledAt) => {
    setIsScheduleLoading(true);
    try {
      await createRequest({ scheduledAt });
      setIsScheduleModalOpen(false);
    } finally {
      setIsScheduleLoading(false);
    }
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
    <>
    <DashboardShell
      title="Customer Dashboard"
      subtitle="Customer Mode"
      user={user}
      mode="customer"
      hideMobileMenu
      hasBottomNav
    >

      {activeTab === "schedule" ? (
        <div className="flex-1 pb-4 lg:pb-6">
          <div className="max-w-lg mx-auto">
            <div className="glass-lux p-8 rounded-2xl text-center">
              <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 bg-surface-soft">
                <Calendar size={40} className="text-icon-highlight" />
              </div>
              <h2 className="text-2xl font-bold mb-2 text-text-primary">
                Schedule a Service
              </h2>
              <p className="text-sm text-text-muted mb-8 max-w-sm mx-auto">
                Book a date and time that works for you. We&apos;ll dispatch a
                professional at your chosen slot.
              </p>
              <Button
                onClick={() => setIsScheduleModalOpen(true)}
                className="w-full sm:w-auto"
                size="lg"
              >
                <Calendar size={18} className="mr-2" />
                Book Appointment
              </Button>
            </div>
          </div>
        </div>
      ) : activeTab === "store" ? (
        <div className="flex-1 overflow-y-auto page-enter">
          <MarketplaceHome />
        </div>
      ) : activeTab === "request" ? (
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6 pb-4 lg:pb-6">
          <div className="lg:col-span-7 xl:col-span-8 rounded-2xl overflow-hidden relative shadow-2xl min-h-[250px] sm:min-h-[350px] lg:min-h-[400px]">
            <MapView />

            <div className="absolute top-4 left-4 z-[400] glass-lux px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-2 text-foreground">
              <span className="w-2 h-2 rounded-full bg-yellow-500 dark:bg-primary-light" />
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

      <ScheduleBookingModal
        isOpen={isScheduleModalOpen}
        onClose={() => setIsScheduleModalOpen(false)}
        onSubmit={handleScheduleSubmit}
        isLoading={isScheduleLoading}
      />

      <ReviewModal
        isOpen={isReviewOpen}
        onClose={() => setIsReviewOpen(false)}
        providerName={reviewProviderName}
        onSubmit={handleReviewSubmit}
      />
    </DashboardShell>

    {/* ─── Bottom Tab Bar — All Sizes ────────────────────────────────── */}
    <nav className="flex fixed bottom-0 left-0 right-0 z-40 bg-bg-card/85 backdrop-blur-2xl border-t border-border-subtle pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_20px_rgba(0,0,0,0.12)]">
      <div className="flex items-center justify-around h-14 px-1 max-w-lg mx-auto w-full">
        {TABS.map(({ key, icon: Icon, label }) => {
          const isActive = activeTab === key;
          const isStore = key === "store";
          return (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={cn(
                "relative flex flex-col items-center justify-center gap-0.5 flex-1 h-full py-1 rounded-xl transition-all duration-200",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
                isActive && !isStore && "bg-surface-soft"
              )}
              aria-label={label}
              aria-current={isActive ? "page" : undefined}
            >
              <div className={cn(
                "relative flex items-center justify-center w-7 h-7 rounded-lg transition-colors duration-200",
                isActive && !isStore && "text-primary",
                !isActive && !isStore && "text-text-muted",
                isStore && "text-emerald-400"
              )}>
                <Icon size={isStore ? 20 : 22} />
                {isStore && (
                  <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.6)]" />
                )}
              </div>
              <span className={cn(
                "text-[10px] font-semibold leading-none transition-colors duration-200",
                isActive && !isStore && "text-primary",
                !isActive && !isStore && "text-text-muted",
                isStore && "text-emerald-400/90"
              )}>
                {label}
              </span>
              {/* Active indicator line */}
              {isActive && !isStore && (
                <span className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-6 h-0.5 rounded-full bg-primary" />
              )}
              {/* Store badge dot */}
              {isStore && (
                <span className="absolute -top-0.5 right-1/4 w-1.5 h-1.5 rounded-full bg-emerald-400" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
    <SOSButton />
  </>
);
}
