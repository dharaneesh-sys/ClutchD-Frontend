"use client";

import { useEffect } from "react";
import {
  ClipboardList,
  Package,
  Truck,
  CheckCircle2,
  XCircle,
  Clock,
  RotateCcw,
} from "lucide-react";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import { useOrderStore } from "@/store/orderStore";
import { ORDER_STATUSES } from "@/lib/constants";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";

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
          {/* Header row */}
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-6 w-24 rounded-full" />
          </div>
          {/* Info rows */}
          <div className="flex items-center gap-6">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-3 w-16" />
          </div>
          {/* Total row */}
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

function OrderCard({ order }) {
  const itemCount = order.items?.length || 0;

  return (
    <div className="glass-lux rounded-2xl p-5 space-y-3">
      {/* Header row */}
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

      {/* Divider */}
      <div className="border-t border-border-subtle/50" />

      {/* Info rows */}
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
        {order.address?.city && (
          <span className="inline-flex items-center gap-1.5">
            <span className="w-1 h-1 rounded-full bg-text-dim/40" />
            {order.address.city}
          </span>
        )}
      </div>

      {/* Total */}
      <div className="flex items-center justify-between pt-1">
        <span className="text-xs text-text-muted">Order Total</span>
        <span className="text-lg font-bold tracking-tight text-foreground">
          {formatCurrency(order.total)}
        </span>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────

export default function OrdersPage() {
  const { orders, isLoading, fetchOrderHistory } = useOrderStore();

  useEffect(() => {
    fetchOrderHistory();
  }, [fetchOrderHistory]);

  return (
    <div className="p-4 page-enter">
      {/* Header */}
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
            <OrderCard key={order.id} order={order} />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={ClipboardList}
          title="No orders yet"
          description="You haven't placed any orders yet. Browse the marketplace to find the parts you need."
        />
      )}
    </div>
  );
}
