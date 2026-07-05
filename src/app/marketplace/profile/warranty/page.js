"use client";

import { useState, useEffect, useCallback } from "react";
import {
  ShieldCheck,
  Plus,
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  Image as ImageIcon,
} from "lucide-react";
import { cn, formatDate } from "@/lib/utils";
import { useAuthStore } from "@/store/authStore";
import { useToastStore } from "@/store/toastStore";
import { WarrantyClaimsStore, CLAIM_STATUSES } from "@/lib/warrantyClaimsStore";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { FileUpload } from "@/components/ui/FileUpload";
import { EmptyState } from "@/components/ui/EmptyState";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { WarrantyTerms } from "@/components/dashboard/WarrantyTerms";

// ─── Claim Status Badge ────────────────────────────────────────────────────

function ClaimStatusBadge({ status }) {
  const config = CLAIM_STATUSES[status] || { label: status, color: "default" };
  return <Badge variant={config.color}>{config.label}</Badge>;
}

// ─── Claim Card ────────────────────────────────────────────────────────────

function ClaimCard({ claim, onViewDetails }) {
  return (
    <button
      onClick={() => onViewDetails(claim)}
      className="w-full glass-lux rounded-2xl p-4 space-y-3 text-left hover:bg-white/[0.02] transition-colors animate-fade-in-up"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <ShieldCheck size={14} className="shrink-0 text-text-muted" />
            <span className="text-sm font-semibold text-foreground truncate">
              {claim.serviceLabel}
            </span>
          </div>
          <p className="text-[11px] text-text-muted mt-1">
            {formatDate(claim.createdAt)}
          </p>
        </div>
        <ClaimStatusBadge status={claim.status} />
      </div>

      {claim.description && (
        <p className="text-xs text-text-dim line-clamp-2">{claim.description}</p>
      )}

      {claim.photos && claim.photos.length > 0 && (
        <div className="flex items-center gap-1.5 text-xs text-text-muted">
          <ImageIcon size={12} />
          {claim.photos.length} photo{claim.photos.length > 1 ? "s" : ""} attached
        </div>
      )}
    </button>
  );
}

// ─── Claim Detail Modal ────────────────────────────────────────────────────

