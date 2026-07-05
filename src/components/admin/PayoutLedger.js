"use client";

import { useState, useEffect, useCallback } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { BackendHealth } from "@/lib/backendHealth";
import { Search, Banknote, RefreshCw } from "lucide-react";

const MOCK_PAYOUTS_KEY = "clutchd_payout_ledger";

const PAYOUT_STATUSES = ["All", "Pending", "Processing", "Completed", "Failed"];

const MOCK_MECHANICS = [
  "Rajesh Auto Works",
  "Siddharth Garage",
  "Priya Motors",
  "Kumar Service Center",
  "Ananya Auto Repair",
  "Ganesh Tyres & Service",
  "Sharma Car Care",
  "Venkatesh Auto Garage",
  "Deep Auto Zone",
  "Meera's Auto Solutions",
  "Rahul's Pit Stop",
  "Laxmi Auto Garage",
  "Arun Auto Engineering",
  "Sneha Car Clinic",
  "Varun Motors",
  "Pooja Auto Center",
  "Mohan's Garage",
  "Kavita Auto Works",
  "Suresh Auto Service",
  "Divya Motors Garage",
];

function generateMockPayouts() {
  const statuses = ["pending", "processing", "completed", "failed"];
  const payouts = [];

  for (let i = 0; i < 24; i++) {
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const rawAmount = Math.floor(Math.random() * 15000) + 500;
    const date = new Date();
    date.setDate(date.getDate() - Math.floor(Math.random() * 60));

    payouts.push({
      id: `PAYOUT_${String(i + 1).padStart(4, "0")}`,
      mechanicName: MOCK_MECHANICS[Math.floor(Math.random() * MOCK_MECHANICS.length)],
      providerType: Math.random() > 0.5 ? "mechanic" : "garage",
      amount: rawAmount,
      formattedAmount: `₹${rawAmount.toLocaleString("en-IN")}`,
      status,
      createdAt: date.toISOString(),
    });
  }

  return payouts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

function seedMockData() {
  try {
    const existing = localStorage.getItem(MOCK_PAYOUTS_KEY);
    if (!existing) {
      localStorage.setItem(MOCK_PAYOUTS_KEY, JSON.stringify(generateMockPayouts()));
    }
  } catch {
    // localStorage unavailable — proceed empty
  }
}

function loadMockData() {
  try {
    const raw = localStorage.getItem(MOCK_PAYOUTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function PayoutLedger() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [payouts, setPayouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [backendAvailable, setBackendAvailable] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);

    const available = BackendHealth.isAvailable();
    setBackendAvailable(available);

    if (available) {
      try {
        const { fetchPayouts } = await import("@/services/adminService");
        const data = await fetchPayouts({ status: statusFilter !== "All" ? statusFilter.toLowerCase() : undefined });
        setPayouts(data);
        return;
      } catch (err) {
        console.warn("Backend payout fetch failed, falling back to mock data:", err);
        setBackendAvailable(false);
      }
    }

    // Demo / fallback mode
    seedMockData();
    let data = loadMockData();

    if (statusFilter !== "All") {
      data = data.filter((p) => p.status.toLowerCase() === statusFilter.toLowerCase());
    }

    setPayouts(data);
    setLoading(false);
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

  const formatDate = (dateStr) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <GlassCard variant="outlined" className="p-4 sm:p-6">
      {/* Header with status indicator */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 mb-4">
        <h3 className="text-xl font-semibold text-text-primary flex items-center gap-2">
          <Banknote size={20} className="text-icon-highlight" />
          Payout Ledger
        </h3>
        <div className="flex items-center gap-2">
          <span
            className={`inline-block w-2 h-2 rounded-full ${backendAvailable ? "bg-green-500" : "bg-amber-500"}`}
            title={backendAvailable ? "Live data" : "Demo mode (local data)"}
          />
          <span className="text-xs text-text-muted">
            {backendAvailable ? "Live" : "Demo"}
          </span>
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
