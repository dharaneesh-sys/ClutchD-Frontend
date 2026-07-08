"use client";

import { useState, useEffect, useCallback } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/ToastProvider";
import { CertificationStore, CERT_STATUSES } from "@/lib/certificationStore";
import { cn } from "@/lib/utils";
import {
  Search,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Clock,
  FileText,
  Award,
  Loader2,
} from "lucide-react";
import { formatDate } from "@/lib/utils";

// ─── Status Badge ──────────────────────────────────────────────────────────

function StatusBadge({ status }) {
  const s = CERT_STATUSES[status] || CERT_STATUSES.pending;
  return <Badge variant={s.color}>{s.label}</Badge>;
}

// ─── Stats Card ────────────────────────────────────────────────────────────

function StatsCard({ icon: Icon, label, value, color }) {
  return (
    <div className="rounded-xl border border-border-subtle bg-bg-card p-4">
      <div className="flex items-center gap-3">
        <div
          className={cn(
            "w-10 h-10 rounded-lg flex items-center justify-center",
            color === "primary" && "bg-primary/10 text-primary-light",
            color === "success" && "bg-green-500/10 text-green-400",
            color === "warning" && "bg-amber-500/10 text-amber-400",
            color === "danger" && "bg-red-500/10 text-red-400",
            color === "default" && "bg-white/10 text-text-dim"
          )}
        >
          <Icon size={18} />
        </div>
        <div>
          <p className="text-2xl font-bold text-foreground">{value}</p>
          <p className="text-xs text-text-muted">{label}</p>
        </div>
      </div>
    </div>
  );
}

// ─── Confirm Modal ─────────────────────────────────────────────────────────

function ConfirmModal({ certification, action, isOpen, onClose, onConfirm }) {
  const [adminNotes, setAdminNotes] = useState("");

  useEffect(() => {
    if (certification) {
      /* eslint-disable-next-line react-hooks/set-state-in-effect */
      setAdminNotes(certification.adminNotes || "");
    }
  }, [certification]);

  if (!certification) return null;

  const isApprove = action === "approve";

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isApprove ? "Verify Certification" : "Reject Certification"}
      maxWidth="max-w-md"
    >
      <div className="space-y-5">
        <div className="rounded-xl bg-surface-soft p-4 border border-border-subtle">
          <div className="flex items-center gap-3 mb-2">
            <Award size={18} className="text-primary-light" />
            <span className="font-medium text-text-primary">{certification.badgeName}</span>
          </div>
          <p className="text-sm text-text-muted">
            Mechanic: <span className="font-medium text-text-primary">{certification.mechanicName}</span>
          </p>
          <p className="text-sm text-text-muted">
            Issuer: <span className="text-text-primary">{certification.issuer}</span>
          </p>
          <p className="text-sm text-text-muted">
            Document type: <span className="text-text-primary">{certification.documentType}</span>
          </p>
          <p className="text-sm text-text-muted">
            Submitted: <span className="text-text-primary">{formatDate(certification.submittedAt)}</span>
          </p>
        </div>

        <div>
          <label className="text-[11px] uppercase tracking-wider text-text-muted mb-2 block">
            Admin Notes
          </label>
          <textarea
            value={adminNotes}
            onChange={(e) => setAdminNotes(e.target.value)}
            placeholder={isApprove ? "Add notes (optional)..." : "Provide reason for rejection..."}
            rows={3}
            className={cn(
              "w-full rounded-2xl border px-4 py-3 text-sm transition-all resize-none",
              "border-border-subtle bg-surface text-text-primary placeholder:text-text-dim",
              "shadow-[inset_0_1px_0_rgba(var(--color-white-rgb),0.04)]",
              "focus:border-primary focus:bg-surface focus:outline-none focus:ring-1 focus:ring-primary/30"
            )}
          />
        </div>

        <div className="flex flex-col gap-2 pt-2">
          {isApprove && (
            <Button
              variant="primary"
              className="w-full"
              onClick={() => onConfirm(certification.id, "verified", adminNotes)}
            >
              <CheckCircle2 size={16} className="mr-1.5" />
              Verify Certification
            </Button>
          )}
          {!isApprove && (
            <Button
              variant="danger"
              className="w-full"
              onClick={() => onConfirm(certification.id, "rejected", adminNotes)}
            >
              <XCircle size={16} className="mr-1.5" />
              Reject Certification
            </Button>
          )}
          <Button variant="ghost" className="w-full" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </div>
    </Modal>
  );
}

// ─── Main Panel ────────────────────────────────────────────────────────────

