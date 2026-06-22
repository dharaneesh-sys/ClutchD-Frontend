import { useState, useEffect } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Power, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import api from "@/lib/api";
import { useAuthStore } from "@/store/authStore";

export function AvailabilityToggle() {
  const { user, updateUserData } = useAuthStore();
  const [isOnline, setIsOnline] = useState(user?.isOnline ?? true);
  const [loading, setLoading] = useState(false);
  


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
          <h3 className="text-lg font-bold mb-1 text-text-primary">Status</h3>
          <p className="text-sm text-text-muted">
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
              ? "bg-primary border-primary-light text-white pulse-online" 
              : "bg-bg-card border-border-subtle text-text-muted"
          )}
        >
          {loading ? <Loader2 className="animate-spin" size={24} /> : <Power size={24} />}
        </button>
      </div>
      
      <div className="mt-6 pt-5 flex gap-4 border-t border-border-subtle">
         <div className="flex-1 rounded-xl p-3 text-center border bg-surface-soft border-border-subtle">
            <p className="text-xs mb-1 text-text-muted">Status</p>
            <p className={cn("font-bold", isOnline ? "text-icon-highlight" : "text-text-dim")}>
              {isOnline ? "ONLINE" : "OFFLINE"}
            </p>
         </div>
         <div className="flex-1 rounded-xl p-3 text-center border bg-surface-soft border-border-subtle">
            <p className="text-xs mb-1 text-text-muted">Hours Today</p>
            <p className="font-bold text-text-primary">4.5 hrs</p>
         </div>
      </div>
    </GlassCard>
  );
}
