import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = process.cwd();
const FILES = [
  "src/app/dashboard/mechanic/page.js",
  "src/app/dashboard/garage/page.js",
  "src/app/dashboard/fleet/page.js",
  "src/components/mechanic/AvailabilityToggle.js",
  "src/components/mechanic/ProfileEditor.js",
  "src/components/mechanic/CertificationBadge.js",
  "src/components/mechanic/IncomingJobs.js",
  "src/components/fleet/FleetRegistrationForm.js",
  "src/components/fleet/FleetDashboard.js",
  "src/components/dashboard/MapView.js",
];

const src = FILES.map((f) => readFileSync(resolve(ROOT, f), "utf8")).join("\n");

describe("W4 finding dashboards contract (DESIGN.md)", () => {
  it("has no white/black hardcoded washes", () => {
    for (const pat of ["text-white", "bg-white/", "border-white/", "bg-black/", "text-blue-300", "bg-blue-500/", "text-green-400", "bg-green-500/", "bg-warning", "text-red-300", "text-red-400", "text-red-500", "bg-red-500/", "border-red-500/", "from-red", "from-blue", "to-blue", "hover:text-red-", "hover:bg-red-"]) {
      expect(src, pat).not.toContain(pat);
    }
  });

  it("has no dark: classes (data-theme vars only)", () => {
    expect(src).not.toContain("dark:");
  });

  it("has no stone/zinc one-off neutrals", () => {
    expect(src).not.toMatch(/bg-stone-|dark:bg-zinc-|border-slate-|text-slate-/);
  });

  it("has no legacy glass-lux-strong or CTA glow shadows", () => {
    expect(src).not.toContain("glass-lux-strong");
    expect(src).not.toMatch(/hover:shadow-\[0_12px_40px/);
  });

  it("has no raw hex fills", () => {
    expect(src).not.toMatch(/bg-\[#[0-9a-fA-F]{3,6}\]/);
  });

  it("map legend uses info role, not orange", () => {
    expect(src).not.toContain("legend-dot-orange");
  });
});
