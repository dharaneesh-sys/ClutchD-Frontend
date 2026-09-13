"use client";

import { useState, useEffect, useCallback } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  Eye,
  FileText,
  IdCard,
  Loader2,
  Phone,
  Mail,
  XCircle,
} from "lucide-react";
import { useToast } from "@/components/ui/ToastProvider";
import { fetchPendingKyc, reviewKyc } from "@/services/adminService";
import { API_BASE_URL } from "@/lib/constants";

/** Absolute URL for a backend-served document (/static/uploads/...). */
function docUrl(url) {
  if (!url) return null;
  if (/^https?:\/\//i.test(url)) return url;
  return `${API_BASE_URL.replace(/\/api\/?$/, "")}${url.startsWith("/") ? "" : "/"}${url}`;
}

const STATUS_META = {
  pending: { label: "Pending", variant: "default", Icon: Clock },
  submitted: { label: "Under Review", variant: "warning", Icon: FileText },
  verified: { label: "Verified", variant: "success", Icon: CheckCircle },
  rejected: { label: "Rejected", variant: "danger", Icon: XCircle },
};

const STATUS_FILTERS = [
  { key: "", label: "Action Queue" },
  { key: "submitted", label: "Under Review" },
  { key: "pending", label: "Pending" },
  { key: "verified", label: "Verified" },
  { key: "rejected", label: "Rejected" },
];

function DocThumb({ doc, onOpen }) {
  return (
    <button
      type="button"
      onClick={() => onOpen(doc)}
      className="group relative block w-full aspect-[4/3] rounded-xl overflow-hidden border border-white/10 bg-white/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
      aria-label={`View ${doc.label}`}
    >
      {doc.url ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={docUrl(doc.url)}
            alt={doc.label}
            loading="lazy"
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
          />
          <span className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
          <span className="absolute bottom-1.5 left-2 right-2 flex items-center gap-1 text-[11px] font-medium text-white/90">
            <Eye size={12} className="shrink-0" /> View
          </span>
        </>
      ) : (
        <span className="absolute inset-0 flex flex-col items-center justify-center gap-1 text-text-dim">
          {doc.kind === "aadhaar" ? <IdCard size={22} /> : <FileText size={22} />}
          <span className="text-[11px]">Not uploaded</span>
        </span>
      )}
    </button>
  );
}

function DocLightbox({ doc, onClose }) {
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (!doc) return null;
  return (
    <div
      className="fixed inset-0 z-[70] bg-black/90 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label={doc.label}
      onClick={onClose}
    >
      <div className="max-w-3xl w-full" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-3">
          <p className="text-white font-medium">{doc.label}</p>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-white/80 hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
            aria-label="Close"
          >
            <XCircle size={22} />
          </button>
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={docUrl(doc.url)}
          alt={doc.label}
          className="w-full max-h-[70dvh] object-contain rounded-xl bg-black"
        />
        <a
          href={docUrl(doc.url)}
          target="_blank"
          rel="noreferrer"
          className="mt-3 inline-block text-sm text-primary-light underline"
        >
          Open full image in new tab
        </a>
      </div>
    </div>
  );
}

