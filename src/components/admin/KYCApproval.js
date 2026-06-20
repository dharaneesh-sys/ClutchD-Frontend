"use client";

import { useState, useEffect } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { FileText, CheckCircle, XCircle } from "lucide-react";
import { useThemeStore } from "@/store/themeStore";
import { useToast } from "@/components/ui/ToastProvider";
import { fetchPendingKyc, verifyMechanic, verifyGarage } from "@/services/adminService";

export function KYCApproval() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  const [confirmModal, setConfirmModal] = useState(null);
  const { theme } = useThemeStore();
  const { success: showSuccess, error: showError } = useToast();
  const isLight = theme === "light";

  const loadApplications = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchPendingKyc();
      setApplications(data);
    } catch (err) {
      setError(err?.response?.data?.detail || "Failed to load KYC applications");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadApplications();
  }, []);

  const handleApprove = async (app) => {
    setActionLoading(app.id);
    try {
      if (app.profileType === "garage") {
        await verifyGarage(app.id, true);
      } else {
        await verifyMechanic(app.id, true);
      }
      setApplications(prev => prev.filter(a => a.id !== app.id));
      showSuccess(`${app.name} approved successfully.`);
    } catch (err) {
      showError(err?.response?.data?.detail || "Failed to approve");
    } finally {
      setActionLoading(null);
      setConfirmModal(null);
    }
  };

  const handleReject = async (app) => {
    setActionLoading(app.id);
    try {
      if (app.profileType === "garage") {
        await verifyGarage(app.id, false);
      } else {
        await verifyMechanic(app.id, false);
      }
      setApplications(prev => prev.filter(a => a.id !== app.id));
      showSuccess(`${app.name} rejected.`);
    } catch (err) {
      showError(err?.response?.data?.detail || "Failed to reject");
    } finally {
      setActionLoading(null);
      setConfirmModal(null);
    }
  };

  return (
    <>
      {loading ? (
        <div className="col-span-full py-12 text-center">
          <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin mx-auto border-primary" />
        </div>
      ) : error ? (
        <div className={`col-span-full py-12 text-center ${isLight ? "text-red-500" : "text-red-400"}`}>
          <p>{error}</p>
          <button onClick={loadApplications} className="mt-3 text-sm underline">Retry</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {applications.length === 0 ? (
            <div className={`col-span-full py-12 text-center ${"text-text-muted"}`}>
              <FileText size={48} className="mx-auto mb-4 opacity-20" />
              <p>No pending KYC applications.</p>
            </div>
          ) : (
            applications.map((app) => (
              <GlassCard key={app.id} variant="elevated" className="p-5 sm:p-6 flex flex-col h-full">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className={`text-lg font-bold ${"text-text-primary"}`}>{app.name}</h3>
                    <p className={`text-xs font-medium ${"text-icon-highlight"}`}>{app.type}</p>
                  </div>
                  <Badge variant="warning">{app.status}</Badge>
                </div>

                <div className="mb-4">
                  <p className={`text-xs mb-2 ${"text-text-dim"}`}>Submitted {app.submitted}</p>
                  <p className={`text-sm font-medium mb-1 ${"text-text-primary"}`}>Attached Documents:</p>
                  <ul className={`text-sm space-y-1 ${"text-text-muted"}`}>
                    {app.documents.map((doc, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <FileText size={12} className={"text-icon-highlight"} /> {doc}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className={`mt-auto grid grid-cols-2 gap-3 pt-4 border-t ${"border-border-subtle"}`}>
                  <Button
                    variant="outline"
                    className={isLight ? "text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700" : "text-red-400 border-red-500/30 hover:bg-red-500/10 hover:text-red-400"}
                    isLoading={actionLoading === app.id}
                    onClick={() => setConfirmModal({ app, action: "reject" })}
                  >
                    <XCircle size={16} className="mr-2" /> Reject
                  </Button>
                  <Button
                    onClick={() => setConfirmModal({ app, action: "approve" })}
                    isLoading={actionLoading === app.id}
                  >
                    <CheckCircle size={16} className="mr-2" /> Approve
                  </Button>
                </div>
              </GlassCard>
            ))
          )}
        </div>
      )}

      <Modal
        isOpen={!!confirmModal}
        onClose={() => setConfirmModal(null)}
        title={confirmModal?.action === "approve" ? "Approve KYC" : "Reject KYC"}
      >
        <p className={`mb-6 ${"text-text-primary"}`}>
          {confirmModal?.action === "approve"
            ? `Are you sure you want to approve ${confirmModal?.app?.name}?`
            : `Are you sure you want to reject ${confirmModal?.app?.name}?`}
        </p>
        <div className="flex gap-3 justify-end">
          <Button variant="ghost" onClick={() => setConfirmModal(null)}>Cancel</Button>
          <Button
            variant={confirmModal?.action === "approve" ? "primary" : "danger"}
            onClick={() =>
              confirmModal?.action === "approve"
                ? handleApprove(confirmModal.app)
                : handleReject(confirmModal.app)
            }
          >
            {confirmModal?.action === "approve" ? "Approve" : "Reject"}
          </Button>
        </div>
      </Modal>
    </>
  );
}
