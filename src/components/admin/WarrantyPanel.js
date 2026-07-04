"use client";

import { useState, useEffect, useCallback } from "react";
import {
  ShieldCheck,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  Eye,
  Image as ImageIcon,
  FileText,
} from "lucide-react";
import { cn, formatDate } from "@/lib/utils";
import { WarrantyClaimsStore, CLAIM_STATUSES } from "@/lib/warrantyClaimsStore";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { EmptyState } from "@/components/ui/EmptyState";

// ─── Status Badge ──────────────────────────────────────────────────────────

function StatusBadge({ status }) {
  const config = CLAIM_STATUSES[status] || { label: status, color: "default" };
  return <Badge variant={config.color}>{config.label}</Badge>;
}

// ─── Claim Row (table row for admin view) ──────────────────────────────────

function ClaimRow({ claim, onReview }) {
  return (
    <tr className="border-b border-border-subtle/50 hover:bg-white/[0.02] transition-colors">
      <td className="py-3 px-3">
        <span className="text-xs font-mono text-text-dim">
          #{claim.id?.slice(-10)}
        </span>
      </td>
      <td className="py-3 px-3">
        <span className="text-sm font-medium text-foreground">
          {claim.userName}
        </span>
      </td>
      <td className="py-3 px-3">
        <span className="text-sm text-text-primary">
          {claim.serviceLabel}
        </span>
      </td>
      <td className="py-3 px-3">
        <span className="text-xs text-text-muted">
          {formatDate(claim.createdAt)}
        </span>
      </td>
      <td className="py-3 px-3">
        <StatusBadge status={claim.status} />
      </td>
      <td className="py-3 px-3 text-right">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onReview(claim)}
        >
          <Eye size={14} className="mr-1" />
          Review
        </Button>
      </td>
    </tr>
  );
}

// ─── Review Claim Modal ────────────────────────────────────────────────────

