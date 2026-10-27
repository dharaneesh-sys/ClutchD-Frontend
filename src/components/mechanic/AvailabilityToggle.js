import { useState } from "react";
import { Loader2 } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { cn } from "@/lib/utils";
import api from "@/lib/api";
import { useAuthStore } from "@/store/authStore";

/**
 * Mechanic online/offline switch. Reads the API value (`user.isOnline` from
 * the session payload); unknown is shown as "Status unknown", never assumed
 * online. The label changes only after PATCH /providers/availability succeeds.
 */
export function AvailabilityToggle({ className }) {
  const user = useAuthStore((s) => s.user);
  const updateUserData = useAuthStore((s) => s.updateUserData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const known = typeof user?.isOnline === "boolean";
  const isOnline = known && user.isOnline;

  const toggle = async () => {
    const next = !isOnline;
    setLoading(true);
    setError("");
    try {
      const { data } = await api.patch("/providers/availability", { available: next });
      updateUserData({ isOnline: typeof data?.available === "boolean" ? data.available : next });
    } catch {
      setError("Couldn't change your status. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const label = !known ? "Status unknown" : isOnline ? "You're online" : "You're offline";
  const hint = !known ? "Go online to receive job offers." : isOnline ? "Receiving job offers nearby." : "You won't receive new offers.";

  return (
    <GlassCard className={cn("flex items-center justify-between gap-4 p-4", className)}>
      <div className="min-w-0">
        <p id="availability-label" className="font-semibold text-[var(--foreground)]">{label}</p>
        <p className="text-sm text-[var(--text-muted)]">{hint}</p>
        {error && <p role="alert" className="mt-1 text-xs text-[var(--danger-ink)]">{error}</p>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={isOnline}
        aria-labelledby="availability-label"
        onClick={toggle}
        disabled={loading}
        className={cn(
          "relative inline-flex h-11 w-[72px] shrink-0 items-center rounded-full p-1 transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2",
          isOnline ? "bg-[var(--success)]" : "bg-[var(--border-strong)]",
          loading && "opacity-70"
        )}
      >
        <span
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded-full bg-[var(--surface-card)] shadow transition-transform motion-reduce:transition-none",
            isOnline ? "translate-x-7" : "translate-x-0"
          )}
        >
          {loading && <Loader2 size={16} aria-hidden="true" className="animate-spin text-[var(--text-muted)]" />}
        </span>
      </button>
    </GlassCard>
  );
}
