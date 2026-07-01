"use client";

import { useState, useEffect, useCallback } from "react";
import {
  CreditCard,
  Award,
  TrendingUp,
  Gift,
  Sparkles,
  Star,
  Zap,
  Crown,
  Loader2,
  Copy,
  Check,
  ChevronRight,
} from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import { Shimmer } from "@/components/ui/Shimmer";
import { useToastStore } from "@/store/toastStore";
import api from "@/lib/api";

// ─── Constants ──────────────────────────────────────────────────────

const TIER_CONFIG = {
  platinum: {
    icon: Crown,
    label: "Platinum",
    color: "text-sky-300",
    bg: "bg-sky-500/10",
    ring: "ring-sky-500/30",
    gradient: "from-sky-500/20 to-blue-500/10",
    discount: "50%",
  },
  gold: {
    icon: Award,
    label: "Gold",
    color: "text-amber-300",
    bg: "bg-amber-500/10",
    ring: "ring-amber-500/30",
    gradient: "from-amber-500/20 to-yellow-500/10",
    discount: "30%",
  },
  silver: {
    icon: Star,
    label: "Silver",
    color: "text-zinc-300",
    bg: "bg-zinc-500/10",
    ring: "ring-zinc-500/30",
    gradient: "from-zinc-500/20 to-gray-500/10",
    discount: "15%",
  },
  bronze: {
    icon: Zap,
    label: "Bronze",
    color: "text-orange-300",
    bg: "bg-orange-500/10",
    ring: "ring-orange-500/30",
    gradient: "from-orange-500/20 to-amber-500/10",
    discount: "5%",
  },
};

const DEMO_CARD = {
  card_number: "CDC-A1B2C3D4",
  membership_tier: "silver",
  reward_points: 1250,
  lifetime_points: 1250,
  total_orders: 8,
  total_spent: 28450,
  created_at: new Date(Date.now() - 86400000 * 90).toISOString(),
  updated_at: new Date().toISOString(),
};

const DEMO_OFFERS = [
  {
    id: "offer-1",
    title: "Free Oil Change",
    description: "Get a complimentary oil change on your next service booking",
    min_tier: "bronze",
    discount_percent: 100,
    discount_cap: 1500,
    is_active: true,
  },
  {
    id: "offer-2",
    title: "15% Off Parts",
    description: "Discount on all engine and performance parts",
    min_tier: "silver",
    discount_percent: 15,
    discount_cap: 2000,
    is_active: true,
  },
  {
    id: "offer-3",
    title: "Free Pickup & Drop",
    description: "Complimentary vehicle pickup and delivery for service",
    min_tier: "gold",
    discount_percent: 100,
    discount_cap: 500,
    is_active: true,
  },
  {
    id: "offer-4",
    title: "Priority Support",
    description: "24/7 priority customer support with dedicated manager",
    min_tier: "platinum",
    discount_percent: 0,
    discount_cap: 0,
    is_active: true,
  },
];

// ─── Helper ─────────────────────────────────────────────────────────

function getTierConfig(tier) {
  return TIER_CONFIG[tier] || TIER_CONFIG.bronze;
}

function getNextTier(currentTier) {
  const order = ["bronze", "silver", "gold", "platinum"];
  const idx = order.indexOf(currentTier);
  if (idx === -1 || idx >= order.length - 1) return null;
  return order[idx + 1];
}

function getTierProgress(lifetimePoints) {
  const thresholds = [
    { tier: "platinum", min: 100000 },
    { tier: "gold", min: 50000 },
    { tier: "silver", min: 10000 },
    { tier: "bronze", min: 0 },
  ];

  const currentTier = thresholds.find((t) => lifetimePoints >= t.min) || thresholds[3];
  const nextTier = thresholds[thresholds.indexOf(currentTier) - 1];

  if (!nextTier) return { currentLabel: currentTier.tier, progress: 100, nextLabel: null };

  const progress = ((lifetimePoints - currentTier.min) / (nextTier.min - currentTier.min)) * 100;
  return {
    currentLabel: currentTier.tier,
    progress: Math.min(Math.max(progress, 0), 100),
    nextLabel: nextTier.tier,
    pointsNeeded: nextTier.min - lifetimePoints,
  };
}

// ─── Copy Button ────────────────────────────────────────────────────

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  const toast = useToastStore();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success("Card number copied");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-1.5 text-xs text-text-muted hover:text-primary-light transition-colors"
    >
      {copied ? <Check size={12} /> : <Copy size={12} />}
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

// ─── Offer Card ─────────────────────────────────────────────────────

