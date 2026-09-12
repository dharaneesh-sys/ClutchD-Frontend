"use client";

import { useState, useEffect, useCallback } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { Search, Banknote, RefreshCw } from "lucide-react";

const PAYOUT_STATUSES = ["All", "Pending", "Processing", "Completed", "Failed"];

export function PayoutLedger() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [payouts, setPayouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { fetchPayouts } = await import("@/services/adminService");
      const data = await fetchPayouts({ status: statusFilter !== "All" ? statusFilter.toLowerCase() : undefined });
      setPayouts(data);
    } catch (err) {
      setError(err?.response?.data?.detail || err.message || "Failed to load payouts");
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filtered = payouts.filter((p) =>
    p.mechanicName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.id?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const statusBadgeVariant = (status) => {
    switch (status) {
      case "completed":
        return "success";
      case "pending":
        return "warning";
      case "processing":
        return "info";
      case "failed":
        return "danger";
      default:
        return "info";
    }
  };

  import { formatDate } from "@/lib/utils";

  return (
    <GlassCard variant="outlined" className="p-4 sm:p-6">
      {/* Header with status indicator */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 mb-4">
        <h3 className="text-xl font-semibold text-text-primary flex items-center gap-2">
          <Banknote size={20} className="text-icon-highlight" />
          Payout Ledger
        </h3>
        <div className="flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-green-500" title="Live data" />
          <span className="text-xs text-text-muted">Live</span>
          <button
            onClick={loadData}
            className="p-1.5 rounded-lg hover:bg-surface-soft text-text-muted hover:text-text-primary transition-colors"
            title="Refresh"
          >
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {/* Search + Status filter */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6">
        <div className="relative w-full sm:w-72">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <Input
            placeholder="Search by mechanic name or payout ID..."
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2 overflow-x-auto custom-scrollbar">
          {PAYOUT_STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                statusFilter === s
                  ? "bg-primary text-white shadow-sm"
                  : "bg-surface-soft text-text-primary hover:bg-bg-card"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="py-12 flex justify-center">
          <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin border-primary" />
        </div>
      ) : error ? (
        <div className="py-12 text-center text-red-500">
          <p>{error}</p>
          <button onClick={loadData} className="mt-3 text-sm underline">
            Retry
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left text-sm text-text-primary">
            <thead className="text-xs uppercase border-b text-text-dim border-border-subtle">
              <tr>
                <th className="px-4 pb-3 font-medium">Payout ID</th>
                <th className="px-4 pb-3 font-medium">Mechanic / Garage</th>
                <th className="px-4 pb-3 font-medium">Type</th>
                <th className="px-4 pb-3 font-medium">Amount</th>
                <th className="px-4 pb-3 font-medium">Status</th>
                <th className="px-4 pb-3 font-medium">Date</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr
                  key={p.id}
                  className="border-b border-border-subtle transition-colors hover:bg-bg-card"
                >
                  <td className="px-4 py-4 font-mono text-xs text-text-muted">
                    {p.id?.slice(0, 8)}
                  </td>
                  <td className="px-4 py-4 font-medium text-text-primary">
                    {p.mechanicName}
                  </td>
                  <td className="px-4 py-4 capitalize text-text-muted text-xs">
                    {p.providerType}
                  </td>
                  <td className="px-4 py-4 font-semibold text-text-primary">
                    {p.formattedAmount}
                  </td>
                  <td className="px-4 py-4">
                    <Badge variant={statusBadgeVariant(p.status)}>
                      {p.status.charAt(0).toUpperCase() + p.status.slice(1)}
                    </Badge>
                  </td>
                  <td className="px-4 py-4 text-xs text-text-muted">
                    {formatDate(p.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filtered.length === 0 && (
            <div className="py-12 text-center text-text-dim">
              No payouts found.
            </div>
          )}
        </div>
      )}
    </GlassCard>
  );
}
