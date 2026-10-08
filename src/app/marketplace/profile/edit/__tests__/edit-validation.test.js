// Wave-3 Task 7 — RED-first unit tests for edit-profile validation.
// Validation rules frozen (name >= 2, phone >= 10 digits, address >= 5);
// the page must export validateForm so the rules stay pinned.
import "@testing-library/jest-dom/vitest";
import { describe, it, expect, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), back: vi.fn() }),
  usePathname: () => "/marketplace/profile/edit",
}));

import { validateForm } from "@/app/marketplace/profile/edit/page";

describe("edit-form validation rules (pinned)", () => {
  it("accepts a fully valid form", () => {
    expect(
      validateForm({ name: "Asha Kumar", phone: "+91 98765 43210", address: "12 Main St, Chennai" })
    ).toEqual({});
  });

  it("rejects a short name", () => {
    const errors = validateForm({ name: "A", phone: "9876543210", address: "12 Main St" });
    expect(errors.name).toMatch(/at least 2 characters/);
  });

  it("rejects a phone with fewer than 10 digits", () => {
    const errors = validateForm({ name: "Asha", phone: "12345", address: "12 Main St" });
    expect(errors.phone).toMatch(/at least 10 digits/);
  });

  it("counts only digits in the phone (formatting ignored)", () => {
    expect(
      validateForm({ name: "Asha", phone: "(987) 654-3210", address: "12 Main St" })
    ).toEqual({});
  });

  it("rejects a short address", () => {
    const errors = validateForm({ name: "Asha", phone: "9876543210", address: "12" });
    expect(errors.address).toMatch(/at least 5 characters/);
  });

  it("reports all failing fields at once", () => {
    const errors = validateForm({ name: "", phone: "", address: "" });
    expect(Object.keys(errors).sort()).toEqual(["address", "name", "phone"]);
  });
});
