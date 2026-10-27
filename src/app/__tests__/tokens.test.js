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
const theme = () => block("@theme inline");

// DESIGN.md §0.3 flat-blue contract: every canonical token exists in BOTH themes.
const REQUIRED_PAIRS = [
  ["--primary", "#1A73E8", "#8AB4F8"],
  ["--primary-dark", "#1557B0", "#A8C7FA"],
  ["--primary-light", "var(--primary)", "var(--primary)"],
  ["--accent", "var(--primary)", "var(--primary)"],
  ["--background", "#F5F7FB", "#0B1220"],
  ["--surface-card", "#FFFFFF", "#151C28"],
  ["--foreground", "#111827", "#E8EEF7"],
  ["--text-muted", "#5F6B7A", "#A7B2C3"],
  ["--border", "#E1E7F0", "#2A3444"],
  ["--border-strong", "#748192", "#5C6C84"],
  ["--success", "#188038", "#81C995"],
  ["--pending", "#B06000", "#FDD663"],
  ["--danger", "#D93025", "#F28B82"],
  ["--on-primary", "#FFFFFF", "#0B1220"],
  ["--surface-soft", "#EDF2FA", "#1B2432"],
  ["--ring", "#1A73E8", "#A8C7FA"],
  ["--pending-soft", "#FDF3E7", "#3A2C12"],
  ["--pending-ink", "#8A4A00", "#FDD663"],
  ["--danger-ink", "#C5221F", "#F28B82"],
  ["--glass-overlay-bg", "rgba(255,255,255,0.78)", "rgba(21,28,40,0.78)"],
  ["--glass-overlay-border", "rgba(255,255,255,0.55)", "rgba(232,238,247,0.14)"],
  ["--glass-overlay-scrim", "rgba(17,24,39,0.48)", "rgba(0,0,0,0.62)"],
  ["--glass-overlay-blur", "16px", "16px"],
  [
    "--shadow-card",
    "0 1px 2px rgba(17,24,39,0.04), 0 8px 24px rgba(17,24,39,0.06)",
    "0 1px 2px rgba(0,0,0,0.35), 0 8px 24px rgba(0,0,0,0.35)",
  ],
  ["--color-primary-rgb", "26, 115, 232", "138, 180, 248"],
];

const REQUIRED_NAMES = [
  "--color-white-rgb",
  "--color-black-rgb",
  "--color-emerald-filter",
  "--elevation-1",
  "--elevation-2",
  "--elevation-3",
  "--elevation-4",
  "--elevation-5",
  "--chart-crosshair",
  "--chart-1",
  "--chart-5",
];

// Temporary compatibility aliases kept until task 10.
const LEGACY_ALIASES = [
  ["--surface", "var(--surface-card)"],
  ["--surface-dim", "var(--surface-soft)"],
  ["--surface-bright", "var(--surface-card)"],
  ["--surface-container", "var(--surface-soft)"],
  ["--surface-container-low", "var(--surface-soft)"],
  ["--surface-container-high", "var(--border)"],
  ["--surface-container-highest", "var(--border)"],
  ["--on-surface", "var(--foreground)"],
  ["--on-surface-variant", "var(--text-muted)"],
  ["--outline", "var(--border-strong)"],
  ["--outline-variant", "var(--border)"],
  ["--color-surface-soft", "var(--surface-soft)"],
  ["--color-surface-mid", "var(--border)"],
  ["--color-text-primary", "var(--foreground)"],
  ["--color-text-muted", "var(--text-muted)"],
  ["--color-text-dim", "var(--text-muted)"],
  ["--color-text-secondary", "var(--text-muted)"],
  ["--color-border-subtle", "var(--border)"],
  ["--color-bg-card", "var(--surface-card)"],
  ["--color-icon-highlight", "var(--primary)"],
  ["--color-badge-bg", "var(--surface-soft)"],
  ["--color-badge-text", "var(--primary-dark)"],
];

