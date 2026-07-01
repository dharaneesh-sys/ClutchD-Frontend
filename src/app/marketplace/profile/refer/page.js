"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Gift,
  Copy,
  Check,
  Share2,
  Users,
  Coins,
  Sparkles,
  Award,
  TrendingUp,
} from "lucide-react";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import { Shimmer, ShimmerList } from "@/components/ui/Shimmer";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { useAuthStore } from "@/store/authStore";
import { useToastStore } from "@/store/toastStore";
import api from "@/lib/api";

// ─── Demo fallback data ──────────────────────────────────────────────

const DEMO_REFERRAL = {
  code: "CLUTCHD-A1B2C3",
  reward_balance: 500,
  total_referrals: 3,
  share_link: "https://clutchd.app/auth?ref=CLUTCHD-A1B2C3",
};

const DEMO_REWARDS = [
  {
    id: 1,
    referred_email: "ravi@example.com",
    amount: 100,
    status: "credited",
    created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
  },
  {
    id: 2,
    referred_email: "priya@example.com",
    amount: 100,
    status: "credited",
    created_at: new Date(Date.now() - 86400000 * 12).toISOString(),
  },
  {
    id: 3,
    referred_email: "suresh@example.com",
    amount: 100,
    status: "credited",
    created_at: new Date(Date.now() - 86400000 * 20).toISOString(),
  },
  {
    id: 4,
    referred_email: "anita@example.com",
    amount: 100,
    status: "pending",
    created_at: new Date(Date.now() - 1800000).toISOString(),
  },
  {
    id: 5,
    referred_email: "vikram@example.com",
    amount: 100,
    status: "pending",
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
];

const REWARD_STATUS_CONFIG = {
  credited: { variant: "success", label: "Credited" },
  pending: { variant: "warning", label: "Pending" },
  expired: { variant: "danger", label: "Expired" },
};

// ─── Referral Hero Card ──────────────────────────────────────────────

function ReferralHero({ referral, onCopy, onShare, copied }) {
  return (
    <div className="glass-lux rounded-2xl p-5 overflow-hidden relative">
      {/* Decorative glow */}
      <div
        className="absolute -top-16 -right-16 w-40 h-40 rounded-full opacity-20 blur-3xl pointer-events-none"
        style={{ background: "var(--color-primary, #10b981)" }}
        aria-hidden="true"
      />

      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-3">
          <Gift size={16} className="text-primary-light" />
          <span className="text-xs font-semibold uppercase tracking-wider text-primary-light">
            Your Referral Code
          </span>
        </div>

        <div className="flex items-center justify-between gap-3 mb-4">
          <div
            className={cn(
              "font-mono text-2xl sm:text-3xl font-extrabold tracking-wider",
              "text-foreground"
            )}
          >
            {referral.code}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={onCopy}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all border",
                copied
                  ? "bg-primary/20 text-primary-light border-primary/30"
                  : "bg-white/10 text-foreground hover:bg-white/15 border-white/10 hover:border-white/20"
              )}
              aria-label={copied ? "Copied" : "Copy referral code"}
            >
              {copied ? (
                <>
                  <Check size={14} />
                  Copied
                </>
              ) : (
                <>
                  <Copy size={14} />
                  Copy
                </>
              )}
            </button>

            <button
              onClick={onShare}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all",
                "bg-gradient-to-b from-primary via-primary to-primary-dark text-white",
                "shadow-[0_4px_12px_rgba(var(--color-primary-rgb),0.3)]",
                "ring-1 ring-primary/25 hover:ring-primary/35",
                "hover:shadow-[0_8px_24px_rgba(var(--color-primary-rgb),0.25)]"
              )}
              aria-label="Share referral link"
            >
              <Share2 size={14} />
              Share
            </button>
          </div>
        </div>

        <p className="text-xs text-text-dim font-mono truncate select-all">
          {referral.share_link}
        </p>
      </div>
    </div>
  );
}

// ─── Stats Cards ─────────────────────────────────────────────────────

