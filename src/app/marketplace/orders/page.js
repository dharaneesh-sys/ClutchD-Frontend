"use client";

import { useEffect, useCallback, useState } from "react";
import {
  ClipboardList,
  Package,
  Truck,
  CheckCircle2,
  XCircle,
  Clock,
  RotateCcw,
  Store,
  ShoppingBag,
  MapPin,
  Bell,
  Eye,
  X,
} from "lucide-react";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import { useOrderStore } from "@/store/orderStore";
import { ORDER_STATUSES } from "@/lib/constants";
import { useOrderStatusNotifications } from "@/hooks/useOrderStatusNotifications";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { OrderTimeline } from "@/components/marketplace/OrderTimeline";

// ─── Status helpers ───────────────────────────────────────────────────

const STATUS_STYLES = {
  pending: {
    bg: "bg-amber-500/15",
    text: "text-amber-300",
    dot: "bg-amber-400",
    icon: Clock,
  },
  confirmed: {
    bg: "bg-sky-500/15",
    text: "text-sky-300",
    dot: "bg-sky-400",
    icon: RotateCcw,
  },
  shipped: {
    bg: "bg-indigo-500/15",
    text: "text-indigo-300",
    dot: "bg-indigo-400",
    icon: Truck,
  },
  ready_for_pickup: {
    bg: "bg-cyan-500/15",
    text: "text-cyan-300",
    dot: "bg-cyan-400",
    icon: Store,
  },
  picked_up: {
    bg: "bg-teal-500/15",
    text: "text-teal-300",
    dot: "bg-teal-400",
    icon: ShoppingBag,
  },
  delivered: {
    bg: "bg-emerald-500/15",
    text: "text-emerald-300",
    dot: "bg-emerald-400",
    icon: CheckCircle2,
  },
  cancelled: {
    bg: "bg-rose-500/15",
    text: "text-rose-300",
    dot: "bg-rose-400",
    icon: XCircle,
  },
};

function StatusBadge({ status }) {
  const style = STATUS_STYLES[status] || STATUS_STYLES.pending;
  const Icon = style.icon;
  const label = ORDER_STATUSES[status] || status;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1",
        "text-[0.6875rem] font-semibold tracking-wide uppercase",
        style.bg,
        style.text,
      )}
    >
      <span className={cn("w-1.5 h-1.5 rounded-full", style.dot)} />
      <Icon size={12} className="shrink-0" />
      {label}
    </span>
  );
}

// ─── Loading skeleton ─────────────────────────────────────────────────

function OrdersSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={i}
          className="glass-lux rounded-2xl p-5 space-y-4"
        >
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-6 w-24 rounded-full" />
          </div>
          <div className="flex items-center gap-6">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-3 w-16" />
          </div>
          <div className="flex justify-between items-center pt-2 border-t border-border-subtle/50">
            <Skeleton className="h-3 w-32" />
            <Skeleton className="h-5 w-20" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Order Card ───────────────────────────────────────────────────────

function OrderCard({ order, onMarkPickedUp, onViewTimeline }) {
  const itemCount = order.items?.length || 0;
  const isReadyForPickup = order.status === "ready_for_pickup";

  const pickupLocation = order.pickupLocation
    ? typeof order.pickupLocation === "string"
      ? { name: order.pickupLocation }
      : order.pickupLocation
    : null;

  return (
    <div className="glass-lux rounded-2xl p-5 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground">
            Order #{order.id}
          </p>
          <p className="text-[11px] text-text-muted mt-0.5">
            {order.createdAt ? formatDate(order.createdAt) : "—"}
          </p>
        </div>
        <StatusBadge status={order.status} />
      </div>

      <div className="border-t border-border-subtle/50" />

      {isReadyForPickup && (
        <div className="flex items-start gap-2.5 rounded-xl bg-cyan-500/10 px-3.5 py-2.5">
          <Bell size={16} className="mt-0.5 shrink-0 text-cyan-400" />
          <div className="min-w-0">
            <p className="text-xs font-semibold text-cyan-300">
              Ready for Pickup
            </p>
            <p className="text-[11px] text-cyan-400/70 mt-0.5">
              Your order is ready! Head to the store to collect it.
            </p>
          </div>
        </div>
      )}

      <div className="flex items-center gap-4 text-xs text-text-muted">
        <span className="inline-flex items-center gap-1.5">
          <Package size={13} className="shrink-0" />
          {itemCount} item{itemCount !== 1 ? "s" : ""}
        </span>
        {order.payment?.method && (
          <span className="capitalize inline-flex items-center gap-1.5">
            <span className="w-1 h-1 rounded-full bg-text-dim/40" />
            {order.payment.method}
          </span>
        )}
        {pickupLocation ? (
          <span className="inline-flex items-center gap-1.5" title={pickupLocation.address || ""}>
            <Store size={13} className="shrink-0 text-cyan-400" />
            {pickupLocation.name}
          </span>
        ) : order.address?.city ? (
          <span className="inline-flex items-center gap-1.5">
            <MapPin size={13} className="shrink-0" />
            {order.address.city}
          </span>
        ) : null}
      </div>

      <div className="flex items-center justify-between pt-1">
        <button
          onClick={() => onViewTimeline(order)}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5",
            "text-xs font-medium transition-all",
            "bg-white/5 text-text-muted hover:bg-white/10 hover:text-foreground",
          )}
        >
          <Eye size={13} />
          View Timeline
        </button>
        <div className="flex items-center gap-3">
          {isReadyForPickup && (
            <button
              onClick={() => onMarkPickedUp(order.id)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5",
                "text-xs font-semibold transition-all",
                "bg-teal-500/20 text-teal-300 hover:bg-teal-500/30",
                "active:scale-95",
              )}
            >
              <ShoppingBag size={13} />
              Mark as Picked Up
            </button>
          )}
          <span className="text-lg font-bold tracking-tight text-foreground">
            {formatCurrency(order.total)}
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Timeline Modal ─────────────────────────────────────────────────

