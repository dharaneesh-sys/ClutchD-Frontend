// Wave-3 Task 9 — RED-first contract tests for profile support screens.
// DESIGN.md: D1 (grounded blue, BAN one-off hues/white hardcodes/neon),
// D3 (headline-3/body-2 shell language), D4 (cards rounded-2xl),
// D5 (surface-card 2-variant only), D7/D15 (danger/info/pending roles;
// SOS queued/confirming use pending, never blue/red), D9 (SOS inline,
// 2-tap, no overlay), D10 (parts store outranks discovery/SOS).
import "@testing-library/jest-dom/vitest";
import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

const profileDir = path.resolve(process.cwd(), "src/app/marketplace/profile");
const uiDir = path.resolve(process.cwd(), "src/components/ui");

const read = (p) => fs.readFileSync(p, "utf8");
const screens = () => ({
  help: read(path.join(profileDir, "help/page.js")),
  safety: read(path.join(profileDir, "safety/page.js")),
  care: read(path.join(profileDir, "care/page.js")),
  services: read(path.join(profileDir, "services/page.js")),
  refer: read(path.join(profileDir, "refer/page.js")),
  quickActions: read(path.join(profileDir, "quick-actions/page.js")),
});
const shared = () => ({
  ReferralPanel: read(path.join(uiDir, "ReferralPanel.js")),
  SOSButton: read(path.join(uiDir, "SOSButton.js")),
  useSOS: read(path.join(uiDir, "useSOS.js")),
  ErrorCard: read(path.join(uiDir, "ErrorCard.js")),
  EmptyState: read(path.join(uiDir, "EmptyState.js")),
});
const allTouched = () => ({ ...screens(), ...shared() });

describe("support screens share the profile shell language (D3/D4/D5)", () => {
  it("all 6 screens use surface-card cards with rounded-2xl, no legacy variants or glow", () => {
    for (const [name, code] of Object.entries(screens())) {
      expect(code, `${name} needs a flat card`).toMatch(/surface-card|<GlassCard/);
      expect(code, `${name} needs rounded-2xl`).toContain("rounded-2xl");
      expect(code, `${name} bans legacy glass`).not.toMatch(
        /glass-strong|glass-lux-strong|surface-elevated|surface-filled|surface-outlined/
      );
      expect(code, `${name} bans neon glow`).not.toMatch(/btn-glow|hover-glow/);
    }
  });

  it("all 6 screens use headline-3/body-2, no type-display", () => {
    for (const [name, code] of Object.entries(screens())) {
      expect(code, `${name} needs headline-3`).toMatch(/type-headline-3|headline-3/);
      expect(code, `${name} needs body-2`).toMatch(/type-body-2|body-2/);
      expect(code, `${name} bans type-display`).not.toContain("type-display");
    }
  });
});

