import { useState, useEffect } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { Input } from "@/components/ui/Input";
import { Clock, MapPin, Settings, Loader2, IndianRupee, AlertTriangle } from "lucide-react";
import { AssignMechanicModal } from "@/components/garage/AssignMechanicModal";
import api from "@/lib/api";
import { FEE_CONSTANTS } from "@/lib/constants";
import { useToast } from "@/components/ui/ToastProvider";
import { formatDistanceToNow } from "date-fns";

export function GarageJobQueue() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  
  const { success: showSuccess, error: showError } = useToast();

  // --- Job Completion Modal State ---
  const [completionModal, setCompletionModal] = useState(false);
  const [completionJobId, setCompletionJobId] = useState(null);
  const [serviceAmount, setServiceAmount] = useState("");
  const [submittingPrice, setSubmittingPrice] = useState(false);
  const [priceError, setPriceError] = useState("");
  const [deleteJob, setDeleteJob] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchJobs = async () => {
    try {
      const res = await api.get("/jobs/incoming");
      setJobs(res.data.jobs || []);
    } catch (e) {
      console.warn("Failed to fetch jobs", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
    const interval = setInterval(() => {
      if (!document.hidden) fetchJobs();
    }, 10000);
    const onVisibility = () => { if (!document.hidden) fetchJobs(); };
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  const openAssignModal = (job) => {
    setSelectedJob(job);
    setAssignModalOpen(true);
  };

  const handleAssign = async (jobId, mechanicId) => {
    try {
      await api.post(`/jobs/${jobId}/assign`, {
        assign_type: "mechanic",
        assign_id: mechanicId,
      });
      // Optimistic update
      setJobs((prev) =>
        prev.map((j) => (j.id === jobId ? { ...j, status: "assigned", mechanic: { id: mechanicId } } : j))
      );
      setAssignModalOpen(false);
      fetchJobs(); // refresh list
    } catch (e) {
      console.error("Failed to assign job", e);
    }
  };

  const openCompletionModal = (id) => {
    setCompletionJobId(id);
    setServiceAmount("");
    setPriceError("");
    setCompletionModal(true);
  };

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
    <GlassCard variant="strong" className="p-6 h-full flex flex-col relative">

      <div className="flex justify-between items-center mb-6">
         <div>
            <h2 className="text-xl font-bold tracking-tight text-text-primary">Garage Queue</h2>
            <p className="text-sm text-text-muted">Dispatch to your staff</p>
         </div>
        <Badge variant="warning" className="animate-pulse">
           {jobs.filter(j => j.status === 'searching' || j.status === 'assigned_to_garage').length} Unassigned
        </Badge>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-4">
        {loading && jobs.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center">
            <Loader2 size={40} className="mb-4 animate-spin text-icon-highlight" />
            <p className="text-text-dim">Loading jobs...</p>
          </div>
        ) : jobs.length === 0 ? (
           <div className="h-full flex flex-col items-center justify-center text-text-dim">
             <Clock size={40} className="mb-4 opacity-50" />
             <p>No active jobs.</p>
           </div>
        ) : (
          jobs.map(job => {
            const isUnassigned = job.status === 'searching' || job.status === 'assigned_to_garage';
            const isActive = job.status === 'in_progress' || job.status === 'en_route';
            return (
              <div key={job.id} className={`p-4 rounded-xl border transition-all ${
                !isUnassigned 
                  ? 'bg-surface-soft border-border-subtle opacity-80'
                  : 'bg-bg-card border-border-subtle shadow-sm'
              }`}>
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-semibold text-text-primary">Customer</h4>
                  <Badge variant={!isUnassigned ? 'success' : 'danger'}>
                    {job.status.toUpperCase()}
                  </Badge>
                </div>
                
                <div className="mb-3">
                  <p className="text-sm font-medium text-red-400 mb-1">{job.issueTag}</p>
                  <p className="text-sm mb-2 text-text-muted">{job.description}</p>
                  <div className="flex items-center justify-between text-xs text-text-muted">
                      <div className="flex items-center gap-1">
                        <MapPin size={12} className="text-icon-highlight" />
                        {job.customerLat?.toFixed(4)}, {job.customerLng?.toFixed(4)}
                      </div>
                     <div className="flex items-center gap-1">
                       <Clock size={12} />
                       {job.createdAt ? formatDistanceToNow(new Date(job.createdAt), { addSuffix: true }) : "recently"}
                     </div>
                  </div>
                </div>

                <div className="border-t pt-3 mt-3 flex items-center justify-between border-border-subtle">
                  <div>
                    <p className="text-[10px] uppercase tracking-wider mb-0.5 text-text-dim">Est. Value</p>
                    <p className="font-bold text-icon-highlight">
                      ₹{job.priceEstimate?.min || 0} - ₹{job.priceEstimate?.max || 0}
                    </p>
                  </div>
                  
                  <div className="flex gap-2">
                    {isUnassigned ? (
                      <Button size="sm" onClick={() => openAssignModal(job)}>
                         Dispatch
                      </Button>
                    ) : isActive ? (
                      <Button size="sm" onClick={() => openCompletionModal(job.id)}>
                        <IndianRupee size={14} className="mr-1" /> Bill Customer
                      </Button>
                    ) : (
                       <div className="text-right">
                          <p className="text-[10px] uppercase tracking-wider mb-0.5 text-text-dim">Assigned To</p>
                          <p className="font-bold text-sm flex items-center justify-end text-text-primary">
                            <Settings size={12} className="mr-1 text-icon-highlight" /> 
                            {job.mechanic?.name || "Mechanic"}
                          </p>
                       </div>
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
            );
          })
        )}
      </div>

      <AssignMechanicModal 
        isOpen={assignModalOpen} 
        onClose={() => setAssignModalOpen(false)} 
        job={selectedJob}
        onAssign={handleAssign}
      />

      {/* ── Job Completion Modal ── */}
      <Modal isOpen={completionModal} onClose={() => setCompletionModal(false)} title="Submit Service Bill">
        <div className="text-center mb-6">
          <div className="w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4 bg-surface-soft">
            <IndianRupee size={32} className="text-icon-highlight" />
          </div>
          <p className="text-sm text-text-muted">
            Enter the service charge for the work completed. Additional fees (convenience, distance, GST) will be automatically calculated and added to the customer&apos;s bill.
          </p>
        </div>

        <Input
          label="Service Fee (₹)"
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
        message="Are you sure you want to delete this job record? This action cannot be removed."
        confirmLabel="Delete"
        isLoading={deleteLoading}
      />
    </GlassCard>
  );
}
