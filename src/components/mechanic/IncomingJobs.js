"use client";

import { useState, useEffect, useCallback } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { Input } from "@/components/ui/Input";
import { Navigation, CheckCircle2, AlertTriangle, MapPin, Clock, IndianRupee, Loader2 } from "lucide-react";
import { FEE_CONSTANTS } from "@/lib/constants";
import { useTrackingStore } from "@/store/trackingStore";
import { useToast } from "@/components/ui/ToastProvider";
import api from "@/lib/api";

export function IncomingJobs() {
  const [jobs, setJobs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const { setNavigationTarget } = useTrackingStore();
  const { success: showSuccess, error: showError } = useToast();

  // --- Job Completion Modal State ---
  const [completionModal, setCompletionModal] = useState(false);
  const [completionJobId, setCompletionJobId] = useState(null);
  const [serviceAmount, setServiceAmount] = useState("");
  const [submittingPrice, setSubmittingPrice] = useState(false);
  const [priceError, setPriceError] = useState("");
  const [deleteJob, setDeleteJob] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchJobs = useCallback(async () => {
    try {
      const { data } = await api.get("/jobs/incoming");
      setJobs(Array.isArray(data.jobs) ? data.jobs : []);
      setError(null);
    } catch (err) {
      if (err.response?.status === 404) {
        setJobs([]);
      } else {
        setError(err.response ? "Failed to load jobs." : "Server unreachable.");
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchJobs();
    const interval = setInterval(() => {
      if (!document.hidden) fetchJobs();
    }, 15000);
    const onVisibility = () => { if (!document.hidden) fetchJobs(); };
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [fetchJobs]);

  const acceptJob = async (id) => {
    try {
      await api.patch(`/service/request/${id}/status`, { status: "en_route" });
      setJobs(jobs.map(j => j.id === id ? { ...j, status: "accepted" } : j));
      showSuccess("Job accepted! Navigate to the customer's location.");
    } catch (err) {
      showError(`Failed to accept: ${err.response?.data?.detail || err.message}`);
    }
  };

  const rejectJob = (id) => {
    setJobs(jobs.filter(j => j.id !== id));
  };
  
  // Opens the completion modal instead of directly completing the job
  const openCompletionModal = (id) => {
    setCompletionJobId(id);
    setServiceAmount("");
    setPriceError("");
    setCompletionModal(true);
  };

  // Submits the service fee to backend, triggering price calculation
  const handleFinalizePrice = async () => {
    const amount = parseFloat(serviceAmount);
    if (isNaN(amount) || amount <= 0) {
      setPriceError("Please enter a valid service amount.");
      return;
    }
    if (amount > 500000) {
      setPriceError("Amount cannot exceed ₹5,00,000.");
      return;
    }
    setPriceError("");
    setSubmittingPrice(true);
    try {
      await api.post(`/service/request/${completionJobId}/finalize-price`, {
        serviceAmount: amount,
      });
      setJobs(jobs.filter(j => j.id !== completionJobId));
      setCompletionModal(false);
      showSuccess(`Invoice of ₹${amount} sent to customer. Awaiting payment.`);
    } catch (err) {
      setPriceError(err.response?.data?.detail || "Failed to submit price. Please try again.");
    } finally {
      setSubmittingPrice(false);
    }
  };

  return (
    <GlassCard variant="strong" className="p-4 sm:p-6 h-full flex flex-col relative">

      <div className="flex justify-between items-center mb-6">
         <div>
            <h2 className="text-xl font-bold tracking-tight text-text-primary">Job Queue</h2>
            <p className="text-sm text-text-muted">Manage your service requests</p>
         </div>
        <Badge variant="warning" className="animate-pulse">
           {jobs.filter(j => j.status === 'pending' || j.status === 'assigned').length} Request(s)
        </Badge>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-4">
        {isLoading ? (
           <div className="h-full flex flex-col items-center justify-center text-text-dim">
              <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin mb-4 border-primary/30 border-t-primary"></div>
             <p>Loading jobs...</p>
           </div>
        ) : error ? (
           <div className="h-full flex flex-col items-center justify-center text-text-dim">
              <AlertTriangle size={40} className="mb-4 text-amber-400/50" />
              <p>{error}</p>
             <Button variant="ghost" size="sm" className="mt-2" onClick={fetchJobs}>Retry</Button>
           </div>
        ) : jobs.length === 0 ? (
           <div className="h-full flex flex-col items-center justify-center text-text-dim">
              <Clock size={40} className="mb-4 opacity-50" />
             <p>No jobs in queue.</p>
             <p className="text-sm">Stay online to receive requests.</p>
           </div>
        ) : (
          jobs.map(job => (
            <div key={job.id} className={`p-4 rounded-xl border transition-all ${
              job.status === 'accepted' || job.status === 'en_route' || job.status === 'in_progress'
                ? 'bg-surface-soft border-border-subtle'
                : 'bg-bg-card border-border-subtle'
            }`}>
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-semibold text-text-primary">{job.issueTag || job.customer || "Service Request"}</h4>
                <span className="text-xs flex items-center text-text-muted">
                  <Clock size={12} className="mr-1"/>
                  {job.createdAt ? new Date(job.createdAt).toLocaleTimeString() : "—"}
                </span>
              </div>
              
              <div className="mb-3">
                <Badge variant={job.status === 'assigned' || job.status === 'pending' ? 'danger' : 'success'} className="mb-2">
                  {job.issueTag || "Unknown"}
                </Badge>
                <p className="text-sm mb-2 text-text-muted">{job.description || "No description"}</p>
                {job.mechanic?.distance && (
                   <div className="flex items-center text-xs font-medium text-text-muted">
                      <MapPin size={12} className="mr-1 text-icon-highlight" />
                      {job.mechanic.distance} away
                   </div>
                )}
              </div>

              <div className="border-t pt-3 mt-3 flex items-center justify-between border-border-subtle">
                <div>
                  <p className="text-[10px] uppercase tracking-wider mb-0.5 text-text-dim">Est. Cost</p>
                  <p className="font-bold text-icon-highlight">
                    {job.priceEstimate ? `₹${job.priceEstimate.min} - ₹${job.priceEstimate.max}` : "—"}
                  </p>
                </div>
                
                <div className="flex gap-2">
                  {(job.status === 'assigned' || job.status === 'pending' || job.status === 'searching') ? (
                    <>
                      <Button variant="ghost" size="sm" onClick={() => rejectJob(job.id)}>Decline</Button>
                      <Button size="sm" onClick={() => acceptJob(job.id)}>Accept Job</Button>
                    </>
                  ) : (
                    <>
                      <Button variant="outline" size="sm" onClick={() => {
                        if (job.customerLocation) {
                          setNavigationTarget(job.customerLocation);
                          showSuccess("Navigating to customer location...");
                        } else {
                          showError("Customer location not available.");
                        }
                      }}>
                        <Navigation size={14} className="mr-1.5" /> Navigate
                      </Button>
                      <Button size="sm" onClick={() => openCompletionModal(job.id)}>
                        <IndianRupee size={14} className="mr-1" /> Bill Customer
                      </Button>
                    </>
                  )}
                  <button
                    onClick={() => setDeleteJob(job)}
                    className={`ml-2 flex items-center justify-center p-1.5 rounded-lg transition-colors text-red-500 hover:bg-red-50 hover:text-red-600 border border-transparent hover:border-red-200`}
                    title="Delete Job"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* ── Job Completion Modal ── */}
      <Modal isOpen={completionModal} onClose={() => setCompletionModal(false)} title="Submit Service Bill">
        <div className="text-center mb-6">
          <div className="w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4 bg-surface-soft">
            <IndianRupee size={32} className="text-icon-highlight" />
          </div>
          <p className="text-sm text-text-muted">
            Enter the service charge for the work you completed. Additional fees (convenience, distance, GST) will be automatically calculated and added to the customer&apos;s bill.
          </p>
        </div>

        <Input
          label="Your Service Fee (₹)"
          type="number"
          placeholder="e.g. 150"
          value={serviceAmount}
          onChange={(e) => setServiceAmount(e.target.value)}
          icon={IndianRupee}
        />

        {priceError && (
          <div className="mt-3 flex items-center gap-2 p-3 rounded-xl text-sm bg-red-500/10 border border-red-500/30 text-red-400">
            <AlertTriangle size={14} className="shrink-0" />
            {priceError}
          </div>
        )}

        {/* Fee Preview */}
        {serviceAmount && parseFloat(serviceAmount) > 0 && (
          <div className="mt-4 p-4 rounded-xl border text-sm space-y-2 bg-bg-card border-border-subtle">
            <p className="text-xs uppercase tracking-wider font-semibold mb-2 text-text-dim">Customer will be charged</p>
            <div className="flex justify-between text-text-muted">
              <span>Service Fee</span>
              <span className="font-medium">₹{parseFloat(serviceAmount).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-text-muted">
              <span>Convenience Fee</span>
              <span className="font-medium">₹{FEE_CONSTANTS.PLATFORM_FEE_FLAT}.00</span>
            </div>
            <div className="flex justify-between text-text-muted">
              <span>Cancellation Fee</span>
              <span className="font-medium">₹{FEE_CONSTANTS.CANCELLATION_FEE}.00</span>
            </div>
            <div className="flex justify-between text-text-muted">
              <span>Distance Fee</span>
              <span className="font-medium text-xs italic">calculated</span>
            </div>
            <div className="flex justify-between text-text-muted">
              <span>GST ({FEE_CONSTANTS.GST_RATE * 100}%)</span>
              <span className="font-medium text-xs italic">calculated</span>
            </div>
            <div className="border-t pt-2 mt-2 flex justify-between font-bold border-border-subtle text-text-primary">
              <span>Estimated Total</span>
              <span>₹{(((parseFloat(serviceAmount) + FEE_CONSTANTS.PLATFORM_FEE_FLAT + FEE_CONSTANTS.CANCELLATION_FEE) * (1 + FEE_CONSTANTS.GST_RATE))).toFixed(2)}+</span>
            </div>
            <p className="text-[10px] text-text-dim">
              * Distance fee will be added based on actual distance. Night surcharge applies after 8 PM.
            </p>
          </div>
        )}

        <div className="mt-6 flex gap-3">
          <Button variant="ghost" className="flex-1" onClick={() => setCompletionModal(false)}>
            Cancel
          </Button>
          <Button className="flex-1" onClick={handleFinalizePrice} isLoading={submittingPrice}>
            {submittingPrice ? <><Loader2 size={16} className="animate-spin mr-2" /> Sending...</> : "Send Invoice"}
          </Button>
        </div>
      </Modal>

      <ConfirmModal
        isOpen={!!deleteJob}
        onClose={() => setDeleteJob(null)}
        onConfirm={async () => {
          if (!deleteJob) return;
          setDeleteLoading(true);
          try {
            await api.delete(`/jobs/${deleteJob.id}`);
            fetchJobs();
            setDeleteJob(null);
          } catch (e) {
            showError(`Failed to delete job: ${e.response?.data?.detail || e.message}`);
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
    </GlassCard>
  );
}