describe("support screens stay in grounded blue (D1/D7/D15)", () => {
  it("no one-off hues: indigo/violet/blue-400/orange escapes", () => {
    for (const [name, code] of Object.entries(allTouched())) {
      expect(code, `${name} bans indigo`).not.toMatch(/indigo-/);
      expect(code, `${name} bans violet`).not.toMatch(/violet-/);
      expect(code, `${name} bans blue-400`).not.toContain("blue-400");
      expect(code, `${name} bans orange-*`).not.toMatch(/orange-/);
      expect(code, `${name} bans purple hex`).not.toMatch(/#a78bfa|#c4b5fd/i);
    }
  });

  it("no white-wash surfaces or white hardcodes", () => {
    for (const [name, code] of Object.entries(allTouched())) {
      expect(code, `${name} bans bg-white wash`).not.toMatch(/bg-white\//);
      expect(code, `${name} bans white borders/rings/dividers`).not.toMatch(
        /border-white|ring-white|divide-white|hover:bg-white/
      );
    }
  });

  it("no red-* hardcodes; danger role only (ErrorCard/SOS surfaces included)", () => {
    for (const [name, code] of Object.entries(allTouched())) {
      expect(code, `${name} bans red-* hardcodes`).not.toMatch(/red-400|red-500|red-600|red-700/);
    }
  });

  it("no warning-token refs; info/pending roles only", () => {
    for (const [name, code] of Object.entries(allTouched())) {
      expect(code, `${name} bans warning token`).not.toMatch(
        /bg-warning|text-warning|var\(--warning\)|variant:\s*"warning"/
      );
    }
  });

  it("no dark: branches and no 0.75rem radius outliers", () => {
    for (const [name, code] of Object.entries(allTouched())) {
      expect(code, `${name} bans dark:`).not.toMatch(/dark:/);
      expect(code, `${name} bans 0.75rem radius`).not.toMatch(/0\.75rem/);
    }
  });
});

describe("referral display (D1/D5)", () => {
  it("ReferralPanel uses surface-card only, no purple hex fallbacks", () => {
    const code = shared().ReferralPanel;
    expect(code).toMatch(/surface-card|<GlassCard/);
    expect(code).not.toMatch(/variant="glass"/);
    expect(code).not.toMatch(/#[0-9a-fA-F]{3,6}/);
  });

  it("refer screen exposes copy + share actions", () => {
    const code = screens().refer;
    expect(code).toMatch(/onCopy|handleCopy|Copy/);
    expect(code).toMatch(/onShare|handleShare|Share/);
  });
});

describe("SOS stays reachable but subordinate (D7/D9/D10/D15)", () => {
  it("safety screen keeps an inline SOS section (no overlay, 2-tap confirm copy)", () => {
    const code = screens().safety;
    expect(code).toMatch(/Emergency SOS/);
    expect(code).toMatch(/confirming|Tap AGAIN|Tap again/);
    expect(code).not.toMatch(/fixed inset-0.*SOS|SOS.*fixed inset-0/);
  });

  it("SOSButton has no neon glow shadows and no fixed positioning", () => {
    const code = shared().SOSButton;
    expect(code).not.toMatch(/shadow-\[0_0_20px/);
    expect(code).not.toContain("fixed");
  });

  it("SOS queued/offline states use the pending role, never blue/red", () => {
    for (const [name, code] of Object.entries({
      safety: screens().safety,
      SOSButton: shared().SOSButton,
    })) {
      expect(code, `${name} bans blue queued copy`).not.toMatch(
        /text-\[var\(--primary-light\)\]/
      );
    }
    expect(shared().SOSButton).toMatch(/pending/);
  });

  it("quick-actions keeps the parts-store shortcut at full weight (D10)", () => {
    const code = screens().quickActions;
    expect(code).toContain("/marketplace");
    expect(code).toMatch(/Browse Parts/);
  });

  it("useSOS data logic is frozen: 2-tap confirm, geo fallback, rate limits", () => {
    const code = shared().useSOS;
    expect(code).toContain("SOS_RATE_LIMIT_MS");
    expect(code).toContain("SOS_CONFIRM_WINDOW_MS");
    expect(code).toContain("SOS_GEO_TIMEOUT_MS");
    expect(code).toContain("/service/sos");
    expect(code).toMatch(/confirming/);
  });
});

describe("empty/error states use shared components (D5)", () => {
  it("care/services/refer/quick-actions render EmptyState, not raw empty copy", () => {
    for (const name of ["care", "services", "refer", "quickActions"]) {
      const code = screens()[name];
      expect(code, `${name} imports EmptyState`).toMatch(/EmptyState/);
      expect(code, `${name} renders <EmptyState`).toContain("<EmptyState");
    }
  });

  it("ErrorCard uses surface-card, not legacy glass", () => {
    const code = shared().ErrorCard;
    expect(code).toMatch(/surface-card|<GlassCard/);
    expect(code).not.toMatch(/"glass |glass p-/);
  });
});
