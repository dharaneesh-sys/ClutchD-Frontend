"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Truck,
  Building2,
  Calendar,
  LogOut,
  MessageSquare,
} from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { useFleetStore } from "@/store/fleetStore";
import { DashboardShell } from "@/components/ui/DashboardShell";
import { ChatPanel } from "@/components/ui/ChatPanel";
import { FleetRegistrationForm } from "@/components/fleet/FleetRegistrationForm";
import { FleetDashboard } from "@/components/fleet/FleetDashboard";
import { FleetBookingPanel } from "@/components/dashboard/fleet/FleetBookingPanel";
import { BookingConfirmation } from "@/components/dashboard/fleet/BookingConfirmation";
import { NAVIGATION_EVENT } from "@/lib/navigation";

export default function FleetDashboardPage() {
  const { user, logout, isAuthenticated, _hydrated } = useAuthStore();
  const { initialize, initialized, lastBooking, clearLastBooking } = useFleetStore();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [hasRegistration, setHasRegistration] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatJobId, setChatJobId] = useState(null);
  const [chatOtherName, setChatOtherName] = useState("Support");

  // Check if a fleet registration exists in localStorage
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem("clutchd-fleet-registration");
      setHasRegistration(!!raw);
      if (!raw) {
        setActiveTab("register");
      }
    } catch {
      setHasRegistration(false);
      setActiveTab("register");
    }
  }, []);

  useEffect(() => {
    if (_hydrated && !isAuthenticated) {
      router.push("/auth");
    }
  }, [_hydrated, isAuthenticated, router]);

  // Listen for navigation events
  useEffect(() => {
    const handleNavigation = (event) => {
      const { path } = event.detail;
      if (path) router.push(path);
    };
    window.addEventListener(NAVIGATION_EVENT, handleNavigation);
    return () => window.removeEventListener(NAVIGATION_EVENT, handleNavigation);
  }, [router]);

  // Initialize fleet store data once
  useEffect(() => {
    if (hasRegistration && !initialized) {
      initialize();
    }
  }, [hasRegistration, initialized, initialize]);

  const handleRegistered = useCallback((_data, goToDashboard) => {
    setHasRegistration(true);
    if (goToDashboard) {
      setActiveTab("dashboard");
    }
  }, []);

  const handleRegisterNew = useCallback(() => {
    // Clear existing fleet data and show the registration form
    if (typeof window !== "undefined") {
      try {
        localStorage.removeItem("clutchd-fleet-registration");
        localStorage.removeItem("clutchd-fleet-vehicles");
        localStorage.removeItem("clutchd-fleet-service-history");
      } catch {
        // best-effort
      }
    }
    setHasRegistration(false);
    setActiveTab("register");
  }, []);

  const handleStartBooking = useCallback(() => {
    setActiveTab("booking");
    clearLastBooking();
  }, [clearLastBooking]);

  if (!_hydrated || !isAuthenticated) {
    return (
      <div className="min-h-[100dvh] w-full flex items-center justify-center bg-[var(--background)]">
        <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin border-[var(--primary)]" />
      </div>
    );
  }

  const sidebarItems = [
    {
      icon: LayoutDashboard,
      label: "Fleet Dashboard",
      onClick: () => setActiveTab("dashboard"),
    },
    {
      icon: Calendar,
      label: "Bulk Booking",
      onClick: () => setActiveTab("booking"),
    },
    {
      icon: Building2,
      label: hasRegistration ? "Update Registration" : "Register",
      onClick: () => setActiveTab("register"),
    },
  ];

  return (
    <DashboardShell
      title="Fleet Dashboard"
      subtitle="B2B Mode"
      user={user}
      mode="garage"
      sidebar={sidebarItems}
    >
      <div className="flex-1 pb-4 lg:pb-6">
        {activeTab === "register" && (
          <FleetRegistrationForm onRegistered={handleRegistered} />
        )}

        {activeTab === "dashboard" && hasRegistration && (
          <FleetDashboard
            onRegisterNew={handleRegisterNew}
            onStartBooking={handleStartBooking}
          />
        )}

        {activeTab === "dashboard" && !hasRegistration && (
          <div className="flex items-center justify-center min-h-[40vh]">
            <p className="text-text-muted">
              No fleet registration found. Please register your fleet first.
            </p>
          </div>
        )}

        {activeTab === "booking" && hasRegistration && (
          <>
            {lastBooking ? (
              <BookingConfirmation
                booking={lastBooking}
                onDismiss={() => { clearLastBooking(); setActiveTab("dashboard"); }}
                onNewBooking={() => clearLastBooking()}
              />
            ) : (
              <FleetBookingPanel />
            )}
          </>
        )}

        {activeTab === "booking" && !hasRegistration && (
          <div className="flex items-center justify-center min-h-[40vh]">
            <p className="text-text-muted">
              Please register your fleet before making a booking.
            </p>
          </div>
        )}
      </div>

      {/* Chat button */}
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
            aria-label={chatOpen ? "Close chat" : "Chat with support"}
          >
            <MessageSquare size={22} />
          </button>
        </div>
      )}
    </DashboardShell>
  );
}
