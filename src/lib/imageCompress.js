/**
 * Client-side image compression for uploads.
 *
 * Why: phone cameras produce 3-8MB JPEGs. Pushing that through the Tailscale
 * funnel (130-540 KB/s measured) takes minutes and trips the 60s upload
 * timeout (then the retry loop multiplied it). Resizing to ≤1280px and
 * re-encoding as WebP ~q80 gives a 60-250KB image that uploads in 1-3s —
 * visually identical for a store listing (1280px is 2x a 360dp listing tile).
 *
 * WebP is ~30-40% smaller than JPEG at the same quality; every Chromium-based
 * WebView (including Capacitor/Android) encodes it natively. Safari browsers
 * fall back to JPEG via a capability sniff.
 *
 * Used by the seller part form; pure client-side, no dependencies.
 */

const MAX_DIMENSION = 1280;
const TARGET_BYTES = 300 * 1024; // ~300KB after first pass
const QUALITY_STEPS = [0.8, 0.65, 0.5]; // progressively smaller if needed
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

function makeCanvas(img) {
  const scale = Math.min(1, MAX_DIMENSION / Math.max(img.width, img.height));
  const w = Math.max(1, Math.round(img.width * scale));
  const h = Math.max(1, Math.round(img.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas unavailable.");
  // The JPEG/WebP target has no alpha — flatten transparency onto white so
  // PNG logos don't come out with black backgrounds.
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, w, h);
  ctx.drawImage(img, 0, 0, w, h);
  return canvas;
}

function canvasSupportsWebP(canvas) {
  try {
    return canvas.toDataURL("image/webp").startsWith("data:image/webp");
  } catch {
    return false;
  }
}

function encode(canvas, mime, quality) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Encoding failed."))),
      mime,
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
 * @returns {Promise<File>} compressed file
 */
export async function compressImage(file) {
  try {
    // Animated/odd types: pass through untouched.
    if (!file || file.type === "image/gif" || file.type === "image/svg+xml") {
      return file;
    }
    if (typeof document === "undefined" || !document.createElement) return file;

    const img = await loadBitmap(file);
    const canvas = makeCanvas(img);
    const mimes = canvasSupportsWebP(canvas)
      ? ["image/webp", FALLBACK_MIME]
      : [FALLBACK_MIME];

    let blob = null;
    let usedMime = mimes[mimes.length - 1];
    for (const mime of mimes) {
      for (const quality of QUALITY_STEPS) {
        try {
          blob = await encode(canvas, mime, quality);
        } catch {
          blob = null;
        }
        if (blob && blob.size <= TARGET_BYTES) {
          usedMime = mime;
          break;
        }
        if (blob && usedMime === mime) usedMime = mime;
      }
      if (blob && blob.size <= TARGET_BYTES) break;
    }
    if (!blob || blob.size >= file.size) return file; // compression didn't help

    const ext = usedMime === "image/webp" ? "webp" : "jpg";
    const baseName = (file.name || "photo").replace(/\.[^.]+$/, "");
    return new File([blob], `${baseName}.${ext}`, { type: usedMime });
  } catch {
    return file;
  }
}