function OfferCard({ offer, locked }) {
  const tier = getTierConfig(offer.min_tier);

  return (
    <div
      className={cn(
        "glass-lux rounded-2xl p-4 transition-all duration-200",
        locked ? "opacity-50" : "hover:shadow-lg"
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            "flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center",
            tier.bg
          )}
        >
          <Gift size={18} className={tier.color} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-foreground">{offer.title}</h3>
            {locked && (
              <span className="text-[10px] font-medium text-text-muted uppercase tracking-wider">
                • {tier.label}
              </span>
            )}
          </div>
          <p className="text-xs text-text-muted mt-1">{offer.description}</p>
          {offer.discount_percent > 0 && (
            <div className="flex items-center gap-2 mt-2">
              <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 bg-primary/15 text-primary-light text-[10px] font-semibold">
                <Sparkles size={10} />
                {offer.discount_percent}% Off
              </span>
              {offer.discount_cap > 0 && (
                <span className="text-[10px] text-text-muted">
                  Up to {formatCurrency(offer.discount_cap)}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ──────────────────────────────────────────────────────

export default function ClutchDCardPage() {
  const toast = useToastStore();
  const [card, setCard] = useState(null);
  const [offers, setOffers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [cardRes, offersRes] = await Promise.all([
        api.get("/card"),
        api.get("/card/offers"),
      ]);
      setCard(cardRes.data);
      setOffers(offersRes.data.offers || []);
    } catch {
      setError("Could not load card data. Showing preview.");
      setCard(DEMO_CARD);
      setOffers(DEMO_OFFERS);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (isLoading) {
    return (
      <div className="p-4 page-enter space-y-6">
        <div className="space-y-1 mb-2">
          <Shimmer className="w-40 h-6" />
          <Shimmer className="w-56 h-4" />
        </div>
        <Shimmer className="h-48 w-full rounded-2xl" />
        <Shimmer className="h-24 w-full rounded-2xl" />
        <Shimmer className="h-32 w-full rounded-2xl" />
      </div>
    );
  }

  if (!card) return null;

  const tier = getTierConfig(card.membership_tier);
  const progress = getTierProgress(card.lifetime_points);
  const TierIcon = tier.icon;
  const nextTierName = getNextTier(card.membership_tier);

  return (
    <div className="p-4 page-enter space-y-5 max-w-lg mx-auto">
      {/* Page Header */}
      <div className="space-y-1">
        <h1 className="type-headline-3 text-foreground">ClutchD Card</h1>
        <p className="type-body-2 text-text-muted">Your membership & rewards</p>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="flex items-start gap-3 glass-lux rounded-2xl p-4 border border-amber-500/20 bg-amber-500/5">
          <p className="text-sm text-amber-300 flex-1">{error}</p>
          <button
            onClick={fetchData}
            className="text-xs font-medium text-primary-light hover:text-primary shrink-0"
          >
            Retry
          </button>
        </div>
      )}

      {/* ── Digital Card ─────────────────────────────────────────────── */}
      <div
        className={cn(
          "relative overflow-hidden rounded-2xl p-6 bg-gradient-to-br",
          tier.gradient,
          "border",
          tier.ring,
          "shadow-xl"
        )}
      >
        {/* Decorative elements */}
        <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-white/[0.03] blur-2xl" />
        <div className="absolute -bottom-10 -left-10 w-32 h-32 rounded-full bg-white/[0.03] blur-2xl" />

        <div className="relative space-y-4">
          {/* Card Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CreditCard size={20} className="text-white/70" />
              <span className="text-xs font-medium text-white/70 uppercase tracking-wider">
                ClutchD
              </span>
            </div>
            <div className={cn("flex items-center gap-1.5", tier.color)}>
              <TierIcon size={16} />
              <span className="text-sm font-bold">{tier.label}</span>
            </div>
          </div>

          {/* Card Number */}
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-mono font-bold text-white tracking-widest">
                {card.card_number}
              </span>
              <CopyButton text={card.card_number} />
            </div>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-2 gap-4 pt-2">
            <div>
              <p className="text-[10px] font-medium text-white/60 uppercase tracking-wider">
                Reward Points
              </p>
              <p className="text-xl font-bold text-white mt-0.5">
                {card.reward_points.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-medium text-white/60 uppercase tracking-wider">
                Total Spent
              </p>
              <p className="text-xl font-bold text-white mt-0.5">
                {formatCurrency(card.total_spent)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Tier Progress ────────────────────────────────────────────── */}
      <div className="glass-lux rounded-2xl p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp size={16} className="text-primary-light" />
            <span className="text-sm font-semibold text-foreground">Tier Progress</span>
          </div>
          <span className="text-xs text-text-muted">
            {card.lifetime_points.toLocaleString()} pts
          </span>
        </div>

        {/* Progress Bar */}
        <div className="relative h-2.5 rounded-full bg-white/5 overflow-hidden">
          <div
            className={cn(
              "absolute inset-y-0 left-0 rounded-full transition-all duration-500",
              "bg-gradient-to-r from-primary/60 to-primary-light"
            )}
            style={{ width: `${Math.min(progress.progress, 100)}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-xs">
          <span className="capitalize text-text-muted">{progress.currentLabel}</span>
          {progress.nextLabel ? (
            <span className="text-text-muted">
              {progress.pointsNeeded.toLocaleString()} pts to {progress.nextLabel}
            </span>
          ) : (
            <span className="text-primary-light font-semibold">Maximum Tier!</span>
          )}
        </div>

        {/* Member stats */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <div className="bg-white/[0.03] rounded-xl p-3 text-center">
            <p className="text-xs text-text-muted">Orders</p>
            <p className="text-lg font-bold text-foreground mt-0.5">{card.total_orders}</p>
          </div>
          <div className="bg-white/[0.03] rounded-xl p-3 text-center">
            <p className="text-xs text-text-muted">Discount</p>
            <p className="text-lg font-bold text-primary-light mt-0.5">{tier.discount}</p>
          </div>
        </div>
      </div>

      {/* ── Exclusive Offers ─────────────────────────────────────────── */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Gift size={16} className="text-primary-light" />
          <h2 className="text-sm font-semibold text-foreground">Exclusive Offers</h2>
        </div>

        {offers.length === 0 ? (
          <div className="glass-lux rounded-2xl p-6 text-center">
            <Gift size={24} className="mx-auto text-text-muted mb-2" />
            <p className="text-sm text-text-muted">No offers available at the moment</p>
          </div>
        ) : (
          <div className="space-y-2">
            {offers.map((offer) => {
              const locked = offer.min_tier !== card.membership_tier;
              return <OfferCard key={offer.id} offer={offer} locked={locked} />;
            })}
          </div>
        )}
      </div>

      {/* Extra bottom spacing */}
      <div className="h-4" />
    </div>
  );
}
