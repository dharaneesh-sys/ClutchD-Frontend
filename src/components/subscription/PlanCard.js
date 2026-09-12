"use client";

import { Check, Loader2 } from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";

/**
 * PlanCard displays a single subscription plan with name, price,
 * feature list, and a CTA button. The current plan is highlighted
 * with an active badge and subtle border ring.
 *
 * @param {Object} props
 * @param {import("@/lib/constants").SubscriptionPlan} props.plan
 * @param {boolean} props.isCurrent - Whether this is the user's current plan
 * @param {(planId: string) => void} props.onSubscribe - Called with plan.id when CTA is clicked
 * @param {boolean} [props.isSubscribing] - If true, the subscribe button is disabled with a spinner
 */
export function PlanCard({ plan, isCurrent, onSubscribe, isSubscribing }) {
  const isFree = plan.price === 0;

  return (
    <GlassCard
      variant="glass-lux"
      className={cn(
        "relative flex flex-col p-6 sm:p-7",
        isCurrent
          ? "ring-2 ring-primary/40 shadow-[0_0_30px_rgba(var(--color-primary-rgb),0.12)]"
          : "ring-1 ring-white/[0.06]"
      )}
    >
      {/* Badges */}
      <div className="flex items-start justify-between mb-4">
        {plan.badge && !isCurrent && (
          <span className="inline-flex items-center rounded-full bg-primary/15 px-3 py-1 text-[0.625rem] font-semibold uppercase tracking-wider text-primary-light">
            {plan.badge}
          </span>
        )}
        {isCurrent && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-warning/15 px-3 py-1 text-[0.625rem] font-semibold uppercase tracking-wider text-warning">
            <span className="w-1.5 h-1.5 rounded-full bg-warning" />
            Current Plan
          </span>
        )}
        {/* Spacer when no badge */}
        {!plan.badge && !isCurrent && <span />}
      </div>

      {/* Plan name + price */}
      <div className="mb-6">
        <h3 className="text-lg font-bold text-foreground">{plan.name}</h3>
        <div className="mt-2 flex items-baseline gap-1">
          <span className="text-3xl font-extrabold text-foreground tracking-tight">
            {isFree ? "Free" : formatCurrency(plan.price)}
          </span>
          {!isFree && (
            <span className="text-sm text-text-muted">/{plan.period}</span>
          )}
        </div>
      </div>

      {/* Feature list */}
      <ul className="space-y-3 mb-8 flex-1">
        {plan.features.map((feature) => (
          <li key={feature} className="flex items-start gap-3">
            <span className="flex-shrink-0 mt-0.5 w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center">
              <Check size={12} className="text-primary-light" />
            </span>
            <span className="text-sm text-text-secondary leading-relaxed">{feature}</span>
          </li>
        ))}
      </ul>

      {/* CTA */}
      <Button
        variant={isCurrent ? "secondary" : "primary"}
        size="md"
        className="w-full"
        onClick={() => onSubscribe(plan.id)}
        disabled={isSubscribing || isCurrent}
      >
        {isSubscribing && !isCurrent ? (
          <>
            <Loader2 size={14} className="animate-spin mr-1.5" />
            Subscribing…
          </>
        ) : isCurrent ? (
          "Current Plan"
        ) : isFree ? (
          "Get Started"
        ) : (
          `Subscribe to ${plan.name}`
        )}
      </Button>
    </GlassCard>
  );
}
