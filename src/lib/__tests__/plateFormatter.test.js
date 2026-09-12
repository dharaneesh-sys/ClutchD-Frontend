import { describe, it, expect } from "vitest";
import { formatPlateLive, formatIndianPlate, canonicalPlate } from "../plateFormatter";

describe("formatPlateLive progressive formatting", () => {
  it.each([
    ["", ""],
    ["T", "T"],
    ["t", "T"],
    ["TN", "TN"],
    ["tn", "TN"],
    ["TN3", "TN-3"],
    ["TN38", "TN-38"],
    ["TN38A", "TN-38-A"],
    ["TN38AB", "TN-38-AB"],
    ["TN38AB1", "TN-38-AB-1"],
    ["TN38AB12", "TN-38-AB-12"],
    ["TN38AB123", "TN-38-AB-123"],
    ["TN38AB1234", "TN-38-AB-1234"],
  ])("formats %s → %s", (input, expected) => {
    expect(formatPlateLive(input)).toBe(expected);
  });

  it("uppercases and strips invalid chars", () => {
    expect(formatPlateLive("tn 38 ab 1234")).toBe("TN-38-AB-1234");
    expect(formatPlateLive("tn-38-ab-1234")).toBe("TN-38-AB-1234");
  });

  it("handles paste of full canonical plate", () => {
    expect(formatPlateLive("tn38ab1234")).toBe("TN-38-AB-1234");
    expect(formatPlateLive("TN38AB1234")).toBe("TN-38-AB-1234");
  });

  it("is backspace safe: deleting a dash only removes alphanumerics", () => {
    // User types full plate then hits backspace (removes trailing digit).
    expect(formatPlateLive("TN-38-AB-123")).toBe("TN-38-AB-123");
    // Trailing dash alone never persists (operates on alphanumerics only).
    expect(formatPlateLive("TN-38-")).toBe("TN-38");
    expect(formatPlateLive("TN-38-A")).toBe("TN-38-A");
  });

  it("returns digit-first input as-is without fighting the user", () => {
    expect(formatPlateLive("38TN")).toBe("38TN");
    expect(formatPlateLive("1")).toBe("1");
  });

  it("caps groups at 2/2/3/4 and ignores overflow", () => {
    expect(formatPlateLive("TN38AB12345")).toBe("TN-38-AB-1234");
    expect(formatPlateLive("TN38ABCD1234")).toBe("TN-38-ABC");
  });

  it("supports 3-letter series progressively", () => {
    expect(formatPlateLive("TN38ABC")).toBe("TN-38-ABC");
    expect(formatPlateLive("TN38ABC1")).toBe("TN-38-ABC-1");
    expect(formatPlateLive("TN38ABC1234")).toBe("TN-38-ABC-1234");
  });
});

describe("existing formatters keep working with 3-letter series", () => {
  it("formatIndianPlate stays dashed including 3-letter series", () => {
    expect(formatIndianPlate("TN38AB1234")).toBe("TN-38-AB-1234");
    expect(formatIndianPlate("TN38ABC1234")).toBe("TN-38-ABC-1234");
  });

  it("canonicalPlate machine form stays dash-free", () => {
    expect(canonicalPlate("TN-38-AB-1234")).toBe("TN38AB1234");
    expect(canonicalPlate("TN-38-ABC-1234")).toBe("TN38ABC1234");
    expect(canonicalPlate("TN-38-AB-1234")).not.toContain("-");
  });
});
