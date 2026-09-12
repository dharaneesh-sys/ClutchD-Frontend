import { describe, it, expect } from "vitest";
import {
  ISSUE_TO_EXPERTISE,
  issueTagToExpertise,
  EXPERTISE_OPTIONS,
  ISSUE_TAGS,
} from "../constants";

// Expected mapping per task spec
const EXPECTED = {
  flat_tire: "tires",
  engine_failure: "engine",
  battery_dead: "battery",
  overheating: "engine",
  brake_issue: "brakes",
  oil_leak: "oil",
  electrical: "electrical",
  ac_not_working: "ac",
  transmission: "transmission",
  starting_issue: "engine",
  noise: "diagnostics",
  other: null,
};

describe("ISSUE_TO_EXPERTISE", () => {
  it("is exported and has exactly 12 keys", () => {
    expect(ISSUE_TO_EXPERTISE).toBeDefined();
    expect(typeof ISSUE_TO_EXPERTISE).toBe("object");
    expect(Object.keys(ISSUE_TO_EXPERTISE).length).toBe(12);
  });

  it("flat_tire resolves to tires", () => {
    expect(ISSUE_TO_EXPERTISE.flat_tire).toBe("tires");
  });

  it("all 12 map to expected values", () => {
    for (const [tag, expected] of Object.entries(EXPECTED)) {
      expect(ISSUE_TO_EXPERTISE[tag]).toBe(expected);
    }
  });

  it("covers every ISSUE_TAGS value", () => {
    const issueTagValues = new Set(ISSUE_TAGS.map((t) => t.value));
    for (const tag of Object.keys(ISSUE_TO_EXPERTISE)) {
      expect(issueTagValues.has(tag)).toBe(true);
    }
    for (const tag of issueTagValues) {
      expect(tag in ISSUE_TO_EXPERTISE).toBe(true);
    }
  });

  it("non-null targets exist in EXPERTISE_OPTIONS", () => {
    const expertiseValues = new Set(EXPERTISE_OPTIONS.map((o) => o.value));
    for (const [tag, exp] of Object.entries(ISSUE_TO_EXPERTISE)) {
      if (exp !== null) {
        expect(expertiseValues.has(exp)).toBe(true);
      }
    }
  });
});

describe("issueTagToExpertise(tag)", () => {
  it("is exported as function", () => {
    expect(typeof issueTagToExpertise).toBe("function");
  });

  it("all 12 resolve via helper", () => {
    for (const [tag, expected] of Object.entries(EXPECTED)) {
      expect(issueTagToExpertise(tag)).toBe(expected);
    }
  });

  it("bogus -> null", () => {
    expect(issueTagToExpertise("bogus")).toBeNull();
  });

  it("other -> null", () => {
    expect(issueTagToExpertise("other")).toBeNull();
  });

  it("unknown string -> null", () => {
    expect(issueTagToExpertise("does_not_exist")).toBeNull();
  });

  it("empty / null / undefined / non-string -> null", () => {
    expect(issueTagToExpertise("")).toBeNull();
    expect(issueTagToExpertise(null)).toBeNull();
    expect(issueTagToExpertise(undefined)).toBeNull();
    expect(issueTagToExpertise(123)).toBeNull();
  });

  it("flat_tire via helper resolves to tires (acceptance gate)", () => {
    expect(issueTagToExpertise("flat_tire")).toBe("tires");
  });
});
