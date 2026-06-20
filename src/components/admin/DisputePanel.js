import { useState, useEffect } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { AlertCircle, FileText, CheckCircle2, DollarSign, AlertTriangle, MessageSquare } from "lucide-react";
import { useThemeStore } from "@/store/themeStore";
import { useToast } from "@/components/ui/ToastProvider";
import { fetchDisputes, resolveDisputeWithStatus, refundDispute, penalizeProvider, messageDisputeParties } from "@/services/adminService";

export function DisputePanel() {
  const [disputes, setDisputes] = useState([]);
  const [selectedDispute, setSelectedDispute] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  const [confirmModal, setConfirmModal] = useState(null);
  const [messageModal, setMessageModal] = useState(null);
  const [messageText, setMessageText] = useState("");
  const [amountInput, setAmountInput] = useState("");
  const { theme } = useThemeStore();
  const { success: showSuccess, error: showError } = useToast();
  const isLight = theme === "light";

  const loadDisputes = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchDisputes();
      setDisputes(data);
    } catch (err) {
      setError(err?.response?.data?.detail || "Failed to load disputes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDisputes();
  }, []);

  const handleResolve = async (id) => {
    setActionLoading(id);
    try {
      await resolveDisputeWithStatus(id, "resolved");
      setDisputes(prev => prev.filter(d => d.id !== id));
      setSelectedDispute(null);
      showSuccess("Dispute closed successfully.");
    } catch (err) {
      showError(err?.response?.data?.detail || "Failed to close dispute");
    } finally {
      setActionLoading(null);
      setConfirmModal(null);
    }
  };

  const handleRefund = async (dispute) => {
    const amount = parseInt(amountInput) * 100;
    if (!amount || amount <= 0) {
      showError("Please enter a valid amount");
      return;
    }
    setActionLoading("refund");
    try {
      await refundDispute(dispute.id, amount, `Refund processed by admin for dispute ${dispute.id}`);
      setDisputes(prev => prev.filter(d => d.id !== dispute.id));
      setSelectedDispute(null);
      showSuccess(`Refund of ₹${parseInt(amountInput).toLocaleString("en-IN")} processed.`);
    } catch (err) {
      showError(err?.response?.data?.detail || "Failed to process refund");
    } finally {
      setActionLoading(null);
      setConfirmModal(null);
      setAmountInput("");
    }
  };

  const handlePenalize = async (dispute) => {
    const amount = parseInt(amountInput) * 100;
    if (!amount || amount <= 0) {
      showError("Please enter a valid penalty amount");
      return;
    }
    setActionLoading("penalize");
    try {
      await penalizeProvider(dispute.id, amount, `Penalty applied by admin for dispute ${dispute.id}`);
      setDisputes(prev => prev.filter(d => d.id !== dispute.id));
      setSelectedDispute(null);
      showSuccess(`Penalty of ₹${parseInt(amountInput).toLocaleString("en-IN")} applied.`);
    } catch (err) {
      showError(err?.response?.data?.detail || "Failed to apply penalty");
    } finally {
      setActionLoading(null);
      setConfirmModal(null);
      setAmountInput("");
    }
  };

  const handleMessage = async () => {
    if (!messageText.trim()) {
      showError("Please enter a message");
      return;
    }
    setActionLoading("message");
    try {
      await messageDisputeParties(messageModal.id, messageText.trim());
      showSuccess("Message sent to both parties.");
      setMessageModal(null);
      setMessageText("");
    } catch (err) {
      showError(err?.response?.data?.detail || "Failed to send message");
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin border-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-red-500">
        <p>{error}</p>
        <button onClick={loadDisputes} className="mt-3 text-sm underline">Retry</button>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col lg:flex-row h-full gap-6">
        <GlassCard className="flex-1 flex flex-col overflow-hidden max-h-full">
          <div className={`p-4 border-b flex justify-between items-center ${"border-border-subtle bg-bg-card"}`}>
            <h3 className={`font-semibold ${"text-text-primary"}`}>Active Disputes</h3>
            <Badge variant="danger">{disputes.length} Open</Badge>
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-3">
            {disputes.length === 0 ? (
              <div className={`text-center py-12 ${"text-text-dim"}`}>No active disputes 🎉</div>
            ) : (
              disputes.map(d => (
                <div
                  key={d.id}
                  onClick={() => setSelectedDispute(d)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer ${
                    selectedDispute?.id === d.id
                      ? 'bg-surface-soft border-red-500/30 shadow-[0_0_10px_rgba(239,68,68,0.1)]'
                      : 'bg-bg-card border-border-subtle hover:bg-bg-card'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <Badge variant={d.status === 'Open' ? 'danger' : 'warning'} className="mb-2">{d.status}</Badge>
                    <span className={`text-xs ${"text-text-dim"}`}>{d.date || "—"}</span>
                  </div>
                  <h4 className={`font-medium mb-1 ${"text-text-primary"}`}><AlertCircle size={14} className="inline mr-1 text-red-500 mb-0.5" />{d.reason}</h4>
                  <p className={`text-sm ${"text-text-muted"}`}>{d.customer} vs {d.provider}</p>
                </div>
              ))
            )}
          </div>
        </GlassCard>

        <GlassCard className="flex-[1.5] flex flex-col overflow-hidden bg-bg-card">
          {selectedDispute ? (
            <div className="p-4 sm:p-6 flex flex-col h-full">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className={`text-xl font-bold mb-1 ${"text-text-primary"}`}>Dispute {selectedDispute.id}</h3>
                  <p className={`text-sm ${"text-text-muted"}`}>Related Job: {selectedDispute.jobId}</p>
                </div>
                <Badge variant="danger" className="text-lg">
                  Amount: {selectedDispute.amount}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className={`p-4 rounded-xl border ${"bg-bg-card border-border-subtle"}`}>
                  <p className={`text-[10px] uppercase mb-1 ${"text-text-dim"}`}>Customer</p>
                  <p className={`font-medium ${"text-text-primary"}`}>{selectedDispute.customer}</p>
                </div>
                <div className={`p-4 rounded-xl border ${"bg-bg-card border-border-subtle"}`}>
                  <p className={`text-[10px] uppercase mb-1 ${"text-text-dim"}`}>Provider</p>
                  <p className={`font-medium ${"text-text-primary"}`}>{selectedDispute.provider}</p>
                </div>
              </div>

              <div className="mb-6">
                <p className={`font-medium mb-2 ${"text-text-primary"}`}>Customer Complaint</p>
                <div className="p-4 rounded-xl border text-sm leading-relaxed relative bg-surface-soft border-border-subtle text-text-primary">
                  <AlertCircle className="absolute -left-2 -top-2 rounded-full text-red-500 bg-bg-card" size={20} />
                  &quot;{selectedDispute.desc}&quot;
                </div>
              </div>

              <div className={`mt-auto space-y-4 pt-6 border-t ${"border-border-subtle"}`}>
                <h4 className={`text-sm font-medium ${"text-text-primary"}`}>Resolution Actions</h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <Button
                    variant="outline"
                    className={"border-border-subtle text-icon-highlight hover:bg-bg-card"}
                    onClick={() => setConfirmModal({ dispute: selectedDispute, action: "refund" })}
                  >
                    <DollarSign size={14} className="mr-1" /> Refund
                  </Button>
                  <Button
                    variant="outline"
                    className="border-border-subtle text-red-500 hover:bg-surface-soft"
                    onClick={() => setConfirmModal({ dispute: selectedDispute, action: "penalize" })}
                  >
                    <AlertTriangle size={14} className="mr-1" /> Penalize
                  </Button>
                  <Button
                    variant="outline"
                    className={"border-border-subtle text-text-primary hover:bg-bg-card"}
                    onClick={() => { setMessageModal(selectedDispute); setMessageText(""); }}
                  >
                    <MessageSquare size={14} className="mr-1" /> Message
                  </Button>
                  <Button
                    onClick={() => setConfirmModal({ dispute: selectedDispute, action: "close" })}
                    isLoading={actionLoading === selectedDispute.id}
                  >
                    <CheckCircle2 size={16} className="mr-1.5" /> Close
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className={`flex flex-col items-center justify-center h-full ${"text-text-dim"}`}>
              <FileText size={64} className="mb-4 opacity-20" />
              <p className="text-lg font-medium">Select a dispute to view details</p>
              <p className="text-sm">Choose from the list on the left</p>
            </div>
          )}
        </GlassCard>
      </div>

      <Modal
        isOpen={!!confirmModal}
        onClose={() => { setConfirmModal(null); setAmountInput(""); }}
        title={
          confirmModal?.action === "close" ? "Close Dispute" :
          confirmModal?.action === "refund" ? "Refund Customer" :
          "Penalize Provider"
        }
      >
        {confirmModal?.action === "close" ? (
          <>
            <p className={`mb-6 ${"text-text-primary"}`}>
              Are you sure you want to close dispute {confirmModal?.dispute?.id}?
            </p>
            <div className="flex gap-3 justify-end">
              <Button variant="ghost" onClick={() => setConfirmModal(null)}>Cancel</Button>
              <Button onClick={() => handleResolve(confirmModal.dispute.id)} isLoading={actionLoading === confirmModal.dispute.id}>
                <CheckCircle2 size={16} className="mr-1.5" /> Close Dispute
              </Button>
            </div>
          </>
        ) : (
          <>
            <p className={`mb-4 ${"text-text-primary"}`}>
              {confirmModal?.action === "refund"
                ? `Enter the refund amount for ${confirmModal?.dispute?.customer}:`
                : `Enter the penalty amount for ${confirmModal?.dispute?.provider}:`}
            </p>
            <div className="relative mb-6">
              <span className={`absolute left-3 top-1/2 -translate-y-1/2 font-medium ${"text-text-muted"}`}>₹</span>
              <Input
                type="number"
                placeholder="Enter amount"
                className="pl-8"
                value={amountInput}
                onChange={(e) => setAmountInput(e.target.value)}
              />
            </div>
            <div className="flex gap-3 justify-end">
              <Button variant="ghost" onClick={() => { setConfirmModal(null); setAmountInput(""); }}>Cancel</Button>
              <Button
                onClick={() =>
                  confirmModal?.action === "refund"
                    ? handleRefund(confirmModal.dispute)
                    : handlePenalize(confirmModal.dispute)
                }
                isLoading={actionLoading === "refund" || actionLoading === "penalize"}
              >
                {confirmModal?.action === "refund" ? "Process Refund" : "Apply Penalty"}
              </Button>
            </div>
          </>
        )}
      </Modal>

      <Modal
        isOpen={!!messageModal}
        onClose={() => { setMessageModal(null); setMessageText(""); }}
        title="Message Both Parties"
      >
        <p className={`mb-4 text-sm ${"text-text-muted"}`}>
          This message will be sent to both {messageModal?.customer} and {messageModal?.provider}.
        </p>
        <textarea
          className="w-full rounded-2xl border px-4 py-3 text-sm transition-all min-h-[120px] resize-none mb-6 bg-bg-card border-border-subtle text-text-primary placeholder:text-text-dim focus:border-primary focus:ring-1 focus:ring-primary/30 focus:outline-none"
          placeholder="Type your message here..."
          value={messageText}
          onChange={(e) => setMessageText(e.target.value)}
        />
        <div className="flex gap-3 justify-end">
          <Button variant="ghost" onClick={() => { setMessageModal(null); setMessageText(""); }}>Cancel</Button>
          <Button onClick={handleMessage} isLoading={actionLoading === "message"}>
            <MessageSquare size={16} className="mr-1.5" /> Send Message
          </Button>
        </div>
      </Modal>
    </>
  );
}
