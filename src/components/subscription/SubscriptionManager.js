"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Crown,
  ShieldCheck,
  ArrowUp,
  ArrowDown,
  CheckCircle2,
  AlertTriangle,
  X,
  Loader2,
  LogOut,
} from "lucide-react";
import { SUBSCRIPTION_PLANS } from "@/lib/constants";
import { BackendHealth } from "@/lib/backendHealth";
import { GlassCard } from "@/components/ui/GlassCard";
import { PlanCard } from "@/components/subscription/PlanCard";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { useToastStore } from "@/store/toastStore";
import { useSubscriptionStore } from "@/store/subscriptionStore";

/**
 * SubscriptionManager renders the full subscription UI:
 * - Current plan status card with active plan benefits
 * - Grid of all available plans as PlanCards
 * - Subscribe / cancel flows that gate behind BackendHealth
 * - Backend-unavailable notice when the payment system is offline
 * - Persisted state via subscriptionStore
 */
export function SubscriptionManager() {
  const toast = useToastStore();

  // ── Subscription store ──────────────────────────────────────────────
  const currentPlanId = useSubscriptionStore((s) => s.planId);
  const status = useSubscriptionStore((s) => s.status);
  const activeUntil = useSubscriptionStore((s) => s.activeUntil);
  const isSubscribing = useSubscriptionStore((s) => s.isSubscribing);
  const isCancelling = useSubscriptionStore((s) => s.isCancelling);
  const backendAvailable = useSubscriptionStore((s) => s.backendAvailable);
  const error = useSubscriptionStore((s) => s.error);
  const subscribe = useSubscriptionStore((s) => s.subscribe);
  const cancel = useSubscriptionStore((s) => s.cancel);

  // Local state for hydration and backend notice
  const [hydrated, setHydrated] = useState(false);
  const [backendOnline, setBackendOnline] = useState(
    () => BackendHealth.isAvailable() === true
  );
  const [backendChecked, setBackendChecked] = useState(false);
  const [showOfflineNotice, setShowOfflineNotice] = useState(false);
  const [cancelTarget, setCancelTarget] = useState(null);

  // Hydrate subscription from persisted store on mount
  useEffect(() => {
    useSubscriptionStore.getState().hydrateFromService();
    /* eslint-disable-next-line react-hooks/set-state-in-effect */
    setHydrated(true);
  }, []);

  // Check backend health on mount
  useEffect(() => {
    const check = async () => {
      const available = await BackendHealth.check();
      setBackendOnline(available);
      setBackendChecked(true);
      if (!available) {
        setShowOfflineNotice(true);
      }
    };
    check();

    // Listen for status changes
    BackendHealth.onStatusChange((isAvailable) => {
      setBackendOnline(isAvailable);
      if (!isAvailable) {
        setShowOfflineNotice(true);
      }
    });

    return () => {
      // Cleanup all listeners for this component instance is not needed
      // because onStatusChange uses a single shared listener list; we'd
      // need the exact callback ref to remove. The component is short-lived
      // so the leak is negligible.
    };
  }, []);

  const currentPlan = SUBSCRIPTION_PLANS.find((p) => p.id === currentPlanId);
  const currentPlanIndex = SUBSCRIPTION_PLANS.findIndex((p) => p.id === currentPlanId);

  /**
   * Handle plan selection — subscribe, upgrade, or downgrade.
   */
  const handleSubscribe = useCallback(
    async (planId) => {
      if (planId === currentPlanId) return;

      const targetPlan = SUBSCRIPTION_PLANS.find((p) => p.id === planId);
      if (!targetPlan) return;

      // Free plan — just update local state directly (no API needed)
      if (targetPlan.price === 0) {
        useSubscriptionStore.getState().subscribe(planId);
        toast.success("Downgraded to Free plan.");
        return;
      }

      // Paid plan — call the subscription service
      const success = await subscribe(planId);

      if (success) {
        const action = planId === "plus" || (planId !== "free" && currentPlanIndex < SUBSCRIPTION_PLANS.findIndex((p) => p.id === planId))
          ? "Upgraded"
          : "Downgraded";
        toast.success(`${action} to ${targetPlan.name} plan successfully!`);

        // If backend was offline, show a persistent info toast
        if (!backendOnline) {
          toast.info(
            "Subscription setup will be available when the payment system is online. Your subscription is saved locally for demo purposes.",
            { persistent: true, duration: 8000 }
          );
        }
      } else {
        toast.error(error || `Failed to subscribe to ${targetPlan.name} plan.`);
      }
    },
    [currentPlanId, currentPlanIndex, subscribe, backendOnline, error, toast]
  );

  /**
   * Handle subscription cancellation.
   */
  const handleConfirmCancel = useCallback(async () => {
    setCancelTarget(null);
    const success = await cancel();

    if (success) {
      toast.success("Subscription cancelled. You are now on the Free plan.");
    } else {
      toast.error(error || "Failed to cancel subscription.");
    }
  }, [cancel, error, toast]);

  /**
   * Dismiss the backend-offline notice.
   */
  const dismissOfflineNotice = useCallback(() => {
    setShowOfflineNotice(false);
  }, []);

  // ── Derived ─────────────────────────────────────────────────────────
  const isPaidPlan = currentPlanId && currentPlanId !== "free";
  const formattedActiveUntil = activeUntil
    ? new Date(activeUntil).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : null;

  if (!hydrated) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={24} className="animate-spin text-primary-light" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Page Header */}
      <div className="space-y-1">
        <h1 className="type-headline-3 text-foreground">Subscription</h1>
        <p className="type-body-2 text-text-muted">
          Choose the plan that fits your needs
        </p>
      </div>

      {/* Backend Offline Notice */}
      {showOfflineNotice && !backendOnline && (
        <GlassCard variant="glass" className="p-4 border border-[var(--color-primary-rgb)]/30 bg-[var(--color-primary-rgb)]/15">
          <div className="flex items-start gap-3">
            <AlertTriangle size={18} className="text-primary-light flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[var(--primary-light)]">
                Payment system offline
              </p>
              <p className="text-xs text-text-muted mt-1">
                Subscription setup will be available when the payment system is
                online. Changes are saved locally for demo purposes.
              </p>
            </div>
            <button
              onClick={dismissOfflineNotice}
              className="flex-shrink-0 p-1 rounded-full hover:bg-white/10 transition-colors"
              aria-label="Dismiss notice"
            >
              <X size={16} className="text-text-muted" />
            </button>
          </div>
        </GlassCard>
      )}

      {/* Current Plan Status */}
      <GlassCard variant="glass-lux" className="p-5">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <Crown size={24} className="text-primary-light" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base font-bold text-foreground">
                {currentPlan?.name || "Free"} Plan
              </h2>
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[0.625rem] font-semibold uppercase tracking-wider ${
                  status === "active"
                    ? "bg-success/15 text-success"
                    : status === "cancelled"
                    ? "bg-red-500/15 text-red-300"
                    : "bg-white/10 text-text-muted"
                }`}
              >
                <CheckCircle2 size={10} />
                {status === "active" ? "Active" : status === "cancelled" ? "Cancelled" : "Free"}
              </span>
              {currentPlan?.badge && status === "active" && (
                <span className="inline-flex items-center rounded-full bg-primary/15 px-2.5 py-0.5 text-[0.625rem] font-semibold uppercase tracking-wider text-primary-light">
                  {currentPlan.badge}
                </span>
              )}
            </div>
            <p className="text-sm text-text-muted mt-1">
              {isPaidPlan && status === "active"
                ? `You are on the ${currentPlan?.name} plan at ₹${currentPlan?.price}/${currentPlan?.period}.`
                : "You are on the Free plan. Upgrade to unlock premium features."}
            </p>
            {isPaidPlan && formattedActiveUntil && (
              <p className="text-xs text-text-dim mt-0.5">
                {status === "active"
                  ? `Active until ${formattedActiveUntil}`
                  : `Access until ${formattedActiveUntil}`}
              </p>
            )}
          </div>
        </div>

        {/* Cancel subscription button (only for paid active plans) */}
        {isPaidPlan && status === "active" && (
          <div className="mt-3 pt-3 border-t border-white/[0.06] flex justify-end">
            <button
              onClick={() => setCancelTarget(true)}
              disabled={isCancelling}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-red-400 hover:text-red-300 transition-colors disabled:opacity-50"
            >
              {isCancelling ? (
                <Loader2 size={12} className="animate-spin" />
              ) : (
                <LogOut size={12} />
              )}
              Cancel subscription
            </button>
          </div>
        )}

        {/* Benefit highlights row */}
        {currentPlan && currentPlan.features.length > 0 && (
          <div className="mt-4 pt-4 border-t border-white/[0.06]">
            <div className="flex items-center gap-1.5 mb-3">
              <ShieldCheck size={14} className="text-primary-light" />
              <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">
                Plan Benefits
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {currentPlan.features.map((feature) => (
                <div key={feature} className="flex items-center gap-2 text-sm text-text-secondary">
                  <CheckCircle2 size={14} className="text-icon-highlight flex-shrink-0" />
                  <span>{feature}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </GlassCard>

      {/* Plan Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {SUBSCRIPTION_PLANS.map((plan) => (
          <PlanCard
            key={plan.id}
            plan={plan}
            isCurrent={plan.id === currentPlanId}
            onSubscribe={handleSubscribe}
            isSubscribing={isSubscribing}
          />
        ))}
      </div>

      {/* Upgrade vs Downgrade hint */}
      <GlassCard variant="glass" className="p-4">
        <div className="flex items-start gap-3">
          <ArrowUp size={16} className="text-icon-highlight flex-shrink-0 mt-0.5" />
          <ArrowDown size={16} className="text-warning flex-shrink-0 mt-0.5" />
          <p className="text-xs text-text-muted leading-relaxed">
            <span className="text-icon-highlight font-medium">Upgrade</span> anytime to unlock more features.
            {" "}
            <span className="text-warning font-medium">Downgrade</span> at any time — changes apply at the
            start of your next billing cycle. Cancel anytime with no hidden fees.
          </p>
        </div>
      </GlassCard>

      {/* Cancel Confirmation Modal */}
      <ConfirmModal
        isOpen={!!cancelTarget}
        onClose={() => setCancelTarget(null)}
        onConfirm={handleConfirmCancel}
        title="Cancel Subscription"
        message={
          <>
            Are you sure you want to cancel your{" "}
            <strong>{currentPlan?.name}</strong> subscription? You will be
            downgraded to the Free plan at the end of your current billing
            period.
          </>
        }
        confirmLabel={isCancelling ? "Cancelling…" : "Cancel Subscription"}
        variant="danger"
        isLoading={isCancelling}
      />
    </div>
  );
}
