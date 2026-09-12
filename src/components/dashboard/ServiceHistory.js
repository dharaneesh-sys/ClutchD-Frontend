"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Badge } from "@/components/ui/Badge";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { Calendar, Download, MapPin, Loader2, Wrench, ChevronDown, ChevronUp, Receipt, RefreshCw, Mail, ShieldCheck, ListFilter } from "lucide-react";
import { cn, formatDate, formatTime } from "@/lib/utils";
import { WarrantyTerms } from "@/components/dashboard/WarrantyTerms";
import api, { extractApiError } from "@/lib/api";
import { downloadJobInvoice, buildJobInvoiceText } from "@/lib/documentDownload";
import { GST_RATE } from "@/lib/constants";
import { useToast } from "@/hooks/useToast";
import { useAuthStore } from "@/store/authStore";
import { PaymentModal } from "@/components/dashboard/PaymentModal";

const FILTERS = [
  { key: "all", label: "All" },
  { key: "completed", label: "Completed" },
  { key: "cancelled", label: "Cancelled" },
];

export function ServiceHistory() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [paymentJob, setPaymentJob] = useState(null);
  const [expandedInvoice, setExpandedInvoice] = useState(null);
  const [deleteJob, setDeleteJob] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [errorToast, setErrorToast] = useState(null);
  const [filter, setFilter] = useState("all");
  const { toast } = useToast();

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
    try {
      const res = await api.get("/jobs/history");
      setHistory(res.data.jobs || []);
    } catch (e) {
      toast.error(extractApiError(e, "Failed to load history"));
    } finally {
      setLoading(false);
    }
  }, [toast]);

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

  const showFilterTabs = !loading || history.length > 0;

  return (
    <div className="space-y-4">
      {showFilterTabs && (
        <div className="flex items-center gap-2 pb-1">
          <ListFilter size={14} className="text-text-muted shrink-0" />
          {FILTERS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all",
                filter === key
                  ? "bg-primary/10 text-primary border border-primary/20"
                  : "text-text-muted hover:text-text-primary hover:bg-surface-soft"
              )}
            >
              {label}
              {filterCounts && <span className="ml-1.5 text-[10px] opacity-60">({filterCounts[key]})</span>}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center p-12">
          <Loader2 size={40} className="animate-spin mb-4 text-icon-highlight" />
          <p className="text-text-muted">Loading your history...</p>
        </div>
      ) : history.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 text-center rounded-2xl border bg-bg-card border-border-subtle">
          <Wrench size={48} className="mb-4 opacity-50 text-text-dim" />
          <h3 className="text-xl font-semibold mb-2 text-text-primary">No History Yet</h3>
          <p className="text-text-muted">
            Your completed and cancelled service requests will appear here.
          </p>
        </div>
      ) : filteredHistory.length === 0 ? (
        <div className="text-center py-10 rounded-2xl border border-dashed bg-bg-card border-border-subtle">
          <ListFilter size={28} className="mx-auto mb-2 text-text-dim opacity-50" />
          <p className="text-sm font-medium text-text-muted">
            No {filter === "all" ? "" : filter} service requests
          </p>
          <p className="text-xs text-text-dim mt-1">
            {filter === "completed"
              ? "Completed service requests will appear here."
              : filter === "cancelled"
                ? "Cancelled service requests will appear here."
                : "Service requests will appear here once created."}
          </p>
        </div>
      ) : null}
      {filteredHistory.length > 0 && filteredHistory.map(job => {
        const pricing = job.pricing;
        const displayAmount = pricing?.totalAmount ?? job.priceEstimate?.min ?? 0;
        const isExpanded = expandedInvoice === job.id;

        return (
          <GlassCard key={job.id} variant="strong" className="p-5 flex flex-col">
            <div className="flex flex-col sm:flex-row gap-4 sm:items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                   <h4 className="text-lg font-bold text-text-primary">{job.issueTag}</h4>
                   <Badge variant={job.status === "completed" ? "success" : "danger"}>
                     {job.status.toUpperCase()}
                   </Badge>
                </div>
                <p className="text-sm mb-3 line-clamp-2 text-text-primary">{job.description}</p>
                
                <div className="flex flex-wrap items-center gap-4 text-xs text-text-muted">
                   <div className="flex items-center gap-1.5">
                     <Calendar size={14} className="text-icon-highlight" />
                     {job.createdAt ? `${formatDate(job.createdAt)} · ${formatTime(job.createdAt)}` : "Unknown Date"}
                   </div>
                   {job.mechanic && (
                     <div className="flex items-center gap-1.5">
                       <Wrench size={14} className="text-icon-highlight" />
                       Serviced by: {job.mechanic.name}
                     </div>
                   )}
                   {job.customerLocation && (
                     <div className="flex items-center gap-1.5">
                       <MapPin size={14} className="text-icon-highlight" />
                       {Number(job.customerLocation.lat ?? 0).toFixed(4)}, {Number(job.customerLocation.lng ?? 0).toFixed(4)}
                     </div>
                   )}
                </div>
              </div>
              
              {job.status === "completed" && (
                <div className="flex sm:flex-col items-center sm:items-end justify-between pt-4 sm:pt-0 border-t sm:border-t-0 sm:border-l sm:pl-6 border-border-subtle">
                  <div className="text-left sm:text-right mb-0 sm:mb-3">
                    <p className="text-[10px] uppercase tracking-wider mb-1 text-text-dim">
                      {job.isPaid ? "Amount Paid" : "Amount Due"}
                    </p>
                    <p className="text-xl font-bold text-icon-highlight">
                      ₹{displayAmount.toFixed ? displayAmount.toFixed(2) : displayAmount}
                    </p>
                  </div>
                  
                  <div className="flex gap-2">
                    {!job.isPaid ? (
                      <button 
                        onClick={() => setPaymentJob(job)}
                        className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold text-white shadow transition-transform active:scale-95 bg-primary-strong hover:bg-primary"
                      >
                        Pay Now
                      </button>
                    ) : (
                      <>
                        {pricing && (
                          <button 
                            onClick={() => toggleInvoice(job.id)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors bg-surface-soft text-icon-highlight hover:opacity-80 border border-border-subtle"
                          >
                            <Receipt size={14} />
                            Invoice
                            {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                          </button>
                        )}
                        <button 
                          onClick={() => downloadInvoice(job.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors bg-bg-card text-text-primary hover:bg-surface-soft hover:text-icon-highlight active:bg-surface-soft"
                        >
                          <Download size={14} />
                          PDF
                        </button>
                        <button 
                          onClick={() => emailInvoice(job)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors bg-bg-card text-text-primary hover:bg-surface-soft hover:text-icon-highlight active:bg-surface-soft"
                        >
                          <Mail size={14} />
                          Email
                        </button>
                      </>
                    )}
                  </div>
                  <button
                    onClick={() => setDeleteJob(job)}
                    className={`ml-2 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors text-red-500 hover:bg-red-50 hover:text-red-600 border border-red-200`}
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>

            {/* Inline Invoice Breakdown */}
            {isExpanded && pricing && (
              <div className="mt-4 p-4 rounded-xl border space-y-2 text-sm animate-in slide-in-from-top-1 bg-surface-soft border-border-subtle">
                <div className="flex items-center gap-2 mb-3">
                  <Receipt size={16} className="text-icon-highlight" />
                  <h5 className="font-bold text-sm text-text-primary">
                    Invoice #{job.id.substring(0, 8).toUpperCase()}
                  </h5>
                </div>

                <div className="flex justify-between text-text-primary">
                  <span>Service Fee</span>
                  <span className="font-medium">₹{Number(pricing.serviceAmount ?? 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-text-primary">
                  <span>Convenience Fee</span>
                  <span className="font-medium">₹{Number(pricing.convenienceFee ?? 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-text-primary">
                  <span>Cancellation Fee</span>
                  <span className="font-medium">₹{Number(pricing.cancellationFee ?? 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-text-primary">
                  <span>Distance ({Number(pricing.distanceKm ?? 0).toFixed(1)} km)</span>
                  <span className="font-medium">₹{Number(pricing.distanceFee ?? 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-text-primary">
                  <span>GST ({GST_RATE * 100}%)</span>
                  <span className="font-medium">₹{Number(pricing.gstAmount ?? 0).toFixed(2)}</span>
                </div>
                <div className="border-t pt-2 mt-2 flex justify-between font-bold border-border-subtle text-text-primary">
                  <span>Grand Total</span>
                  <span className="text-icon-highlight">₹{Number(pricing.totalAmount ?? 0).toFixed(2)}</span>
                </div>

                <div className="mt-3 pt-2 border-t space-y-1 border-border-subtle">
                  <p className="text-[10px] text-text-dim">
                    Service fee paid to your provider • Platform fees paid to ClutchD
                  </p>
                  {pricing.providerUpiId && (
                    <p className="text-[10px] text-text-dim">
                      Provider UPI: {pricing.providerUpiId}
                    </p>
                  )}
                </div>

                <div className="mt-4">
                  <WarrantyTerms variant="inline" />
                </div>
              </div>
            )}

            {/* Always-visible warranty reference */}
            {job.status === "completed" && !isExpanded && (
              <div className="mt-4 pt-3 border-t border-border-subtle">
                <div className="flex items-center gap-2 text-[10px] text-text-muted">
                  <ShieldCheck size={12} className="text-icon-highlight shrink-0" />
                  <span>
                    Covered by our{" "}
                    <button
                      type="button"
                      onClick={() => toggleInvoice(job.id)}
                      className="underline hover:text-icon-highlight transition-colors"
                    >
                      warranty terms
                    </button>
                  </span>
                </div>
              </div>
            )}
          </GlassCard>
        );
      })}

      {paymentJob && (
        <PaymentModal
          isOpen={!!paymentJob}
          onClose={() => setPaymentJob(null)}
          amount={paymentJob.pricing?.totalAmount ?? paymentJob.priceEstimate?.min ?? 0}
          pricing={paymentJob.pricing}
          jobId={paymentJob.id}
          onSuccess={handlePaymentSuccess}
        />
      )}

      {errorToast && (
        <div className="fixed top-4 right-4 z-[100] px-4 py-3 rounded-xl border shadow-2xl text-sm font-medium bg-red-500/10 border-red-500/30 text-red-400">
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
