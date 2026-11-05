"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import dynamic from "next/dynamic";
import "leaflet/dist/leaflet.css";
import "react-leaflet-cluster/dist/assets/MarkerCluster.css";
import "react-leaflet-cluster/dist/assets/MarkerCluster.Default.css";
import { ProfileEditor } from "@/components/mechanic/ProfileEditor";
import { KycDocumentsSection } from "@/components/ui/KycDocumentsSection";
import { AvailabilityToggle } from "@/components/mechanic/AvailabilityToggle";
import { IncomingJobs } from "@/components/mechanic/IncomingJobs";
import { EarningsChart } from "@/components/mechanic/EarningsChart";
import { useAuthStore } from "@/store/authStore";
import { useTrackingStore } from "@/store/trackingStore";
import { Briefcase, X, MessageSquare, Power, MapPin, Wallet, History, LifeBuoy, CheckCircle2 } from "lucide-react";
import { DashboardShell } from "@/components/ui/DashboardShell";
import { PartnerHome } from "@/components/partner/PartnerHome";
import { ProviderHistory } from "@/components/partner/ProviderHistory";
import { useProviderOverview } from "@/hooks/useProviderOverview";
import { money } from "@/components/partner/format";
import {
  DashboardTabBar,
  MECHANIC_TABS,
  TAB_ALIASES,
  resolveTab,
} from "@/components/dashboard/DashboardTabBar";
import { PartnerTabStrip } from "@/components/partner/PartnerTabStrip";
import { PartnerSupport } from "@/components/partner/PartnerSupport";
import { PartnerBilling } from "@/components/partner/PartnerBilling";
import { ChatPanel } from "@/components/ui/ChatPanel";
import SplashScreen from "@/components/ui/SplashScreen";
import { NAVIGATION_EVENT } from "@/lib/navigation";
import { Modal } from "@/components/ui/Modal";

const NavigationMap = dynamic(
  () => import("../../../components/dashboard/MapView"),
  { 
    ssr: false,
    loading: () => <div className="w-full h-full bg-surface-soft rounded-2xl animate-pulse" />
  }
);

