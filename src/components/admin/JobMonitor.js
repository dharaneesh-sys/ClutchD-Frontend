import { useState, useEffect } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { MapPin, Navigation, Clock, AlertTriangle, Crosshair } from "lucide-react";
import { useToast } from "@/components/ui/ToastProvider";
import { fetchJobs, forceAssignJob, trackJob } from "@/services/adminService";
import dynamic from "next/dynamic";
import L from "leaflet";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

const MapContainer = dynamic(
  () => import("react-leaflet").then((m) => m.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import("react-leaflet").then((m) => m.TileLayer),
  { ssr: false }
);
const Marker = dynamic(
  () => import("react-leaflet").then((m) => m.Marker),
  { ssr: false }
);
const Popup = dynamic(
  () => import("react-leaflet").then((m) => m.Popup),
  { ssr: false }
);

export function JobMonitor() {
  useEffect(() => { import("leaflet/dist/leaflet.css"); }, []);
  const [filter, setFilter] = useState("All");
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  const [forceAssignModal, setForceAssignModal] = useState(null);
  const [selectedProvider, setSelectedProvider] = useState("");
  const [providerType, setProviderType] = useState("mechanic");
  const [trackMapModal, setTrackMapModal] = useState(null);
  const [trackData, setTrackData] = useState(null);
  const [mapLoading, setMapLoading] = useState(false);
  const { success: showSuccess, error: showError } = useToast();

  const loadJobs = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (filter !== "All") {
        const statusMap = {
          "Searching": "searching",
          "En Route": "en_route",
          "In Progress": "in_progress",
          "Nearing Completion": "in_progress",
        };
        params.status = statusMap[filter] || filter.toLowerCase();
      }
      const data = await fetchJobs(params);
      setJobs(data);
    } catch (err) {
      setError(err?.response?.data?.detail || "Failed to load jobs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadJobs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const handleForceAssign = async () => {
    if (!selectedProvider || !forceAssignModal) {
      showError("Please select a provider");
      return;
    }
    setActionLoading(forceAssignModal.id);
    try {
      await forceAssignJob(forceAssignModal.id, providerType, selectedProvider);
      showSuccess(`Job ${forceAssignModal.id} force-assigned.`);
      setForceAssignModal(null);
      setSelectedProvider("");
      loadJobs();
    } catch (err) {
      showError(err?.response?.data?.detail || "Failed to force assign");
    } finally {
      setActionLoading(null);
    }
  };

  const handleTrackMap = async (job) => {
    setTrackMapModal(job);
    setMapLoading(true);
    setTrackData(null);
    try {
      const data = await trackJob(job.id);
      setTrackData(data);
    } catch (err) {
      showError(err?.response?.data?.detail || "Failed to load tracking data");
    } finally {
      setMapLoading(false);
    }
  };

  const statusFilters = ["All", "Searching", "En Route", "In Progress", "Nearing Completion"];

  return (
    <>
      <GlassCard variant="elevated" className="h-full flex flex-col overflow-hidden">
        <div className={`p-4 border-b flex gap-2 overflow-x-auto custom-scrollbar ${"border-border-subtle"}`}>
          {statusFilters.map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`whitespace-nowrap px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                filter === f
                    ? 'bg-primary text-white shadow-sm'
                  : ('bg-surface-soft text-text-primary hover:bg-bg-card')
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4">
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin border-primary" />
              </div>
            ) : error ? (
            <div className="flex flex-col items-center py-12 text-red-500">
              <p>{error}</p>
              <button onClick={loadJobs} className="mt-3 text-sm underline">Retry</button>
            </div>
          ) : jobs.length === 0 ? (
            <div className={`py-12 text-center ${"text-text-dim"}`}>
              No jobs found.
            </div>
          ) : (
            jobs.filter(j => filter === "All" || j.status === filter).map(job => (
              <div key={job.id} className={`p-4 rounded-xl border flex flex-col lg:flex-row gap-4 lg:items-center justify-between ${"bg-bg-card border-border-subtle"}`}>
                <div className="grid grid-cols-2 lg:flex gap-4 lg:gap-8 flex-1">
                   <div>
                     <p className={`text-[10px] uppercase mb-1 ${"text-text-dim"}`}>Job ID / Time</p>
                     <p className={`text-sm font-mono ${"text-text-primary"}`}>{job.id?.slice(0, 8)}</p>
                     <p className={`text-xs mt-1 flex items-center gap-1 ${"text-icon-highlight"}`}><Clock size={10} /> {job.time}</p>
                   </div>

                   <div>
                     <p className={`text-[10px] uppercase mb-1 ${"text-text-dim"}`}>Parties</p>
                     <p className={`text-sm font-medium ${"text-text-primary"}`}>{job.customer}</p>
                     <p className={`text-xs ${"text-text-muted"}`}>via {job.provider}</p>
                   </div>

                   <div>
                     <p className={`text-[10px] uppercase mb-1 ${"text-text-dim"}`}>Issue / Amount</p>
                     <p className={`text-sm font-medium ${"text-text-primary"}`}>{job.issue}</p>
                     <p className={`text-xs ${"text-text-primary"}`}>{job.amount}</p>
                   </div>

                   <div className="col-span-2 lg:col-span-1">
                     <p className={`text-[10px] uppercase mb-1 ${"text-text-dim"}`}>Location</p>
                     <p className={`text-sm flex items-center gap-1 ${"text-text-primary"}`}><MapPin size={12} className={"text-icon-highlight"} /> {job.location}</p>
                   </div>
                </div>

                <div className="flex flex-col sm:flex-row lg:flex-col items-center lg:items-end gap-2 shrink-0">
                   <Badge variant={
                     job.status === 'Searching' ? 'warning' :
                     job.status === 'In Progress' ? 'success' : 'info'
                   }>
                     {job.status}
                   </Badge>

                   <div className="flex gap-2">
                     {job.status === 'Searching' && (
                       <button
                         onClick={() => { setForceAssignModal(job); setSelectedProvider(""); setProviderType("mechanic"); }}
                          className="text-xs flex items-center gap-1 px-2 py-1 rounded border bg-bg-card text-red-500 border-border-subtle hover:bg-surface-soft"
                       >
                         <AlertTriangle size={12} /> Force Assign
                       </button>
                     )}
                     <button
                       onClick={() => handleTrackMap(job)}
                       className={`text-xs flex items-center gap-1 px-2 py-1 rounded border transition-colors ${"bg-bg-card hover:bg-bg-card text-text-primary border-border-subtle"}`}
                     >
                       <Navigation size={12} /> Track Map
                     </button>
                   </div>
                </div>
              </div>
            ))
          )}
        </div>
      </GlassCard>

      <Modal
        isOpen={!!forceAssignModal}
        onClose={() => { setForceAssignModal(null); setSelectedProvider(""); }}
        title={`Force Assign — ${forceAssignModal?.id?.slice(0, 8)}`}
      >
        {forceAssignModal && (
          <div className="space-y-4">
            <p className={`text-sm ${"text-text-primary"}`}>
              Force-assign {forceAssignModal.issue} job for {forceAssignModal.customer} to a provider.
            </p>

            <div>
              <label className={`block text-sm font-medium mb-1.5 ${"text-text-primary"}`}>Provider Type</label>
              <div className="flex gap-3">
                <button
                  onClick={() => setProviderType("mechanic")}
                  className={`flex-1 py-3 px-4 rounded-xl text-sm font-medium border transition-all ${
                    providerType === "mechanic"
                      ? "bg-surface-soft border-border-subtle text-icon-highlight"
                      : "bg-bg-card border-border-subtle text-text-muted"
                  }`}
                >
                  Mechanic
                </button>
                <button
                  onClick={() => setProviderType("garage")}
                  className={`flex-1 py-3 px-4 rounded-xl text-sm font-medium border transition-all ${
                    providerType === "garage"
                      ? "bg-surface-soft border-border-subtle text-icon-highlight"
                      : "bg-bg-card border-border-subtle text-text-muted"
                  }`}
                >
                  Garage
                </button>
              </div>
            </div>

            <div>
              <label className={`block text-sm font-medium mb-1.5 ${"text-text-primary"}`}>Provider ID (UUID)</label>
                <input
                  type="text"
                  placeholder={providerType === "mechanic" ? "Enter mechanic ID..." : "Enter garage ID..."}
                  value={selectedProvider}
                  onChange={(e) => setSelectedProvider(e.target.value)}
                  className="w-full rounded-2xl border px-4 py-3 text-sm transition-all bg-bg-card border-border-subtle text-text-primary placeholder:text-text-dim focus:border-primary focus:ring-1 focus:ring-primary/30 focus:outline-none"
                />
            </div>

            <div className="flex gap-3 justify-end pt-2">
              <Button variant="ghost" onClick={() => { setForceAssignModal(null); setSelectedProvider(""); }}>Cancel</Button>
              <Button onClick={handleForceAssign} isLoading={actionLoading === forceAssignModal.id}>
                <Crosshair size={16} className="mr-1.5" /> Force Assign
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={!!trackMapModal}
        onClose={() => { setTrackMapModal(null); setTrackData(null); }}
        title={`Track Map — ${trackMapModal?.id?.slice(0, 8)}`}
        maxWidth="max-w-3xl"
      >
        {mapLoading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin border-primary" />
          </div>
        ) : trackData ? (
          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-1 p-3 rounded-xl border bg-surface-soft border-border-subtle">
                <p className="text-[10px] uppercase mb-1 text-text-muted">Customer</p>
                <p className="text-sm font-medium text-text-primary">
                  {trackMapModal.customer}<br/>
                  <span className="text-xs opacity-70">{trackData.customerLat?.toFixed(4)}, {trackData.customerLon?.toFixed(4)}</span>
                </p>
              </div>
              {trackData.providerLat && (
                <div className="flex-1 p-3 rounded-xl border bg-surface-soft border-border-subtle">
                  <p className="text-[10px] uppercase mb-1 text-text-muted">Provider</p>
                  <p className="text-sm font-medium text-text-primary">
                    {trackMapModal.provider}<br/>
                    <span className="text-xs opacity-70">{trackData.providerLat?.toFixed(4)}, {trackData.providerLon?.toFixed(4)}</span>
                  </p>
                </div>
              )}
            </div>

            <div className="h-[350px] rounded-xl overflow-hidden border">
              {typeof window !== "undefined" && (
                <MapContainer center={[trackData.customerLat || 20, trackData.customerLon || 78]} zoom={13} className="h-full w-full" scrollWheelZoom={true}>
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  {trackData.customerLat && trackData.customerLon && (
                    <Marker position={[trackData.customerLat, trackData.customerLon]}>
                      <Popup>{trackMapModal.customer} (Customer)</Popup>
                    </Marker>
                  )}
                  {trackData.providerLat && trackData.providerLon && (
                    <Marker position={[trackData.providerLat, trackData.providerLon]}>
                      <Popup>{trackMapModal.provider} (Provider)</Popup>
                    </Marker>
                  )}
                </MapContainer>
              )}
            </div>
          </div>
        ) : (
          <div className={`py-12 text-center ${"text-text-dim"}`}>
            No tracking data available.
          </div>
        )}
      </Modal>
    </>
  );
}
