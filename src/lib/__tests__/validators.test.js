import { describe, it, expect } from "vitest";
import {
  loginSchema,
  customerSignupSchema,
  mechanicSignupSchema,
  garageSignupSchema,
  serviceRequestSchema,
  reviewSchema,
} from "../validators";

// ---------------------------------------------------------------------------
// loginSchema
// ---------------------------------------------------------------------------
describe("loginSchema", () => {
  const validInput = {
    email: "user@example.com",
    password: "MyPassword1",
  };

  it("accepts valid login data", () => {
    const result = loginSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it("rejects invalid email", () => {
    const result = loginSchema.safeParse({ ...validInput, email: "not-an-email" });
    expect(result.success).toBe(false);
    if (!result.success) {
      const msgs = result.error.issues.map((i) => i.message).join(" ");
      expect(msgs).toMatch(/valid email/i);
    }
  });

  it("rejects password shorter than 8 characters", () => {
    const result = loginSchema.safeParse({ ...validInput, password: "Short1A" }); // 7 chars
    expect(result.success).toBe(false);
    if (!result.success) {
      const msgs = result.error.issues.map((i) => i.message).join(" ");
      expect(msgs).toMatch(/at least 8/i);
    }
  });

  it("rejects password without uppercase letter", () => {
    const result = loginSchema.safeParse({ ...validInput, password: "mypassword1" });
    expect(result.success).toBe(false);
    if (!result.success) {
      const msgs = result.error.issues.map((i) => i.message).join(" ");
      expect(msgs).toMatch(/uppercase/i);
    }
  });

  it("rejects password without lowercase letter", () => {
    const result = loginSchema.safeParse({ ...validInput, password: "MYPASSWORD1" });
    expect(result.success).toBe(false);
    if (!result.success) {
      const msgs = result.error.issues.map((i) => i.message).join(" ");
      expect(msgs).toMatch(/lowercase/i);
    }
  });

  it("rejects password without number", () => {
    const result = loginSchema.safeParse({ ...validInput, password: "MyPassword" });
    expect(result.success).toBe(false);
    if (!result.success) {
      const msgs = result.error.issues.map((i) => i.message).join(" ");
      expect(msgs).toMatch(/number/i);
    }
  });

  it("rejects missing email field", () => {
    const result = loginSchema.safeParse({ password: "MyPassword1" });
    expect(result.success).toBe(false);
  });

  it("rejects missing password field", () => {
    const result = loginSchema.safeParse({ email: "user@example.com" });
    expect(result.success).toBe(false);
  });

  it("rejects empty string email", () => {
    const result = loginSchema.safeParse({ ...validInput, email: "" });
    expect(result.success).toBe(false);
  });

  it("rejects empty string password", () => {
    const result = loginSchema.safeParse({ ...validInput, password: "" });
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// customerSignupSchema
// ---------------------------------------------------------------------------
describe("customerSignupSchema", () => {
  const validInput = {
    fullName: "Jane Doe",
    email: "jane@example.com",
    password: "MyPassword1",
    confirmPassword: "MyPassword1",
  };

  it("accepts valid signup data", () => {
    const result = customerSignupSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it("rejects mismatched passwords", () => {
    const result = customerSignupSchema.safeParse({
      ...validInput,
      confirmPassword: "Different1A",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const msgs = result.error.issues.map((i) => i.message).join(" ");
      expect(msgs).toMatch(/do not match/i);
    }
  });

  it("rejects short fullName", () => {
    const result = customerSignupSchema.safeParse({ ...validInput, fullName: "J" });
    expect(result.success).toBe(false);
    if (!result.success) {
      const msgs = result.error.issues.map((i) => i.message).join(" ");
      expect(msgs).toMatch(/full name/i);
    }
  });

  it("rejects invalid email", () => {
    const result = customerSignupSchema.safeParse({ ...validInput, email: "bad" });
    expect(result.success).toBe(false);
  });

  it("rejects weak password (no uppercase)", () => {
    const result = customerSignupSchema.safeParse({
      ...validInput,
      password: "weakpassword1",
      confirmPassword: "weakpassword1",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const msgs = result.error.issues.map((i) => i.message).join(" ");
      expect(msgs).toMatch(/uppercase/i);
    }
  });

  it("rejects empty string fullName", () => {
    const result = customerSignupSchema.safeParse({ ...validInput, fullName: "" });
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// mechanicSignupSchema
// ---------------------------------------------------------------------------
describe("mechanicSignupSchema", () => {
  const validInput = {
    email: "mech@example.com",
    password: "MechPass1",
    confirmPassword: "MechPass1",
    fullName: "Bob Fixit",
    phone: "9876543210",
    experience: "5",
    expertise: ["engine", "brakes"],
    location: "Coimbatore",
  };

  it("accepts valid mechanic signup data", () => {
    const result = mechanicSignupSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it("rejects missing phone", () => {
    const result = mechanicSignupSchema.safeParse({ ...validInput, phone: "" });
    expect(result.success).toBe(false);
    if (!result.success) {
      const msgs = result.error.issues.map((i) => i.message).join(" ");
      expect(msgs).toMatch(/phone/i);
    }
  });

  it("rejects empty expertise array", () => {
    const result = mechanicSignupSchema.safeParse({ ...validInput, expertise: [] });
    expect(result.success).toBe(false);
    if (!result.success) {
      const msgs = result.error.issues.map((i) => i.message).join(" ");
      expect(msgs).toMatch(/expertise/i);
    }
  });

  it("rejects mismatched passwords", () => {
    const result = mechanicSignupSchema.safeParse({
      ...validInput,
      confirmPassword: "Different1A",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const msgs = result.error.issues.map((i) => i.message).join(" ");
      expect(msgs).toMatch(/do not match/i);
    }
  });

  it("rejects missing location", () => {
    const result = mechanicSignupSchema.safeParse({ ...validInput, location: "" });
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// garageSignupSchema
// ---------------------------------------------------------------------------
describe("garageSignupSchema", () => {
  const validInput = {
    email: "garage@example.com",
    password: "GarageP1",
    confirmPassword: "GarageP1",
    garageName: "FixIt Garage",
    ownerName: "Alice Owner",
    phone: "9876543210",
    location: "Coimbatore",
    services: ["engine", "brakes"],
    mechanicCount: "3",
    operatingHours: "9 AM - 9 PM",
  };

  it("accepts valid garage signup data", () => {
    const result = garageSignupSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it("rejects empty garageName", () => {
    const result = garageSignupSchema.safeParse({ ...validInput, garageName: "" });
    expect(result.success).toBe(false);
    if (!result.success) {
      const msgs = result.error.issues.map((i) => i.message).join(" ");
      expect(msgs).toMatch(/garage name/i);
    }
  });

  it("rejects empty services", () => {
    const result = garageSignupSchema.safeParse({ ...validInput, services: [] });
    expect(result.success).toBe(false);
    if (!result.success) {
      const msgs = result.error.issues.map((i) => i.message).join(" ");
      expect(msgs).toMatch(/service/i);
    }
  });

  it("rejects short ownerName", () => {
    const result = garageSignupSchema.safeParse({ ...validInput, ownerName: "A" });
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// serviceRequestSchema
// ---------------------------------------------------------------------------
describe("serviceRequestSchema", () => {
  const validInput = {
    issueTag: "flat_tire",
    description: "Left front tire is completely flat and needs replacement.",
    requestType: "mechanic",
  };

  it("accepts valid request data", () => {
    const result = serviceRequestSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it("accepts requestType 'garage' and 'auto'", () => {
    expect(serviceRequestSchema.safeParse({ ...validInput, requestType: "garage" }).success).toBe(true);
    expect(serviceRequestSchema.safeParse({ ...validInput, requestType: "auto" }).success).toBe(true);
  });

  it("rejects empty issueTag", () => {
    const result = serviceRequestSchema.safeParse({ ...validInput, issueTag: "" });
    expect(result.success).toBe(false);
    if (!result.success) {
      const msgs = result.error.issues.map((i) => i.message).join(" ");
      expect(msgs).toMatch(/issue/i);
    }
  });

  it("rejects too-short description", () => {
    const result = serviceRequestSchema.safeParse({ ...validInput, description: "Short" });
    expect(result.success).toBe(false);
    if (!result.success) {
      const msgs = result.error.issues.map((i) => i.message).join(" ");
      expect(msgs).toMatch(/min 10/i);
    }
  });

  it("rejects invalid requestType", () => {
    const result = serviceRequestSchema.safeParse({ ...validInput, requestType: "bogus" });
    expect(result.success).toBe(false);
  });

  it("rejects empty description", () => {
    const result = serviceRequestSchema.safeParse({ ...validInput, description: "" });
    expect(result.success).toBe(false);
  });

  it("rejects missing issueTag field", () => {
    const { issueTag, ...without } = validInput;
    const result = serviceRequestSchema.safeParse(without);
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// reviewSchema
// ---------------------------------------------------------------------------
describe("reviewSchema", () => {
  it("accepts a valid review with all fields", () => {
    const result = reviewSchema.safeParse({ rating: 4, comment: "Great service!" });
    expect(result.success).toBe(true);
  });

  it("accepts a rating-only review (comment optional)", () => {
    const result = reviewSchema.safeParse({ rating: 5 });
    expect(result.success).toBe(true);
  });

  it("rejects rating below 1", () => {
    const result = reviewSchema.safeParse({ rating: 0 });
    expect(result.success).toBe(false);
  });

  it("rejects rating above 5", () => {
    const result = reviewSchema.safeParse({ rating: 6 });
    expect(result.success).toBe(false);
  });

  it("rejects non-number rating", () => {
    const result = reviewSchema.safeParse({ rating: "great" });
    expect(result.success).toBe(false);
  });
});
