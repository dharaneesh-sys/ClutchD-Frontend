// Task 10: design-contract guard. Mirrors the plan's contract greps so a
// regression fails `npm test`, and checks rendered primitives carry no legacy
// classes. Documented exceptions: .omo/evidence/pilot/contract-exceptions.md.
import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { render } from "@testing-library/react";
import { Button } from "@/components/ui/Button";
import { GlassCard } from "@/components/ui/GlassCard";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { EmptyState } from "@/components/ui/EmptyState";

const SRC = path.resolve(process.cwd(), "src");

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (/\.(js|jsx|css)$/.test(entry.name) && !/\.test\./.test(entry.name)) out.push(full);
  }
  return out;
}

const FILES = walk(SRC).map((f) => ({ file: path.relative(process.cwd(), f), code: fs.readFileSync(f, "utf8") }));

function hits(regex, { except = () => false } = {}) {
  const found = [];
  for (const { file, code } of FILES) {
    code.split("\n").forEach((line, i) => {
      if (regex.test(line) && !except(file, line)) found.push(`${file}:${i + 1}: ${line.trim()}`);
    });
  }
  return found;
}

describe("Task 10: contract greps return zero in src/", () => {
  it("no retired font or indigo hexes", () => {
    expect(hits(/Instrument Serif|#1E29B6|#162086|#2e3bd1/i)).toEqual([]);
  });

  it("no legacy glass/surface/glow classes", () => {
    expect(
      hits(/glass-lux|glass-strong|surface-elevated|surface-filled|surface-outlined|btn-glow|hover-glow/)
    ).toEqual([]);
  });

  it("no dark: utilities (CSS custom properties like --primary-dark: are not utilities)", () => {
    expect(hits(/(^|[\s"'`])dark:/)).toEqual([]);
  });

  it("no white-alpha surfaces or borders", () => {
    expect(hits(/bg-white\/(5|10)|border-white\//)).toEqual([]);
  });

  it("no warning utilities (warning maps to pending)", () => {
    expect(hits(/text-warning|bg-warning|fill-warning/)).toEqual([]);
  });

  it("backdrop blur only on approved overlay surfaces", () => {
    const approved = [
      "src/app/globals.css",
      "src/components/dashboard/DashboardTabBar.js",
      "src/components/ui/BottomNav.js",
      "src/components/ui/GlassCard.js",
      "src/components/ui/SplashScreen.js",
      "src/components/charts/tooltip/tooltip-box.jsx",
    ];
    expect(hits(/backdrop-blur|backdrop-filter/, { except: (f) => approved.includes(f) })).toEqual([]);
  });
});

describe("Task 10: rendered primitives carry no legacy classes", () => {
  it("Button, GlassCard, Badge, Input, EmptyState", () => {
    const { container } = render(
      <div>
        <Button>Go</Button>
        <GlassCard>Card</GlassCard>
        <GlassCard variant="strong">Legacy</GlassCard>
        <Badge variant="warning">Pending</Badge>
        <Input label="Name" />
        <EmptyState title="Nothing yet" />
      </div>
    );
    const html = container.innerHTML;
    expect(html).not.toMatch(/glass-lux|glass-strong|btn-glow|hover-glow|surface-elevated|dark:|bg-white\//);
    expect(html).toContain("var(--primary)");
  });
});

describe("Task 10: flat-blue tokens", () => {
  const css = fs.readFileSync(path.join(SRC, "app/globals.css"), "utf8");
  const root = css.match(/:root\s*\{([\s\S]*?)\n\}/)[1];
  it.each([
    ["--primary", "#1A73E8"],
    ["--primary-dark", "#1557B0"],
    ["--background", "#F5F7FB"],
    ["--surface-card", "#FFFFFF"],
    ["--foreground", "#111827"],
    ["--text-muted", "#5F6B7A"],
    ["--border", "#E1E7F0"],
    ["--success", "#188038"],
    ["--pending", "#B06000"],
    ["--danger", "#D93025"],
  ])("%s = %s", (name, value) => {
    expect(root).toMatch(new RegExp(`${name}:\\s*${value};`, "i"));
  });
});
