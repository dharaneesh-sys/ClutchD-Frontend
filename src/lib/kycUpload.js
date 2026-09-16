"use client";

import api from "@/lib/api";

/**
 * Upload a single KYC document to the backend.
 * Returns the public URL path, or null on failure (KYC is best-effort —
 * a failed upload must never block account creation).
 */
async function uploadOne(file) {
  if (!file) return null;
  const fd = new FormData();
  fd.append("file", file);
  try {
    // Photos over the funnel on 4G easily exceed the default 30s — long
    // timeout + retryable (upload is idempotent: worst case stores a second
    // orphan file, the profile URL write is a separate call).
    const { data } = await api.post("/uploads", fd, {
      headers: { "Content-Type": "multipart/form-data" },
      timeout: 60000,
      __isRetryable: true,
    });
    return data?.url || null;
  } catch (err) {
    console.error("[kycUpload] upload failed:", err);
    return null;
  }
}

/**
 * Upload Aadhaar + license photos (whichever are provided) and attach the
 * resulting URLs to the signed-in provider's profile via PUT /profile/me.
 *
 * Call this right after a successful mechanic/garage signup, while the
 * fresh auth token is still in the request pipeline.
 *
 * @param {{ aadhaarPhoto?: File|null, licensePhoto?: File|null }} docs
 * @returns {Promise<{ aadhaarPhotoUrl: string|null, licensePhotoUrl: string|null }>}
 */
export async function uploadKycDocuments({ aadhaarPhoto, licensePhoto }) {
  const [aadhaarPhotoUrl, licensePhotoUrl] = await Promise.all([
    uploadOne(aadhaarPhoto),
    uploadOne(licensePhoto),
  ]);

  if (aadhaarPhotoUrl || licensePhotoUrl) {
    const body = {};
    if (aadhaarPhotoUrl) body.aadhaarPhotoUrl = aadhaarPhotoUrl;
    if (licensePhotoUrl) body.licensePhotoUrl = licensePhotoUrl;
    try {
      await api.put("/profile/me", body);
    } catch (err) {
      // Profile attach failed — files are on the server but not linked.
      // Non-fatal: admin can still match by upload records.
      console.error("[kycUpload] failed to attach KYC URLs to profile:", err);
    }
  }

  return { aadhaarPhotoUrl, licensePhotoUrl };
}
