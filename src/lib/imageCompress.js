/**
 * Client-side image compression for uploads.
 *
 * Why: phone cameras produce 3-8MB JPEGs. Pushing that through the Tailscale
 * funnel on 4G takes minutes and trips the 60s upload timeout (then the retry
 * loop multiplied it). Resizing to ≤1600px and re-encoding as JPEG ~82 gives a
 * 100-400KB image that uploads in 1-3s — visually identical for a store listing.
 *
 * Used by the seller part form; pure client-side, no dependencies.
 */

const MAX_DIMENSION = 1600;
const TARGET_BYTES = 350 * 1024; // ~350KB after first pass
const QUALITY_STEPS = [0.82, 0.65, 0.5]; // progressively smaller if needed
const FALLBACK_MIME = "image/jpeg";

function loadBitmap(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not decode image."));
    };
    img.src = url;
  });
}

function drawToBlob(img, quality) {
  return new Promise((resolve, reject) => {
    const scale = Math.min(1, MAX_DIMENSION / Math.max(img.width, img.height));
    const w = Math.max(1, Math.round(img.width * scale));
    const h = Math.max(1, Math.round(img.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return reject(new Error("Canvas unavailable."));
    // JPEG has no alpha — flatten transparency onto white so PNG logos don't
    // come out with black backgrounds.
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, w, h);
    ctx.drawImage(img, 0, 0, w, h);
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Encoding failed."))),
      FALLBACK_MIME,
      quality,
    );
  });
}

/**
 * Compress an image File/Blob. Returns a File ready for FormData upload.
 * Falls back to the original file unchanged if compression is impossible
 * (unsupported type, decoding failure, no canvas) — callers must never block
 * an upload because compression failed.
 *
 * @param {File|Blob} file
 * @returns {Promise<File>} compressed file (same name, .jpg extension)
 */
export async function compressImage(file) {
  try {
    // Animated/odd types: pass through untouched.
    if (!file || file.type === "image/gif" || file.type === "image/svg+xml") {
      return file;
    }
    if (typeof document === "undefined" || !document.createElement) return file;

    const img = await loadBitmap(file);
    let blob = null;
    for (const quality of QUALITY_STEPS) {
      blob = await drawToBlob(img, quality);
      if (blob.size <= TARGET_BYTES) break;
    }
    if (!blob || blob.size >= file.size) return file; // compression didn't help

    const baseName = (file.name || "photo").replace(/\.[^.]+$/, "");
    return new File([blob], `${baseName}.jpg`, { type: FALLBACK_MIME });
  } catch {
    return file;
  }
}
