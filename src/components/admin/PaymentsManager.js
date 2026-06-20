import { useState, useEffect } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Search, DollarSign, CreditCard, Receipt, RefreshCw } from "lucide-react";
import { useThemeStore } from "@/store/themeStore";
import { useToast } from "@/components/ui/ToastProvider";
import { fetchPayments } from "@/services/adminService";
import api from "@/lib/api";

export function PaymentsManager() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  const [refundModal, setRefundModal] = useState(null);
  const [refundAmount, setRefundAmount] = useState("");
  const { theme } = useThemeStore();
  const { success: showSuccess, error: showError } = useToast();
  const isLight = theme === "light";

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (statusFilter !== "All") {
        params.status = statusFilter.toLowerCase();
      }
      const data = await fetchPayments(params);
      setPayments(data);
    } catch (err) {
      setError(err?.response?.data?.detail || "Failed to load payments");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, [statusFilter]);

  const filtered = payments.filter(p =>
    p.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.status?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleRefund = async () => {
    if (!refundModal) return;
    const amount = parseInt(refundAmount) * 100;
    if (!amount || amount <= 0) {
      showError("Please enter a valid amount");
      return;
    }
    setActionLoading("refund");
    try {
      await api.post(`/admin/payments/${refundModal.id}/refund`, {
        amount,
        notes: `Refund processed by admin for payment ${refundModal.id}`,
      });
      setPayments(prev => prev.filter(p => p.id !== refundModal.id));
      showSuccess(`Refund of ₹${parseInt(refundAmount).toLocaleString("en-IN")} processed.`);
      setRefundModal(null);
      setRefundAmount("");
    } catch (err) {
      showError(err?.response?.data?.detail || "Failed to process refund");
    } finally {
      setActionLoading(null);
    }
  };

  const statusOptions = ["All", "Pending", "Captured", "Failed", "Refunded"];

  return (
    <>
      <GlassCard variant="outlined" className="p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6">
          <div className="relative w-full sm:w-72">
            <Search size={16} className={`absolute left-3 top-1/2 -translate-y-1/2 ${"text-text-muted"}`} />
            <Input placeholder="Search by user or payment ID..." className="pl-9" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
          <div className="flex gap-2 overflow-x-auto custom-scrollbar">
            {statusOptions.map(s => (
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

        {loading ? (
          <div className="py-12 flex justify-center">
            <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin border-primary" />
          </div>
        ) : error ? (
          <div className="py-12 text-center text-red-500">
            <p>{error}</p>
            <button onClick={loadData} className="mt-3 text-sm underline">Retry</button>
          </div>
        ) : (
          <div className="overflow-x-auto custom-scrollbar">
            <table className={`w-full text-left text-sm ${"text-text-primary"}`}>
              <thead className={`text-xs uppercase border-b ${"text-text-dim border-border-subtle"}`}>
                <tr>
                  <th className="px-4 pb-3 font-medium">Payment ID</th>
                  <th className="px-4 pb-3 font-medium">User</th>
                  <th className="px-4 pb-3 font-medium">Amount</th>
                  <th className="px-4 pb-3 font-medium">Status</th>
                  <th className="px-4 pb-3 font-medium">Method</th>
                  <th className="px-4 pb-3 font-medium">Provider</th>
                  <th className="px-4 pb-3 font-medium">Date</th>
                  <th className="px-4 pb-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr key={p.id} className={`border-b transition-colors ${"border-border-subtle hover:bg-bg-card"}`}>
                    <td className={`px-4 py-4 font-mono text-xs ${"text-text-muted"}`}>{p.id?.slice(0, 8)}</td>
                    <td className={`px-4 py-4 font-medium ${"text-text-primary"}`}>{p.userName}</td>
                    <td className={`px-4 py-4 font-semibold ${"text-text-primary"}`}>{p.formattedAmount}</td>
                    <td className="px-4 py-4">
                      <Badge variant={
                        p.status === "Captured" ? "success" :
                        p.status === "Pending" ? "warning" :
                        p.status === "Failed" ? "danger" :
                        "info"
                      }>{p.status}</Badge>
                    </td>
                    <td className="px-4 py-4">
                      <span className="flex items-center gap-1">
                        <CreditCard size={12} className={"text-text-muted"} />
                        {p.method}
                      </span>
                    </td>
                    <td className={`px-4 py-4 capitalize ${"text-text-muted"}`}>{p.provider}</td>
                    <td className={`px-4 py-4 text-xs ${"text-text-muted"}`}>
                      {p.createdAt ? new Date(p.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—"}
                    </td>
                    <td className="px-4 py-4 text-right">
                      {p.status === "Captured" && (
                        <button
                          onClick={() => { setRefundModal(p); setRefundAmount(""); }}
                          disabled={actionLoading === "refund"}
                          className="text-xs flex items-center gap-1 px-2 py-1 rounded border transition-colors bg-bg-card text-red-500 border-border-subtle hover:bg-surface-soft"
                        >
                          <RefreshCw size={12} /> Refund
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filtered.length === 0 && (
              <div className={`py-12 text-center ${"text-text-dim"}`}>
                No payments found.
              </div>
            )}
          </div>
        )}
      </GlassCard>

      <Modal isOpen={!!refundModal} onClose={() => { setRefundModal(null); setRefundAmount(""); }} title="Process Refund">
        {refundModal && (
          <>
            <p className={`mb-4 ${"text-text-primary"}`}>
              Refund for <strong>{refundModal.userName}</strong> — original amount: <strong>{refundModal.formattedAmount}</strong>
            </p>
            <div className="relative mb-6">
              <span className={`absolute left-3 top-1/2 -translate-y-1/2 font-medium ${"text-text-muted"}`}>₹</span>
              <Input type="number" placeholder="Enter refund amount" className="pl-8" value={refundAmount} onChange={(e) => setRefundAmount(e.target.value)} />
            </div>
            <div className="flex gap-3 justify-end">
              <Button variant="ghost" onClick={() => { setRefundModal(null); setRefundAmount(""); }}>Cancel</Button>
              <Button onClick={handleRefund} isLoading={actionLoading === "refund"}>
                <DollarSign size={16} className="mr-1.5" /> Process Refund
              </Button>
            </div>
          </>
        )}
      </Modal>
    </>
  );
}
