"use client";

import { useState } from "react";
import {
  Crown,
  ShieldCheck,
  ArrowUp,
  ArrowDown,
  CheckCircle2,
} from "lucide-react";
import { SUBSCRIPTION_PLANS } from "@/lib/constants";
import { GlassCard } from "@/components/ui/GlassCard";
import { PlanCard } from "@/components/subscription/PlanCard";
import { useToastStore } from "@/store/toastStore";

/**
 * SubscriptionManager renders the full subscription UI:
 * - Current plan status card
 * - Grid of all available plans as PlanCards
 * - Handles plan upgrades/downgrades via onSubscribe callback
 */
export function SubscriptionManager() {
  const toast = useToastStore();
  const [currentPlanId, setCurrentPlanId] = useState("free");

  const currentPlan = SUBSCRIPTION_PLANS.find((p) => p.id === currentPlanId);
  const currentPlanIndex = SUBSCRIPTION_PLANS.findIndex((p) => p.id === currentPlanId);

  const handleSubscribe = (planId) => {
    if (planId === currentPlanId) return;

    const targetPlan = SUBSCRIPTION_PLANS.find((p) => p.id === planId);
    if (!targetPlan) return;

    const targetIndex = SUBSCRIPTION_PLANS.findIndex((p) => p.id === planId);

    if (targetIndex > currentPlanIndex) {
      // Upgrade
      setCurrentPlanId(planId);
      toast.success(`Upgraded to ${targetPlan.name} plan successfully!`);
    } else if (targetIndex < currentPlanIndex) {
      // Downgrade
      setCurrentPlanId(planId);
      toast.success(`Downgraded to ${targetPlan.name} plan. Changes will apply next billing cycle.`);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Page Header */}
      <div className="space-y-1">
        <h1 className="type-headline-3 text-foreground">Subscription</h1>
        <p className="type-body-2 text-text-muted">
          Choose the plan that fits your needs
        </p>
      </div>

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
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[0.625rem] font-semibold uppercase tracking-wider text-emerald-300">
                <CheckCircle2 size={10} />
                Active
              </span>
            </div>
            <p className="text-sm text-text-muted mt-1">
              {currentPlan?.price === 0
                ? "You are on the Free plan. Upgrade to unlock premium features."
                : `You are on the ${currentPlan?.name} plan at ${currentPlan?.price > 0 ? `₹${currentPlan?.price}/${currentPlan?.period}` : "Free"}.`}
            </p>
          </div>
        </div>

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
                  <CheckCircle2 size={14} className="text-emerald-400 flex-shrink-0" />
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
          />
        ))}
      </div>

      {/* Upgrade vs Downgrade hint */}
      <GlassCard variant="glass" className="p-4">
        <div className="flex items-start gap-3">
          <ArrowUp size={16} className="text-emerald-400 flex-shrink-0 mt-0.5" />
          <ArrowDown size={16} className="text-amber-400 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-text-muted leading-relaxed">
            <span className="text-emerald-400 font-medium">Upgrade</span> anytime to unlock more features.
            {" "}
            <span className="text-amber-400 font-medium">Downgrade</span> at any time — changes apply at the
            start of your next billing cycle. Cancel anytime with no hidden fees.
          </p>
        </div>
      </GlassCard>
    </div>
  );
}