function ReviewClaimModal({ claim, isOpen, onClose, onUpdated }) {
  const [adminNotes, setAdminNotes] = useState(claim?.adminNotes || "");
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (claim) {
      setAdminNotes(claim.adminNotes || "");
    }
  }, [claim]);

  if (!claim) return null;

  const handleUpdateStatus = async (newStatus) => {
    setUpdating(true);
    try {
      WarrantyClaimsStore.updateStatus(claim.id, newStatus, adminNotes);
      onUpdated();
      onClose();
    } catch {
      // silent
    } finally {
      setUpdating(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Review Warranty Claim" maxWidth="max-w-lg">
      <div className="space-y-5">
        {/* Claim Info */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-[11px] uppercase tracking-wider text-text-muted mb-1">Customer</p>
            <p className="text-sm font-medium text-foreground">{claim.userName}</p>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-wider text-text-muted mb-1">Status</p>
            <StatusBadge status={claim.status} />
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-wider text-text-muted mb-1">Service</p>
            <p className="text-sm font-medium text-foreground">{claim.serviceLabel}</p>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-wider text-text-muted mb-1">Submitted</p>
            <p className="text-sm text-text-primary">{formatDate(claim.createdAt)}</p>
          </div>
        </div>

        {/* Description */}
        <div>
          <p className="text-[11px] uppercase tracking-wider text-text-muted mb-2">Issue Description</p>
          <div className="rounded-xl bg-surface-soft p-3 border border-border-subtle">
            <p className="text-sm text-text-secondary">{claim.description}</p>
          </div>
        </div>

        {/* Photos */}
        {claim.photos && claim.photos.length > 0 && (
          <div>
            <p className="text-[11px] uppercase tracking-wider text-text-muted mb-2">
              Photos ({claim.photos.length})
            </p>
            <div className="grid grid-cols-3 gap-2">
              {claim.photos.map((photo, idx) => (
                <a
                  key={idx}
                  href={photo}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="aspect-square rounded-lg overflow-hidden bg-surface-soft border border-border-subtle block"
                >
                  <img
                    src={photo}
                    alt={`Claim photo ${idx + 1}`}
                    className="w-full h-full object-cover hover:opacity-80 transition-opacity"
                  />
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Admin Notes */}
        <div>
          <label className="text-[11px] uppercase tracking-wider text-text-muted mb-2 block">
            Admin Notes
          </label>
          <textarea
            value={adminNotes}
            onChange={(e) => setAdminNotes(e.target.value)}
            placeholder="Add internal notes about this claim..."
            rows={3}
            className={cn(
              "w-full rounded-2xl border px-4 py-3 text-sm transition-all resize-none",
              "border-border-subtle bg-surface text-text-primary placeholder:text-text-dim",
              "shadow-[inset_0_1px_0_rgba(var(--color-white-rgb),0.04)]",
              "focus:border-primary focus:bg-surface focus:outline-none focus:ring-1 focus:ring-primary/30"
            )}
          />
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2 pt-2">
          {claim.status !== "approved" && (
            <Button
              variant="primary"
              className="w-full"
              isLoading={updating}
              onClick={() => handleUpdateStatus("approved")}
            >
              <CheckCircle2 size={16} className="mr-1.5" />
              Approve Claim
            </Button>
          )}
          {claim.status !== "rejected" && (
            <Button
              variant="danger"
              className="w-full"
              isLoading={updating}
              onClick={() => handleUpdateStatus("rejected")}
            >
              <XCircle size={16} className="mr-1.5" />
              Reject Claim
            </Button>
          )}
          {claim.status === "submitted" && (
            <Button
              variant="secondary"
              className="w-full"
              isLoading={updating}
              onClick={() => handleUpdateStatus("under_review")}
            >
              <Loader2 size={16} className="mr-1.5" />
              Mark Under Review
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
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

// ─── Main Panel ────────────────────────────────────────────────────────────

export function WarrantyPanel() {
  const [claims, setClaims] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [reviewClaim, setReviewClaim] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchClaims = useCallback(() => {
    setIsLoading(true);
    try {
      const all = WarrantyClaimsStore.getAll();
      setClaims(all);
    } catch {
      setClaims([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchClaims();
  }, [fetchClaims]);

  useEffect(() => {
    let result = [...claims];

    if (statusFilter !== "all") {
      result = result.filter((c) => c.status === statusFilter);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (c) =>
          c.userName?.toLowerCase().includes(q) ||
          c.serviceLabel?.toLowerCase().includes(q) ||
          c.description?.toLowerCase().includes(q) ||
          c.id?.toLowerCase().includes(q)
      );
    }

    setFiltered(result);
  }, [claims, search, statusFilter]);

  // Stats
  const stats = {
    total: claims.length,
    submitted: claims.filter((c) => c.status === "submitted").length,
    underReview: claims.filter((c) => c.status === "under_review").length,
    approved: claims.filter((c) => c.status === "approved").length,
    rejected: claims.filter((c) => c.status === "rejected").length,
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <StatsCard icon={FileText} label="Total" value={stats.total} color="default" />
        <StatsCard icon={Clock} label="Submitted" value={stats.submitted} color="warning" />
        <StatsCard icon={Loader2} label="Under Review" value={stats.underReview} color="primary" />
        <StatsCard icon={CheckCircle2} label="Approved" value={stats.approved} color="success" />
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
            placeholder="Search claims..."
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
          <option value="submitted">Submitted</option>
          <option value="under_review">Under Review</option>
          <option value="approved">Approved</option>
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
                  Claim ID
                </th>
                <th className="text-left py-3 px-3 text-[11px] uppercase tracking-wider text-text-muted font-semibold">
                  Customer
                </th>
                <th className="text-left py-3 px-3 text-[11px] uppercase tracking-wider text-text-muted font-semibold">
                  Service
                </th>
                <th className="text-left py-3 px-3 text-[11px] uppercase tracking-wider text-text-muted font-semibold">
                  Date
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
              {filtered.map((claim) => (
                <ClaimRow
                  key={claim.id}
                  claim={claim}
                  onReview={setReviewClaim}
                />
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState
          icon={ShieldCheck}
          title="No warranty claims"
          description={
            search || statusFilter !== "all"
              ? "No claims match your current filters."
              : "No warranty claims have been submitted yet."
          }
        />
      )}

      {/* Review Modal */}
      <ReviewClaimModal
        claim={reviewClaim}
        isOpen={!!reviewClaim}
        onClose={() => setReviewClaim(null)}
        onUpdated={fetchClaims}
      />
    </div>
  );
}
