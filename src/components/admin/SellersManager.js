"use client";

import { useState, useEffect } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Search, Star, Phone, ShieldCheck, ShieldOff, Eye, Package } from "lucide-react";
import { useToast } from "@/components/ui/ToastProvider";
import { fetchSellers, verifySeller } from "@/services/adminService";

export function SellersManager() {
  const [searchTerm, setSearchTerm] = useState("");
  const [sellers, setSellers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  const [profileModal, setProfileModal] = useState(null);
  const { success: showSuccess, error: showError } = useToast();

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchSellers();
      setSellers(data);
    } catch (err) {
      setError(err?.response?.data?.detail || "Failed to load sellers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleVerify = async (seller) => {
    setActionLoading(seller.id);
    try {
      const newVerified = !seller.verified;
      await verifySeller(seller.id, newVerified);
      setSellers(prev => prev.map(s =>
        s.id === seller.id ? { ...s, verified: newVerified } : s
      ));
      showSuccess(`${seller.storeName} ${newVerified ? "verified" : "unverified"}.`);
    } catch (err) {
      showError(err?.response?.data?.detail || "Failed to update");
    } finally {
      setActionLoading(null);
    }
  };

  const filtered = sellers.filter(s =>
    s.storeName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.ownerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.phone?.includes(searchTerm) ||
    s.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <GlassCard variant="outlined" className="p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6">
          <div className="relative w-full sm:w-72">
            <Search size={16} className={`absolute left-3 top-1/2 -translate-y-1/2 ${"text-text-muted"}`} />
            <Input placeholder="Search by store, owner, or phone..." className="pl-9" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
          <Badge variant="info">{sellers.length} Total</Badge>
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
                  <th className="px-4 pb-3 font-medium">Store</th>
                  <th className="px-4 pb-3 font-medium">Owner</th>
                  <th className="px-4 pb-3 font-medium">Phone</th>
                  <th className="px-4 pb-3 font-medium">Rating</th>
                  <th className="px-4 pb-3 font-medium">Listings</th>
                  <th className="px-4 pb-3 font-medium">Verified</th>
                  <th className="px-4 pb-3 font-medium">Status</th>
                  <th className="px-4 pb-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s) => (
                  <tr key={s.id} className={`border-b transition-colors ${"border-border-subtle hover:bg-bg-card"}`}>
                    <td className={`px-4 py-4 font-medium ${"text-text-primary"}`}>{s.storeName}</td>
                    <td className={`px-4 py-4 ${"text-text-muted"}`}>{s.ownerName || "—"}</td>
                    <td className={`px-4 py-4 ${"text-text-muted"}`}>{s.phone || "—"}</td>
                    <td className="px-4 py-4">
                      <span className="flex items-center gap-1">
                        <Star size={12} className="text-icon-highlight" />
                        {Number(s.rating || 0).toFixed(1)}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span className="flex items-center gap-1">
                        <Package size={12} className="text-text-muted" />
                        {s.listings ?? 0}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <Badge variant={s.verified ? "success" : "warning"}>{s.verified ? "Verified" : "Pending"}</Badge>
                    </td>
                    <td className="px-4 py-4">
                      <Badge variant={s.isActive === false ? "danger" : "success"}>{s.isActive === false ? "Suspended" : "Active"}</Badge>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={() => setProfileModal(s)}
                          aria-label="View seller"
                          className={`p-1.5 rounded transition-colors ${"hover:bg-bg-card text-text-muted hover:text-text-primary"}`}
                        >
                          <Eye size={15} />
                        </button>
                        <button
                          onClick={() => handleVerify(s)}
                          disabled={actionLoading === s.id}
                          aria-label={s.verified ? "Unverify seller" : "Verify seller"}
                          className={`p-1.5 rounded transition-colors ${s.verified ? "text-red-500 hover:bg-surface-soft" : "text-icon-highlight hover:bg-surface-soft"}`}
                        >
                          {s.verified ? <ShieldOff size={15} /> : <ShieldCheck size={15} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filtered.length === 0 && (
              <div className={`py-12 text-center ${"text-text-dim"}`}>
                No sellers found matching &quot;{searchTerm}&quot;
              </div>
            )}
          </div>
        )}
      </GlassCard>

      <Modal isOpen={!!profileModal} onClose={() => setProfileModal(null)} title="Seller Profile">
        {profileModal && (
          <div className="space-y-4">
            {[
              ["Store", profileModal.storeName],
              ["Owner", profileModal.ownerName || "—"],
              ["Email", profileModal.email || "—"],
              ["Phone", profileModal.phone || "—"],
              ["Listings", String(profileModal.listings ?? 0)],
              ["Joined", profileModal.createdAt ? new Date(profileModal.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—"],
            ].map(([label, value]) => (
              <div key={label} className={`p-4 rounded-xl border ${"bg-bg-card border-border-subtle"}`}>
                <p className={`text-xs uppercase mb-1 ${"text-text-dim"}`}>{label}</p>
                <p className={`font-medium break-all ${"text-text-primary"}`}>{value}</p>
              </div>
            ))}
            <div className={`p-4 rounded-xl border ${"bg-bg-card border-border-subtle"}`}>
              <p className={`text-xs uppercase mb-1 ${"text-text-dim"}`}>Status</p>
              <div className="flex gap-2">
                <Badge variant={profileModal.verified ? "success" : "warning"}>{profileModal.verified ? "Verified" : "Pending"}</Badge>
                <Badge variant={profileModal.isActive === false ? "danger" : "success"}>{profileModal.isActive === false ? "Suspended" : "Active"}</Badge>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
