"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { useAuthStore } from "@/store/authStore";
import { useThemeStore } from "@/store/themeStore";
import { LogOut, Building2, LayoutDashboard, Users, BarChart3 } from "lucide-react";
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
  const { theme } = useThemeStore();
  const isLight = theme === "light";
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

  if (!_hydrated || !isAuthenticated) {
    return <div className="min-h-[100dvh] w-full flex items-center justify-center bg-[var(--background)]"><div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin border-[var(--primary)]" /></div>;
  }

  const sidebarItems = [
    { icon: LayoutDashboard, label: "Dashboard", onClick: () => {} },
    { icon: Users, label: "Garage Profile", onClick: () => {} },
    { icon: BarChart3, label: "Analytics", onClick: () => {} },
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
      </div>
    </DashboardShell>
  );
}
