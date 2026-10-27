import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (p) => fs.readFileSync(path.join(root, p), "utf8");

// Wave-6 Task 14 — DESIGN.md contract tests for landing + auth + global shell.
// RED first: banned tokens below exist in the pre-redesign sources and MUST
// fail until the GREEN restyle lands (Gates G3/G6, sections D1/D4/D5/D15).
describe("Wave-6 Task 14: landing/auth/shell design contract (D1/D4/D5/D15)", () => {
  it("landing page uses only sanctioned glass variants (D5)", () => {
    const src = read("src/app/page.js");
    expect(src).not.toContain("glass-lux-strong");
    expect(src).toMatch(/surface-card|<GlassCard/);
  });

  it("landing page has no white hardcodes or glow shadows (D1.1)", () => {
    const src = read("src/app/page.js");
    expect(src).not.toMatch(/text-white|bg-white|border-white/);
    expect(src).not.toMatch(/shadow-\[0_0_/);
  });

  it("landing page radii follow D4 (cards 2xl, no 3xl outliers)", () => {
    const src = read("src/app/page.js");
    expect(src).not.toContain("rounded-3xl");
  });

  it("auth shell page has no white hardcodes (D1.1)", () => {
    const src = read("src/app/auth/page.js");
    expect(src).not.toMatch(/text-white|bg-white|border-white/);
    expect(src).toMatch(/surface-card|<GlassCard/);
  });

  it("LoginCard uses surface-card + danger tokens, no red-*/glow/undefined utilities (D5/D7/D15)", () => {
    const src = read("src/components/auth/LoginCard.js");
    expect(src).not.toContain("glass-lux-strong");
    expect(src).not.toMatch(/red-500|red-400/);
    expect(src).not.toMatch(/shadow-\[0_0_/);
    expect(src).not.toContain("primary-text");
    expect(src).toMatch(/surface-card|<GlassCard/);
  });

  it("SignUpCard uses surface-card + danger tokens, no red-*/glow (D5/D7/D15)", () => {
    const src = read("src/components/auth/SignUpCard.js");
    expect(src).not.toContain("glass-lux-strong");
    expect(src).not.toMatch(/red-500|red-400/);
    expect(src).not.toMatch(/shadow-\[0_0_/);
    expect(src).toMatch(/surface-card|<GlassCard/);
  });

  it("not-found uses surface-card + defined tokens only (D5/D15)", () => {
    const src = read("src/app/not-found.js");
    expect(src).not.toMatch(/"glass[ "]/);
    expect(src).not.toContain("--secondary");
    expect(src).not.toMatch(/text-white/);
    expect(src).toMatch(/surface-card|<GlassCard/);
  });
});

describe("Wave-6 Task 14: auth flows + shell wiring stay identical", () => {
  it("global-error keeps all recovery flows (retry / login / clear data)", () => {
    const src = read("src/app/global-error.js");
    expect(src).toContain("Try Again");
    expect(src).toContain("Go to Login");
    expect(src).toContain("Clear app data and restart");
    expect(src).toContain("/auth");
  });

  it("root layout keeps light default + shell providers (D2)", () => {
    const src = read("src/app/layout.js");
    expect(src).toContain('data-theme="light"');
    expect(src).toContain("ThemeProvider");
    expect(src).toContain("AuthInit");
    expect(src).toContain("PushInit");
    expect(src).toContain("BackButtonHandler");
  });

  it("AuthInit stays headless and restores the session (logic frozen)", () => {
    const src = read("src/components/ui/AuthInit.js");
    expect(src).toContain("restoreSession");
    expect(src).toContain("registerOnlineFlush");
    expect(src).toContain("return null");
  });

  it("BackButtonHandler keeps exit-confirm + escape-stack order (logic frozen)", () => {
    const src = read("src/components/ui/BackButtonHandler.js");
    expect(src).toContain("backButton");
    expect(src).toContain("Exit ClutchD?");
    expect(src).toContain("getBackTarget");
  });
});
