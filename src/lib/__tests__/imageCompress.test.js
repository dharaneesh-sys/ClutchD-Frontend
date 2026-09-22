/**
 * Tests for the client-side image compression utility.
 * jsdom lacks real image decoding/canvas encoding, so the suite verifies the
 * safety rails: pass-through of unsupported types, graceful fallback on
 * decode/canvas failure, and output naming when a compressed result is
 * smaller than the input.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { compressImage } from "@/lib/imageCompress";

function makeFile(name, size, type = "image/jpeg") {
  const blob = new Blob([new Uint8Array(Math.min(size, 1024))], { type });
  return new File([blob], name, { type });
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
    const spy = vi.spyOn(document, "createElement");
    // Force loadBitmap to fail: stub Image so onerror fires.
    vi.stubGlobal(
      "Image",
      class {
        set src(_) {
          setTimeout(() => this.onerror && this.onerror(new Event("error")), 0);
        }
      },
    );
    expect(await compressImage(img)).toBe(img);
    expect(spy).not.toHaveBeenCalled(); // never reached canvas creation
    vi.unstubAllGlobals();
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
    vi.unstubAllGlobals();
  });

  it("returns the compressed file with .jpg name when compression shrinks it", async () => {
    const img = makeFile("brake-pad.png", 500, "image/png");
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
          toBlob: (cb) =>
            setTimeout(() => cb(new Blob([new Uint8Array(100)], { type: "image/jpeg" })), 0),
        };
      }
      return originalCreateElement(tag);
    });
    const out = await compressImage(img);
    expect(out).not.toBe(img);
    expect(out.name).toBe("brake-pad.jpg");
    expect(out.type).toBe("image/jpeg");
    vi.unstubAllGlobals();
  });

  it("keeps the original when the 'compressed' blob is not smaller", async () => {
    const img = makeFile("tiny.jpg", 300);
    vi.stubGlobal(
      "Image",
      class {
        set src(_) {
          setTimeout(() => this.onload && this.onload(), 0);
          this.width = 800;
          this.height = 600;
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
          toBlob: (cb) =>
            setTimeout(() => cb(new Blob([new Uint8Array(2048)], { type: "image/jpeg" })), 0),
        };
      }
      return originalCreateElement(tag);
    });
    expect(await compressImage(img)).toBe(img);
    vi.unstubAllGlobals();
  });
});
