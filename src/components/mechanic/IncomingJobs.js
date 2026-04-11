"use client";

import { useState, useEffect, useCallback } from "react";
import { GlassCard } from "../ui/GlassCard";
import { Button } from "../ui/Button";
import { Badge } from "../ui/Badge";
import { MapPin, Clock, Navigation, CheckCircle2, AlertTriangle } from "lucide-react";
import api from "../../lib/api";

export function IncomingJobs() {
  const [jobs, setJobs] = useState([]);
  const [toast, setToast] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const showToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(null), 3000);
  };

  const fetchJobs = useCallback(async () => {
    try {
      const { data } = await api.get("/jobs/incoming");
      setJobs(Array.isArray(data.jobs) ? data.jobs : []);
      setError(null);
    } catch (err) {
      if (err.response?.status === 404) {
        // Endpoint may not exist yet — show empty state
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
    const interval = setInterval(fetchJobs, 15000); // Poll every 15s
    return () => clearInterval(interval);
  }, [fetchJobs]);

  const acceptJob = async (id) => {
    try {
      await api.patch(`/service/request/${id}/status`, { status: "en_route" });
      setJobs(jobs.map(j => j.id === id ? { ...j, status: "accepted" } : j));
      showToast("Job accepted! Navigate to the customer's location.");
    } catch (err) {
      showToast("Failed to accept job. Please try again.");
    }
  };

  const rejectJob = (id) => {
    setJobs(jobs.filter(j => j.id !== id));
  };
  
  const finishJob = async (id) => {
    try {
      await api.patch(`/service/request/${id}/status`, { status: "completed" });
      setJobs(jobs.filter(j => j.id !== id));
      showToast("Job marked as completed. Earnings added to your wallet.");
    } catch (err) {
      showToast("Failed to complete job. Please try again.");
    }
  };

  return (
    <GlassCard variant="strong" className="p-6 h-full flex flex-col relative">
      {/* Toast Notification */}
      {toast && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-3 bg-emerald-500/20 border border-emerald-500/30 backdrop-blur-xl rounded-xl shadow-lg animate-in slide-in-from-top-2 max-w-[90%]">
          <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
          <span className="text-sm text-emerald-100 font-medium">{toast}</span>
        </div>
      )}

      <div className="flex justify-between items-center mb-6">
        <div>
           <h2 className="text-xl font-bold text-white tracking-tight">Job Queue</h2>
           <p className="text-sm text-emerald-100/60">Manage your service requests</p>
        </div>
        <Badge variant="warning" className="animate-pulse">
           {jobs.filter(j => j.status === 'pending' || j.status === 'assigned').length} Request(s)
        </Badge>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-4">
        {isLoading ? (
           <div className="h-full flex flex-col items-center justify-center text-white/40">
             <div className="w-8 h-8 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin mb-4"></div>
             <p>Loading jobs...</p>
           </div>
        ) : error ? (
           <div className="h-full flex flex-col items-center justify-center text-white/40">
             <AlertTriangle size={40} className="mb-4 text-amber-400/50" />
             <p>{error}</p>
             <Button variant="ghost" size="sm" className="mt-2" onClick={fetchJobs}>Retry</Button>
           </div>
        ) : jobs.length === 0 ? (
           <div className="h-full flex flex-col items-center justify-center text-white/40">
             <Clock size={40} className="mb-4 opacity-50" />
             <p>No jobs in queue.</p>
             <p className="text-sm">Stay online to receive requests.</p>
           </div>
        ) : (
          jobs.map(job => (
            <div key={job.id} className={`p-4 rounded-xl border transition-all ${
              job.status === 'accepted' || job.status === 'en_route' || job.status === 'in_progress'
                ? 'bg-emerald-500/10 border-emerald-500/30' 
                : 'bg-white/5 border-white/10'
            }`}>
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-semibold text-white">{job.issueTag || job.customer || "Service Request"}</h4>
                <span className="text-xs text-white/50 flex items-center">
                  <Clock size={12} className="mr-1"/>
                  {job.createdAt ? new Date(job.createdAt).toLocaleTimeString() : "—"}
                </span>
              </div>
              
              <div className="mb-3">
                <Badge variant={job.status === 'assigned' || job.status === 'pending' ? 'danger' : 'success'} className="mb-2">
                  {job.issueTag || "Unknown"}
                </Badge>
                <p className="text-sm text-emerald-100/80 mb-2">{job.description || "No description"}</p>
                {job.mechanic?.distance && (
                  <div className="flex items-center text-xs text-emerald-100/60 font-medium">
                     <MapPin size={12} className="mr-1 text-emerald-400" />
                     {job.mechanic.distance} away
                  </div>
                )}
              </div>

              <div className="border-t border-white/5 pt-3 mt-3 flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-emerald-100/50 uppercase tracking-wider mb-0.5">Est. Cost</p>
                  <p className="font-bold text-emerald-300">
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
                      <Button variant="outline" size="sm">
                        <Navigation size={14} className="mr-1.5" /> Navigate
                      </Button>
                      <Button size="sm" onClick={() => finishJob(job.id)}>Complete</Button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </GlassCard>
  );
}
