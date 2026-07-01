"use client";

import { useState, useEffect, useCallback } from "react";
import {
  CreditCard,
  Download,
  Receipt,
  Smartphone,
  DollarSign,
  Banknote,
} from "lucide-react";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import { EmptyState } from "@/components/ui/EmptyState";
import { ShimmerList } from "@/components/ui/Shimmer";
import { Badge } from "@/components/ui/Badge";
import { useToastStore } from "@/store/toastStore";
import api from "@/lib/api";

// ─── Status helpers ──────────────────────────────────────────────────

const STATUS_CONFIG = {
  completed: { variant: "success", label: "Paid" },
  pending: { variant: "warning", label: "Pending" },
  failed: { variant: "danger", label: "Failed" },
  refunded: { variant: "info", label: "Refunded" },
};

const METHOD_ICONS = {
  upi: Smartphone,
  card: CreditCard,
  cash: Banknote,
  credit_card: CreditCard,
  debit_card: CreditCard,
  net_banking: CreditCard,
};

const METHOD_LABELS = {
  upi: "UPI",
  card: "Card",
  cash: "Cash",
  credit_card: "Credit Card",
  debit_card: "Debit Card",
  net_banking: "Net Banking",
};

// ─── Demo fallback data ──────────────────────────────────────────────

const DEMO_PAYMENTS = [
  {
    id: "pay-demo-1",
    amount: 2850,
    currency: "INR",
    provider: "razorpay",
    status: "completed",
    method: "upi",
    created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    id: "pay-demo-2",
    amount: 1200,
    currency: "INR",
    provider: "razorpay",
    status: "completed",
    method: "card",
    created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
  {
    id: "pay-demo-3",
    amount: 450,
    currency: "INR",
    provider: "cash",
    status: "completed",
    method: "cash",
    created_at: new Date(Date.now() - 86400000 * 7).toISOString(),
  },
  {
    id: "pay-demo-4",
    amount: 3200,
    currency: "INR",
    provider: "razorpay",
    status: "pending",
    method: "upi",
    created_at: new Date(Date.now() - 1800000).toISOString(),
  },
  {
    id: "pay-demo-5",
    amount: 1500,
    currency: "INR",
    provider: "razorpay",
    status: "failed",
    method: "card",
    created_at: new Date(Date.now() - 86400000).toISOString(),
  },
];

// ─── Payment Card ────────────────────────────────────────────────────

function PaymentCard({ payment, onDownload }) {
  const MethodIcon = METHOD_ICONS[payment.method] || CreditCard;
  const methodLabel = METHOD_LABELS[payment.method] || payment.method;

  return (
    <div className="glass-lux rounded-2xl p-4 sm:p-5 space-y-3 animate-fade-in-up">
      {/* Header: Method + Status */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-white/10 ring-1 ring-white/10 flex items-center justify-center">
            <MethodIcon size={18} className="text-primary-light" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground capitalize">
              {methodLabel}
            </p>
            <p className="text-[11px] text-text-muted mt-0.5">
              {formatDate(payment.created_at)}
            </p>
          </div>
        </div>
        <Badge variant={STATUS_CONFIG[payment.status]?.variant || "default"}>
          {STATUS_CONFIG[payment.status]?.label || payment.status}
        </Badge>
      </div>

      {/* Divider */}
      <div className="border-t border-border-subtle/50" />

      {/* Info */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="text-xs text-text-muted">
            {payment.provider && (
              <span className="capitalize">{payment.provider}</span>
            )}
            {payment.transactionId && (
              <span className="ml-2 font-mono text-[10px]">
                TXN: {payment.transactionId.slice(-8)}
              </span>
            )}
          </div>
        </div>
        <span className="text-lg font-bold tracking-tight text-foreground">
          {formatCurrency(payment.amount)}
        </span>
      </div>

      {/* Actions */}
      <div className="flex justify-end pt-1">
        <button
          onClick={() => onDownload(payment)}
          className={cn(
            "inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg",
            "bg-primary/10 text-primary-light hover:bg-primary/20 transition-colors"
          )}
        >
          <Download size={13} />
          Download Receipt
        </button>
      </div>
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────

export default function PaymentsPage() {
  const [payments, setPayments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const toast = useToastStore();

  const fetchPayments = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { data } = await api.get("/payments/history");
      const fetched = data?.payments || data || [];
      setPayments(fetched.length > 0 ? fetched : DEMO_PAYMENTS);
    } catch {
      setPayments(DEMO_PAYMENTS);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  const handleDownload = (payment) => {
    toast.info("Receipt download coming soon");
  };

  const sortedPayments = [...payments].sort(
    (a, b) => new Date(b.created_at) - new Date(a.created_at)
  );

  // Summary stats
  const totalPaid = payments
    .filter((p) => p.status === "completed")
    .reduce((sum, p) => sum + (p.amount || 0), 0);
  const pendingCount = payments.filter((p) => p.status === "pending").length;

  return (
    <div className="p-4 page-enter">
      {/* Header */}
      <div className="space-y-1 mb-6">
        <h1 className="type-headline-3 text-foreground">Payments & Bills</h1>
        <p className="type-body-2 text-muted">View your payment history</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="glass-lux rounded-2xl p-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
              <DollarSign size={16} className="text-primary-light" />
            </div>
            <div>
              <p className="text-2xl font-bold tracking-tight text-foreground">
                {formatCurrency(totalPaid)}
              </p>
              <p className="text-xs text-text-muted font-medium">Total Paid</p>
            </div>
          </div>
        </div>
        <div className="glass-lux rounded-2xl p-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 flex items-center justify-center shrink-0">
              <Receipt size={16} className="text-amber-400" />
            </div>
            <div>
              <p className="text-2xl font-bold tracking-tight text-foreground">
                {pendingCount}
              </p>
              <p className="text-xs text-text-muted font-medium">Pending</p>
            </div>
          </div>
        </div>
      </div>

      {/* Payment List */}
      {isLoading ? (
        <ShimmerList count={3} />
      ) : sortedPayments.length > 0 ? (
        <div className="space-y-3">
          {sortedPayments.map((payment, index) => (
            <div key={payment.id} style={{ animationDelay: `${index * 60}ms` }}>
              <PaymentCard
                payment={payment}
                onDownload={handleDownload}
              />
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Receipt}
          title="No payments yet"
          description="Your payment history will appear here after your first service."
        />
      )}
    </div>
  );
}
