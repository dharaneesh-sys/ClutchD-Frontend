// Wave-3 Task 7 — RED-first contract tests for the profile shell.
// DESIGN.md: D1 (grounded blue, no white-wash chips, no warning refs),
// D3 (headline-3/body-2 shell language), D4 (cards rounded-2xl),
// D5 (glass-lux 2-variant only), D7/D15 (danger/info/pending roles, no red-*).
import "@testing-library/jest-dom/vitest";
import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

const profileDir = path.resolve(process.cwd(), "src/app/marketplace/profile");
const uiDir = path.resolve(process.cwd(), "src/components/ui");

const read = (p) => fs.readFileSync(p, "utf8");
const screens = () => ({
  profile: read(path.join(profileDir, "page.js")),
  settings: read(path.join(profileDir, "settings/page.js")),
  edit: read(path.join(profileDir, "edit/page.js")),
  account: read(path.join(profileDir, "account/page.js")),
});

describe("profile shell language (D3/D4/D5)", () => {
  it("all 4 screens use glass-lux cards with rounded-2xl, no legacy variants", () => {
    for (const [name, code] of Object.entries(screens())) {
      expect(code, `${name} needs glass-lux`).toContain("glass-lux");
      expect(code, `${name} needs rounded-2xl`).toContain("rounded-2xl");
      expect(code, `${name} bans legacy glass`).not.toMatch(
        /glass-strong|glass-lux-strong|surface-elevated|surface-filled|surface-outlined/
      );
    }
  });

  it("all 4 screens use headline/body type steps, no type-display", () => {
    for (const [name, code] of Object.entries(screens())) {
      expect(code, `${name} needs headline-3`).toMatch(/type-headline-3|headline-3/);
      expect(code, `${name} needs body-2`).toMatch(/type-body-2|body-2/);
      expect(code, `${name} bans type-display`).not.toContain("type-display");
      expect(code, `${name} bans hardcoded font-family`).not.toMatch(/font-family/);
    }
  });
});

describe("profile shell grounded blue (D1/D7/D15)", () => {
  it("no white-wash chips or white hardcodes on any screen", () => {
    for (const [name, code] of Object.entries(screens())) {
      expect(code, `${name} bans bg-white wash`).not.toMatch(/bg-white\//);
      // D15.1 on-primary/on-error (#FFFFFF on primary/danger fills) is
      // sanctioned; every other text-white is a hardcoded escape.
      for (const line of code.split("\n")) {
        if (/text-white/.test(line)) {
          expect(
            line,
            `${name}: text-white allowed only on primary/danger fills`
          ).toMatch(/bg-primary|bg-danger/);
        }
      }
      expect(code, `${name} bans white borders/rings/dividers`).not.toMatch(
        /border-white|ring-white|divide-white|hover:bg-white/
      );
    }
  });

  it("no warning-token or red-* hardcodes; danger/info/pending roles only", () => {
    for (const [name, code] of Object.entries(screens())) {
      expect(code, `${name} bans warning token`).not.toMatch(/bg-warning|text-warning|var\(--warning\)/);
      expect(code, `${name} bans red-* hardcodes`).not.toMatch(/red-400|red-500/);
      expect(code, `${name} bans malformed color-mix chips`).not.toMatch(
        /color-primary-rgb\]|15\[0\.06\]|15\[0\.12\]/
      );
    }
  });

  it("no dark: branches and no 0.75rem radius outliers", () => {
    for (const [name, code] of Object.entries(screens())) {
      expect(code, `${name} bans dark:`).not.toMatch(/dark:/);
      expect(code, `${name} bans 0.75rem radius`).not.toMatch(/0\.75rem/);
    }
  });
});

describe("KycBadge / KycDocumentsSection display (D5/D7)", () => {
  it("submitted maps to a sanctioned Badge variant (no warning prop)", () => {
    const code = read(path.join(uiDir, "KycBadge.js"));
    expect(code).not.toMatch(/variant:\s*"warning"/);
  });

  it("KycDocumentsSection uses the default glass-lux variant (no strong)", () => {
    const code = read(path.join(uiDir, "KycDocumentsSection.js"));
    expect(code).not.toMatch(/variant="strong"|glass-lux-strong/);
    expect(code).not.toMatch(/red-400|red-500/);
    expect(code).not.toMatch(/bg-white\//);
  });
});

describe("BackButton display (D4/D11)", () => {
  it("keeps token hover surface and a 44px touch target", () => {
    const code = read(path.join(uiDir, "BackButton.js"));
    expect(code).toContain("hover:bg-surface-soft");
    expect(code).toMatch(/min-h-\[44px\]|h-11|min-h-11/);
  });
});
