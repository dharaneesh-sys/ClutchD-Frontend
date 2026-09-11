import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  LOCAL_DATA_EXPORT_KEYS,
  collectLocalUserData,
  buildLocalUserDataFilename,
  downloadLocalUserData,
} from "../exportLocalUserData";

let clickSpy = null;
let capturedBlob = null;

function readBlobText(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsText(blob);
  });
}

beforeEach(() => {
  window.localStorage.clear();
  capturedBlob = null;
  window.URL.createObjectURL = vi.fn((blob) => {
    capturedBlob = blob;
    return "blob:mock-url";
  });
  window.URL.revokeObjectURL = vi.fn();
  clickSpy = vi
    .spyOn(window.HTMLAnchorElement.prototype, "click")
    .mockImplementation(() => {});
});

afterEach(() => {
  clickSpy.mockRestore();
  vi.restoreAllMocks();
  window.localStorage.clear();
});

describe("LOCAL_DATA_EXPORT_KEYS", () => {
  it("covers cart, theme, fleet, subscription, warranty, certifications, maintenance", () => {
    const joined = LOCAL_DATA_EXPORT_KEYS.join(" ");
    for (const fragment of [
      "clutchd_cart",
      "clutchd_theme",
      "fleet",
      "subscription",
      "warranty",
      "certifications",
      "maintenance",
    ]) {
      expect(joined).toContain(fragment);
    }
  });

  it("never includes auth tokens or secrets", () => {
    expect(LOCAL_DATA_EXPORT_KEYS).not.toContain("clutchd_access_token");
    expect(LOCAL_DATA_EXPORT_KEYS).not.toContain("clutchd_token_expires_at");
    expect(LOCAL_DATA_EXPORT_KEYS).not.toContain("auth-storage");
  });
});

describe("collectLocalUserData", () => {
  it("aggregates only keys that exist", () => {
    window.localStorage.setItem("clutchd_cart", JSON.stringify([{ id: "p1" }]));
    window.localStorage.setItem("clutchd_theme", "dark");
    const payload = collectLocalUserData(window.localStorage);
    expect(payload.data.clutchd_cart).toEqual([{ id: "p1" }]);
    expect(payload.data.clutchd_theme).toBe("dark");
    expect(payload.data.clutchd_maintenance).toBeUndefined();
    expect(typeof payload.exportedAt).toBe("string");
  });

  it("keeps corrupt JSON as a raw string instead of throwing", () => {
    window.localStorage.setItem("clutchd_cart", "{not-json");
    const payload = collectLocalUserData(window.localStorage);
    expect(payload.data.clutchd_cart).toBe("{not-json");
  });

  it("ignores unknown keys", () => {
    window.localStorage.setItem("some_random_key", "x");
    const payload = collectLocalUserData(window.localStorage);
    expect(payload.data.some_random_key).toBeUndefined();
  });
});

describe("downloadLocalUserData", () => {
  it("downloads a real JSON blob and reports exported keys", async () => {
    window.localStorage.setItem("clutchd_cart", JSON.stringify([]));
    window.localStorage.setItem(
      "clutchd_maintenance",
      JSON.stringify({ vehicles: [] })
    );
    const result = downloadLocalUserData();
    expect(result.filename).toBe(buildLocalUserDataFilename());
    expect(result.exportedKeys).toEqual(
      expect.arrayContaining(["clutchd_cart", "clutchd_maintenance"])
    );
    expect(capturedBlob).toBeInstanceOf(Blob);
    const parsed = JSON.parse(await readBlobText(capturedBlob));
    expect(parsed.data.clutchd_cart).toEqual([]);
    expect(clickSpy).toHaveBeenCalled();
  });

  it("returns null when no local data exists (no fake success)", () => {
    expect(downloadLocalUserData()).toBeNull();
    expect(clickSpy).not.toHaveBeenCalled();
  });
});
