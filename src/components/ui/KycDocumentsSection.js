"use client";

import { useRef, useState } from "react";
import { AlertTriangle, FileCheck2, IdCard, Loader2, UploadCloud } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import { FileUpload } from "@/components/ui/FileUpload";
import { KycBadge, deriveKycStatus } from "@/components/ui/KycBadge";
import { uploadKycDocuments } from "@/lib/kycUpload";
import { useAuthStore } from "@/store/authStore";
import { useToast } from "@/components/ui/ToastProvider";
import api from "@/lib/api";

/**
 * KYC documents manager for mechanic/garage profiles.
 * Shows the current verification status, the documents on file, and lets
 * the provider upload or replace them. Uploads are best-effort: a failure
 * never blocks the profile, it just toasts.
 */
export function KycDocumentsSection({ role }) {
  const user = useAuthStore((s) => s.user);
  const updateUserData = useAuthStore((s) => s.updateUserData);
  const { success: showSuccess, error: showError } = useToast();
  const [aadhaarFile, setAadhaarFile] = useState(null);
  const [licenseFile, setLicenseFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const uploadNonce = useRef(0);

  if (!user) return null;
  const status = deriveKycStatus(user);

  const handleUpload = async () => {
    if (!aadhaarFile && !licenseFile) return;
    setUploading(true);
    try {
      const { aadhaarPhotoUrl, licensePhotoUrl } = await uploadKycDocuments({
        aadhaarPhoto: aadhaarFile,
        licensePhoto: licenseFile,
      });
      // Refresh the authoritative user payload (kycStatus flips to submitted)
      const res = await api.get("/profile/me").catch(() => null);
      if (res?.data) updateUserData(res.data);
      showSuccess(
        aadhaarPhotoUrl || licensePhotoUrl
          ? "Documents uploaded — verification is in progress."
          : "Upload failed. Please try again."
      );
      if (aadhaarPhotoUrl || licensePhotoUrl) {
        setAadhaarFile(null);
        setLicenseFile(null);
        uploadNonce.current += 1; // reset FileUpload inputs
      }
    } catch {
      showError("Upload failed. Please check your connection and try again.");
    } finally {
      setUploading(false);
    }
  };

  const docLabel = role === "garage" ? "Business License / GST Photo" : "Driving License Photo";

  return (
    <GlassCard variant="strong" className="p-4 sm:p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold tracking-tight text-text-primary">KYC Documents</h2>
        <KycBadge user={user} />
      </div>

      <p className="text-sm text-text-muted mb-5">
        {status === "verified"
          ? "Your identity is verified. You can replace your documents below if they change."
          : status === "submitted"
            ? "We've received your documents and are reviewing them. This usually takes 1–2 business days."
            : status === "rejected"
              ? "Your documents were rejected. Check the admin's note below, then re-upload corrected photos — we'll review them again."
              : "Upload your Aadhaar and license to get verified. Verified providers get more jobs."}
      </p>

      {status === "rejected" && user.kycNote && (
        <div className="mb-5 flex items-start gap-2 text-sm text-amber-300/90 bg-amber-500/10 border border-amber-500/25 rounded-xl px-4 py-3">
          <AlertTriangle size={16} className="shrink-0 mt-0.5" />
          <span>
            <span className="font-medium">Reason:</span> {user.kycNote}
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
        <div>
          <label className="mb-2 flex items-center gap-1.5 block text-sm font-medium text-text-muted">
            <IdCard size={14} className="text-icon-highlight" />
            Aadhaar Card
          </label>
          <FileUpload
            key={`aadhaar-${uploadNonce.current}`}
            label={user.aadhaarPhotoUrl ? "Replace Aadhaar photo" : "Upload Aadhaar photo"}
            onChange={setAadhaarFile}
            value={aadhaarFile}
          />
          {user.aadhaarPhotoUrl && !aadhaarFile && (
            <p className="mt-1.5 text-xs text-success flex items-center gap-1">
              <FileCheck2 size={12} /> On file
            </p>
          )}
        </div>
        <div>
          <label className="mb-2 flex items-center gap-1.5 block text-sm font-medium text-text-muted">
            <IdCard size={14} className="text-icon-highlight" />
            {docLabel}
          </label>
          <FileUpload
            key={`license-${uploadNonce.current}`}
            label={user.licensePhotoUrl ? "Replace license photo" : "Upload license photo"}
            onChange={setLicenseFile}
            value={licenseFile}
          />
          {user.licensePhotoUrl && !licenseFile && (
            <p className="mt-1.5 text-xs text-success flex items-center gap-1">
              <FileCheck2 size={12} /> On file
            </p>
          )}
        </div>
      </div>

      <Button
        onClick={handleUpload}
        disabled={uploading || (!aadhaarFile && !licenseFile)}
        size="sm"
      >
        {uploading ? (
          <>
            <Loader2 size={14} className="animate-spin mr-2" /> Uploading...
          </>
        ) : (
          <>
            <UploadCloud size={14} className="mr-2" />
            {status === "pending" ? "Submit Documents" : "Update Documents"}
          </>
        )}
      </Button>
    </GlassCard>
  );
}
