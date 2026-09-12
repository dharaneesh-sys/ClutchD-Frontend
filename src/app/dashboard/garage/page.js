"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { useAuthStore } from "@/store/authStore";
import { LayoutDashboard, Users, BarChart3, ShoppingBag, MessageSquare, PackagePlus, Store } from "lucide-react";
import { ConnectionIndicator } from "@/components/ui/ConnectionIndicator";
import { NotificationBell } from "@/components/ui/NotificationBell";
import { DashboardShell } from "@/components/ui/DashboardShell";
import { ChatPanel } from "@/components/ui/ChatPanel";
import { GarageProfile } from "@/components/garage/GarageProfile";
import { GarageJobQueue } from "@/components/garage/GarageJobQueue";
import { GarageAnalytics } from "@/components/garage/GarageAnalytics";
import { Logo } from "@/components/ui/Logo";
import SplashScreen from "@/components/ui/SplashScreen";
import { NAVIGATION_EVENT } from "@/lib/navigation";
import { Modal } from "@/components/ui/Modal";
import { SellerProductForm } from "@/components/marketplace/SellerProductForm";
import { MyListings } from "@/components/marketplace/MyListings";

export default function GarageDashboard() {
  const user = useAuthStore((s) => s.user);
  const [sellOpen, setSellOpen] = useState(false);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const _hydrated = useAuthStore((s) => s._hydrated);
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("dashboard");

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
    { icon: PackagePlus, label: "Sell Part", onClick: () => setSellOpen(true) },
    { icon: Store, label: "My Listings", onClick: () => setActiveTab("mylistings") },
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

        {activeTab === "mylistings" && (
          <div className="grid grid-cols-1 gap-4 lg:gap-6">
            <MyListings onAddNew={() => setSellOpen(true)} />
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

      {/* ── Sell Part modal (1 tap from sidebar) ─────────────────────── */}
      <Modal
        isOpen={sellOpen}
        onClose={() => setSellOpen(false)}
        title="Sell a part"
      >
        <SellerProductForm
          onSuccess={() => {
            setSellOpen(false);
            setActiveTab("mylistings");
          }}
        />
      </Modal>
    </DashboardShell>
  );
}
