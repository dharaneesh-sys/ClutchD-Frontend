"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { useAuthStore } from "@/store/authStore";
import { LogOut, Building2, LayoutDashboard, Users, BarChart3, ShoppingBag } from "lucide-react";
import { ConnectionIndicator } from "@/components/ui/ConnectionIndicator";
import { NotificationBell } from "@/components/ui/NotificationBell";
import { DashboardShell } from "@/components/ui/DashboardShell";
import { GarageProfile } from "@/components/garage/GarageProfile";
import { GarageJobQueue } from "@/components/garage/GarageJobQueue";
import { GarageAnalytics } from "@/components/garage/GarageAnalytics";
import { Logo } from "@/components/ui/Logo";
import { NAVIGATION_EVENT } from "@/lib/navigation";

export default function GarageDashboard() {
  const { user, logout, isAuthenticated, _hydrated } = useAuthStore();
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

  if (!_hydrated || !isAuthenticated) {
    return <div className="min-h-[100dvh] w-full flex items-center justify-center bg-[var(--background)]"><div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin border-[var(--primary)]" /></div>;
  }

  const sidebarItems = [
    { icon: LayoutDashboard, label: "Dashboard", onClick: () => setActiveTab("dashboard") },
    { icon: Users, label: "Garage Profile", onClick: () => setActiveTab("profile") },
    { icon: BarChart3, label: "Analytics", onClick: () => setActiveTab("analytics") },
    { icon: ShoppingBag, label: "Parts Store", onClick: () => router.push("/marketplace") },
  ];

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
                <GarageJobQueue />
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
      </div>
    </DashboardShell>
  );
}
