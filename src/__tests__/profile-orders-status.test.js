import { describe, it, expect } from "vitest";

// Wave-3 Task 8 RED: orders status chips must use shared Badge language —
// info/pending/success/danger/default only, per DESIGN.md D7 + D15.1.
// D7 remap: en_route (legacy purple) -> pending amber. No "warning" variant
// (Badge has no such variant; --warning was renamed to --info).
import {
  STATUS_BADGE_VARIANT,
  STATUS_LABELS,
  getStatusTab,
} from "@/app/marketplace/profile/orders/page";

const SANCTIONED = new Set(["info", "pending", "success", "danger", "default"]);

describe("orders status chip language (D7)", () => {
  it("uses only sanctioned Badge variants", () => {
    for (const [status, variant] of Object.entries(STATUS_BADGE_VARIANT)) {
      expect(
        SANCTIONED.has(variant),
        `${status} maps to unsanctioned variant "${variant}"`
      ).toBe(true);
    }
  });

  it("maps searching to info (informational, D7)", () => {
    expect(STATUS_BADGE_VARIANT.searching).toBe("info");
  });

  it("maps assigned to info (informational, D7)", () => {
    expect(STATUS_BADGE_VARIANT.assigned).toBe("info");
  });

  it("remaps en_route to pending amber (kills purple exception, D7)", () => {
    expect(STATUS_BADGE_VARIANT.en_route).toBe("pending");
  });

  it("maps pending to pending amber (D7)", () => {
    expect(STATUS_BADGE_VARIANT.pending).toBe("pending");
  });

  it("maps completed to success and cancelled to danger", () => {
    expect(STATUS_BADGE_VARIANT.completed).toBe("success");
    expect(STATUS_BADGE_VARIANT.cancelled).toBe("danger");
  });

  it("keeps every status label intact (no behavior change)", () => {
    expect(STATUS_LABELS).toMatchObject({
      searching: "Searching",
      assigned: "Assigned",
      en_route: "En Route",
      in_progress: "In Progress",
      completed: "Completed",
      cancelled: "Cancelled",
      pending: "Pending",
    });
  });

  it("keeps tab routing identical (active/completed/cancelled)", () => {
    expect(getStatusTab("searching")).toBe("current");
    expect(getStatusTab("assigned")).toBe("current");
    expect(getStatusTab("en_route")).toBe("current");
    expect(getStatusTab("in_progress")).toBe("current");
    expect(getStatusTab("pending")).toBe("current");
    expect(getStatusTab("completed")).toBe("completed");
    expect(getStatusTab("cancelled")).toBe("cancelled");
  });
});
