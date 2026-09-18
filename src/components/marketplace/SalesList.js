"use client";

import { useEffect, useState } from "react";
import { ReceiptText, RefreshCw, IndianRupee } from "lucide-react";
import { useProductStore } from "@/store/productStore";
import { formatCurrency } from "@/lib/utils";

const STATUS_STYLES = {
  confirmed: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  pending: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  cancelled: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
};

function statusStyle(status) {
  return STATUS_STYLES[status] || "bg-surface-soft text-text-muted border-border-subtle";
}

function formatDate(iso) {
  try {
    return new Date(iso).toLocaleString(undefined, {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

/**
 * Seller sales view — orders containing this seller's products.
 * Data comes from GET /orders/sales (server-scoped to the caller).
 */
export function SalesList() {
  const sales = useProductStore((s) => s.sellerSales);
  const loaded = useProductStore((s) => s.sellerSalesLoaded);
  const fetchSellerSales = useProductStore((s) => s.fetchSellerSales);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!loaded) fetchSellerSales();
  }, [loaded, fetchSellerSales]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchSellerSales();
    setRefreshing(false);
  };

  const totalRevenue = sales.reduce(
    (sum, o) =>
      sum +
      (o.items || []).reduce((s2, i) => s2 + (Number(i.price) || 0) * (Number(i.quantity) || 0), 0),
    0
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-text-muted">
            Your sales
          </h3>
          <p className="mt-0.5 text-xs text-text-muted">
            Orders that include parts you listed
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="inline-flex items-center gap-2 rounded-xl border border-border-subtle bg-surface px-3 py-2 text-xs font-semibold text-text-primary transition-all hover:bg-surface-soft disabled:opacity-50"
          aria-label="Refresh sales"
        >
          <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {/* Revenue summary */}
      <div className="grid grid-cols-2 gap-3">
        <div className="glass-lux rounded-2xl p-4">
          <div className="flex items-center gap-2 text-text-muted">
            <ReceiptText size={16} />
            <span className="text-[11px] font-semibold uppercase tracking-wider">
              Orders
            </span>
          </div>
          <p className="mt-2 text-xl font-bold text-text-primary">{sales.length}</p>
        </div>
        <div className="glass-lux rounded-2xl p-4">
          <div className="flex items-center gap-2 text-text-muted">
            <IndianRupee size={16} />
            <span className="text-[11px] font-semibold uppercase tracking-wider">
              Revenue
            </span>
          </div>
          <p className="mt-2 text-xl font-bold text-text-primary">
            {formatCurrency(totalRevenue)}
          </p>
        </div>
      </div>

      {!loaded ? (
        <div className="glass-lux rounded-2xl p-8 text-center">
          <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-t-transparent border-primary" />
          <p className="text-sm text-text-muted">Loading your sales…</p>
        </div>
      ) : sales.length === 0 ? (
        <div className="glass-lux rounded-2xl p-8 text-center">
          <ReceiptText size={32} className="mx-auto mb-3 text-text-muted" />
          <p className="text-sm font-semibold text-text-primary">No sales yet</p>
          <p className="mt-1 text-sm text-text-muted">
            When a customer orders a part you listed, it shows up here.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {sales.map((order) => {
            const orderTotal = (order.items || []).reduce(
              (s2, i) => s2 + (Number(i.price) || 0) * (Number(i.quantity) || 0),
              0
            );
            return (
              <div key={order.id} className="glass-lux rounded-2xl p-4">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-xs text-text-muted">
                    #{String(order.id).slice(0, 8)}
                  </span>
                  <span
                    className={`rounded-full border px-2.5 py-0.5 text-[11px] font-semibold capitalize ${statusStyle(
                      order.status
                    )}`}
                  >
                    {order.status}
                  </span>
                </div>
                <div className="mt-3 space-y-1.5">
                  {(order.items || []).map((item, idx) => (
                    <div
                      key={item.productId || idx}
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="text-text-primary">
                        {item.name || "Part"}
                        <span className="text-text-muted"> × {item.quantity}</span>
                      </span>
                      <span className="font-semibold text-text-primary">
                        {formatCurrency((Number(item.price) || 0) * (Number(item.quantity) || 0))}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="mt-3 flex items-center justify-between border-t border-border-subtle pt-3">
                  <span className="text-xs text-text-muted">
                    {formatDate(order.createdAt)}
                  </span>
                  <span className="text-sm font-bold text-text-primary">
                    {formatCurrency(orderTotal)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
