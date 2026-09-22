/**
 * Tests for the client-side image compression utility.
 * jsdom lacks real image decoding/canvas encoding, so the suite verifies the
 * safety rails: pass-through of unsupported types, graceful fallback on
 * decode/canvas failure, WebP-first encoding when the canvas supports it,
 * JPEG fallback when it doesn't, and keeping the original when compression
 * doesn't shrink the file.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { compressImage } from "@/lib/imageCompress";

function makeFile(name, size, type = "image/jpeg") {
  const blob = new Blob([new Uint8Array(Math.min(size, 1024))], { type });
  return new File([blob], name, { type });
}

/** Stub an <img>-like element plus a configurable canvas factory. */
function stubBrowser({ webp = true, blobSize = 100, blobMime = null } = {}) {
  vi.stubGlobal(
    "Image",
    class {
      set src(_) {
        setTimeout(() => this.onload && this.onload(), 0);
        this.width = 4000;
        this.height = 3000;
      }
    },
  );
  vi.spyOn(document, "createElement").mockImplementation((tag) => {
    if (tag === "canvas") {
      return {
        width: 0,
        height: 0,
        getContext: () => ({
          fillStyle: "",
          fillRect: () => {},
          drawImage: () => {},
        }),
        toDataURL: (mime) =>
          webp || mime !== "image/webp"
            ? `data:${mime};base64,AAAA`
            : "data:,",
        toBlob: (cb, mime) =>
          setTimeout(
            () => cb(new Blob([new Uint8Array(blobSize)], { type: blobMime || mime })),
            0,
          ),
      };
    }
    return originalCreateElement(tag);
  });
}

describe("compressImage", () => {
  const originalCreateElement = document.createElement.bind(document);

  beforeEach(() => {
    // jsdom has no object URL support — stub so loadBitmap's real path runs.
    vi.stubGlobal("URL", Object.assign(Object.create(URL), URL, {
      createObjectURL: () => "blob:mock",
      revokeObjectURL: () => {},
    }));
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("passes GIFs through untouched", async () => {
    const gif = makeFile("anim.gif", 5000, "image/gif");
    expect(await compressImage(gif)).toBe(gif);
  });

  it("passes SVGs through untouched", async () => {
    const svg = makeFile("logo.svg", 5000, "image/svg+xml");
    expect(await compressImage(svg)).toBe(svg);
  });

  it("falls back to the original file when decoding fails", async () => {
    const img = makeFile("broken.jpg", 5000);
    vi.stubGlobal(
      "Image",
      class {
        set src(_) {
          setTimeout(() => this.onerror && this.onerror(new Event("error")), 0);
        }
      },
    );
    expect(await compressImage(img)).toBe(img);
  });

  it("falls back to the original file when canvas is unavailable", async () => {
    const img = makeFile("photo.jpg", 5000);
    vi.stubGlobal(
      "Image",
      class {
        set src(_) {
          setTimeout(() => this.onload && this.onload(), 0);
          this.width = 4000;
          this.height = 3000;
        }
      },
    );
    vi.spyOn(document, "createElement").mockImplementation((tag) => {
      if (tag === "canvas") return { width: 0, height: 0, getContext: () => null };
      return originalCreateElement(tag);
    });
    expect(await compressImage(img)).toBe(img);
  });

  it("encodes WebP first when the canvas supports it", async () => {
    const img = makeFile("brake-pad.png", 500, "image/png");
    stubBrowser({ webp: true, blobSize: 100 });
    const out = await compressImage(img);
    expect(out).not.toBe(img);
    expect(out.name).toBe("brake-pad.webp");
    expect(out.type).toBe("image/webp");
  });

  it("falls back to JPEG when the canvas cannot encode WebP", async () => {
    const img = makeFile("brake-pad.png", 500, "image/png");
    stubBrowser({ webp: false, blobSize: 100, blobMime: "image/jpeg" });
    const out = await compressImage(img);
    expect(out).not.toBe(img);
    expect(out.name).toBe("brake-pad.jpg");
    expect(out.type).toBe("image/jpeg");
  });

  it("keeps the original when the 'compressed' blob is not smaller", async () => {
    const img = makeFile("tiny.jpg", 300);
    stubBrowser({ webp: true, blobSize: 2048 });
    expect(await compressImage(img)).toBe(img);
  });
});
