"use client";

import { useState, useEffect, useCallback } from "react";
import { AlertTriangle, Clock, IndianRupee, CheckCircle2, Send } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { Input } from "@/components/ui/Input";
import { EmptyState } from "@/components/ui/EmptyState";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Skeleton } from "@/components/ui/Skeleton";
import { useTrackingStore } from "@/store/trackingStore";
import { useToast } from "@/components/ui/ToastProvider";
import api from "@/lib/api";
import { OfferCard, JobCard } from "./RequestCard";
import { money, realTotal } from "./format";

const detail = (err, fallback) => {
  const d = err?.response?.data?.detail;
  return typeof d === "string" ? d : fallback;
};

/**
 * Shared mechanic/garage queue. Uses only existing endpoints:
 * GET /providers/offers, POST /offers/:id/accept|decline, GET /jobs/incoming,
 * PATCH /service/request/:id/status, POST /service/request/:id/finalize-price,
 * POST /payments/cash, DELETE /jobs/:id. Never calls the admin-only assign.
 */
export function PartnerQueue({ title = "Job Queue", subtitle, onChat }) {
  const [jobs, setJobs] = useState([]);
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const setNavigationTarget = useTrackingStore((s) => s.setNavigationTarget);
  const { success: showSuccess, error: showError } = useToast();

  const [billJob, setBillJob] = useState(null);
  const [serviceAmount, setServiceAmount] = useState("");
  const [priceError, setPriceError] = useState("");
  const [submittingPrice, setSubmittingPrice] = useState(false);
  const [invoiceSent, setInvoiceSent] = useState(null); // { total }
  const [cashJob, setCashJob] = useState(null);
  const [cashLoading, setCashLoading] = useState(false);
  const [completed, setCompleted] = useState(null); // { total }
  const [deleteJob, setDeleteJob] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchAll = useCallback(async () => {
    try {
      const { data } = await api.get("/jobs/incoming");
      setJobs(Array.isArray(data?.jobs) ? data.jobs : []);
      setError(null);
    } catch (err) {
      setError(err?.response ? "Couldn't load your jobs." : "Server unreachable. Check your connection.");
    } finally {
      setLoading(false);
    }
    try {
      const { data } = await api.get("/providers/offers", { params: { status: "pending" } });
      setOffers(Array.isArray(data?.offers) ? data.offers : []);
    } catch {
      setOffers([]);
    }
  }, []);

  useEffect(() => {
    fetchAll();
    const interval = setInterval(() => {
      if (!document.hidden && navigator.onLine !== false) fetchAll();
    }, 15000);
    const onVisibility = () => {
      if (!document.hidden) fetchAll();
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [fetchAll]);

  const respond = async (offer, action) => {
    setBusyId(offer.id);
    try {
      await api.post(`/offers/${offer.id}/${action}`);
      showSuccess(action === "accept" ? "Offer accepted. The job is now yours." : "Offer declined.");
      await fetchAll();
    } catch (err) {
      showError(detail(err, `Couldn't ${action} the offer.`));
    } finally {
      setBusyId(null);
    }
  };

  const advance = async (job, status) => {
    setBusyId(job.id);
    try {
      await api.patch(`/service/request/${job.id}/status`, { status });
      if (status === "en_route" && job.customerLocation?.lat) {
        setNavigationTarget({ lat: job.customerLocation.lat, lng: job.customerLocation.lng });
      }
      await fetchAll();
    } catch (err) {
      showError(detail(err, "Couldn't update the job status."));
    } finally {
      setBusyId(null);
    }
  };

  const navigate = (job) => {
    if (job.customerLocation?.lat) {
      setNavigationTarget({ lat: job.customerLocation.lat, lng: job.customerLocation.lng });
      showSuccess("Route set. Open the Navigation tab.");
    } else {
      showError("Customer location not available.");
    }
  };

  const openBill = (job) => {
    setBillJob(job);
    setServiceAmount("");
    setPriceError("");
  };

  const finalizePrice = async () => {
    const amount = parseFloat(serviceAmount);
    if (!Number.isFinite(amount) || amount <= 0) return setPriceError("Enter a valid service amount.");
    if (amount > 500000) return setPriceError("Amount cannot exceed ₹5,00,000.");
    setPriceError("");
    setSubmittingPrice(true);
    try {
      const { data } = await api.post(`/service/request/${billJob.id}/finalize-price`, { serviceAmount: amount });
      setBillJob(null);
      setInvoiceSent({ total: realTotal(data) });
      await fetchAll();
    } catch (err) {
      setPriceError(detail(err, "Couldn't send the bill. Please try again."));
    } finally {
      setSubmittingPrice(false);
    }
  };

  const collectCash = async () => {
    const total = realTotal(cashJob);
    if (total === null) return;
    setCashLoading(true);
    try {
      await api.post("/payments/cash", { job_id: cashJob.id, amount: Math.round(total * 100) });
      setCashJob(null);
      setCompleted({ total });
      await fetchAll();
    } catch (err) {
      showError(detail(err, "Couldn't record the cash payment."));
    } finally {
      setCashLoading(false);
    }
  };

  return (
    <section aria-labelledby="queue-heading" className="space-y-3">
      <div>
        <SectionHeader title={<span id="queue-heading">{title}</span>} action={offers.length + jobs.length > 0 ? `${offers.length + jobs.length} open` : null} />
        {subtitle && <p className="text-sm text-[var(--text-muted)]">{subtitle}</p>}
      </div>

      {loading ? (
        <div className="space-y-3" aria-busy="true" aria-label="Loading jobs">
          {[1, 2].map((i) => (
            <div key={i} className="space-y-2 rounded-2xl border border-[var(--border)] bg-[var(--surface-card)] p-4">
              <Skeleton className="w-1/2" />
              <Skeleton className="h-3 w-2/3" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div role="alert" className="flex flex-col items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface-card)] p-6 text-center">
          <AlertTriangle size={24} aria-hidden="true" className="text-[var(--danger)]" />
          <p className="text-sm text-[var(--danger-ink)]">{error}</p>
          <Button variant="outline" size="sm" onClick={fetchAll}>Retry</Button>
        </div>
      ) : offers.length === 0 && jobs.length === 0 ? (
        <EmptyState icon={Clock} title="No jobs right now" description="New offers appear here as customers nearby request service." />
      ) : (
        <>
          {offers.map((o) => (
            <OfferCard key={o.id} offer={o} busy={busyId === o.id} onAccept={(x) => respond(x, "accept")} onDecline={(x) => respond(x, "decline")} />
          ))}
          {jobs.map((j) => (
            <JobCard
              key={j.id}
              job={j}
              busy={busyId === j.id}
              onStartNavigation={(x) => advance(x, "en_route")}
              onStartService={(x) => advance(x, "in_progress")}
              onNavigate={navigate}
              onBill={openBill}
              onCollectCash={setCashJob}
              onChat={onChat}
              onDelete={setDeleteJob}
            />
          ))}
        </>
      )}

      <Modal isOpen={!!billJob} onClose={() => setBillJob(null)} title="Bill customer">
        <p className="mb-4 text-sm text-[var(--text-muted)]">
          Enter your service charge. Convenience, distance and GST are calculated by ClutchD and shown to the customer on the final bill.
        </p>
        <Input label="Your service fee (₹)" type="number" inputMode="decimal" placeholder="e.g. 150" value={serviceAmount} onChange={(e) => setServiceAmount(e.target.value)} icon={IndianRupee} error={priceError || undefined} />
        <div className="mt-5 flex gap-3">
          <Button variant="secondary" className="flex-1" onClick={() => setBillJob(null)}>Cancel</Button>
          <Button className="flex-1" onClick={finalizePrice} isLoading={submittingPrice}>
            <Send size={16} aria-hidden="true" /> Send bill
          </Button>
        </div>
      </Modal>

      <Modal isOpen={!!invoiceSent} onClose={() => setInvoiceSent(null)} title="Invoice sent">
        <div data-testid="invoice-sent" className="py-2 text-center">
          <p className="text-3xl font-semibold text-[var(--foreground)]">{money(invoiceSent?.total)}</p>
          <p className="mt-1 text-sm text-[var(--pending-ink)]">Awaiting payment</p>
          <Button className="mt-5 w-full" onClick={() => setInvoiceSent(null)}>OK</Button>
        </div>
      </Modal>

      <ConfirmModal
        isOpen={!!cashJob}
        onClose={() => setCashJob(null)}
        onConfirm={collectCash}
        title="Confirm cash received"
        message={cashJob ? `Confirm you received ${money(realTotal(cashJob))} in cash. This completes the job.` : ""}
        confirmLabel="Cash received"
        variant="info"
        isLoading={cashLoading}
      />

      <Modal isOpen={!!completed} onClose={() => setCompleted(null)} title="Job completed">
        <div data-testid="job-completed" className="py-2 text-center">
          <CheckCircle2 size={40} aria-hidden="true" className="mx-auto mb-2 text-[var(--success)]" />
          <p className="text-2xl font-semibold text-[var(--foreground)]">{money(completed?.total)} paid</p>
          <Button className="mt-5 w-full" onClick={() => setCompleted(null)}>Back to home</Button>
        </div>
      </Modal>

      <ConfirmModal
        isOpen={!!deleteJob}
        onClose={() => setDeleteJob(null)}
        onConfirm={async () => {
          setDeleteLoading(true);
          try {
            await api.delete(`/jobs/${deleteJob.id}`);
            await fetchAll();
          } catch (e) {
            showError(detail(e, "Couldn't delete the job."));
          } finally {
            setDeleteJob(null);
            setDeleteLoading(false);
          }
        }}
        title="Delete job record"
        message="Delete this job record? This cannot be undone."
        isLoading={deleteLoading}
      />
    </section>
  );
}
