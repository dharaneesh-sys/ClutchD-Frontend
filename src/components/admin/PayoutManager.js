"use client";

import { useState, useEffect, useCallback } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useToast } from "@/components/ui/ToastProvider";
import { payoutService } from "@/lib/payment/payoutService";
import {
  DollarSign,
  Calendar,
  Settings,
  Send,
  RefreshCw,
  CheckCircle,
  Clock,
  AlertCircle,
  Wallet,
} from "lucide-react";

// ─── Status badge variant mapper ───────────────────────────────────────────

function statusBadge(status) {
  switch (status) {
    case "ready":
      return "success";
    case "paid":
      return "info";
    case "below_threshold":
      return "warning";
    default:
      return "default";
  }
}

function statusLabel(status) {
  switch (status) {
    case "ready":
      return "Ready";
    case "paid":
      return "Paid";
    case "below_threshold":
      return "Below Threshold";
    default:
      return status;
  }
}

// ─── Component ──────────────────────────────────────────────────────────────

export function PayoutManager() {
  // ── Data state ──────────────────────────────────────────────────────────
  const [schedule, setSchedule] = useState(() => payoutService.getSchedule());
  const [ledger, setLedger] = useState([]);
  const [estimatedPayouts, setEstimatedPayouts] = useState([]);
  const [upcomingDates, setUpcomingDates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  const { success: showSuccess, error: showError } = useToast();

  // ── Schedule modal state ────────────────────────────────────────────────
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [editFrequency, setEditFrequency] = useState("weekly");
  const [editThreshold, setEditThreshold] = useState("500");
  const [savingSchedule, setSavingSchedule] = useState(false);

  // ── Manual payout modal state ───────────────────────────────────────────
  const [payoutModal, setPayoutModal] = useState(null);
  const [payoutAmount, setPayoutAmount] = useState("");

  // ── Confirm payout modal state ──────────────────────────────────────────
  const [confirmPayout, setConfirmPayout] = useState(null);

  // ── Data loading ────────────────────────────────────────────────────────

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const payouts = await payoutService.getMechanicPayouts();
      setLedger(payouts);
      setEstimatedPayouts(payoutService.getEstimatedPayouts(payouts));
      setUpcomingDates(payoutService.getUpcomingDates(5));
    } catch (err) {
      setError(err?.message || "Failed to load payout data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ── Schedule handlers ───────────────────────────────────────────────────

  const openScheduleModal = () => {
    const s = schedule;
    setEditFrequency(s.frequency);
    setEditThreshold(String(s.minThreshold));
    setScheduleModalOpen(true);
  };

  const handleSaveSchedule = async () => {
    const threshold = parseInt(editThreshold, 10);
    if (!threshold || threshold < 0) {
      showError("Minimum threshold must be a positive number");
      return;
    }

    setSavingSchedule(true);
    try {
      const result = await payoutService.updateSchedule({
        frequency: editFrequency,
        minThreshold: threshold,
      });
      setSchedule(result.schedule);
      setScheduleModalOpen(false);

      // Recalculate with new schedule
      const payouts = await payoutService.getMechanicPayouts();
      setLedger(payouts);
      setEstimatedPayouts(payoutService.getEstimatedPayouts(payouts));
      setUpcomingDates(payoutService.getUpcomingDates(5));

      const backendNote = result.backendAvailable ? "" : " (saved locally — backend unavailable)";
      showSuccess(`Payout schedule updated${backendNote}`);
    } catch (err) {
      showError(err?.message || "Failed to update schedule");
    } finally {
      setSavingSchedule(false);
    }
  };

  // ── Manual payout handlers ──────────────────────────────────────────────

  const openPayoutModal = (mechanic) => {
    setPayoutModal(mechanic);
    setPayoutAmount(String(mechanic.pendingAmount || 0));
  };

  const handleConfirmPayout = async () => {
    if (!confirmPayout) return;
    const amount = parseInt(payoutAmount, 10);
    if (!amount || amount <= 0) {
      showError("Please enter a valid payout amount");
      return;
    }

    setActionLoading(confirmPayout.mechanicId);
    try {
      const result = await payoutService.triggerManualPayout(
        confirmPayout.mechanicId,
        amount,
        `Manual payout by admin for ${confirmPayout.mechanicName}`
      );

      const backendNote = result.backendAvailable ? "" : " (mock — backend unavailable)";
      showSuccess(
        `₹${amount.toLocaleString("en-IN")} paid to ${confirmPayout.mechanicName}${backendNote}`
      );

      setConfirmPayout(null);
      setPayoutModal(null);
      setPayoutAmount("");

      // Refresh data
      await loadData();
    } catch (err) {
      showError(err?.message || "Failed to process payout");
    } finally {
      setActionLoading(null);
    }
  };

  const handleRequestPayout = () => {
    setConfirmPayout(payoutModal);
  };

  // ── Derived stats ───────────────────────────────────────────────────────

  const totalPending = estimatedPayouts.reduce(
    (sum, m) => sum + (m.meetsThreshold ? m.pendingAmount : 0),
    0
  );
  const readyCount = estimatedPayouts.filter((m) => m.meetsThreshold).length;
  const totalMechanics = estimatedPayouts.length;

  // ── Render ──────────────────────────────────────────────────────────────

  return (
    <>
      {/* ── Stats row ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <GlassCard variant="outlined" className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-green-500/15 text-green-400">
              <Wallet size={20} />
            </div>
            <div>
              <p className="text-xs text-text-muted uppercase tracking-wider font-medium">
                Total Pending
              </p>
              <p className="text-xl font-bold text-text-primary">
                ₹{totalPending.toLocaleString("en-IN")}
              </p>
            </div>
          </div>
        </GlassCard>

        <GlassCard variant="outlined" className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-500/15 text-blue-400">
              <CheckCircle size={20} />
            </div>
            <div>
              <p className="text-xs text-text-muted uppercase tracking-wider font-medium">
                Ready to Pay
              </p>
              <p className="text-xl font-bold text-text-primary">
                {readyCount}/{totalMechanics}
              </p>
            </div>
          </div>
        </GlassCard>

        <GlassCard variant="outlined" className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-warning/15 text-warning">
              <Calendar size={20} />
            </div>
            <div>
              <p className="text-xs text-text-muted uppercase tracking-wider font-medium">
                Schedule
              </p>
              <p className="text-sm font-semibold text-text-primary capitalize">
                {payoutService.getScheduleLabel()}
              </p>
            </div>
          </div>
        </GlassCard>

        <GlassCard variant="outlined" className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-500/15 text-purple-400">
              <DollarSign size={20} />
            </div>
            <div>
              <p className="text-xs text-text-muted uppercase tracking-wider font-medium">
                Min. Threshold
              </p>
              <p className="text-xl font-bold text-text-primary">
                ₹{schedule.minThreshold?.toLocaleString("en-IN")}
              </p>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* ── Schedule config + upcoming dates ─────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <GlassCard variant="outlined" className="p-4 lg:col-span-1">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
              <Settings size={16} />
              Schedule Configuration
            </h3>
            <button
              onClick={openScheduleModal}
              className="text-xs px-3 py-1.5 rounded-lg bg-surface-soft text-primary-light hover:bg-primary/20 transition-colors font-medium"
            >
              Edit
            </button>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-text-muted">Frequency</span>
              <span className="text-text-primary font-medium capitalize">
                {schedule.frequency}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-muted">Minimum Threshold</span>
              <span className="text-text-primary font-medium">
                ₹{schedule.minThreshold?.toLocaleString("en-IN")}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-muted">Label</span>
              <span className="text-text-primary font-medium">
                {payoutService.getScheduleLabel()}
              </span>
            </div>
          </div>
        </GlassCard>

        <GlassCard variant="outlined" className="p-4 lg:col-span-2">
          <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2 mb-4">
            <Calendar size={16} />
            Upcoming Payout Dates
          </h3>
          {upcomingDates.length === 0 ? (
            <p className="text-sm text-text-dim">No upcoming dates calculated.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
              {upcomingDates.map((d, idx) => (
                <div
                  key={d.date}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm ${
                    idx === 0
                      ? "bg-primary/15 border border-primary/30 text-primary-light"
                      : "bg-surface-soft text-text-muted"
                  }`}
                >
                  <Calendar size={14} className="shrink-0" />
                  <span className="font-medium">{d.label}</span>
                  {idx === 0 && (
                    <Badge variant="info" className="ml-auto text-[10px]">
                      Next
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          )}
        </GlassCard>
      </div>

      {/* ── Mechanic payout table ────────────────────────────────────── */}
      <GlassCard variant="outlined" className="p-4 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-text-primary">
            Mechanic Payout Ledger
          </h3>
          <button
            onClick={loadData}
            disabled={loading}
            className="text-xs flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-soft text-text-muted hover:text-text-primary transition-colors disabled:opacity-50"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>

        {loading ? (
          <div className="py-12 flex justify-center">
            <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin border-primary" />
          </div>
        ) : error ? (
          <div className="py-12 text-center text-red-500">
            <AlertCircle size={24} className="mx-auto mb-2" />
            <p className="text-sm">{error}</p>
            <button onClick={loadData} className="mt-3 text-xs underline">
              Retry
            </button>
          </div>
        ) : estimatedPayouts.length === 0 ? (
          <div className="py-12 text-center text-text-dim">
            <Wallet size={24} className="mx-auto mb-2 opacity-50" />
            <p className="text-sm">No payout data available.</p>
          </div>
        ) : (
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left text-sm text-text-primary">
              <thead className="text-xs uppercase border-b border-border-subtle text-text-dim">
                <tr>
                  <th className="px-4 pb-3 font-medium">Mechanic</th>
                  <th className="px-4 pb-3 font-medium text-right">Jobs Done</th>
                  <th className="px-4 pb-3 font-medium text-right">Pending Amount</th>
                  <th className="px-4 pb-3 font-medium">Next Payout</th>
                  <th className="px-4 pb-3 font-medium">Status</th>
                  <th className="px-4 pb-3 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {estimatedPayouts.map((m) => (
                  <tr
                    key={m.mechanicId}
                    className="border-b border-border-subtle transition-colors hover:bg-bg-card"
                  >
                    <td className="px-4 py-4 font-medium">{m.mechanicName}</td>
                    <td className="px-4 py-4 text-right text-text-muted">
                      {m.completedJobs}
                    </td>
                    <td className="px-4 py-4 text-right font-semibold">
                      ₹{m.pendingAmount.toLocaleString("en-IN")}
                    </td>
                    <td className="px-4 py-4">
                      {m.nextPayoutDate ? (
                        <span className="flex items-center gap-1.5 text-xs">
                          <Calendar size={12} className="text-text-muted" />
                          {m.nextPayoutLabel}
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5 text-xs text-text-dim">
                          <AlertCircle size={12} />
                          Below ₹{m.minThreshold?.toLocaleString("en-IN")}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <Badge variant={statusBadge(m.status)}>
                        {statusLabel(m.status)}
                      </Badge>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <Button
                        size="sm"
                        variant="tonal"
                        onClick={() => openPayoutModal(m)}
                        isLoading={actionLoading === m.mechanicId}
                        disabled={
                          actionLoading !== null ||
                          m.pendingAmount < (schedule.minThreshold || 500)
                        }
                        className="text-xs"
                      >
                        <Send size={12} className="mr-1" />
                        Pay Now
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </GlassCard>

      {/* ── Schedule editor modal ────────────────────────────────────── */}
      <Modal
        isOpen={scheduleModalOpen}
        onClose={() => setScheduleModalOpen(false)}
        title="Payout Schedule"
      >
        <div className="space-y-5">
          <div>
            <label className="mb-2 block text-sm font-medium text-text-muted">
              Payout Frequency
            </label>
            <div className="grid grid-cols-3 gap-2">
              {payoutService.FREQUENCY_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setEditFrequency(opt.value)}
                  className={`px-3 py-2.5 rounded-xl text-sm font-medium transition-all border ${
                    editFrequency === opt.value
                      ? "bg-primary/20 border-primary/50 text-primary-light"
                      : "bg-surface-soft border-border-subtle text-text-muted hover:text-text-primary hover:border-text-dim"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-text-muted">
              Minimum Payout Threshold (₹)
            </label>
            <Input
              type="number"
              placeholder="500"
              value={editThreshold}
              onChange={(e) => setEditThreshold(e.target.value)}
            />
            <p className="mt-1.5 text-xs text-text-dim">
              Mechanics must have at least this amount pending to receive an
              automatic payout.
            </p>
          </div>

          <div className="flex gap-3 justify-end pt-2">
            <Button
              variant="ghost"
              onClick={() => setScheduleModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveSchedule}
              isLoading={savingSchedule}
            >
              <CheckCircle size={16} className="mr-1.5" />
              Save Schedule
            </Button>
          </div>
        </div>
      </Modal>

      {/* ── Manual payout modal ──────────────────────────────────────── */}
      <Modal
        isOpen={!!payoutModal}
        onClose={() => {
          setPayoutModal(null);
          setPayoutAmount("");
        }}
        title={`Payout — ${payoutModal?.mechanicName || ""}`}
      >
        {payoutModal && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-surface-soft rounded-xl p-3 text-center">
                <p className="text-xs text-text-muted">Jobs Completed</p>
                <p className="text-lg font-bold text-text-primary">
                  {payoutModal.completedJobs}
                </p>
              </div>
              <div className="bg-surface-soft rounded-xl p-3 text-center">
                <p className="text-xs text-text-muted">Pending Amount</p>
                <p className="text-lg font-bold text-primary-light">
                  ₹{payoutModal.pendingAmount.toLocaleString("en-IN")}
                </p>
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-text-muted">
                Payout Amount (₹)
              </label>
              <Input
                type="number"
                placeholder="Enter amount"
                value={payoutAmount}
                onChange={(e) => setPayoutAmount(e.target.value)}
              />
            </div>

            <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
              <AlertCircle size={16} className="shrink-0 mt-0.5 text-warning" />
              <p className="text-xs text-amber-300/80">
                This will process a manual payout. The amount will be deducted
                from the mechanic&apos;s pending balance. Backend will be used if
                available; otherwise it will be recorded locally.
              </p>
            </div>

            <div className="flex gap-3 justify-end">
              <Button
                variant="ghost"
                onClick={() => {
                  setPayoutModal(null);
                  setPayoutAmount("");
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleRequestPayout}>
                <Send size={16} className="mr-1.5" />
                Process ₹
                {(
                  parseInt(payoutAmount) || 0
                ).toLocaleString("en-IN")}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* ── Payout confirmation modal ────────────────────────────────── */}
      <Modal
        isOpen={!!confirmPayout}
        onClose={() => setConfirmPayout(null)}
        title="Confirm Payout"
        maxWidth="max-w-sm"
      >
        {confirmPayout && (
          <div className="space-y-4">
            <div className="bg-surface-soft rounded-xl p-4 text-center">
              <p className="text-xs text-text-muted mb-1">
                Sending to {confirmPayout.mechanicName}
              </p>
              <p className="text-3xl font-bold text-primary-light">
                ₹{(parseInt(payoutAmount) || 0).toLocaleString("en-IN")}
              </p>
              {confirmPayout.upiId && (
                <p className="text-xs text-text-muted mt-1">
                  UPI: {confirmPayout.upiId}
                </p>
              )}
            </div>

            <p className="text-sm text-text-muted text-center">
              This action will process the payout. This is a demo environment
              — no real money will be transferred.
            </p>

            <div className="flex gap-3 justify-center">
              <Button
                variant="ghost"
                onClick={() => setConfirmPayout(null)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleConfirmPayout}
                isLoading={actionLoading === confirmPayout.mechanicId}
              >
                <DollarSign size={16} className="mr-1.5" />
                Confirm Payout
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
