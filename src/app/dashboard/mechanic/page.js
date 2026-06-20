"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import dynamic from "next/dynamic";
import { ProfileEditor } from "@/components/mechanic/ProfileEditor";
import { AvailabilityToggle } from "@/components/mechanic/AvailabilityToggle";
import { IncomingJobs } from "@/components/mechanic/IncomingJobs";
import { EarningsChart } from "@/components/mechanic/EarningsChart";
import { useAuthStore } from "@/store/authStore";
import { useThemeStore } from "@/store/themeStore";
import { useTrackingStore } from "@/store/trackingStore";
import { LogOut, Wrench, Briefcase, MapPin, DollarSign } from "lucide-react";
import { NotificationBell } from "@/components/ui/NotificationBell";
import { ConnectionIndicator } from "@/components/ui/ConnectionIndicator";
import { DashboardShell } from "@/components/ui/DashboardShell";
import { Logo } from "@/components/ui/Logo";
import { NAVIGATION_EVENT } from "@/lib/navigation";

const NavigationMap = dynamic(
  () => import("../../../components/dashboard/MapView"),
  { 
    ssr: false,
    loading: () => <div className="w-full h-full bg-stone-100 dark:bg-zinc-900 rounded-2xl animate-pulse" />
  }
);

export default function MechanicDashboard() {
  const { user, logout, isAuthenticated, _hydrated } = useAuthStore();
  const { theme } = useThemeStore();
  const isLight = theme === "light";
  const router = useRouter();

  useEffect(() => {
    if (_hydrated && !isAuthenticated) {
      router.push("/auth");
    }
  }, [_hydrated, isAuthenticated, router]);

  // Request GPS and continuously watch position for navigation routing
  useEffect(() => {
    if (!_hydrated || !isAuthenticated) return;
    useTrackingStore.getState().requestGPSLocation();
    const stopWatching = useTrackingStore.getState().watchGPSLocation();
    return () => stopWatching();
  }, [isAuthenticated]);

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
    { icon: Briefcase, label: "Jobs", onClick: () => {} },
    { icon: MapPin, label: "Navigation", onClick: () => {} },
    { icon: DollarSign, label: "Earnings", onClick: () => {} },
  ];

  return (
    <DashboardShell
      title="Mechanic Dashboard"
      subtitle="Provider Mode"
      user={user}
      mode="mechanic"
      sidebar={sidebarItems}
    >
      <div className="flex-1 pb-4 lg:pb-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6">
          
          <div className="lg:col-span-4 flex flex-col gap-4 lg:gap-6">
            <div>
              <AvailabilityToggle />
            </div>
            <div>
              <ProfileEditor />
            </div>
            <div>
               <EarningsChart />
            </div>
          </div>
          
          <div className="lg:col-span-8 flex flex-col gap-4 lg:gap-6">
            <div>
              <IncomingJobs />
            </div>
            
            <div className="h-[250px] sm:h-[300px] rounded-2xl overflow-hidden relative shadow-2xl border">
               <NavigationMap />
               <div className={`absolute top-4 left-4 z-[400] backdrop-blur-md px-3 py-1.5 rounded-full border text-xs font-semibold flex items-center gap-2 ${isLight ? "bg-white/80 border-slate-200 text-slate-700" : "bg-black/60 border-white/10 text-white"}`}>
                 <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                 Navigation
               </div>
            </div>
          </div>
          
        </div>
      </div>
    </DashboardShell>
  );
}
