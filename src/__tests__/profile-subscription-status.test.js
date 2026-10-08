import { describe, it, expect } from "vitest";

// Wave-3 Task 8 RED: subscription status chips must use shared Badge
// language — info/pending/success/danger only, per DESIGN.md D7 + D15.1.
// No "warning" classes (renamed to --info/--pending), no red-*/white
// hardcodes in chip styling.
import { getSubscriptionStatusChip } from "@/components/subscription/SubscriptionManager";

const SANCTIONED = new Set(["info", "pending", "success", "danger", "default"]);

describe("subscription status chip language (D7)", () => {
  it("maps active to success", () => {
    expect(getSubscriptionStatusChip("active")).toMatchObject({
      variant: "success",
      label: "Active",
    });
  });

  it("maps cancelled to danger", () => {
    expect(getSubscriptionStatusChip("cancelled")).toMatchObject({
      variant: "danger",
      label: "Cancelled",
    });
  });

  it("maps expired to pending", () => {
    expect(getSubscriptionStatusChip("expired")).toMatchObject({
      variant: "pending",
      label: "Expired",
    });
  });

  it("maps free/none to info without changing plan semantics", () => {
    expect(getSubscriptionStatusChip("none")).toMatchObject({
      variant: "info",
      label: "Free",
    });
    expect(getSubscriptionStatusChip(undefined)).toMatchObject({
      variant: "info",
      label: "Free",
    });
  });

  it("uses only sanctioned Badge variants across all statuses", () => {
    for (const s of ["active", "cancelled", "expired", "none", undefined]) {
      const chip = getSubscriptionStatusChip(s);
      expect(
        SANCTIONED.has(chip.variant),
        `status "${s}" maps to unsanctioned variant "${chip.variant}"`
      ).toBe(true);
    }
  });
});
