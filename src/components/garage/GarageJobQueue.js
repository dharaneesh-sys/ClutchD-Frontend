import { useState, useEffect } from "react";
import { GlassCard } from "../ui/GlassCard";
import { Button } from "../ui/Button";
import { Badge } from "../ui/Badge";
import { Clock, MapPin, Settings, Loader2 } from "lucide-react";
import { AssignMechanicModal } from "./AssignMechanicModal";
import api from "../../lib/api";
import { useThemeStore } from "../../store/themeStore";
import { formatDistanceToNow } from "date-fns";

export function GarageJobQueue() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  
  const { theme } = useThemeStore();
  const isLight = theme === "light";

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
    const interval = setInterval(fetchJobs, 10000); // poll every 10s
    return () => clearInterval(interval);
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

  return (
    <GlassCard variant="strong" className="p-6 h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <div>
           <h2 className={`text-xl font-bold tracking-tight ${isLight ? "text-slate-900" : "text-white"}`}>Garage Queue</h2>
           <p className={`text-sm ${isLight ? "text-slate-500" : "text-emerald-100/60"}`}>Dispatch to your staff</p>
        </div>
        <Badge variant="warning" className="animate-pulse">
           {jobs.filter(j => j.status === 'searching' || j.status === 'assigned_to_garage').length} Unassigned
        </Badge>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-4">
        {loading && jobs.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center">
            <Loader2 size={40} className={`mb-4 animate-spin ${isLight ? "text-yellow-500" : "text-emerald-500"}`} />
            <p className={isLight ? "text-slate-500" : "text-white/40"}>Loading jobs...</p>
          </div>
        ) : jobs.length === 0 ? (
           <div className={`h-full flex flex-col items-center justify-center ${isLight ? "text-slate-400" : "text-white/40"}`}>
             <Clock size={40} className="mb-4 opacity-50" />
             <p>No active jobs.</p>
           </div>
        ) : (
          jobs.map(job => {
            const isUnassigned = job.status === 'searching' || job.status === 'assigned_to_garage';
            return (
              <div key={job.id} className={`p-4 rounded-xl border transition-all ${
                !isUnassigned 
                  ? (isLight ? 'bg-slate-50 border-slate-200 opacity-80' : 'bg-black/20 border-white/5 opacity-80')
                  : (isLight ? 'bg-white border-yellow-200 shadow-sm' : 'bg-white/5 border-emerald-500/30')
              }`}>
                <div className="flex justify-between items-start mb-2">
                  <h4 className={`font-semibold ${isLight ? "text-slate-900" : "text-white"}`}>Customer</h4>
                  <Badge variant={!isUnassigned ? 'success' : 'danger'}>
                    {job.status.toUpperCase()}
                  </Badge>
                </div>
                
                <div className="mb-3">
                  <p className="text-sm font-medium text-red-400 mb-1">{job.issueTag}</p>
                  <p className={`text-sm mb-2 ${isLight ? "text-slate-600" : "text-emerald-100/80"}`}>{job.description}</p>
                  <div className={`flex items-center justify-between text-xs ${isLight ? "text-slate-500" : "text-emerald-100/60"}`}>
                     <div className="flex items-center gap-1">
                       <MapPin size={12} className={isLight ? "text-yellow-600" : "text-emerald-400"} />
                       {job.customerLat?.toFixed(4)}, {job.customerLng?.toFixed(4)}
                     </div>
                     <div className="flex items-center gap-1">
                       <Clock size={12} />
                       {job.createdAt ? formatDistanceToNow(new Date(job.createdAt), { addSuffix: true }) : "recently"}
                     </div>
                  </div>
                </div>

                <div className={`border-t pt-3 mt-3 flex items-center justify-between ${isLight ? "border-slate-100" : "border-white/5"}`}>
                  <div>
                    <p className={`text-[10px] uppercase tracking-wider mb-0.5 ${isLight ? "text-slate-400" : "text-emerald-100/50"}`}>Est. Value</p>
                    <p className={`font-bold ${isLight ? "text-yellow-600" : "text-emerald-300"}`}>
                      ₹{job.priceEstimate?.min || 0} - ₹{job.priceEstimate?.max || 0}
                    </p>
                  </div>
                  
                  {isUnassigned ? (
                    <Button size="sm" onClick={() => openAssignModal(job)}>
                       Dispatch
                    </Button>
                  ) : (
                    <div className="text-right">
                       <p className={`text-[10px] uppercase tracking-wider mb-0.5 ${isLight ? "text-slate-400" : "text-emerald-100/50"}`}>Assigned To</p>
                       <p className={`font-bold text-sm flex items-center justify-end ${isLight ? "text-slate-900" : "text-white"}`}>
                         <Settings size={12} className={`mr-1 ${isLight ? "text-yellow-600" : "text-emerald-400"}`} /> 
                         {job.mechanic?.name || "Mechanic"}
                       </p>
                    </div>
                  )}
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
    </GlassCard>
  );
}
