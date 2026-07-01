"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import dynamic from "next/dynamic";
import "leaflet/dist/leaflet.css";
import "react-leaflet-cluster/dist/assets/MarkerCluster.css";
import "react-leaflet-cluster/dist/assets/MarkerCluster.Default.css";
import { ProfileEditor } from "@/components/mechanic/ProfileEditor";
import { AvailabilityToggle } from "@/components/mechanic/AvailabilityToggle";
import { IncomingJobs } from "@/components/mechanic/IncomingJobs";
import { EarningsChart } from "@/components/mechanic/EarningsChart";
import { useAuthStore } from "@/store/authStore";
import { useTrackingStore } from "@/store/trackingStore";
import { LogOut, Wrench, Briefcase, MapPin, DollarSign, ShoppingBag, X } from "lucide-react";
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
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("jobs");
  const [jobsPanelOpen, setJobsPanelOpen] = useState(true);

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
  }, [isAuthenticated]); // eslint-disable-line react-hooks/exhaustive-deps

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
    { icon: Briefcase, label: "Jobs", onClick: () => setActiveTab("jobs") },
    { icon: MapPin, label: "Navigation", onClick: () => setActiveTab("navigation") },
    { icon: DollarSign, label: "Earnings", onClick: () => setActiveTab("earnings") },
    { icon: ShoppingBag, label: "Parts Store", onClick: () => router.push("/marketplace") },
  ];

  return (
    <DashboardShell
      title="Mechanic Dashboard"
      subtitle="Provider Mode"
      user={user}
      mode="mechanic"
      sidebar={sidebarItems}
    >
      <div className="flex-1 pb-4 lg:pb-6 space-y-6">
        {/* Desktop tab navigation */}
        <div className="hidden lg:flex items-center gap-2 p-1 rounded-2xl bg-surface-soft border border-border-subtle w-fit">
          {sidebarItems.map((item, index) => {
            const isStore = item.label === "Parts Store";
            const tabKey = item.label.toLowerCase().replace(" ", "");
            const isActive = !isStore && activeTab === tabKey;
            return (
              <button
                key={index}
                onClick={item.onClick}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isStore
                    ? "text-emerald-400 hover:bg-emerald-500/10 border border-emerald-500/20"
                    : isActive
                      ? "bg-bg-card shadow-sm border border-border-subtle text-text-primary"
                      : "text-text-muted hover:text-text-primary hover:bg-bg-card/50 border border-transparent"
                }`}
              >
                <item.icon size={16} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {activeTab === "jobs" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6">
            <div className="lg:col-span-4 flex flex-col gap-4 lg:gap-6">
              <AvailabilityToggle />
              <ProfileEditor />
            </div>
            
            <div className="lg:col-span-8 flex flex-col gap-4 lg:gap-6">
              <IncomingJobs />
              
              <div className="h-[250px] sm:h-[300px] rounded-2xl overflow-hidden relative shadow-2xl border">
                <NavigationMap />
                <div className="absolute top-4 left-4 z-[400] backdrop-blur-md px-3 py-1.5 rounded-full border text-xs font-semibold flex items-center gap-2 bg-white/80 dark:bg-black/60 border-slate-200 dark:border-white/10 text-slate-700 dark:text-white">
                  <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                  Navigation
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "navigation" && (
          <div className="space-y-4">
            {/* Top bar with availability & profile controls */}
            <div className="flex flex-wrap items-center gap-3">
              <AvailabilityToggle />
              <ProfileEditor />
            </div>
            
            {/* Full-width map with collapsible jobs overlay */}
            <div className="relative h-[60vh] sm:h-[70vh] lg:h-[75vh] rounded-2xl overflow-hidden shadow-2xl border">
              <NavigationMap />
              
              {/* Collapsible jobs panel */}
              <div className={`absolute top-4 right-4 z-[400] w-80 sm:w-96 transition-all duration-300 ${jobsPanelOpen ? "opacity-100" : "opacity-0 pointer-events-none"}`}>
                <div className="backdrop-blur-xl bg-black/70 rounded-2xl border border-white/10 shadow-2xl overflow-hidden max-h-[55vh]">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
                    <div className="flex items-center gap-2">
                      <Briefcase size={15} className="text-emerald-400" />
                      <span className="text-sm font-semibold text-white">Job Queue</span>
                    </div>
                    <button onClick={() => setJobsPanelOpen(false)} className="p-1.5 rounded-lg hover:bg-white/10 text-white/50 hover:text-white transition-colors">
                      <X size={14} />
                    </button>
                  </div>
                  <div className="overflow-y-auto max-h-[calc(55vh-52px)] custom-scrollbar">
                    <IncomingJobs />
                  </div>
                </div>
              </div>
              
              {/* Toggle button when panel is closed */}
              {!jobsPanelOpen && (
                <button onClick={() => setJobsPanelOpen(true)} className="absolute top-4 right-4 z-[400] backdrop-blur-xl bg-black/70 rounded-xl border border-white/10 shadow-2xl px-4 py-3 text-white hover:bg-black/80 transition-all flex items-center gap-2">
                  <Briefcase size={16} className="text-emerald-400" />
                  <span className="text-sm font-medium">Jobs</span>
                </button>
              )}
            </div>
          </div>
        )}

        {activeTab === "earnings" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6">
            <div className="lg:col-span-4 flex flex-col gap-4 lg:gap-6">
              <AvailabilityToggle />
              <ProfileEditor />
            </div>
            
            <div className="lg:col-span-8">
              <EarningsChart />
            </div>
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
