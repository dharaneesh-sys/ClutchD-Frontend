import { useState, useEffect } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Search, Star, Wrench, MapPin, Phone, ShieldCheck, ShieldOff, Eye, CheckCircle, XCircle } from "lucide-react";
import { useThemeStore } from "@/store/themeStore";
import { useToast } from "@/components/ui/ToastProvider";
import { fetchMechanics, verifyMechanic } from "@/services/adminService";

export function MechanicsManager() {
  const [searchTerm, setSearchTerm] = useState("");
  const [mechanics, setMechanics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  const [profileModal, setProfileModal] = useState(null);
  const { theme } = useThemeStore();
  const { success: showSuccess, error: showError } = useToast();
  const isLight = theme === "light";

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchMechanics();
      setMechanics(data);
    } catch (err) {
      setError(err?.response?.data?.detail || "Failed to load mechanics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleVerify = async (mechanic) => {
    setActionLoading(mechanic.id);
    try {
      const newVerified = !mechanic.verified;
      await verifyMechanic(mechanic.id, newVerified);
      setMechanics(prev => prev.map(m =>
        m.id === mechanic.id ? { ...m, verified: newVerified } : m
      ));
      showSuccess(`${mechanic.fullName} ${newVerified ? "verified" : "unverified"}.`);
    } catch (err) {
      showError(err?.response?.data?.detail || "Failed to update");
    } finally {
      setActionLoading(null);
    }
  };

  const filtered = mechanics.filter(m =>
    m.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.phone?.includes(searchTerm) ||
    m.expertise?.some(e => e.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <>
      <GlassCard variant="outlined" className="p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6">
          <div className="relative w-full sm:w-72">
            <Search size={16} className={`absolute left-3 top-1/2 -translate-y-1/2 ${"text-text-muted"}`} />
            <Input placeholder="Search by name, phone, or skill..." className="pl-9" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
          <Badge variant="info">{mechanics.length} Total</Badge>
        </div>

        {loading ? (
          <div className="py-12 flex justify-center">
            <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin border-primary" />
          </div>
        ) : error ? (
          <div className="py-12 text-center text-red-500">
            <p>{error}</p>
            <button onClick={loadData} className="mt-3 text-sm underline">Retry</button>
          </div>
        ) : (
          <div className="overflow-x-auto custom-scrollbar">
            <table className={`w-full text-left text-sm ${"text-text-primary"}`}>
              <thead className={`text-xs uppercase border-b ${"text-text-dim border-border-subtle"}`}>
                <tr>
                  <th className="px-4 pb-3 font-medium">Name</th>
                  <th className="px-4 pb-3 font-medium">Phone</th>
                  <th className="px-4 pb-3 font-medium">Skills</th>
                  <th className="px-4 pb-3 font-medium">Rating</th>
                  <th className="px-4 pb-3 font-medium">Jobs Done</th>
                  <th className="px-4 pb-3 font-medium">Verified</th>
                  <th className="px-4 pb-3 font-medium">Available</th>
                  <th className="px-4 pb-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((m) => (
                  <tr key={m.id} className={`border-b transition-colors ${"border-border-subtle hover:bg-bg-card"}`}>
                    <td className={`px-4 py-4 font-medium ${"text-text-primary"}`}>{m.fullName}</td>
                    <td className={`px-4 py-4 ${"text-text-muted"}`}>{m.phone}</td>
                    <td className="px-4 py-4">
                      <div className="flex flex-wrap gap-1">
                        {(m.expertise || []).slice(0, 2).map((s, i) => (
                          <span key={i} className={`text-[10px] px-1.5 py-0.5 rounded ${"bg-surface-soft text-text-primary"}`}>{s}</span>
                        ))}
                        {(m.expertise || []).length > 2 && <span className="text-[10px] text-stone-400">+{m.expertise.length - 2}</span>}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className="flex items-center gap-1">
                        <Star size={12} className="text-amber-500" />
                        {m.rating}
                      </span>
                    </td>
                    <td className={`px-4 py-4 ${"text-text-primary"}`}>{m.jobsCompleted}</td>
                    <td className="px-4 py-4">
                      <Badge variant={m.verified ? "success" : "warning"}>{m.verified ? "Verified" : "Pending"}</Badge>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`flex items-center gap-1 ${m.available ? "text-icon-highlight" : "text-red-500"}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${m.available ? "bg-green-500" : "bg-red-500"}`} />
                        {m.available ? "Available" : "Busy"}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => setProfileModal(m)}
                          className={`p-1.5 rounded transition-colors ${"hover:bg-bg-card text-text-muted hover:text-text-primary"}`}
                          title="View Profile"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          onClick={() => handleVerify(m)}
                          disabled={actionLoading === m.id}
                          className={`p-1.5 rounded transition-colors ${
                            m.verified
                              ? "hover:bg-surface-soft text-red-500 hover:text-red-600"
                              : "hover:bg-surface-soft text-icon-highlight hover:text-icon-highlight"
                          }`}
                          title={m.verified ? "Unverify" : "Verify"}
                        >
                          {m.verified ? <XCircle size={16} /> : <CheckCircle size={16} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filtered.length === 0 && (
              <div className={`py-12 text-center ${"text-text-dim"}`}>
                No mechanics found matching &quot;{searchTerm}&quot;
              </div>
            )}
          </div>
        )}
      </GlassCard>

      <Modal isOpen={!!profileModal} onClose={() => setProfileModal(null)} title="Mechanic Profile" maxWidth="max-w-lg">
        {profileModal && (
          <div className="space-y-4">
            <div className={`p-4 rounded-xl border ${"bg-bg-card border-border-subtle"}`}>
              <p className={`text-xs uppercase mb-1 ${"text-text-dim"}`}>Name</p>
              <p className={`font-medium text-lg ${"text-text-primary"}`}>{profileModal.fullName}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className={`p-4 rounded-xl border ${"bg-bg-card border-border-subtle"}`}>
                <p className={`text-xs uppercase mb-1 ${"text-text-dim"}`}>Phone</p>
                <p className={`font-medium flex items-center gap-1 ${"text-text-primary"}`}><Phone size={14} /> {profileModal.phone}</p>
              </div>
              <div className={`p-4 rounded-xl border ${"bg-bg-card border-border-subtle"}`}>
                <p className={`text-xs uppercase mb-1 ${"text-text-dim"}`}>Experience</p>
                <p className={`font-medium ${"text-text-primary"}`}>{profileModal.experience || "—"}</p>
              </div>
            </div>
            <div className={`p-4 rounded-xl border ${"bg-bg-card border-border-subtle"}`}>
              <p className={`text-xs uppercase mb-1 ${"text-text-dim"}`}>Skills</p>
              <div className="flex flex-wrap gap-2 mt-1">
                {(profileModal.expertise || []).length > 0
                  ? profileModal.expertise.map((s, i) => (
                      <span key={i} className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-lg ${"bg-surface-soft text-text-primary border-border-subtle"}`}>
                        <Wrench size={12} /> {s}
                      </span>
                    ))
                  : <span className="text-sm text-stone-400">None specified</span>
                }
              </div>
            </div>
            <div className={`p-4 rounded-xl border ${"bg-bg-card border-border-subtle"}`}>
              <p className={`text-xs uppercase mb-1 ${"text-text-dim"}`}>Location</p>
              <p className={`font-medium flex items-center gap-1 ${"text-text-primary"}`}><MapPin size={14} /> {profileModal.location || `${profileModal.lat?.toFixed(4)}, ${profileModal.lon?.toFixed(4)}`}</p>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className={`p-4 rounded-xl border ${"bg-bg-card border-border-subtle"}`}>
                <p className={`text-xs uppercase mb-1 ${"text-text-dim"}`}>Rating</p>
                <p className={`font-medium flex items-center gap-1 ${"text-text-primary"}`}><Star size={14} className="text-amber-500" /> {profileModal.rating}</p>
              </div>
              <div className={`p-4 rounded-xl border ${"bg-bg-card border-border-subtle"}`}>
                <p className={`text-xs uppercase mb-1 ${"text-text-dim"}`}>Jobs Done</p>
                <p className={`font-medium ${"text-text-primary"}`}>{profileModal.jobsCompleted}</p>
              </div>
              <div className={`p-4 rounded-xl border ${"bg-bg-card border-border-subtle"}`}>
                <p className={`text-xs uppercase mb-1 ${"text-text-dim"}`}>Penalty</p>
                <p className={`font-medium ${profileModal.penalized ? "text-red-500" : "text-text-primary"}`}>
                  {profileModal.penalized ? `₹${(profileModal.penaltyAmount / 100).toLocaleString("en-IN")}` : "None"}
                </p>
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <Badge variant={profileModal.verified ? "success" : "warning"}>{profileModal.verified ? "Verified" : "KYC Pending"}</Badge>
              <Badge variant={profileModal.penalized ? "danger" : "default"}>{profileModal.penalized ? "Penalized" : "Clean"}</Badge>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
