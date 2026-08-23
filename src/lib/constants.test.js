import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  ISSUE_TO_EXPERTISE,
  issueTagToExpertise,
  EXPERTISE_OPTIONS,
  ISSUE_TAGS,
} from "./constants.js";

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
    assert.ok(ISSUE_TO_EXPERTISE, "ISSUE_TO_EXPERTISE should be defined");
    assert.equal(typeof ISSUE_TO_EXPERTISE, "object");
    assert.equal(Object.keys(ISSUE_TO_EXPERTISE).length, 12);
  });

  it("flat_tire resolves to tires", () => {
    assert.equal(ISSUE_TO_EXPERTISE.flat_tire, "tires");
  });

  it("all 12 map to expected values", () => {
    for (const [tag, expected] of Object.entries(EXPECTED)) {
      assert.equal(
        ISSUE_TO_EXPERTISE[tag],
        expected,
        `ISSUE_TO_EXPERTISE[${tag}] expected ${expected} got ${ISSUE_TO_EXPERTISE[tag]}`
      );
    }
  });

  it("covers every ISSUE_TAGS value", () => {
    const issueTagValues = new Set(ISSUE_TAGS.map((t) => t.value));
    for (const tag of Object.keys(ISSUE_TO_EXPERTISE)) {
      assert.ok(issueTagValues.has(tag), `ISSUE_TO_EXPERTISE key ${tag} not in ISSUE_TAGS`);
    }
    for (const tag of issueTagValues) {
      assert.ok(tag in ISSUE_TO_EXPERTISE, `ISSUE_TAGS value ${tag} missing in ISSUE_TO_EXPERTISE`);
    }
  });

  it("non-null targets exist in EXPERTISE_OPTIONS", () => {
    const expertiseValues = new Set(EXPERTISE_OPTIONS.map((o) => o.value));
    for (const [tag, exp] of Object.entries(ISSUE_TO_EXPERTISE)) {
      if (exp !== null) {
        assert.ok(
          expertiseValues.has(exp),
          `ISSUE_TO_EXPERTISE[${tag}] -> ${exp} not found in EXPERTISE_OPTIONS`
        );
      }
    }
  });
});

describe("issueTagToExpertise(tag)", () => {
  it("is exported as function", () => {
    assert.equal(typeof issueTagToExpertise, "function");
  });

  it("all 12 resolve via helper", () => {
    for (const [tag, expected] of Object.entries(EXPECTED)) {
      assert.equal(
        issueTagToExpertise(tag),
        expected,
        `issueTagToExpertise(${tag}) expected ${expected}`
      );
    }
  });

  it("bogus -> null", () => {
    assert.equal(issueTagToExpertise("bogus"), null);
  });

  it("other -> null", () => {
    assert.equal(issueTagToExpertise("other"), null);
  });

  it("unknown string -> null", () => {
    assert.equal(issueTagToExpertise("does_not_exist"), null);
  });

  it("empty / null / undefined -> null", () => {
    assert.equal(issueTagToExpertise(""), null);
    assert.equal(issueTagToExpertise(null), null);
    assert.equal(issueTagToExpertise(undefined), null);
    assert.equal(issueTagToExpertise(123), null);
  });

  it("flat_tire via helper resolves to tires (acceptance gate)", () => {
    assert.equal(issueTagToExpertise("flat_tire"), "tires");
  });
});
