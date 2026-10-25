import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

const css = fs.readFileSync(path.resolve(process.cwd(), "src/app/globals.css"), "utf8");

function block(selector) {
  const m = css.match(new RegExp(`${selector}\\s*\\{([\\s\\S]*?)\\}`, "m"));
  return m ? m[1] : null;
}

const root = () => block(":root");
const dark = () => block('\\[data-theme="dark"\\]');

// D1 grounded-blue palette + D7 status roles: every token must exist in BOTH themes.
const REQUIRED_PAIRS = [
  ["--background", "#f4f6fc", "#09090b"],
  ["--foreground", "#171a2e", "#fafafa"],
  ["--primary", "#1E29B6", "#4aa5f5"],
  ["--primary-dark", "#162086", "#2e8ce0"],
  ["--primary-light", "#2e3bd1", "#8cc3f5"],
  ["--accent", "#1E29B6", "#4aa5f5"],
  ["--danger", "#ef4444", "#ef4444"],
  ["--success", "#22c55e", "#22c55e"],
  ["--info", "#3b82f6", "#60a5fa"],
  ["--pending", "#f59e0b", "#fbbf24"],
  ["--pending-bg", "rgba(245,158,11,0.14)", "rgba(251,191,36,0.16)"],
  ["--pending-text", "#b45309", "#fcd34d"],
  ["--color-icon-highlight", "#1E29B6", "#4aa5f5"],
  ["--color-badge-text", "#1E29B6", "#8cc3f5"],
  ["--glass-lux-bg", "rgba(239, 242, 255, 0.85)", "rgba(12, 12, 15, 0.55)"],
  ["--glass-lux-radius", "1.25rem", "1.25rem"],
];

const REQUIRED_NAMES = [
  "--color-primary-rgb",
  "--color-badge-bg",
  "--color-surface-soft",
  "--color-surface-mid",
  "--glass-lux-border",
  "--glass-lux-shadow",
  "--surface",
  "--surface-container-low",
  "--surface-container",
  "--surface-container-high",
  "--surface-container-highest",
  "--on-surface",
  "--on-surface-variant",
  "--outline",
  "--outline-variant",
  "--elevation-1",
  "--elevation-2",
  "--elevation-3",
  "--elevation-4",
  "--elevation-5",
  "--chart-crosshair",
];

describe("DESIGN.md token contract (Wave-1 Task 1: D1/D2/D4/D5/D7)", () => {
  it.each(REQUIRED_PAIRS)(":root and [data-theme=dark] define %s", (name, light, darkVal) => {
    expect(root(), ":root block exists").toContain(`${name}: ${light}`);
    expect(dark(), "[data-theme=dark] block exists").toContain(`${name}: ${darkVal}`);
  });

  it.each(REQUIRED_NAMES)(":root and [data-theme=dark] define %s", (name) => {
    expect(root()).toContain(name);
    expect(dark()).toContain(name);
  });

  it("@theme inline maps --color-info, --color-pending and --color-warning (warning aliases pending)", () => {
    expect(css).toContain("--color-info: var(--info)");
    expect(css).toContain("--color-pending: var(--pending)");
    expect(css).toContain("--color-warning: var(--pending)");
  });

  it("--warning maps to pending in both themes, never a literal", () => {
    expect(css).not.toMatch(/--warning\s*:\s*#/);
    expect(root()).toContain("--warning: var(--pending)");
    expect(dark()).toContain("--warning: var(--pending)");
  });

  it("light glass-lux override is a flat opaque surface, not cream glass", () => {
    expect(css).not.toMatch(/rgba\(255,\s*249,\s*235/);
    expect(css).not.toContain("saturate(1.2)");
  });

  it("dark theme lives only under [data-theme=dark]: no .dark block (D1/D2)", () => {
    expect(css).not.toMatch(/^\.dark\s*\{/m);
  });

  it("exactly two canonical glass variants exist; glass-lux-strong and standalone glass-hover are gone (D5)", () => {
    expect(css).toMatch(/\.glass-lux\s*[,{]/);
    expect(css).toMatch(/\.glass-lux-interactive\s*[,{]/);
    expect(css).not.toMatch(/\.glass-lux-strong\s*[,{]/);
    expect(css).not.toMatch(/\.glass-hover[\s:{]/);
  });

  it(".type-display is deleted (D3)", () => {
    expect(css).not.toContain(".type-display");
  });

  it("no 0.75rem radius inside surface or leaflet-popup rules (D4)", () => {
    const offenders = [...css.matchAll(/([^{}]+)\{([^{}]*border-radius:\s*0\.75rem[^{}]*)\}/g)]
      .map((m) => m[1].trim())
      .filter((sel) => /surface-|leaflet-popup/.test(sel));
    expect(offenders).toEqual([]);
  });

  it("status classes resolve to D7 roles; banned purple #8b5cf6 is gone", () => {
    expect(css).not.toMatch(/#8b5cf6/i);
    expect(css).toMatch(/\.status-searching\s*\{[^}]*var\(--info\)/);
    expect(css).toMatch(/\.status-assigned\s*\{[^}]*var\(--info\)/);
    expect(css).toMatch(/\.status-enroute\s*\{[^}]*var\(--pending\)/);
    expect(css).toMatch(/\.status-completed\s*\{[^}]*var\(--success\)/);
  });

  it("map legend dots and marker clusters use grounded roles, no one-off hue literals", () => {
    for (const dot of ["blue", "red", "green", "violet", "target"]) {
      const m = css.match(new RegExp(`\\.legend-dot-${dot}\\s*\\{([^}]*)\\}`));
      expect(m, `.legend-dot-${dot} exists`).toBeTruthy();
      expect(m[1]).toMatch(/var\(--/);
      expect(m[1]).not.toMatch(/#[0-9a-fA-F]{3,6}/);
    }
    expect(css).not.toMatch(/16,\s*185,\s*129/); // emerald cluster
    expect(css).not.toMatch(/14,\s*165,\s*233/); // sky cluster
  });
});
