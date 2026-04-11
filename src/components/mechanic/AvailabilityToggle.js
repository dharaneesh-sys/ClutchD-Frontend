import { useState, useEffect } from "react";
import { GlassCard } from "../ui/GlassCard";
import { Power, Loader2 } from "lucide-react";
import { cn } from "../../lib/utils";
import api from "../../lib/api";
import { useAuthStore } from "../../store/authStore";
import { useThemeStore } from "../../store/themeStore";

export function AvailabilityToggle() {
  const { user, updateUserData } = useAuthStore();
  const [isOnline, setIsOnline] = useState(user?.isOnline ?? true);
  const [loading, setLoading] = useState(false);
  
  const { theme } = useThemeStore();
  const isLight = theme === "light";

  useEffect(() => {
    if (user && user.isOnline !== undefined) {
      setIsOnline(user.isOnline);
    }
  }, [user?.isOnline]);

  const toggleStatus = async () => {
    const nextStatus = !isOnline;
    setIsOnline(nextStatus); // Optimistic UI
    setLoading(true);
    try {
      await api.patch("/providers/availability", { available: nextStatus });
      updateUserData({ isOnline: nextStatus });
    } catch (e) {
      console.warn("Failed to update availability", e);
      setIsOnline(!nextStatus); // Revert
    } finally {
      setLoading(false);
    }
  };

  return (
    <GlassCard variant="strong" className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className={`text-lg font-bold mb-1 ${isLight ? "text-slate-900" : "text-white"}`}>Status</h3>
          <p className={`text-sm ${isLight ? "text-slate-500" : "text-emerald-100/60"}`}>
            {isOnline ? "You are receiving job requests" : "You are currently hidden"}
          </p>
        </div>
        
        <button
          onClick={toggleStatus}
          disabled={loading}
          className={cn(
            "w-16 h-16 rounded-full flex items-center justify-center transition-all shadow-lg border-2 relative",
            loading && "opacity-80 cursor-wait",
            isOnline 
              ? (isLight ? "bg-yellow-500 border-yellow-400 text-white pulse-online-light" : "bg-emerald-500 border-emerald-400 text-white pulse-online") 
              : (isLight ? "bg-slate-100 border-slate-200 text-slate-400 hover:bg-slate-200" : "bg-white/10 border-white/20 text-white/50 hover:bg-white/20")
          )}
        >
          {loading ? <Loader2 className="animate-spin" size={24} /> : <Power size={24} />}
        </button>
      </div>
      
      <div className={`mt-6 pt-5 flex gap-4 border-t ${isLight ? "border-slate-100" : "border-white/10"}`}>
         <div className={`flex-1 rounded-xl p-3 text-center border ${isLight ? "bg-slate-50 border-slate-200" : "bg-black/20 border-white/5"}`}>
            <p className={`text-xs mb-1 ${isLight ? "text-slate-500" : "text-white/50"}`}>Status</p>
            <p className={cn("font-bold", isOnline ? (isLight ? "text-yellow-600" : "text-emerald-400") : (isLight ? "text-slate-400" : "text-white/40"))}>
              {isOnline ? "ONLINE" : "OFFLINE"}
            </p>
         </div>
         <div className={`flex-1 rounded-xl p-3 text-center border ${isLight ? "bg-slate-50 border-slate-200" : "bg-black/20 border-white/5"}`}>
            <p className={`text-xs mb-1 ${isLight ? "text-slate-500" : "text-white/50"}`}>Hours Today</p>
            <p className={`font-bold ${isLight ? "text-slate-900" : "text-white"}`}>4.5 hrs</p>
         </div>
      </div>
    </GlassCard>
  );
}