export default function MechanicDashboard() {
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const _hydrated = useAuthStore((s) => s._hydrated);
  const router = useRouter();
  const [activeTab, setActiveTab] = useState(() => {
    // Deep-link support: /dashboard/mechanic?tab=earnings opens that tab.
    // Legacy ?tab=jobs resolves to Home.
    if (typeof window === "undefined") return "home";
    const t = new URLSearchParams(window.location.search).get("tab");
    return resolveTab(MECHANIC_TABS, t, TAB_ALIASES.mechanic);
  });
  const [jobsPanelOpen, setJobsPanelOpen] = useState(true);

  useEffect(() => {
    if (_hydrated && !isAuthenticated) {
      router.push("/auth");
    }
  }, [_hydrated, isAuthenticated, router]);

  // Role guard: only mechanics (and admins) belong here. A customer/garage/
  // seller that somehow lands on this route would see provider actions that
  // the backend then rejects ("Providers only") — bounce them to their own
  // dashboard instead.
  useEffect(() => {
    if (!_hydrated || !isAuthenticated || !user?.id) return;
    const allowed = ["mechanic", "admin"];
    if (!allowed.includes(user.role)) {
      router.replace(`/dashboard/${user.role || "customer"}`);
    }
  }, [_hydrated, isAuthenticated, user?.id, user?.role, router]);

  // Request GPS and continuously watch position for navigation routing
  // Deferred via setTimeout(0) to break React 19's flushSync cascade (#185)
  // — the synchronous store mutations (setState) would otherwise trigger
  // useSyncExternalStore → forceStoreRerender → nestedUpdateCount++
  useEffect(() => {
    if (!_hydrated || !isAuthenticated) return;
    let stopWatching = () => {};
    const id = setTimeout(() => {
      useTrackingStore.getState().requestGPSLocation();
      stopWatching = useTrackingStore.getState().watchGPSLocation();
    }, 0);
    return () => {
      clearTimeout(id);
      stopWatching();
    };
  }, [_hydrated, isAuthenticated]);

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

  /* ── Chat state ────────────────────────────────────────────────── */
  const [chatOpen, setChatOpen] = useState(false);
  const [chatJobId, setChatJobId] = useState(null);
  const [chatOtherName, setChatOtherName] = useState("Customer");
  const overview = useProviderOverview();

  if (!_hydrated) {
    return <SplashScreen />;
  }

  const openChat = (jobId, customerName) => {
    setChatJobId(jobId);
    setChatOtherName(customerName || "Customer");
    setChatOpen(true);
  };

  return (
    <DashboardShell
      title="Mechanic Dashboard"
      subtitle="Provider Mode"
      user={user}
      mode="mechanic"
      hideMenu
      hasBottomNav="mobile"
      greeting={user?.name ? { name: user.name.split(" ")[0] } : undefined}
    >
      <div className="flex-1 pb-4 lg:pb-6 space-y-6">
        <PartnerTabStrip tabs={MECHANIC_TABS} active={activeTab} onSelect={setActiveTab} />

        {activeTab === "home" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6">
            <div className="lg:col-span-7 flex flex-col gap-5">
              <PartnerHome
                availability={<AvailabilityToggle />}
                hasError={Object.values(overview.errors).some(Boolean)}
                onRetry={overview.reload}
                stats={[
                  { label: "Today", value: overview.todayEarnings === null ? "—" : money(overview.todayEarnings, 0), icon: Wallet, tone: "success" },
                  { label: "Completed", value: overview.completedCount === null ? "—" : `${overview.completedCount}${overview.completedCapped ? "+" : ""}`, hint: "All time", icon: CheckCircle2 },
                  { label: "Active", value: overview.activeCount ?? "—", icon: Briefcase, tone: "pending" },
                ]}
                actions={[
                  { icon: Power, label: "Status", onClick: () => document.querySelector('[role="switch"]')?.focus() },
                  { icon: MapPin, label: "Navigation", onClick: () => setActiveTab("navigation") },
                  { icon: Wallet, label: "Earnings", onClick: () => setActiveTab("earnings") },
                  { icon: History, label: "History", onClick: () => setActiveTab("history") },
                  { icon: LifeBuoy, label: "Support", onClick: () => setActiveTab("support") },
                ]}
              />
              <IncomingJobs onChat={openChat} />
            </div>
            <div className="lg:col-span-5 flex flex-col gap-4 lg:gap-6">
              <ProfileEditor />
              <KycDocumentsSection role="mechanic" />
            </div>
          </div>
        )}

        {activeTab === "navigation" && (
          <div className="relative h-[calc(100dvh-220px)] min-h-[360px] rounded-2xl overflow-hidden border border-[var(--border)]">
            <NavigationMap role="mechanic" />
            <div className={`absolute inset-x-3 bottom-3 sm:inset-x-auto sm:right-3 sm:top-3 sm:bottom-auto z-[400] sm:w-96 transition-opacity motion-reduce:transition-none ${jobsPanelOpen ? "opacity-100" : "opacity-0 pointer-events-none"}`}>
              <div className="glass-overlay rounded-2xl overflow-hidden max-h-[50vh] flex flex-col">
                <div className="flex items-center justify-between px-4 py-2 border-b border-[var(--glass-overlay-border)]">
                  <span className="flex items-center gap-2 text-sm font-semibold text-[var(--foreground)]">
                    <Briefcase size={15} aria-hidden="true" /> Jobs
                  </span>
                  <button type="button" onClick={() => setJobsPanelOpen(false)} aria-label="Hide jobs" className="flex h-11 w-11 items-center justify-center rounded-lg text-[var(--text-muted)] hover:bg-[var(--surface-soft)]">
                    <X size={16} />
                  </button>
                </div>
                <div className="overflow-y-auto p-3 custom-scrollbar">
                  <IncomingJobs onChat={openChat} />
                </div>
              </div>
            </div>
            {!jobsPanelOpen && (
              <button type="button" onClick={() => setJobsPanelOpen(true)} className="absolute bottom-3 right-3 z-[400] glass-overlay flex h-14 items-center gap-2 rounded-full px-5 text-sm font-semibold text-[var(--foreground)]">
                <Briefcase size={18} aria-hidden="true" /> Jobs
              </button>
            )}
          </div>
        )}

        {activeTab === "earnings" && (
          <div className="space-y-4">
            <EarningsChart earnings={overview.earnings} error={overview.errors.earnings} onRetry={overview.reload} />
            <PartnerBilling role="mechanic" />
          </div>
        )}

        {activeTab === "history" && (
          <ProviderHistory jobs={overview.history} error={overview.errors.history} onRetry={overview.reload} />
        )}

        {activeTab === "support" && <PartnerSupport />}

      </div>

      {/* ── Chat button (appears when a job is active) ──────────────── */}
      {chatJobId && (
        <div className="fixed bottom-[calc(64px+env(safe-area-inset-bottom)+16px)] lg:bottom-6 right-4 lg:right-6 z-[800] flex flex-col items-end gap-3">
          {chatOpen && (
            <ChatPanel
              jobId={chatJobId}
              otherUserName={chatOtherName}
              otherUserRole="customer"
              onClose={() => setChatOpen(false)}
            />
          )}
          <button
            onClick={() => setChatOpen((o) => !o)}
            className="w-14 h-14 rounded-full flex items-center justify-center shadow-[var(--elevation-3)] bg-[var(--primary)] text-[var(--on-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2"
            aria-label={chatOpen ? "Close chat" : "Chat with customer"}
          >
            <MessageSquare size={22} />
          </button>
        </div>
      )}

      <DashboardTabBar
        tabs={MECHANIC_TABS}
        active={activeTab}
        onSelect={setActiveTab}
        className="lg:hidden"
      />
    </DashboardShell>
  );
}
