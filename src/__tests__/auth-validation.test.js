import { describe, it, expect } from "vitest";
import {
  loginSchema,
  customerSignupSchema,
  sellerSignupSchema,
} from "@/lib/validators";

// Wave-6 Task 14 — auth form validation contract. Auth logic is frozen:
// these lock the exact accept/reject boundary the restyled cards rely on.
describe("loginSchema", () => {
  it("accepts a valid email + password", () => {
    const r = loginSchema.safeParse({ email: "rider@example.com", password: "secret1" });
    expect(r.success).toBe(true);
  });

  it("rejects an invalid email", () => {
    const r = loginSchema.safeParse({ email: "not-an-email", password: "secret1" });
    expect(r.success).toBe(false);
  });

  it("rejects a short password", () => {
    const r = loginSchema.safeParse({ email: "rider@example.com", password: "abc" });
    expect(r.success).toBe(false);
  });
});

describe("customerSignupSchema", () => {
  const base = {
    fullName: "Ada Rider",
    email: "ada@example.com",
    password: "Strong123",
    confirmPassword: "Strong123",
  };

  it("accepts a strong matching signup", () => {
    expect(customerSignupSchema.safeParse(base).success).toBe(true);
  });

  it("rejects mismatched passwords", () => {
    const r = customerSignupSchema.safeParse({ ...base, confirmPassword: "Other123" });
    expect(r.success).toBe(false);
  });

  it("rejects a weak password (no uppercase / number)", () => {
    const r = customerSignupSchema.safeParse({ ...base, password: "weakpass1", confirmPassword: "weakpass1" });
    expect(r.success).toBe(false);
  });
});

describe("sellerSignupSchema", () => {
  it("rejects a missing store name", () => {
    const r = sellerSignupSchema.safeParse({
      email: "shop@example.com",
      password: "Strong123",
      confirmPassword: "Strong123",
      storeName: "",
      fullName: "Shop Owner",
      phone: "9876543210",
      location: "Coimbatore",
    });
    expect(r.success).toBe(false);
  });
});