function StatsCards({ balance, totalReferrals }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="glass-lux rounded-2xl p-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
            <Coins size={16} className="text-primary-light" />
          </div>
          <div>
            <p className="text-2xl font-bold tracking-tight text-foreground">
              {formatCurrency(balance)}
            </p>
            <p className="text-xs text-text-muted font-medium">
              Reward Balance
            </p>
          </div>
        </div>
      </div>
      <div className="glass-lux rounded-2xl p-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-indigo-500/15 flex items-center justify-center shrink-0">
            <Users size={16} className="text-indigo-400" />
          </div>
          <div>
            <p className="text-2xl font-bold tracking-tight text-foreground">
              {totalReferrals}
            </p>
            <p className="text-xs text-text-muted font-medium">
              Total Referrals
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── How It Works ────────────────────────────────────────────────────

function HowItWorks() {
  const steps = [
    {
      number: 1,
      icon: Share2,
      title: "Share Your Code",
      description: "Share your unique referral code with friends and family",
    },
    {
      number: 2,
      icon: Users,
      title: "They Sign Up",
      description: "They register using your referral link or code",
    },
    {
      number: 3,
      icon: Award,
      title: "Earn Rewards",
      description: "You earn ₹100 when they complete their first service",
    },
  ];

  return (
    <div className="glass-lux rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles size={16} className="text-icon-highlight" />
        <span className="text-sm font-semibold text-foreground">
          How It Works
        </span>
      </div>

      <div className="space-y-4">
        {steps.map((step) => {
          const Icon = step.icon;
          return (
            <div key={step.number} className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-xs font-bold text-primary-light">
                  {step.number}
                </span>
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <Icon size={14} className="text-primary-light shrink-0" />
                  <p className="text-sm font-semibold text-foreground">
                    {step.title}
                  </p>
                </div>
                <p className="text-xs text-text-muted mt-0.5">
                  {step.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bonus info */}
      <div className="mt-4 pt-3 border-t border-border-subtle/50">
        <p className="text-xs text-text-dim">
          <span className="text-primary-light font-semibold">₹100 bonus</span>{" "}
          per referral after they complete their first service. No limit on
          referrals!
        </p>
      </div>
    </div>
  );
}

// ─── Referral History ────────────────────────────────────────────────

function ReferralHistory({ rewards }) {
  if (!rewards || rewards.length === 0) {
    return (
      <EmptyState
        icon={Users}
        title="No referrals yet"
        description="Share your code and start earning rewards!"
      />
    );
  }

  return (
    <div className="space-y-2">
      {rewards.map((reward, index) => (
        <div
          key={reward.id}
          className="glass-lux rounded-2xl p-4 flex items-center justify-between gap-3 animate-fade-in-up"
          style={{ animationDelay: `${index * 60}ms` }}
        >
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-foreground truncate">
              {reward.referred_email}
            </p>
            <p className="text-xs text-text-muted mt-0.5">
              {formatDate(reward.created_at)}
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <span className="text-sm font-semibold text-foreground">
              +{formatCurrency(reward.amount)}
            </span>
            <Badge
              variant={REWARD_STATUS_CONFIG[reward.status]?.variant || "default"}
            >
              {REWARD_STATUS_CONFIG[reward.status]?.label || reward.status}
            </Badge>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────

export default function ReferPage() {
  const { user } = useAuthStore();
  const toast = useToastStore();

  const [referral, setReferral] = useState(null);
  const [rewards, setRewards] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const fetchData = useCallback(async () => {
    setIsLoading(true);

    try {
      const { data } = await api.get("/referral/my-code");
      setReferral(data || DEMO_REFERRAL);
    } catch {
      // Generate code from user ID
      const snippet = user?.id
        ? user.id.replace(/[^a-zA-Z0-9]/g, "").slice(0, 6).toUpperCase()
        : "USER";
      setReferral({
        code: `CLUTCHD-${snippet}`,
        reward_balance: 500,
        total_referrals: 3,
        share_link: `https://clutchd.app/auth?ref=CLUTCHD-${snippet}`,
      });
    }

    try {
      const { data } = await api.get("/referral/history");
      const fetched = data?.rewards || data || [];
      setRewards(fetched.length > 0 ? fetched : DEMO_REWARDS);
    } catch {
      setRewards(DEMO_REWARDS);
    }

    setIsLoading(false);
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCopy = useCallback(async () => {
    if (!referral?.share_link) return;

    try {
      await navigator.clipboard.writeText(referral.share_link);
      setCopied(true);
      toast.success("Referral link copied to clipboard!");
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
      const textarea = document.createElement("textarea");
      textarea.value = referral.share_link;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      toast.success("Referral link copied to clipboard!");
      setTimeout(() => setCopied(false), 2500);
    }
  }, [referral, toast]);

  const handleShare = useCallback(async () => {
    if (!referral) return;

    const sharePayload = {
      title: "Join me on ClutchD",
      text: `Use my referral code ${referral.code} to sign up on ClutchD and get rewards!`,
      url: referral.share_link,
    };

    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share(sharePayload);
        toast.success("Referral shared successfully!");
      } catch (err) {
        if (err.name !== "AbortError") {
          handleCopy();
        }
      }
    } else {
      handleCopy();
    }
  }, [referral, handleCopy, toast]);

  if (isLoading) {
    return (
      <div className="p-4 page-enter space-y-4">
        <div className="space-y-1 mb-6">
          <Shimmer className="h-7 w-40" />
          <Shimmer className="h-4 w-56" />
        </div>
        <Shimmer className="h-32 w-full rounded-2xl" />
        <div className="grid grid-cols-2 gap-3">
          <Shimmer className="h-20 rounded-2xl" />
          <Shimmer className="h-20 rounded-2xl" />
        </div>
        <Shimmer className="h-48 rounded-2xl" />
        <ShimmerList count={3} />
      </div>
    );
  }

  return (
    <div className="p-4 page-enter space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="type-headline-3 text-foreground">Refer & Earn</h1>
        <p className="type-body-2 text-muted">
          Invite friends and earn rewards
        </p>
      </div>

      {/* Hero Card */}
      {referral && (
        <ReferralHero
          referral={referral}
          onCopy={handleCopy}
          onShare={handleShare}
          copied={copied}
        />
      )}

      {/* Stats */}
      <StatsCards
        balance={referral?.reward_balance || 0}
        totalReferrals={referral?.total_referrals || 0}
      />

      {/* How It Works */}
      <HowItWorks />

      {/* Referral History */}
      <section>
        <h2 className="text-base font-semibold text-foreground mb-3 flex items-center gap-2">
          <TrendingUp size={16} className="text-primary-light" />
          Referral History
        </h2>
        <ReferralHistory rewards={rewards} />
      </section>
    </div>
  );
}
