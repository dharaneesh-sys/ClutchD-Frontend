"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  ClipboardList,
  Clock,
  CheckCircle2,
  XCircle,
  Wrench,
  Eye,
  Package,
  Download,
  Receipt,
} from "lucide-react";
import { cn, toCamelCase, formatCurrency, formatDate, formatTime } from "@/lib/utils";
import { EmptyState } from "@/components/ui/EmptyState";
import { ShimmerList } from "@/components/ui/Shimmer";
import { Badge } from "@/components/ui/Badge";
import { useAuthStore } from "@/store/authStore";
import api, { extractApiError } from "@/lib/api";
import { useToast } from "@/hooks/useToast";

// ─── Tab definitions ─────────────────────────────────────────────────

const TABS = [
  { key: "current", label: "Current Orders", icon: Clock },
  { key: "completed", label: "Completed", icon: CheckCircle2 },
  { key: "cancelled", label: "Cancelled", icon: XCircle },
];

// ─── Status mapping ──────────────────────────────────────────────────

const STATUS_LABELS = {
  searching: "Searching",
  assigned: "Assigned",
  en_route: "En Route",
  in_progress: "In Progress",
  completed: "Completed",
  cancelled: "Cancelled",
  pending: "Pending",
};

const STATUS_BADGE_VARIANT = {
  searching: "warning",
  assigned: "info",
  en_route: "info",
  in_progress: "default",
  completed: "success",
  cancelled: "danger",
  pending: "warning",
};

const ACTIVE_STATUSES = ["searching", "assigned", "en_route", "in_progress", "pending"];

const ISSUE_LABELS = {
  flat_tire: "Flat Tire",
  engine_failure: "Engine Failure",
  battery_dead: "Dead Battery",
  overheating: "Overheating",
  brake_issue: "Brake Issue",
  oil_leak: "Oil Leak",
  electrical: "Electrical Problem",
  ac_not_working: "AC Not Working",
  transmission: "Transmission Issue",
  starting_issue: "Won't Start",
  noise: "Strange Noise",
  other: "Other",
};

function getIssueLabel(tag) {
  return ISSUE_LABELS[tag] || tag || "Service";
}

function getStatusTab(status) {
  if (ACTIVE_STATUSES.includes(status)) return "current";
  if (status === "completed") return "completed";
  if (status === "cancelled") return "cancelled";
  return "current";
}

// ─── Order Card ──────────────────────────────────────────────────────