export function CertificationPanel() {
  const [certifications, setCertifications] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [actionCert, setActionCert] = useState(null);
  const [actionType, setActionType] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const { success: showSuccess, error: showError } = useToast();

  const fetchCertifications = useCallback(() => {
    setIsLoading(true);
    try {
      const all = CertificationStore.getAll();
      setCertifications(all);
    } catch {
      setCertifications([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCertifications();
  }, [fetchCertifications]);

  useEffect(() => {
    let result = [...certifications];

    if (statusFilter !== "all") {
      result = result.filter((c) => c.status === statusFilter);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (c) =>
          c.mechanicName?.toLowerCase().includes(q) ||
          c.badgeName?.toLowerCase().includes(q) ||
          c.issuer?.toLowerCase().includes(q) ||
          c.documentType?.toLowerCase().includes(q)
      );
    }

    setFiltered(result);
  }, [certifications, search, statusFilter]);

  // Stats
  const stats = {
    total: certifications.length,
    pending: certifications.filter((c) => c.status === "pending").length,
    verified: certifications.filter((c) => c.status === "verified").length,
    rejected: certifications.filter((c) => c.status === "rejected").length,
  };

  const handleAction = async (certId, newStatus, notes) => {
    setActionLoading(certId);
    try {
      const updated = CertificationStore.updateStatus(certId, newStatus, notes);
      if (updated) {
        setCertifications((prev) =>
          prev.map((c) => (c.id === certId ? updated : c))
        );
        showSuccess(
          `"${updated.badgeName}" for ${updated.mechanicName} ${newStatus === "verified" ? "verified" : "rejected"}.`
        );
      }
    } catch {
      showError("Failed to update certification status.");
    } finally {
      setActionLoading(null);
      setActionCert(null);
      setActionType(null);
    }
  };

  const openConfirm = (cert, type) => {
    setActionCert(cert);
    setActionType(type);
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatsCard icon={Award} label="Total" value={stats.total} color="default" />
        <StatsCard icon={Clock} label="Pending" value={stats.pending} color="warning" />
        <StatsCard icon={CheckCircle2} label="Verified" value={stats.verified} color="success" />
        <StatsCard icon={XCircle} label="Rejected" value={stats.rejected} color="danger" />
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dim"
          />
          <input
            type="text"
            placeholder="Search by mechanic, badge, or issuer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={cn(
              "w-full rounded-xl border pl-9 pr-4 py-2.5 text-sm transition-all",
              "border-border-subtle bg-surface text-text-primary placeholder:text-text-dim",
              "focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30"
            )}
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className={cn(
            "rounded-xl border px-4 py-2.5 text-sm transition-all",
            "border-border-subtle bg-surface text-text-primary",
            "focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30"
          )}
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="verified">Verified</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 bg-white/5 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : filtered.length > 0 ? (
        <div className="rounded-xl border border-border-subtle overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border-subtle/50 bg-surface-soft">
                <th className="text-left py-3 px-3 text-[11px] uppercase tracking-wider text-text-muted font-semibold">
                  Mechanic
                </th>
                <th className="text-left py-3 px-3 text-[11px] uppercase tracking-wider text-text-muted font-semibold">
                  Badge / Certification
                </th>
                <th className="text-left py-3 px-3 text-[11px] uppercase tracking-wider text-text-muted font-semibold">
                  Issuer
                </th>
                <th className="text-left py-3 px-3 text-[11px] uppercase tracking-wider text-text-muted font-semibold">
                  Type
                </th>
                <th className="text-left py-3 px-3 text-[11px] uppercase tracking-wider text-text-muted font-semibold">
                  Submitted
                </th>
                <th className="text-left py-3 px-3 text-[11px] uppercase tracking-wider text-text-muted font-semibold">
                  Status
                </th>
                <th className="text-right py-3 px-3 text-[11px] uppercase tracking-wider text-text-muted font-semibold">
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((cert) => (
                <tr
                  key={cert.id}
                  className="border-b border-border-subtle/30 transition-colors hover:bg-bg-card"
                >
                  <td className="py-3 px-3">
                    <span className="text-sm font-medium text-text-primary">
                      {cert.mechanicName}
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-2">
                      <Award size={14} className="text-primary-light shrink-0" />
                      <span className="text-sm text-text-primary">{cert.badgeName}</span>
                    </div>
                  </td>
                  <td className="py-3 px-3">
                    <span className="text-sm text-text-muted">{cert.issuer}</span>
                  </td>
                  <td className="py-3 px-3">
                    <span className="text-xs text-text-dim">{cert.documentType}</span>
                  </td>
                  <td className="py-3 px-3">
                    <span className="text-sm text-text-muted">
                      {formatDate(cert.submittedAt)}
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    <StatusBadge status={cert.status} />
                  </td>
                  <td className="py-3 px-3 text-right">
                    {cert.status === "pending" ? (
                      <div className="flex gap-1.5 justify-end">
                        <button
                          onClick={() => openConfirm(cert, "reject")}
                          disabled={actionLoading === cert.id}
                          className="p-1.5 rounded-lg transition-colors hover:bg-red-500/10 text-red-400 hover:text-red-300"
                          title="Reject"
                        >
                          {actionLoading === cert.id ? (
                            <Loader2 size={16} className="animate-spin" />
                          ) : (
                            <XCircle size={16} />
                          )}
                        </button>
                        <button
                          onClick={() => openConfirm(cert, "approve")}
                          disabled={actionLoading === cert.id}
                          className="p-1.5 rounded-lg transition-colors hover:bg-green-500/10 text-green-400 hover:text-green-300"
                          title="Verify"
                        >
                          <CheckCircle2 size={16} />
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs text-text-dim">
                        {cert.reviewedAt ? formatDate(cert.reviewedAt) : "—"}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <ShieldCheck size={48} className="text-text-dim mb-4 opacity-20" />
          <p className="text-text-muted font-medium">No certifications found</p>
          <p className="text-sm text-text-dim mt-1">
            {search || statusFilter !== "all"
              ? "No certifications match your current filters."
              : "No certification documents have been submitted yet."}
          </p>
        </div>
      )}

      {/* Confirm Modal */}
      <ConfirmModal
        certification={actionCert}
        action={actionType}
        isOpen={!!actionCert && !!actionType}
        onClose={() => {
          setActionCert(null);
          setActionType(null);
        }}
        onConfirm={handleAction}
      />
    </div>
  );
}