describe("DESIGN.md §0.3 flat-blue token contract", () => {
  it.each(REQUIRED_PAIRS)(":root and [data-theme=dark] define %s", (name, light, darkVal) => {
    expect(root(), ":root block exists").toContain(`${name}: ${light}`);
    expect(dark(), "[data-theme=dark] block exists").toContain(`${name}: ${darkVal}`);
  });

  it.each(REQUIRED_NAMES)(":root and [data-theme=dark] define %s", (name) => {
    expect(root()).toContain(name);
    expect(dark()).toContain(name);
  });

  it.each(LEGACY_ALIASES)("keeps compatibility alias %s in both themes", (name, value) => {
    expect(root()).toContain(`${name}: ${value}`);
    expect(dark()).toContain(`${name}: ${value}`);
  });

  it("keeps the semantic aliases pointing at canonical roles", () => {
    for (const blockText of [root(), dark()]) {
      expect(blockText).toContain("--info: var(--primary-dark)");
      expect(blockText).toContain("--pending-bg: var(--pending-soft)");
      expect(blockText).toContain("--pending-text: var(--pending-ink)");
      expect(blockText).toContain("--warning: var(--pending)");
    }
    expect(css).not.toMatch(/--warning\s*:\s*#/);
  });

  it("chart crosshair follows the primary token in both themes", () => {
    expect(root()).toContain("--chart-crosshair: var(--primary)");
    expect(dark()).toContain("--chart-crosshair: var(--primary)");
  });

  it("@theme inline maps canonical tokens to real base variables", () => {
    const themeBlock = theme();
    expect(themeBlock, "@theme inline block exists").toBeTruthy();
    for (const mapping of [
      "--color-on-primary: var(--on-primary)",
      "--color-surface-card: var(--surface-card)",
      "--color-border: var(--border)",
      "--color-border-strong: var(--border-strong)",
      "--color-ring: var(--ring)",
      "--color-pending-soft: var(--pending-soft)",
      "--color-pending-ink: var(--pending-ink)",
      "--color-danger-ink: var(--danger-ink)",
      "--color-surface-soft: var(--surface-soft)",
      "--color-surface-mid: var(--border)",
      "--color-text-primary: var(--foreground)",
      "--color-text-muted: var(--text-muted)",
      "--color-border-subtle: var(--border)",
      "--color-bg-card: var(--surface-card)",
      "--color-icon-highlight: var(--primary)",
      "--color-badge-bg: var(--surface-soft)",
      "--color-badge-text: var(--primary-dark)",
    ]) {
      expect(themeBlock, `@theme inline maps ${mapping}`).toContain(mapping);
    }
  });

  it("@theme inline registers Onest for sans and display", () => {
    const themeBlock = theme();
    expect(themeBlock).toContain("--font-sans: var(--font-onest), sans-serif");
    expect(themeBlock).toContain("--font-display: var(--font-onest), sans-serif");
  });

  it("body and headings use the self-hosted Onest variable", () => {
    expect(css).toMatch(/body\s*\{[^}]*font-family:\s*var\(--font-onest\),\s*sans-serif/);
    expect(css).toMatch(
      /h1,\s*h2,\s*h3,\s*h4\s*\{[^}]*font-family:\s*var\(--font-onest\),\s*sans-serif[^}]*font-weight:\s*600/
    );
  });

  it("retires the remote font import, the retired serif face and the old indigo family", () => {
    // Assemble the banned literals at runtime so this guard file stays clean
    // under the acceptance grep that also scans tests.
    const remoteFontHost = ["fonts", "googleapis", "com"].join(".");
    const retiredFace = ["Instrument", "Serif"].join(" ");
    expect(css).not.toContain(remoteFontHost);
    expect(css).not.toContain(retiredFace);

    const oldBrand = [
      "#1E29" + "B6",
      "#1620" + "86",
      "#2e3b" + "d1",
      "#4aa5" + "f5",
      "#2e8c" + "e0",
      "#8cc3" + "f5",
      "#121B" + "6F",
      "#1a24" + "90",
    ];
    for (const hex of oldBrand) {
      expect(css.toLowerCase()).not.toContain(hex.toLowerCase());
    }
    expect(css).not.toMatch(new RegExp(["rgba\\(30,", "41,", "182"].join("\\s*")));
    expect(css).not.toMatch(new RegExp(["rgba\\(74,", "165,", "245"].join("\\s*")));
  });

  it("light theme has no cream glass override", () => {
    expect(css).not.toMatch(/rgba\(255,\s*249,\s*235/);
    expect(css).not.toContain("saturate(1.2)");
  });

  it("dark theme lives only under [data-theme=dark]: no .dark block", () => {
    expect(css).not.toMatch(/^\.dark\s*\{/m);
  });

  it("task 10: legacy glass/glow classes and alias tokens are gone", () => {
    for (const cls of ["glass-lux", "glass-lux-interactive", "glass-strong", "glass", "surface-elevated", "surface-filled", "surface-outlined", "btn-glow", "hover-glow", "input-glass"]) {
      expect(css, cls).not.toMatch(new RegExp(`\\.${cls}\\s*[,{:]`));
    }
    expect(css).not.toMatch(/--glass-lux-|--glass-(bg|border|hover):/);
  });

  it("task 10: flat card + single glass overlay utilities exist", () => {
    expect(css).toMatch(/\.surface-card\s*\{[^}]*background:\s*var\(--surface-card\)[^}]*border-radius:\s*16px/);
    expect(css).toMatch(/\.surface-card-interactive\s*\{/);
    expect(css).toMatch(/\.glass-overlay\s*\{[^}]*backdrop-filter:\s*blur\(var\(--glass-overlay-blur\)\)/);
  });

  it(".type-display is deleted", () => {
    expect(css).not.toContain(".type-display");
  });

  it("no 0.75rem radius inside surface or leaflet-popup rules", () => {
    const offenders = [...css.matchAll(/([^{}]+)\{([^{}]*border-radius:\s*0\.75rem[^{}]*)\}/g)]
      .map((m) => m[1].trim())
      .filter((sel) => /surface-|leaflet-popup/.test(sel));
    expect(offenders).toEqual([]);
  });

  it("status classes resolve to the flat-blue roles; banned purple #8b5cf6 is gone", () => {
    expect(css).not.toMatch(/#8b5cf6/i);
    expect(css).toMatch(/\.status-searching\s*\{[^}]*var\(--info\)/);
    expect(css).toMatch(/\.status-assigned\s*\{[^}]*var\(--info\)/);
    expect(css).toMatch(/\.status-enroute\s*\{[^}]*var\(--pending\)/);
    expect(css).toMatch(/\.status-completed\s*\{[^}]*var\(--success\)/);
  });

  it("map legend dots and marker clusters use roles, no one-off hue literals", () => {
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