export function KYCApproval() {
  const [applications, setApplications] = useState([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  const [reviewModal, setReviewModal] = useState(null); // { app, action }
  const [note, setNote] = useState("");
  const [lightboxDoc, setLightboxDoc] = useState(null);
  const { success: showSuccess, error: showError } = useToast();

  const loadApplications = useCallback(
    async (filter = statusFilter) => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchPendingKyc(filter ? { status: filter } : {});
        setApplications(data);
      } catch (err) {
        setError(err?.response?.data?.detail || "Failed to load KYC applications");
      } finally {
        setLoading(false);
      }
    },
    [statusFilter]
  );

  useEffect(() => {
    loadApplications(statusFilter);
  }, [statusFilter, loadApplications]);

  const openReview = (app, action) => {
    setNote(app.kycNote || "");
    setReviewModal({ app, action });
  };

  const closeReview = () => setReviewModal(null);

  const submitReview = async () => {
    const { app, action } = reviewModal || {};
    if (!app) return;
    setActionLoading(app.id);
    try {
      await reviewKyc(
        app.profileType,
        app.id,
        action,
        note.trim() ? note.trim() : null
      );
      showSuccess(
        action === "approve"
          ? `${app.name} approved — KYC verified.`
          : `${app.name} rejected.`
      );
      setApplications((prev) => prev.filter((a) => a.id !== app.id));
      setReviewModal(null);
    } catch (err) {
      showError(err?.response?.data?.detail || "Failed to submit review");
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <>
      {/* Status filter chips */}
      <div className="flex flex-wrap gap-2 mb-4 sm:mb-6">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => setStatusFilter(f.key)}
            className={`px-3.5 py-1.5 rounded-full text-sm font-medium border transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 ${
              statusFilter === f.key
                ? "bg-primary text-white border-primary"
                : "bg-white/5 text-text-muted border-white/10 hover:bg-white/10"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="col-span-full py-12 text-center">
          <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin mx-auto border-primary" />
        </div>
      ) : error ? (
        <div className="col-span-full py-12 text-center text-red-500">
          <p>{error}</p>
          <button onClick={() => loadApplications()} className="mt-3 text-sm underline">Retry</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
          {applications.length === 0 ? (
            <div className="col-span-full py-12 text-center text-text-muted">
              <FileText size={48} className="mx-auto mb-4 opacity-20" />
              <p>No KYC applications in this view.</p>
            </div>
          ) : (
            applications.map((app) => {
              const meta = STATUS_META[app.kycStatus] || STATUS_META.pending;
              const aadhaar = app.documents?.find((d) => d.kind === "aadhaar");
              const license = app.documents?.find((d) => d.kind === "license");
              const docs = [
                aadhaar || { kind: "aadhaar", label: "Aadhaar Card", url: null },
                license || { kind: "license", label: "Driving License", url: null },
              ];
              return (
                <GlassCard key={`${app.profileType}-${app.id}`} variant="elevated" className="p-5 sm:p-6 flex flex-col h-full">
                  <div className="flex justify-between items-start mb-3">
                    <div className="min-w-0">
                      <h3 className="text-lg font-bold text-text-primary truncate">{app.name}</h3>
                      <p className="text-xs font-medium text-icon-highlight">{app.type}</p>
                    </div>
                    <Badge variant={meta.variant}>
                      <span className="inline-flex items-center gap-1">
                        <meta.Icon size={12} /> {meta.label}
                      </span>
                    </Badge>
                  </div>

                  {(app.email || app.phone) && (
                    <div className="space-y-1 mb-4 text-sm text-text-muted">
                      {app.email && (
                        <p className="flex items-center gap-2 min-w-0">
                          <Mail size={13} className="shrink-0 text-icon-highlight" />
                          <span className="truncate">{app.email}</span>
                        </p>
                      )}
                      {app.phone && (
                        <p className="flex items-center gap-2">
                          <Phone size={13} className="shrink-0 text-icon-highlight" />
                          {app.phone}
                        </p>
                      )}
                    </div>
                  )}

                  {app.profileType === "garage" && app.ownerName && (
                    <p className="text-xs text-text-dim mb-3">Owner: {app.ownerName}</p>
                  )}

                  {app.kycNote && (
                    <p className="text-xs text-amber-300/90 bg-amber-500/10 border border-amber-500/25 rounded-lg px-3 py-2 mb-4">
                      <span className="font-medium">Previous review note:</span> {app.kycNote}
                    </p>
                  )}

                  <div className="mb-4">
                    <p className="text-xs text-text-dim mb-2">
                      Submitted {app.submittedAt ? new Date(app.submittedAt).toLocaleString() : "—"}
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      {docs.map((doc) => (
                        <DocThumb key={doc.kind} doc={doc} onOpen={setLightboxDoc} />
                      ))}
                    </div>
                  </div>

                  <div className="mt-auto grid grid-cols-2 gap-3 pt-4 border-t border-border-subtle">
                    <Button
                      variant="outline"
                      className="!text-red-400 !border-red-500/40 hover:!bg-red-500/10 hover:!text-red-300"
                      onClick={() => openReview(app, "reject")}
                    >
                      <XCircle size={16} className="mr-2" /> Reject
                    </Button>
                    <Button onClick={() => openReview(app, "approve")}>
                      <CheckCircle size={16} className="mr-2" /> Approve
                    </Button>
                  </div>
                </GlassCard>
              );
            })
          )}
        </div>
      )}

      <Modal
        isOpen={!!reviewModal}
        onClose={closeReview}
        title={reviewModal?.action === "approve" ? "Approve KYC" : "Reject KYC"}
      >
        {reviewModal && (
          <div>
            <p className="mb-4 text-text-primary">
              {reviewModal.action === "approve"
                ? `Approve ${reviewModal.app.name}'s KYC? Their profile will be marked verified.`
                : `Reject ${reviewModal.app.name}'s KYC? They'll be asked to resubmit their documents.`}
            </p>

            {reviewModal.action === "reject" && (
              <div className="mb-4 flex items-start gap-2 text-xs text-amber-300/90 bg-amber-500/10 border border-amber-500/25 rounded-lg px-3 py-2">
                <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                <span>The provider will see your note and can resubmit documents from their profile.</span>
              </div>
            )}

            <label className="block text-sm font-medium text-text-primary mb-1.5">
              Note {reviewModal.action === "reject" && <span className="text-red-400">*</span>}
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              maxLength={1024}
              placeholder={
                reviewModal.action === "approve"
                  ? "Optional — e.g. documents checked over a call"
                  : "Required — e.g. 'Aadhaar photo is blurred, please retake'"
              }
              className="w-full rounded-xl bg-white/5 border border-white/10 px-3.5 py-2.5 text-sm text-text-primary placeholder:text-text-dim focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 resize-none"
            />

            <div className="flex gap-3 justify-end mt-6">
              <Button variant="ghost" onClick={closeReview} disabled={actionLoading}>
                Cancel
              </Button>
              <Button
                variant={reviewModal.action === "approve" ? "primary" : "danger"}
                onClick={submitReview}
                isLoading={actionLoading === reviewModal.app.id}
                disabled={reviewModal.action === "reject" && !note.trim()}
              >
                {reviewModal.action === "approve" ? "Approve" : "Reject"}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <DocLightbox doc={lightboxDoc} onClose={() => setLightboxDoc(null)} />
    </>
  );
}
