"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { useAuthStore } from "@/store/authStore";
import { useTrackingStore } from "@/store/trackingStore";
import { MessageSquare, Briefcase, BarChart3, Building2, LifeBuoy, Wallet, CheckCircle2 } from "lucide-react";
import { PartnerHome } from "@/components/partner/PartnerHome";
import { useProviderOverview } from "@/hooks/useProviderOverview";
import { money } from "@/components/partner/format";
import { DashboardShell } from "@/components/ui/DashboardShell";
import {
  DashboardTabBar,
  GARAGE_TABS,
  TAB_ALIASES,
  resolveTab,
} from "@/components/dashboard/DashboardTabBar";
import { PartnerTabStrip } from "@/components/partner/PartnerTabStrip";
import { PartnerSupport } from "@/components/partner/PartnerSupport";
import { PartnerBilling } from "@/components/partner/PartnerBilling";
import { ChatPanel } from "@/components/ui/ChatPanel";
import { GarageProfile } from "@/components/garage/GarageProfile";
import { KycDocumentsSection } from "@/components/ui/KycDocumentsSection";
import { GarageJobQueue } from "@/components/garage/GarageJobQueue";
import { GarageAnalytics } from "@/components/garage/GarageAnalytics";
import SplashScreen from "@/components/ui/SplashScreen";
import { NAVIGATION_EVENT } from "@/lib/navigation";

export default function GarageDashboard() {
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const _hydrated = useAuthStore((s) => s._hydrated);
  const router = useRouter();
  const [activeTab, setActiveTab] = useState(() => {
    // Deep-link support: /dashboard/garage?tab=analytics opens that tab.
    if (typeof window === "undefined") return "dashboard";
    const t = new URLSearchParams(window.location.search).get("tab");
    return resolveTab(GARAGE_TABS, t, TAB_ALIASES.garage);
  });

  useEffect(() => {
    if (_hydrated && !isAuthenticated) {
      router.push("/auth");
    }
  }, [_hydrated, isAuthenticated, router]);

  // Role guard: only garages (and admins) belong here — same rationale as the
  // mechanic dashboard guard. Prevents customers from seeing provider actions
  // the backend rejects.
  useEffect(() => {
    if (!_hydrated || !isAuthenticated || !user?.id) return;
    const allowed = ["garage", "admin"];
    if (!allowed.includes(user.role)) {
      router.replace(`/dashboard/${user.role || "customer"}`);
    }
  }, [_hydrated, isAuthenticated, user?.id, user?.role, router]);

  // Request GPS on every login and check in the garage's position to the
  // backend (trackingStore.checkInProviderLocation), so customers nearby
  // discover the garage at its real current location. Same deferred-start
  // pattern as the mechanic dashboard (React 19 flushSync cascade #185).
  useEffect(() => {
    if (!_hydrated || !isAuthenticated) return;
    const id = setTimeout(() => {
      useTrackingStore.getState().requestGPSLocation();
    }, 0);
    return () => clearTimeout(id);
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
      title="Garage Dashboard"
      subtitle="Business Mode"
      user={user}
      mode="garage"
      hideMenu
      hasBottomNav="mobile"
      greeting={user?.name ? { name: user.name } : undefined}
    >
      <div className="flex-1 pb-4 lg:pb-6 space-y-6">
        <PartnerTabStrip tabs={GARAGE_TABS} active={activeTab} onSelect={setActiveTab} />

        {activeTab === "dashboard" && (
          <PartnerHome
            hasError={Object.values(overview.errors).some(Boolean)}
            onRetry={overview.reload}
            stats={[
              { label: "Today's revenue", value: overview.todayEarnings === null ? "—" : money(overview.todayEarnings, 0), icon: Wallet, tone: "success" },
              { label: "Active", value: overview.activeCount ?? "—", icon: Briefcase, tone: "pending" },
              { label: "Completed", value: overview.completedCount === null ? "—" : `${overview.completedCount}${overview.completedCapped ? "+" : ""}`, hint: "All time", icon: CheckCircle2 },
            ]}
            actions={[
              { icon: Briefcase, label: "Jobs", onClick: () => setActiveTab("jobs") },
              { icon: BarChart3, label: "Analytics", onClick: () => setActiveTab("analytics") },
              { icon: Building2, label: "Garage", onClick: () => setActiveTab("profile") },
              { icon: LifeBuoy, label: "Support", onClick: () => setActiveTab("support") },
            ]}
            upcoming={overview.activeJobs ?? undefined}
            onOpenJobs={() => setActiveTab("jobs")}
          />
        )}

        {activeTab === "profile" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
            <GarageProfile />
            <KycDocumentsSection role="garage" />
            <div className="lg:col-span-2"><PartnerBilling role="garage" /></div>
          </div>
        )}

        {activeTab === "jobs" && <GarageJobQueue onChat={openChat} />}

        {activeTab === "support" && <PartnerSupport />}

        {activeTab === "analytics" && <GarageAnalytics />}
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
        tabs={GARAGE_TABS}
        active={activeTab}
        onSelect={setActiveTab}
        className="lg:hidden"
      />
    </DashboardShell>
  );
}
