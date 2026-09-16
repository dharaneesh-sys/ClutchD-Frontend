"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { useAuthStore } from "@/store/authStore";
import { LayoutDashboard, Users, BarChart3, ShoppingBag, MessageSquare } from "lucide-react";
import { ConnectionIndicator } from "@/components/ui/ConnectionIndicator";
import { NotificationBell } from "@/components/ui/NotificationBell";
import { DashboardShell } from "@/components/ui/DashboardShell";
import { ChatPanel } from "@/components/ui/ChatPanel";
import { GarageProfile } from "@/components/garage/GarageProfile";
import { KycDocumentsSection } from "@/components/ui/KycDocumentsSection";
import { GarageJobQueue } from "@/components/garage/GarageJobQueue";
import { GarageAnalytics } from "@/components/garage/GarageAnalytics";
import { Logo } from "@/components/ui/Logo";
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
    return ["dashboard", "profile", "analytics"].includes(t) ? t : "dashboard";
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
    if (user.id.startsWith("demo-")) return;
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

  if (!_hydrated) {
    return <SplashScreen />;
  }

  const sidebarItems = [
    { icon: LayoutDashboard, label: "Dashboard", onClick: () => setActiveTab("dashboard") },
    { icon: Users, label: "Garage Profile", onClick: () => setActiveTab("profile") },
    { icon: BarChart3, label: "Analytics", onClick: () => setActiveTab("analytics") },
    { icon: ShoppingBag, label: "Parts Store", onClick: () => router.push("/marketplace") },
  ];

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
      sidebar={sidebarItems}
    >
      <div className="flex-1 pb-4 lg:pb-6">
        {activeTab === "dashboard" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6">
            <div className="lg:col-span-5 xl:col-span-4 flex flex-col gap-4 lg:gap-6">
              <div>
                <GarageProfile />
              </div>
              <div>
                <KycDocumentsSection role="garage" />
              </div>
              <div>
                <GarageAnalytics />
              </div>
            </div>
            <div className="lg:col-span-7 xl:col-span-8 flex flex-col gap-4 lg:gap-6">
              <div>
                <GarageJobQueue onChat={openChat} />
              </div>
            </div>
          </div>
        )}

        {activeTab === "profile" && (
          <div className="grid grid-cols-1 gap-4 lg:gap-6">
            <div>
              <GarageProfile />
            </div>
            <div>
              <KycDocumentsSection role="garage" />
            </div>
            <div>
              <GarageAnalytics />
            </div>
          </div>
        )}

        {activeTab === "analytics" && (
          <div className="grid grid-cols-1 gap-4 lg:gap-6">
            <div>
              <GarageAnalytics />
            </div>
          </div>
        )}

      </div>

      {/* ── Chat button (appears when a job is active) ──────────────── */}
      {chatJobId && (
        <div className="fixed bottom-6 right-6 z-[800] flex flex-col items-end gap-3">
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
            className="w-14 h-14 rounded-full flex items-center justify-center transition-all active-press
                       shadow-[0_8px_32px_rgba(var(--color-primary-rgb),0.3)]
                       bg-primary text-white hover:shadow-[0_12px_40px_rgba(var(--color-primary-rgb),0.4)] hover-lift"
            aria-label={chatOpen ? "Close chat" : "Chat with customer"}
          >
            <MessageSquare size={22} />
          </button>
        </div>
      )}

    </DashboardShell>
  );
}
