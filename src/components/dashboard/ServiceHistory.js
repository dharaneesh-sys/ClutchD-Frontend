"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatusPill } from "@/components/ui/StatusPill";
import { Skeleton } from "@/components/ui/Skeleton";
import { Calendar, Download, Wrench, ChevronDown, ChevronUp, Receipt, Mail, ListFilter, AlertTriangle } from "lucide-react";
import { cn, formatDate, formatTime } from "@/lib/utils";
import api, { extractApiError } from "@/lib/api";
import { downloadJobInvoice, buildJobInvoiceText } from "@/lib/documentDownload";
import { GST_RATE, ISSUE_TAGS } from "@/lib/constants";
import { useAuthStore } from "@/store/authStore";
import { PaymentModal } from "@/components/dashboard/PaymentModal";

const FILTERS = [
  { key: "all", label: "All" },
  { key: "completed", label: "Completed" },
  { key: "cancelled", label: "Cancelled" },
];

const money = (v) => {
  const n = Number(v);
  return v === null || v === undefined || !Number.isFinite(n) ? "—" : `₹${n.toFixed(2)}`;
};

const issueLabel = (tag) => ISSUE_TAGS.find((t) => t.value === tag)?.label || tag || "Service";

export function ServiceHistory() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [paymentJob, setPaymentJob] = useState(null);
  const [expandedInvoice, setExpandedInvoice] = useState(null);
  const [deleteJob, setDeleteJob] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [errorToast, setErrorToast] = useState(null);
  const [filter, setFilter] = useState("all");

  const filteredHistory = useMemo(() => {
    if (filter === "all") return history;
    return history.filter((j) => j.status === filter);
  }, [history, filter]);

  const filterCounts = useMemo(() => {
    if (loading) return null;
    return {
      all: history.length,
      completed: history.filter((j) => j.status === "completed").length,
      cancelled: history.filter((j) => j.status === "cancelled").length,
    };
  }, [history, loading]);

  const fetchHistory = useCallback(async () => {
    setLoadError(null);
    try {
      const res = await api.get("/jobs/history");
      setHistory(res.data?.jobs || []);
    } catch (e) {
      setLoadError(extractApiError(e, "Couldn't load your history. Check your connection and try again."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const handlePaymentSuccess = async (details) => {
    try {
      // Record payment completion
      if (paymentJob) {
         await api.post(`/service/request/${paymentJob.id}/complete`, details);
      }
    } catch (e) {
      console.warn("Completion sync failed", e);
    }
    setPaymentJob(null);
    fetchHistory();
  };

  const downloadInvoice = (jobId) => {
    const job = history.find((j) => j.id === jobId);
    downloadJobInvoice(job && job.id ? job : { id: jobId });
  };

  const emailInvoice = (job) => {
    if (!job) return;
    downloadJobInvoice(job);

    const userEmail = useAuthStore.getState().user?.email || "";
    const email = window.prompt("Send invoice to email:", userEmail);
    if (!email) return;

    const invoiceId = String(job.id ?? "unknown").substring(0, 8).toUpperCase();
    const subject = `Invoice from ClutchD - ${invoiceId}`;
    const body = buildJobInvoiceText(job);
    window.location.href =
      `mailto:${encodeURIComponent(email)}` +
      `?subject=${encodeURIComponent(subject)}` +
      `&body=${encodeURIComponent(body)}`;
  };

  const toggleInvoice = (jobId) => {
    setExpandedInvoice(expandedInvoice === jobId ? null : jobId);
  };

  const showFilterTabs = !loading && !loadError && history.length > 0;

  return (
    <div className="space-y-3">
      {showFilterTabs && (
        <div role="group" aria-label="Filter history" className="flex items-center gap-2 overflow-x-auto pb-1">
          <ListFilter size={14} aria-hidden="true" className="text-[var(--text-muted)] shrink-0" />
          {FILTERS.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              aria-pressed={filter === key}
              onClick={() => setFilter(key)}
              className={cn(
                "min-h-[44px] shrink-0 rounded-full border px-4 text-sm font-medium transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]",
                filter === key
                  ? "border-[var(--primary)] bg-[var(--surface-soft)] text-[var(--primary-dark)]"
                  : "border-[var(--border)] bg-[var(--surface-card)] text-[var(--text-muted)] hover:text-[var(--foreground)]"
              )}
            >
              {label}
              {filterCounts && <span className="ml-1 text-xs">({filterCounts[key]})</span>}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="space-y-3" aria-busy="true" aria-label="Loading your history">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-2xl border border-[var(--border)] bg-[var(--surface-card)] p-4 space-y-2">
              <Skeleton className="w-1/2" />
              <Skeleton className="w-1/3 h-3" />
            </div>
          ))}
        </div>
      ) : loadError ? (
        <div role="alert" className="flex flex-col items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface-card)] p-6 text-center">
          <AlertTriangle size={24} aria-hidden="true" className="text-[var(--danger)]" />
          <p className="text-sm text-[var(--danger-ink)]">{loadError}</p>
          <Button variant="outline" size="sm" onClick={() => { setLoading(true); fetchHistory(); }}>
            Retry
          </Button>
        </div>
      ) : history.length === 0 ? (
        <EmptyState
          icon={Wrench}
          title="No history yet"
          description="Your completed and cancelled service requests will appear here."
        />
      ) : filteredHistory.length === 0 ? (
        <EmptyState
          icon={ListFilter}
          title={`No ${filter} service requests`}
          description={filter === "completed" ? "Completed service requests will appear here." : "Cancelled service requests will appear here."}
        />
      ) : null}

      {!loading && !loadError && filteredHistory.map((job) => {
        const pricing = job.pricing;
        const total = pricing?.totalAmount;
        const hasTotal = total !== null && total !== undefined && Number.isFinite(Number(total));
        const isCompleted = job.status === "completed";
        const isExpanded = expandedInvoice === job.id;

        return (
          <GlassCard key={job.id} data-testid="history-row" className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h4 className="truncate font-semibold text-[var(--foreground)]">{issueLabel(job.issueTag)}</h4>
                <p className="mt-0.5 flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
                  <Calendar size={12} aria-hidden="true" />
                  {job.createdAt ? `${formatDate(job.createdAt)} · ${formatTime(job.createdAt)}` : "—"}
                </p>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1">
                <StatusPill status={job.status} />
                <span className="text-sm font-semibold text-[var(--foreground)]">{isCompleted ? money(total) : "—"}</span>
              </div>
            </div>

            {job.description && <p className="mt-2 line-clamp-2 text-sm text-[var(--text-muted)]">{job.description}</p>}
            {job.mechanic?.name && (
              <p className="mt-1 flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
                <Wrench size={12} aria-hidden="true" /> {job.mechanic.name}
              </p>
            )}

            {isCompleted && (
              <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-[var(--border)] pt-3">
                {!job.isPaid ? (
                  hasTotal && (
                    <Button size="sm" onClick={() => setPaymentJob(job)}>
                      Pay {money(total)}
                    </Button>
                  )
                ) : (
                  <>
                    <span className="mr-auto text-xs font-medium text-[var(--success)]">Paid</span>
                    {pricing && (
                      <Button size="sm" variant="secondary" onClick={() => toggleInvoice(job.id)} aria-expanded={isExpanded}>
                        <Receipt size={14} aria-hidden="true" /> Invoice
                        {isExpanded ? <ChevronUp size={12} aria-hidden="true" /> : <ChevronDown size={12} aria-hidden="true" />}
                      </Button>
                    )}
                    <Button size="sm" variant="ghost" onClick={() => downloadInvoice(job.id)}>
                      <Download size={14} aria-hidden="true" /> PDF
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => emailInvoice(job)}>
                      <Mail size={14} aria-hidden="true" /> Email
                    </Button>
                  </>
                )}
                <Button size="sm" variant="ghost" className="text-[var(--danger-ink)]" onClick={() => setDeleteJob(job)}>
                  Delete
                </Button>
              </div>
            )}

            {isExpanded && pricing && (
              <dl className="mt-3 space-y-2 rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] p-4 text-sm text-[var(--foreground)]">
                <div className="mb-2 flex items-center gap-2 font-semibold">
                  <Receipt size={16} aria-hidden="true" className="text-[var(--primary-dark)]" />
                  Invoice #{String(job.id).substring(0, 8).toUpperCase()}
                </div>
                <div className="flex justify-between"><dt>Service</dt><dd>{money(pricing.serviceAmount)}</dd></div>
                <div className="flex justify-between"><dt>Convenience fee</dt><dd>{money(pricing.convenienceFee)}</dd></div>
                {Number(pricing.cancellationFee) > 0 && (
                  <div className="flex justify-between"><dt>Cancellation fee</dt><dd>{money(pricing.cancellationFee)}</dd></div>
                )}
                <div className="flex justify-between"><dt>Distance</dt><dd>{money(pricing.distanceFee)}</dd></div>
                <div className="flex justify-between"><dt>GST ({GST_RATE * 100}%)</dt><dd>{money(pricing.gstAmount)}</dd></div>
                <div className="flex justify-between border-t border-[var(--border)] pt-2 font-semibold"><dt>Total</dt><dd>{money(pricing.totalAmount)}</dd></div>
                {pricing.providerUpiId && (
                  <p className="pt-1 text-xs text-[var(--text-muted)]">Provider UPI: {pricing.providerUpiId}</p>
                )}
              </dl>
            )}
          </GlassCard>
        );
      })}

      {paymentJob && (
        <PaymentModal
          isOpen={!!paymentJob}
          onClose={() => setPaymentJob(null)}
          amount={paymentJob.pricing?.totalAmount ?? null}
          pricing={paymentJob.pricing}
          jobId={paymentJob.id}
          onSuccess={handlePaymentSuccess}
        />
      )}

      {errorToast && (
        <div role="alert" className="fixed top-4 right-4 z-[100] px-4 py-3 rounded-xl border shadow-[var(--shadow-card)] text-sm font-medium bg-[var(--surface-card)] border-[var(--border)] text-[var(--danger-ink)]">
          {errorToast}
        </div>
      )}

      <ConfirmModal
        isOpen={!!deleteJob}
        onClose={() => setDeleteJob(null)}
        onConfirm={async () => {
          if (!deleteJob) return;
          setDeleteLoading(true);
          try {
            await api.delete(`/jobs/${deleteJob.id}`);
            fetchHistory();
            setDeleteJob(null);
          } catch (e) {
            setErrorToast(`Failed to delete job: ${e.response?.data?.detail || e.message}`);
            setTimeout(() => setErrorToast(null), 4000);
            setDeleteJob(null);
          } finally {
            setDeleteLoading(false);
          }
        }}
        title="Delete Job Record"
        message="Are you sure you want to delete this job record? This action cannot be undone."
        confirmLabel="Delete"
        isLoading={deleteLoading}
      />
    </div>
  );
}
