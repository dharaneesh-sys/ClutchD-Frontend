"use client";

import { useState, useCallback, useMemo } from "react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/authStore";
import { useToastStore } from "@/store/toastStore";
import { GlassCard } from "@/components/ui/GlassCard";
import {
  Gift,
  Copy,
  Check,
  Share2,
  Users,
  Coins,
  Sparkles,
  ChevronRight,
} from "lucide-react";

const MOCK_STATS = {
  totalReferrals: 0,
  rewardsEarned: 0,
  referralBonus: 250,
  maxRewards: 5000,
};

function generateReferralCode(userId) {
  if (!userId) return null;
  const snippet = userId
    .toString()
    .replace(/[^a-zA-Z0-9]/g, "")
    .slice(0, 6)
    .toUpperCase();
  return `CLUTCHD-${snippet}`;
}

function getReferralLink(code) {
  if (!code) return null;
  const baseUrl =
    typeof window !== "undefined"
      ? `${window.location.protocol}//${window.location.host}`
      : "https://clutchd.app";
  return `${baseUrl}/auth?ref=${code}`;
}

export function ReferralPanel({ className, onNavigateBack }) {
  const { user } = useAuthStore();
  const toast = useToastStore();

  const [copied, setCopied] = useState(false);

  const referralCode = useMemo(
    () => generateReferralCode(user?.id),
    [user?.id]
  );

  const referralLink = useMemo(
    () => getReferralLink(referralCode),
    [referralCode]
  );

  const handleCopyLink = useCallback(async () => {
    if (!referralLink) return;

    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      toast.success("Referral link copied to clipboard!");
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback: select and copy from a temp input
      const textarea = document.createElement("textarea");
      textarea.value = referralLink;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      try {
        document.execCommand("copy");
        setCopied(true);
        toast.success("Referral link copied to clipboard!");
        setTimeout(() => setCopied(false), 2500);
      } catch {
        toast.error("Could not copy link. Please copy it manually.");
      }
      document.body.removeChild(textarea);
    }
  }, [referralLink, toast]);

  const handleShare = useCallback(async () => {
    if (!referralCode || !referralLink) return;

    const sharePayload = {
      title: "Join me on ClutchD",
      text: `Use my referral code ${referralCode} to sign up on ClutchD and get rewards!`,
      url: referralLink,
    };

    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share(sharePayload);
        toast.success("Referral shared successfully!");
      } catch (err) {
        // User cancelled or share failed — silently handle
        if (err.name !== "AbortError") {
          // navigator.share failed unexpectedly, fall through to copy
          handleCopyLink();
        }
      }
    } else {
      // navigator.share not supported — copy link as fallback
      handleCopyLink();
    }
  }, [referralCode, referralLink, handleCopyLink, toast]);

  const stats = MOCK_STATS;
  const remaining = Math.max(0, stats.maxRewards - stats.rewardsEarned);

  return (
    <div className={cn("space-y-5", className)}>
      {/* Header */}
      <div className="flex items-center gap-3">
        {onNavigateBack && (
          <button
            onClick={onNavigateBack}
            className="p-2 -ml-2 rounded-xl hover:bg-white/10 transition-colors text-text-muted hover:text-text-primary"
            aria-label="Go back"
          >
            <ChevronRight size={18} className="rotate-180" />
          </button>
        )}
        <div>
          <h2 className="text-lg font-bold tracking-tight text-text-primary">
            Refer & Earn
          </h2>
          <p className="text-sm text-text-muted mt-0.5">
            Invite friends and earn rewards
          </p>
        </div>
      </div>

      {/* Referral Code Card */}
      <GlassCard variant="glass-lux" className="p-5 overflow-hidden relative">
        {/* Decorative glow */}
        <div
          className="absolute -top-12 -right-12 w-32 h-32 rounded-full opacity-20 blur-3xl pointer-events-none"
          style={{ background: "var(--color-primary, #a78bfa)" }}
          aria-hidden="true"
        />

        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-3">
            <Gift size={16} className="text-primary-light" />
            <span className="text-xs font-semibold uppercase tracking-wider text-primary-light">
              Your Referral Code
            </span>
          </div>

          {referralCode ? (
            <div className="flex items-center justify-between gap-3">
              <div
                className={cn(
                  "font-mono text-xl sm:text-2xl font-extrabold tracking-wider",
                  "text-text-primary"
                )}
              >
                {referralCode}
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {/* Copy button */}
                <button
                  onClick={handleCopyLink}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all",
                    copied
                      ? "bg-primary/20 text-primary-light border border-primary/30"
                      : "bg-white/10 text-text-primary hover:bg-white/15 border border-white/10 hover:border-white/20"
                  )}
                  aria-label={copied ? "Copied" : "Copy referral link"}
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

                {/* Share button */}
                <button
                  onClick={handleShare}
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
          ) : (
            <p className="text-sm text-text-muted">
              Sign in to get your referral code.
            </p>
          )}

          {/* Referral link preview */}
          {referralLink && (
            <p className="mt-3 text-xs text-text-dim font-mono truncate select-all">
              {referralLink}
            </p>
          )}
        </div>
      </GlassCard>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        <GlassCard variant="glass" className="p-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
              <Users size={16} className="text-primary-light" />
            </div>
            <div>
              <p className="text-2xl font-bold tracking-tight text-text-primary">
                {stats.totalReferrals}
              </p>
              <p className="text-xs text-text-muted font-medium">
                Total Referrals
              </p>
            </div>
          </div>
        </GlassCard>

        <GlassCard variant="glass" className="p-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 flex items-center justify-center shrink-0">
              <Coins size={16} className="text-amber-400" />
            </div>
            <div>
              <p className="text-2xl font-bold tracking-tight text-text-primary">
                {"\u20B9"}
                {stats.rewardsEarned.toLocaleString("en-IN")}
              </p>
              <p className="text-xs text-text-muted font-medium">
                Rewards Earned
              </p>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* How It Works / Progress Card */}
      <GlassCard variant="glass" className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles size={14} className="text-icon-highlight" />
          <span className="text-sm font-semibold text-text-primary">
            How it works
          </span>
        </div>

        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center shrink-0 mt-0.5">
              <span className="text-[11px] font-bold text-primary-light">1</span>
            </div>
            <p className="text-sm text-text-secondary">
              Share your referral code with friends
            </p>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center shrink-0 mt-0.5">
              <span className="text-[11px] font-bold text-primary-light">2</span>
            </div>
            <p className="text-sm text-text-secondary">
              They sign up using your link
            </p>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center shrink-0 mt-0.5">
              <span className="text-[11px] font-bold text-primary-light">3</span>
            </div>
            <p className="text-sm text-text-secondary">
              You earn{" "}
              <span className="font-semibold text-primary-light">
                {"\u20B9"}
                {stats.referralBonus}
              </span>{" "}
              when they complete their first service
            </p>
          </div>
        </div>

        {/* Reward progress bar */}
        <div className="mt-4 pt-3 border-t border-white/5">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-text-muted">Reward progress</span>
            <span className="text-xs font-medium text-text-primary">
              {"\u20B9"}
              {stats.rewardsEarned.toLocaleString("en-IN")} / {"\u20B9"}
              {stats.maxRewards.toLocaleString("en-IN")}
            </span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-white/5 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${Math.min(100, (stats.rewardsEarned / stats.maxRewards) * 100)}%`,
                background:
                  "linear-gradient(90deg, var(--color-primary, #a78bfa), var(--color-primary-light, #c4b5fd))",
              }}
            />
          </div>
          {remaining > 0 && (
            <p className="mt-2 text-xs text-text-dim">
              Earn{" "}
              <span className="font-semibold text-primary-light">
                {"\u20B9"}
                {remaining.toLocaleString("en-IN")}
              </span>{" "}
              more to reach the next milestone
            </p>
          )}
        </div>
      </GlassCard>
    </div>
  );
}
