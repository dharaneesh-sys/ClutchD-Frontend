"use client";

import { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import "leaflet/dist/leaflet.css";
import "react-leaflet-cluster/dist/assets/MarkerCluster.css";
import "react-leaflet-cluster/dist/assets/MarkerCluster.Default.css";
import { useServiceStore } from "@/store/serviceStore";
import { useAuthStore } from "@/store/authStore";
import { useTrackingStore } from "@/store/trackingStore";
import { ServiceRequestPanel } from "@/components/dashboard/ServiceRequestPanel";
import { ServiceStatusTracker } from "@/components/dashboard/ServiceStatusTracker";
import { ETAIndicator } from "@/components/dashboard/ETAIndicator";
import { ProviderList } from "@/components/dashboard/ProviderList";
import { MaintenanceAlertBanner } from "@/components/dashboard/MaintenanceAlertBanner";
import { PaymentModal } from "@/components/dashboard/PaymentModal";
import { ReviewModal } from "@/components/dashboard/ReviewModal";
import { NotificationBell } from "@/components/ui/NotificationBell";
import { DashboardShell } from "@/components/ui/DashboardShell";
import { ChatPanel } from "@/components/ui/ChatPanel";
import { History, Wrench, Calendar, ShoppingBag, MessageSquare, Car, X } from "lucide-react";
import { SERVICE_STATUS, MAP_DEFAULT_CENTER } from "@/lib/constants";
import { ScheduleBookingModal } from "@/components/dashboard/ScheduleBookingModal";
import { ScheduledAppointments } from "@/components/dashboard/ScheduledAppointments";
import api from "@/lib/api";
import { NAVIGATION_EVENT } from "@/lib/navigation";
import { serviceRequestSchema } from "@/lib/validators";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/ui/Logo";
import SplashScreen from "@/components/ui/SplashScreen";
import { useToastStore } from "@/store/toastStore";

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
  { ssr: false, loading: () => <div className="flex-1 flex items-center justify-center"><div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin border-[#1E29B6] dark:border-primary" /></div> }
);

const MarketplaceHome = dynamic(
  () => import("@/app/marketplace/page"),
  { ssr: false, loading: () => <div className="w-full h-64 animate-pulse bg-surface-container-low rounded-2xl" /> }
);

const VehicleList = dynamic(
  () => import("../../../components/dashboard/VehicleList").then(m => ({ default: m.VehicleList })),
  { ssr: false, loading: () => <div className="flex-1 flex items-center justify-center"><div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin border-[#1E29B6] dark:border-primary" /></div> }
);

const TABS = [
  { key: "request", icon: Wrench, label: "Service" },
  { key: "schedule", icon: Calendar, label: "Schedule" },
  { key: "vehicles", icon: Car, label: "Vehicles" },
  { key: "store", icon: ShoppingBag, label: "Parts Store" },
  { key: "history", icon: History, label: "History" },
];

export default function CustomerDashboard() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const _hydrated = useAuthStore((s) => s._hydrated);
  const activeRequest = useServiceStore((s) => s.activeRequest);
  const createRequest = useServiceStore((s) => s.createRequest);
  const cancelRequest = useServiceStore((s) => s.cancelRequest);
  const restoreActiveRequest = useServiceStore((s) => s.restoreActiveRequest);
  const isLoading = useServiceStore((s) => s.isLoading);
  const error = useServiceStore((s) => s.error);
  const clearError = useServiceStore((s) => s.clearError);
  const mechanicLocation = useTrackingStore((s) => s.mechanicLocation);
  const userLocation = useTrackingStore((s) => s.userLocation);
  const updateRequestStatus = useCallback(
    (...args) => useServiceStore.getState().updateRequestStatus(...args),
    []
  );
  const completeRequest = useCallback(
    (...args) => useServiceStore.getState().completeRequest(...args),
    []
  );
  const holdPayment = useCallback(
    (...args) => useServiceStore.getState().holdPayment(...args),
    []
  );
  const releasePayment = useCallback(
    () => useServiceStore.getState().releasePayment(),
    []
  );
  const disputePayment = useCallback(
    (reason) => useServiceStore.getState().disputePayment(reason),
    []
  );

  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [reviewProviderName, setReviewProviderName] = useState("the professional");
  const [paymentAmount, setPaymentAmount] = useState(1200);
  const [activeTab, setActiveTab] = useState("request"); // "request" | "history" | "schedule" | "store"
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [isScheduleLoading, setIsScheduleLoading] = useState(false);
  const [vehicles, setVehicles] = useState([]);
  const toast = useToastStore();
  // A real pickup location is required before dispatch: either GPS-granted
  // or manually searched. MAP_DEFAULT_CENTER means the user hasn't set one.
  const isLocationReady = Boolean(
    userLocation &&
    (userLocation[0] !== MAP_DEFAULT_CENTER[0] ||
      userLocation[1] !== MAP_DEFAULT_CENTER[1])
  );

  useEffect(() => {
    api
      .get("/vehicles")
      .then((res) => setVehicles(res.data))
      .catch(() => {
        toast.error("Could not load your saved vehicles. Please try again later.");
      });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleReleasePayment = useCallback(() => {
    releasePayment();
    setIsReviewOpen(true);
  }, [releasePayment]);

  const handleDisputePayment = useCallback((reason) => {
    disputePayment(reason);
  }, [disputePayment]);

  /* ── Chat state ────────────────────────────────────────────────── */
  const [chatOpen, setChatOpen] = useState(false);
  const chatJobId = activeRequest?.id;
  const chatOtherName = activeRequest?.mechanic?.name || "Mechanic";
  const chatOtherRole = "mechanic";
  const hasMechanic =
    activeRequest &&
    (activeRequest.status === "assigned" ||
     activeRequest.status === "en_route" ||
     activeRequest.status === "in_progress" ||
     activeRequest.status === "payment_pending" ||
     activeRequest.status === "payment_escrow" ||
     activeRequest.status === "payment_released");

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
      // Defer to break React 19's flushSync cascade (error 185)
      // Without this, the store mutation during effect flush triggers
      // useSyncExternalStore → flushSync → nestedUpdateCount accumulation
      const id = setTimeout(() => {
        useTrackingStore.getState().requestGPSLocation();
      }, 0);
      return () => clearTimeout(id);
    }
  }, [isAuthenticated]);

  // Restore active request on mount (handles page refresh)
  // Deferred via setTimeout(0) to break React 19 flushSync cascade (#185)
  useEffect(() => {
    if (isAuthenticated && !activeRequest) {
      const id = setTimeout(() => restoreActiveRequest(), 0);
      return () => clearTimeout(id);
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
  }, [activeRequest?.id, activeRequest?.status, updateRequestStatus]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!_hydrated) {
    return <SplashScreen />;
  }

  const handleRequestSubmit = async (data) => {
    const location = useTrackingStore.getState().userLocation;
    const lat = Array.isArray(location) ? location[0] : undefined;
    const lng = Array.isArray(location) ? location[1] : undefined;
    try {
      await createRequest({
        ...data,
        customerLat: lat,
        customerLng: lng,
      });
    } catch {
      /* error captured in serviceStore — displayed by ServiceRequestPanel */
    }
  };

  const handleDismissError = () => clearError();

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

  const handleScheduleSubmit = async ({ scheduledAt, vehicleId, notes }) => {
    if (!isLocationReady) {
      toast.warning(
        'Set your pickup location first — use "Locate Me" or search your address.'
      );
      return;
    }
    setIsScheduleLoading(true);
    try {
      const location = useTrackingStore.getState().userLocation;
      const lat = Array.isArray(location) ? location[0] : undefined;
      const lng = Array.isArray(location) ? location[1] : undefined;
      // Scheduled bookings have no dedicated issue picker yet — default to
      // "other" and fold free-form notes into description so the payload
      // passes the same validation ServiceRequestPanel enforces.
      const trimmedNotes = typeof notes === "string" ? notes.trim() : "";
      const payload = {
        issueTag: "other",
        description:
          trimmedNotes.length >= 10
            ? trimmedNotes
            : `Scheduled service booking${trimmedNotes ? `: ${trimmedNotes}` : ""}`,
        requestType: "auto",
        customerLat: lat,
        customerLng: lng,
        scheduledAt,
        vehicleId,
      };
      const parsed = serviceRequestSchema.safeParse(payload);
      if (!parsed.success) {
        throw new Error(parsed.error.issues[0]?.message ?? "Invalid schedule details");
      }
      await createRequest(payload);
      setIsScheduleModalOpen(false);
    } catch {
      /* error captured in serviceStore — modal stays open for retry */
    } finally {
      setIsScheduleLoading(false);
    }
  };

  const handlePaymentSuccess = (paymentDetails) => {
    setIsPaymentOpen(false);
    // After payment is collected, money moves into escrow
    holdPayment(paymentDetails);
    // Review opens later, after customer releases the escrowed payment
  };

  const handleReviewSubmit = () => {
    setIsReviewOpen(false);
    setReviewProviderName("the professional");
  };

  const handleCancelRequest = () => {
    cancelRequest();
  };

  const handleVehicleChange = (vehicleId, vehicle) => {
    useServiceStore.getState().updateVehicle(vehicleId, vehicle);
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

      <MaintenanceAlertBanner />

      {activeTab === "schedule" ? (
        <div className="flex-1 pb-4 lg:pb-6">
          <ScheduledAppointments
            onBook={() => setIsScheduleModalOpen(true)}
          />
        </div>
      ) : activeTab === "store" ? (
        <div className="flex-1 overflow-y-auto page-enter">
          <MarketplaceHome />
        </div>
      ) : activeTab === "request" ? (
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6 pb-4 lg:pb-6">
          <div className="lg:col-span-7 xl:col-span-8 rounded-2xl overflow-hidden relative shadow-2xl min-h-[250px] sm:min-h-[350px] lg:min-h-[400px]">
            <MapView role="customer" />

            <div className="absolute top-4 left-4 z-[400] glass-lux px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-2 text-foreground">
              <span className="w-2 h-2 rounded-full bg-[#1E29B6] dark:bg-primary-light" />
              Live Area Map
            </div>
          </div>

          <div className="lg:col-span-5 xl:col-span-4 flex flex-col gap-4 lg:gap-6">
            {!activeRequest ? (
              <>
                <ServiceRequestPanel onSubmit={handleRequestSubmit} isLoading={isLoading} error={error} onDismissError={handleDismissError} />
                <ProviderList />
              </>
            ) : (
              <>
                <ServiceStatusTracker
                  request={activeRequest}
                  onComplete={handlePaymentInitiate}
                  onCancel={handleCancelRequest}
                  onReleasePayment={handleReleasePayment}
                  onDisputePayment={handleDisputePayment}
                  onVehicleChange={handleVehicleChange}
                />
                <ETAIndicator
                  mechanicLocation={mechanicLocation}
                  userLocation={userLocation}
                  status={activeRequest.status}
                />
              </>
            )}
          </div>
        </div>
      ) : activeTab === "vehicles" ? (
        <div className="flex-1 pb-4 lg:pb-6">
          <VehicleList />
        </div>
      ) : activeTab === "history" ? (
        <div className="flex-1 pb-4 lg:pb-6">
          <ServiceHistory />
        </div>
      ) : null}

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
        vehicles={vehicles}
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
          return (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={cn(
                "relative flex flex-col items-center justify-center gap-0.5 flex-1 h-full py-1 rounded-xl transition-all duration-200",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
                isActive && "bg-surface-soft"
              )}
              aria-label={label}
              aria-current={isActive ? "page" : undefined}
            >
              <div className={cn(
                "relative flex items-center justify-center w-7 h-7 rounded-lg transition-colors duration-200",
                isActive && "text-primary",
                !isActive && "text-text-muted"
              )}>
                <Icon size={22} />
              </div>
              <span className={cn(
                "text-[10px] font-semibold leading-none transition-colors duration-200",
                isActive && "text-primary",
                !isActive && "text-text-muted"
              )}>
                {label}
              </span>
              {/* Active indicator line */}
              {isActive && (
                <span className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-6 h-0.5 rounded-full bg-primary" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
    {/* SOS lives in BottomNav Menu / ProfileMenu / Safety page — no floating overlay */}

    {/* ── Chat button (appears when mechanic is assigned) ──────────── */}
    {hasMechanic && chatJobId && (
      <div className="fixed bottom-24 right-6 z-[800] flex flex-col items-end gap-3">
        {chatOpen && (
          <ChatPanel
            jobId={chatJobId}
            otherUserName={chatOtherName}
            otherUserRole={chatOtherRole}
            onClose={() => setChatOpen(false)}
          />
        )}
        <button
          onClick={() => setChatOpen((o) => !o)}
          className={cn(
            "w-14 h-14 rounded-full flex items-center justify-center transition-all active-press",
            "shadow-[0_8px_32px_rgba(var(--color-primary-rgb),0.3)]",
            chatOpen
              ? "bg-red-500/20 border border-red-400/30 text-red-400 rotate-45"
              : "bg-primary text-white hover:shadow-[0_12px_40px_rgba(var(--color-primary-rgb),0.4)] hover-lift"
          )}
          aria-label={chatOpen ? "Close chat" : "Chat with mechanic"}
        >
          {chatOpen ? (
            <X size={22} />
          ) : (
            <MessageSquare size={22} />
          )}
        </button>
      </div>
    )}
  </>
);
}