function OrderCard({ order, onViewDetails, onDownloadReceipt }) {
  return (
    <div
      className="glass-lux rounded-2xl p-4 sm:p-5 space-y-3 animate-fade-in-up"
    >
      {/* Header: ID + Status */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <Wrench size={14} className="shrink-0 text-text-muted" />
            <span className="text-sm font-semibold text-foreground truncate">
              {getIssueLabel(order.issue_tag)}
            </span>
          </div>
          <p className="text-[11px] text-text-muted mt-1 font-mono">
            #{order.id?.slice(-8) || "—"}
          </p>
        </div>
        <Badge variant={STATUS_BADGE_VARIANT[order.status] || "default"}>
          {STATUS_LABELS[order.status] || order.status}
        </Badge>
      </div>

      {/* Divider */}
      <div className="border-t border-border-subtle/50" />

      {/* Info rows */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-text-muted">
        {order.created_at && (
          <span className="inline-flex items-center gap-1.5">
            <Package size={12} className="shrink-0" />
            {formatDate(order.created_at)}
          </span>
        )}
        {order.total_amount > 0 && (
          <span className="inline-flex items-center gap-1.5 font-semibold text-foreground">
            {formatCurrency(order.total_amount)}
          </span>
        )}
        {order.assigned_mechanic?.name && (
          <span className="inline-flex items-center gap-1.5">
            <span className="w-1 h-1 rounded-full bg-text-dim/40" />
            {order.assigned_mechanic.name}
          </span>
        )}
      </div>

      {/* Description preview */}
      {order.description && (
        <p className="text-xs text-text-dim line-clamp-2">
          {order.description}
        </p>
      )}

      {/* Actions */}
      <div className="flex justify-end pt-1 gap-2">
        {order.status === "completed" && (
          <button
            onClick={() => onDownloadReceipt(order)}
            className={cn(
              "inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg",
              "bg-primary/10 text-primary-light hover:bg-primary/20 transition-colors"
            )}
          >
            <Download size={13} />
            Receipt
          </button>
        )}
        <button
          onClick={() => onViewDetails(order)}
          className={cn(
            "inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg",
            "bg-white/5 text-text-muted hover:bg-white/10 hover:text-foreground transition-colors"
          )}
        >
          <Eye size={13} />
          View Details
        </button>
      </div>
    </div>
  );
}

// ─── Detail Modal ────────────────────────────────────────────────────

function DetailModal({ order, onClose }) {
  if (!order) return null;

  return (
    <>
      <div
        onClick={onClose}
        className="fixed inset-0 z-40 backdrop-blur-sm animate-[backdrop-in_0.2s_ease] bg-black/50"
        aria-hidden="true"
      />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 py-12 px-4 sm:px-6 overflow-y-auto w-full h-full pointer-events-none">
        <div
          className={cn(
            "relative w-full max-w-md rounded-2xl border pointer-events-auto animate-[modal-in_0.25s_ease]",
            "p-6 backdrop-blur-3xl",
            "border-border-subtle bg-surface shadow-[0_30px_80px_rgba(var(--color-black-rgb),0.35)] ring-1 ring-primary/10"
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold tracking-tight text-text-primary">
              Order Details
            </h2>
            <button
              onClick={onClose}
              className="rounded-full p-1.5 transition-colors text-text-dim hover:bg-surface-soft hover:text-text-primary"
            >
              <XCircle size={18} />
            </button>
          </div>

          <div className="space-y-4">
            {/* Status */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-text-muted">Status</span>
              <Badge variant={STATUS_BADGE_VARIANT[order.status] || "default"}>
                {STATUS_LABELS[order.status] || order.status}
              </Badge>
            </div>

            {/* Service */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-text-muted">Service</span>
              <span className="text-sm font-medium text-foreground">
                {getIssueLabel(order.issue_tag)}
              </span>
            </div>

            {/* Order ID */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-text-muted">Order ID</span>
              <span className="text-sm font-mono text-text-primary">
                #{order.id}
              </span>
            </div>

            {/* Date */}
            {order.created_at && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-text-muted">Date</span>
                <span className="text-sm text-foreground">
                  {formatDate(order.created_at)} at {formatTime(order.created_at)}
                </span>
              </div>
            )}

            {/* Amount */}
            {order.total_amount > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-text-muted">Amount</span>
                <span className="text-lg font-bold text-foreground">
                  {formatCurrency(order.total_amount)}
                </span>
              </div>
            )}

            {/* Mechanic */}
            {order.assigned_mechanic && (
              <div className="pt-3 border-t border-border-subtle/50">
                <span className="text-sm text-text-muted block mb-1">Assigned Mechanic</span>
                <p className="text-sm font-medium text-foreground">
                  {order.assigned_mechanic.name}
                </p>
                {order.assigned_mechanic.phone && (
                  <p className="text-xs text-text-muted">{order.assigned_mechanic.phone}</p>
                )}
              </div>
            )}

            {/* Description */}
            {order.description && (
              <div className="pt-3 border-t border-border-subtle/50">
                <span className="text-sm text-text-muted block mb-1">Description</span>
                <p className="text-sm text-text-secondary">{order.description}</p>
              </div>
            )}

            {/* Pricing Breakdown (fallback when receipt unavailable) */}
            {order.status === "completed" && order.pricing && (
              <div className="pt-3 border-t border-border-subtle/50 space-y-2">
                <div className="flex items-center gap-2 mb-2">
                  <Receipt size={14} className="text-icon-highlight" />
                  <span className="text-sm font-semibold text-text-primary">Payment Breakdown</span>
                </div>
                <div className="flex justify-between text-sm text-text-primary">
                  <span>Service Fee</span>
                  <span className="font-medium">{formatCurrency(order.pricing.serviceAmount || 0)}</span>
                </div>
                <div className="flex justify-between text-sm text-text-primary">
                  <span>Convenience Fee</span>
                  <span className="font-medium">{formatCurrency(order.pricing.convenienceFee || 0)}</span>
                </div>
                {order.pricing.cancellationFee > 0 && (
                  <div className="flex justify-between text-sm text-text-primary">
                    <span>Cancellation Fee</span>
                    <span className="font-medium">{formatCurrency(order.pricing.cancellationFee)}</span>
                  </div>
                )}
                {order.pricing.distanceFee > 0 && (
                  <div className="flex justify-between text-sm text-text-primary">
                    <span>Distance ({order.pricing.distanceKm?.toFixed(1) || "0.0"} km)</span>
                    <span className="font-medium">{formatCurrency(order.pricing.distanceFee)}</span>
                  </div>
                )}
                {order.pricing.gstAmount > 0 && (
                  <div className="flex justify-between text-sm text-text-primary">
                    <span>GST</span>
                    <span className="font-medium">{formatCurrency(order.pricing.gstAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-bold text-text-primary border-t border-border-subtle/50 pt-2">
                  <span>Total</span>
                  <span className="text-icon-highlight">{formatCurrency(order.pricing.totalAmount || order.total_amount || 0)}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Page ────────────────────────────────────────────────────────────

export default function OrdersPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("current");
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);

  const downloadReceipt = async (order) => {
    try {
      const res = await api.get(`/jobs/history/${order.id}/invoice`, { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `receipt_${order.id.substring(0, 8)}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (e) {
      const status = e.response?.status;
      if (status === 503) {
        toast.error("Invoice unavailable — try again later", {
          persistent: true,
          action: { label: "Retry", onClick: () => downloadReceipt(order) },
        });
      } else if (status === 501) {
        toast.error("Invoice generation not available");
      } else if (status === 404) {
        // Receipt endpoint not available — show inline breakdown
        setSelectedOrder(order);
      } else {
        toast.error(extractApiError(e, "Failed to download receipt."));
      }
    }
  };

  const fetchOrders = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { data } = await api.get("/jobs/history");
      const fetched = data?.jobs || data?.orders || data || [];
      setOrders(toCamelCase(fetched || []));
    } catch {
      setOrders([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Filter orders by active tab
  const filteredOrders = orders.filter(
    (o) => getStatusTab(o.status) === activeTab
  );

  const sortedOrders = [...filteredOrders].sort(
    (a, b) => new Date(b.created_at) - new Date(a.created_at)
  );

  return (
    <div className="p-4 page-enter">
      {/* Header */}
      <div className="space-y-1 mb-6">
        <h1 className="type-headline-3 text-foreground">Orders</h1>
        <p className="type-body-2 text-muted">Track your service orders</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5 mb-6 overflow-x-auto scrollbar-none">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          const count = orders.filter((o) => getStatusTab(o.status) === tab.key).length;

          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                "flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap border",
                isActive
                  ? "bg-primary/10 text-foreground border-primary/30 shadow-sm"
                  : "bg-white/5 text-text-muted border-transparent hover:bg-white/10 hover:text-foreground"
              )}
            >
              <Icon size={14} />
              {tab.label}
              {count > 0 && (
                <span
                  className={cn(
                    "ml-1 text-[10px] px-1.5 py-0.5 rounded-full",
                    isActive
                      ? "bg-primary/20 text-primary-light"
                      : "bg-white/10 text-text-dim"
                  )}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Content */}
      {isLoading ? (
        <ShimmerList count={3} />
      ) : sortedOrders.length > 0 ? (
        <div className="space-y-3">
          {sortedOrders.map((order, index) => (
            <div key={order.id} style={{ animationDelay: `${index * 60}ms` }}>
              <OrderCard
                order={order}
                onViewDetails={setSelectedOrder}
                onDownloadReceipt={downloadReceipt}
              />
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={ClipboardList}
          title={`No ${activeTab} orders`}
          description={
            activeTab === "current"
              ? "You don't have any active orders. Create a service request to get started."
              : activeTab === "completed"
              ? "Your completed orders will appear here."
              : "No cancelled orders to show."
          }
          action={
            activeTab === "current" ? (
              <button
                onClick={() => router.push("/dashboard")}
                className="btn-glow inline-flex h-11 items-center gap-2 rounded-xl px-6 text-sm font-medium text-white transition-all hover-lift active-press"
              >
                Request Service
              </button>
            ) : undefined
          }
        />
      )}

      {/* Detail Modal */}
      {selectedOrder && (
        <DetailModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
        />
      )}
    </div>
  );
}