function TimelineModal({ order, onClose }) {
  if (!order) return null;

  const isBopis = !!(order.pickupLocation);
  const statusHistory = order.timeline || order.statusHistory ||
    (order.createdAt ? [{ status: order.status, timestamp: order.createdAt }] : []);

  return (
    <>
      <div
        onClick={onClose}
        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm animate-[backdrop-in_0.2s_ease]"
        aria-hidden="true"
      />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 py-12 px-4 sm:px-6 overflow-y-auto w-full h-full pointer-events-none">
        <div
          className={cn(
            "relative w-full max-w-sm rounded-2xl border pointer-events-auto animate-[modal-in_0.25s_ease]",
            "p-6 backdrop-blur-3xl",
            "border-border-subtle bg-surface shadow-[0_30px_80px_rgba(var(--color-black-rgb),0.35)] ring-1 ring-primary/10"
          )}
        >
          <div className="flex items-center justify-between mb-5">
            <div className="min-w-0">
              <h2 className="text-base font-semibold tracking-tight text-foreground">
                Order #{order.id}
              </h2>
              <p className="text-[11px] text-text-muted mt-0.5">
                {order.createdAt ? formatDate(order.createdAt) : "—"}
              </p>
            </div>
            <button
              onClick={onClose}
              className="rounded-full p-1.5 transition-colors text-text-dim hover:bg-surface-soft hover:text-foreground -mr-1"
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>

          <OrderTimeline
            status={order.status}
            statusHistory={statusHistory}
            flowType={isBopis ? "bopis" : "delivery"}
          />

          <div className="mt-1 pt-4 border-t border-border-subtle/50 space-y-2">
            <div className="flex justify-between text-xs text-text-muted">
              <span>Items</span>
              <span className="font-medium text-foreground">
                {order.items?.length || 0}
              </span>
            </div>
            <div className="flex justify-between text-xs text-text-muted">
              <span>Total</span>
              <span className="text-sm font-bold text-foreground">
                {formatCurrency(order.total)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────

export default function OrdersPage() {
  const { orders, isLoading, fetchOrderHistory, updateOrderStatus } = useOrderStore();
  const [timelineOrder, setTimelineOrder] = useState(null);

  useOrderStatusNotifications();

  useEffect(() => {
    fetchOrderHistory();
  }, [fetchOrderHistory]);

  const handleMarkPickedUp = useCallback(
    (orderId) => {
      updateOrderStatus(orderId, "picked_up");
    },
    [updateOrderStatus],
  );

  return (
    <div className="p-4 page-enter">
      <div className="space-y-1 mb-7">
        <h1 className="type-headline-3 text-foreground">Order History</h1>
        <p className="type-body-2 text-muted">
          View and track all your past orders
        </p>
      </div>

      {isLoading && orders.length === 0 ? (
        <OrdersSkeleton />
      ) : orders.length > 0 ? (
        <div className="space-y-4">
          {orders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              onMarkPickedUp={handleMarkPickedUp}
              onViewTimeline={setTimelineOrder}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={ClipboardList}
          title="No orders yet"
          description="You haven't placed any orders yet. Browse the marketplace to find the parts you need."
        />
      )}

      {timelineOrder && (
        <TimelineModal
          order={timelineOrder}
          onClose={() => setTimelineOrder(null)}
        />
      )}
    </div>
  );
}
