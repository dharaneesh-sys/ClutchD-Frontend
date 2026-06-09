"use client";

import { useEffect } from "react";

import dynamic from "next/dynamic";
import { ProfileEditor } from "../../../components/mechanic/ProfileEditor";
import { AvailabilityToggle } from "../../../components/mechanic/AvailabilityToggle";
import { IncomingJobs } from "../../../components/mechanic/IncomingJobs";
import { EarningsChart } from "../../../components/mechanic/EarningsChart";
import { useAuthStore } from "../../../store/authStore";
import { useThemeStore } from "../../../store/themeStore";
import { useTrackingStore } from "../../../store/trackingStore";
import { LogOut, Wrench } from "lucide-react";
import { NotificationBell } from "../../../components/ui/NotificationBell";
import { ConnectionIndicator } from "../../../components/ui/ConnectionIndicator";

const NavigationMap = dynamic(
  () => import("../../../components/dashboard/MapView"),
  { 
    ssr: false,
    loading: () => <div className="w-full h-full bg-stone-100 dark:bg-zinc-900 rounded-2xl animate-pulse" />
  }
);

export default function MechanicDashboard() {
  const { user, logout, isAuthenticated } = useAuthStore();
  const { theme } = useThemeStore();
  const isLight = theme === "light";

  useEffect(() => {
    if (!isAuthenticated) {
      window.location.href = "/auth";
    }
  }, [isAuthenticated]);

  // Request GPS and continuously watch position for navigation routing
  useEffect(() => {
    if (!isAuthenticated) return;
    useTrackingStore.getState().requestGPSLocation();
    const stopWatching = useTrackingStore.getState().watchGPSLocation();
    return () => stopWatching();
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return <div className="min-h-[100dvh] w-full flex items-center justify-center bg-[var(--background)]"><div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin border-[var(--primary)]" /></div>;
  }

  return (
    <div className="min-h-[100dvh] w-full flex flex-col p-3 sm:p-4 lg:p-6 gap-4 lg:gap-6 relative z-10">
      
      <header className={`flex justify-between items-center px-4 lg:px-6 py-3 lg:py-4 backdrop-blur-xl rounded-2xl flex-shrink-0 ${isLight ? "bg-white/70 border border-slate-200" : "bg-white/5 border border-white/10"}`}>
        <div className="flex items-center gap-2">
           <div className="w-7 h-7 lg:w-8 lg:h-8 rounded-lg flex items-center justify-center text-white font-bold tracking-tighter bg-[var(--primary)]">M</div>
           <h1 className={`text-lg lg:text-xl font-bold tracking-tight hidden sm:block ${isLight ? "text-slate-900" : "text-white"}`}>ClutchD</h1>
        </div>
        
        <div className="flex items-center gap-2 lg:gap-4">
          <div className="hidden sm:flex flex-col items-end mr-2">
            <span className={`text-sm font-semibold ${isLight ? "text-slate-900" : "text-white"}`}>{user?.name || "Mechanic"}</span>
            <span className={`text-[10px] uppercase tracking-wider ${isLight ? "text-yellow-600" : "text-emerald-100/60"}`}>Provider Mode</span>
          </div>
          <ConnectionIndicator />
          <NotificationBell />
          <div className={`w-9 h-9 lg:w-10 lg:h-10 rounded-full flex items-center justify-center ${isLight ? "bg-yellow-500/15 border border-yellow-500/30 text-yellow-600" : "bg-emerald-500/20 border border-emerald-500/30 text-emerald-300"}`}>
            <Wrench size={16} />
          </div>
          <button 
            onClick={logout}
            aria-label="Logout"
            className={`w-9 h-9 lg:w-10 lg:h-10 rounded-full flex items-center justify-center transition-colors ${isLight ? "bg-slate-100 hover:bg-red-50 border border-slate-200 hover:border-red-200 text-slate-500 hover:text-red-500" : "bg-white/5 hover:bg-red-500/20 border border-white/10 hover:border-red-500/30 text-white/70 hover:text-red-400"}`}
          >
            <LogOut size={15} />
          </button>
        </div>
      </header>

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
    </div>
  );
}
