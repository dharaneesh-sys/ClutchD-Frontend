"use client";

import { Crown, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSubscriptionStore } from "@/store/subscriptionStore";

/**
 * SubscriptionBadge displays a compact badge reflecting the user's
 * current subscription tier: "Priority" for Plus/Pro users, or nothing
 * for Free users. It can optionally show the plan name ("Plus", "Pro").
 *
 * @param {Object} props
 * @param {"badge"|"pill"|"icon"} [props.variant="badge"] - Visual style
 * @param {boolean} [props.showPlanName=false] - Show "Plus" or "Pro" instead of "Priority"
 * @param {string} [props.className] - Additional classes
 */
export function SubscriptionBadge({
  variant = "badge",
  showPlanName = false,
  className,
}) {
  const planId = useSubscriptionStore((s) => s.planId);
  const status = useSubscriptionStore((s) => s.status);

  const isPaid = planId === "plus" || planId === "pro";
  const isActive = status === "active";

  if (!isPaid || !isActive) return null;

  const isPro = planId === "pro";
  const label = showPlanName
    ? planId === "pro"
      ? "Pro"
      : "Plus"
    : "Priority";

  const Icon = isPro ? Crown : Zap;

  if (variant === "icon") {
    return (
      <span
        className={cn(
          "inline-flex items-center justify-center rounded-full p-1",
          isPro
            ? "bg-purple-500/15 text-purple-400"
            : "bg-primary/15 text-primary-light",
          className
        )}
        title={label}
      >
        <Icon size={12} />
      </span>
    );
  }

  if (variant === "pill") {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[0.625rem] font-semibold uppercase tracking-wider",
          isPro
            ? "bg-purple-500/15 text-purple-300"
            : "bg-primary/15 text-primary-light",
          className
        )}
      >
        <Icon size={10} />
        {label}
      </span>
    );
  }

  // Default: badge
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[0.625rem] font-semibold uppercase tracking-wider",
        isPro
          ? "bg-purple-500/15 text-purple-300"
          : "bg-primary/15 text-primary-light",
        className
      )}
    >
      <Icon size={10} />
      {label}
    </span>
  );
}

/**
 * SubscriptionFeatureBadge — highlights a subscription-gated feature
 * like "Priority Dispatch" or "30% Parts Discount", showing whether
 * it is available on the user's current plan.
 *
 * @param {Object} props
 * @param {string} props.feature - Feature name
 * @param {"plus"|"pro"} props.requiredPlan - Minimum plan required
 * @param {string} [props.className] - Additional classes
 */
export function SubscriptionFeatureBadge({
  feature,
  requiredPlan,
  className,
}) {
  const planId = useSubscriptionStore((s) => s.planId);
  const status = useSubscriptionStore((s) => s.status);

  const tierOrder = { free: 0, plus: 1, pro: 2 };
  const userTier = tierOrder[planId] ?? 0;
  const requiredTier = tierOrder[requiredPlan] ?? 0;
  const hasAccess = userTier >= requiredTier && status === "active";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[0.625rem] font-semibold uppercase tracking-wider transition-colors",
        hasAccess
          ? "bg-success/15 text-success"
          : "bg-white/5 text-text-dim",
        className
      )}
      title={hasAccess ? `Available on ${planId === "pro" ? "Pro" : "Plus"} plan` : `Requires ${requiredPlan === "pro" ? "Pro" : "Plus"} plan`}
    >
      {hasAccess ? <Crown size={10} /> : <Zap size={10} />}
      {feature}
    </span>
  );
}