function ClaimDetailModal({ claim, onClose }) {
  if (!claim) return null;

  return (
    <Modal isOpen={!!claim} onClose={onClose} title="Claim Details">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-text-muted">Service</span>
          <span className="text-sm font-medium text-foreground">
            {claim.serviceLabel}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-text-muted">Status</span>
          <ClaimStatusBadge status={claim.status} />
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-text-muted">Claim ID</span>
          <span className="text-sm font-mono text-text-primary">
            #{claim.id?.slice(-10)}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-text-muted">Submitted</span>
          <span className="text-sm text-foreground">
            {formatDate(claim.createdAt)}
          </span>
        </div>

        {claim.description && (
          <div className="pt-3 border-t border-border-subtle/50">
            <span className="text-sm text-text-muted block mb-1">Issue Description</span>
            <p className="text-sm text-text-secondary">{claim.description}</p>
          </div>
        )}

        {claim.photos && claim.photos.length > 0 && (
          <div className="pt-3 border-t border-border-subtle/50">
            <span className="text-sm text-text-muted block mb-2">
              Photos ({claim.photos.length})
            </span>
            <div className="grid grid-cols-3 gap-2">
              {claim.photos.map((photo, idx) => (
                <div
                  key={idx}
                  className="aspect-square rounded-lg overflow-hidden bg-surface-soft border border-border-subtle"
                >
                  <img
                    src={photo}
                    alt={`Claim photo ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {claim.adminNotes && (
          <div className="pt-3 border-t border-border-subtle/50">
            <span className="text-sm text-text-muted block mb-1">Admin Notes</span>
            <p className="text-sm p-3 rounded-xl bg-surface-soft text-text-secondary">
              {claim.adminNotes}
            </p>
          </div>
        )}
      </div>
    </Modal>
  );
}

// ─── New Claim Form (Modal) ────────────────────────────────────────────────

function NewClaimForm({ isOpen, onClose, onSubmitted, completedServices }) {
  const { user } = useAuthStore();
  const toast = useToastStore();
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  const [selectedServiceId, setSelectedServiceId] = useState("");
  const [description, setDescription] = useState("");
  const [photos, setPhotos] = useState(null);

  // Build service options from completed services
  const serviceOptions = (completedServices || []).map((svc) => ({
    value: svc.id,
    label: `${svc.serviceLabel || svc.serviceType || svc.issueTag || "Service"} — ${svc.createdAt ? formatDate(svc.createdAt) : ""}`,
  }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!selectedServiceId) errs.service = "Please select a service";
    if (!description.trim()) errs.description = "Please describe the issue";
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setSubmitting(true);
    try {
      const selected = completedServices.find((s) => s.id === selectedServiceId);

      // Convert uploaded photos to base64 data URLs for demo/localStorage persistence
      let photoUrls = [];
      if (photos) {
        const files = Array.isArray(photos) ? photos : [photos];
        for (const file of files) {
          if (file && typeof file === "object" && file.size > 0) {
            try {
              const dataUrl = await fileToDataUrl(file);
              photoUrls.push(dataUrl);
            } catch {
              // Skip failed conversion
            }
          }
        }
      }

      WarrantyClaimsStore.submit({
        userId: user?.id || "demo-cust-1",
        userName: user?.name || "Customer",
        serviceId: selectedServiceId,
        serviceType: selected?.serviceType || selected?.issueTag || "general",
        issueTag: selected?.issueTag || "other",
        description: description.trim(),
        photos: photoUrls,
      });

      toast.success("Warranty claim submitted successfully");
      onSubmitted();
      onClose();
      // Reset form
      setSelectedServiceId("");
      setDescription("");
      setPhotos(null);
      setErrors({});
    } catch {
      toast.error("Failed to submit claim");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Submit Warranty Claim" maxWidth="max-w-lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Select
          label="Select Service"
          placeholder="Choose a completed service"
          options={serviceOptions}
          value={selectedServiceId}
          onChange={(e) => setSelectedServiceId(e.target.value)}
          error={errors.service}
        />

        <div className="w-full">
          <label className="mb-2 block text-sm font-medium text-text-muted">
            Describe the Issue
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Explain what went wrong — e.g., the same problem returned after a few days..."
            rows={4}
            className={cn(
              "w-full rounded-2xl border px-4 py-3 text-sm transition-all resize-none",
              "border-border-subtle bg-surface text-text-primary placeholder:text-text-dim",
              "shadow-[inset_0_1px_0_rgba(var(--color-white-rgb),0.04)]",
              "focus:border-primary focus:bg-surface focus:outline-none focus:ring-1 focus:ring-primary/30",
              errors.description && "border-red-500/50 focus:border-red-500 focus:ring-red-500/20"
            )}
            aria-invalid={!!errors.description}
          />
          {errors.description && (
            <p className="mt-1.5 text-xs text-red-400">{errors.description}</p>
          )}
        </div>

        <FileUpload
          label="Upload Photos (optional)"
          accept="image/*"
          multiple={false}
          value={photos}
          onChange={setPhotos}
          maxSizeMB={5}
        />

        <div className="pt-2">
          <WarrantyTerms variant="inline" />
        </div>

        <div className="flex gap-3 pt-2">
          <Button
            type="button"
            variant="ghost"
            className="flex-1"
            onClick={onClose}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            className="flex-1"
            isLoading={submitting}
          >
            Submit Claim
          </Button>
        </div>
      </form>
    </Modal>
  );
}

// Convert a File to a data URL for localStorage persistence
function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// ─── Main Page ─────────────────────────────────────────────────────────────

const CLAIM_TABS = [
  { key: "all", label: "All Claims", icon: FileText },
  { key: "submitted", label: "Submitted", icon: Clock },
  { key: "under_review", label: "Under Review", icon: Loader2 },
  { key: "approved", label: "Approved", icon: CheckCircle2 },
  { key: "rejected", label: "Rejected", icon: XCircle },
];

export default function WarrantyClaimsPage() {
  const { user } = useAuthStore();
  const toast = useToastStore();
  const [activeTab, setActiveTab] = useState("all");
  const [claims, setClaims] = useState([]);
  const [completedServices, setCompletedServices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedClaim, setSelectedClaim] = useState(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const userId = user?.id || "demo-cust-1";
      const userClaims = WarrantyClaimsStore.getUserClaims(userId);
      setClaims(userClaims);

      // Load completed services from localStorage
      // Do NOT fall back to demo mock data — that would leak fake
      // completed services into real user accounts.
      let services = [];
      try {
        const raw = localStorage.getItem("clutchd_services");
        if (raw) {
          services = JSON.parse(raw).filter((s) => s.status === "completed");
        }
      } catch {
        // ignore
      }

      setCompletedServices(services);
    } catch {
      setClaims([]);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filtered = activeTab === "all"
    ? claims
    : claims.filter((c) => c.status === activeTab);

  const sorted = [...filtered].sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  );

  return (
    <div className="p-4 page-enter">
      {/* Header */}
      <div className="space-y-1 mb-6">
        <h1 className="type-headline-3 text-foreground">Warranty Claims</h1>
        <p className="type-body-2 text-text-muted">
          Submit and track warranty claims for your completed services
        </p>
      </div>

      {/* Warranty Terms summary */}
      <div className="mb-6">
        <WarrantyTerms variant="card" />
      </div>

      {/* New Claim Button */}
      <button
        onClick={() => setShowForm(true)}
        className={cn(
          "w-full mb-6 inline-flex items-center justify-center gap-2",
          "rounded-xl px-4 py-3 text-sm font-medium transition-all",
          "bg-primary/10 text-primary-light border border-primary/30",
          "hover:bg-primary/20 hover-lift"
        )}
      >
        <Plus size={16} />
        Submit New Warranty Claim
      </button>

      {/* Tabs */}
      <div className="flex gap-1.5 mb-6 overflow-x-auto scrollbar-none">
        {CLAIM_TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          const count = tab.key === "all"
            ? claims.length
            : claims.filter((c) => c.status === tab.key).length;

          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                "flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap border",
                isActive
                  ? "bg-primary/10 text-foreground border-primary/30 shadow-sm"
                  : "bg-white/5 text-text-muted border-transparent hover:bg-white/10 hover:text-foreground"
              )}
            >
              <Icon size={14} />
              {tab.label}
              {count > 0 && (
                <span
                  className={cn(
                    "ml-1 text-[10px] px-1.5 py-0.5 rounded-full",
                    isActive
                      ? "bg-primary/20 text-primary-light"
                      : "bg-white/10 text-text-dim"
                  )}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Claims List */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="glass-lux rounded-2xl p-4 animate-pulse space-y-3"
            >
              <div className="h-4 bg-white/5 rounded w-1/3" />
              <div className="h-3 bg-white/5 rounded w-2/3" />
              <div className="h-3 bg-white/5 rounded w-1/4" />
            </div>
          ))}
        </div>
      ) : sorted.length > 0 ? (
        <div className="space-y-3">
          {sorted.map((claim, index) => (
            <div key={claim.id} style={{ animationDelay: `${index * 60}ms` }}>
              <ClaimCard
                claim={claim}
                onViewDetails={setSelectedClaim}
              />
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={ShieldCheck}
          title="No warranty claims"
          description={
            activeTab === "all"
              ? "You haven't submitted any warranty claims yet. If a recent service has an issue, submit a claim above."
              : `No ${activeTab.toLowerCase()} claims to show.`
          }
          action={
            activeTab === "all" ? (
              <Button
                variant="primary"
                size="sm"
                onClick={() => setShowForm(true)}
              >
                <Plus size={14} className="mr-1.5" />
                Submit Claim
              </Button>
            ) : undefined
          }
        />
      )}

      {/* New Claim Form Modal */}
      <NewClaimForm
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        onSubmitted={fetchData}
        completedServices={completedServices}
      />

      {/* Claim Detail Modal */}
      {selectedClaim && (
        <ClaimDetailModal
          claim={selectedClaim}
          onClose={() => setSelectedClaim(null)}
        />
      )}
    </div>
  );
}
