// Wave-3 Task 8 — RED-first contract tests for profile commerce (6 screens).
// DESIGN.md: D1 (grounded blue, no one-off hues, no white hardcodes),
// D4 (cards rounded-2xl, controls rounded-xl), D5 (glass-lux 2-variant only),
// D7/D15 (status chips info/pending/success/danger only, no warning refs,
// no red-*/sky/lime/teal/zinc hardcodes), D3 (headline-3/body-2 language).
import "@testing-library/jest-dom/vitest";
import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

const profileDir = path.resolve(process.cwd(), "src/app/marketplace/profile");
const subDir = path.resolve(process.cwd(), "src/components/subscription");
const dashDir = path.resolve(process.cwd(), "src/components/dashboard");

const read = (p) => fs.readFileSync(p, "utf8");
const files = () => ({
  orders: read(path.join(profileDir, "orders/page.js")),
  favorites: read(path.join(profileDir, "favorites/page.js")),
  payments: read(path.join(profileDir, "payments/page.js")),
  warranty: read(path.join(profileDir, "warranty/page.js")),
  subscription: read(path.join(subDir, "SubscriptionManager.js")),
  planCard: read(path.join(subDir, "PlanCard.js")),
  clutchdCard: read(path.join(profileDir, "clutchd-card/page.js")),
  warrantyTerms: read(path.join(dashDir, "WarrantyTerms.js")),
});

describe("profile commerce cards (D4/D5)", () => {
  it("screens and GlassCard consumers use glass-lux with rounded-2xl, no legacy variants", () => {
    const { warrantyTerms: _terms, ...rest } = files();
    for (const [name, code] of Object.entries(rest)) {
      expect(code, `${name} needs glass-lux`).toContain("glass-lux");
      expect(code, `${name} bans legacy glass`).not.toMatch(
        /glass-strong|glass-lux-strong|surface-elevated|surface-filled|surface-outlined/
      );
      expect(code, `${name} bans deprecated glass variant prop`).not.toMatch(
        /variant="glass"/
      );
    }
    // Pages carry rounded-2xl literally; GlassCard consumers inherit it
    // from the primitive (D5 consumption API). WarrantyTerms is a
    // token-driven card and carries rounded-2xl literally.
    const { subscription: _sub, planCard: _plan, ...pages } = rest;
    for (const [name, code] of Object.entries(pages)) {
      expect(code, `${name} needs rounded-2xl`).toContain("rounded-2xl");
    }
    expect(files().warrantyTerms, "warrantyTerms needs rounded-2xl").toContain(
      "rounded-2xl"
    );
  });

  it("all commerce files use headline/body type steps, no type-display", () => {
    const { planCard: _plan, warrantyTerms: _terms, ...screens } = files();
    for (const [name, code] of Object.entries(screens)) {
      expect(code, `${name} needs headline-3`).toMatch(/type-headline-3|headline-3/);
      expect(code, `${name} needs body-2`).toMatch(/type-body-2|body-2/);
      expect(code, `${name} bans type-display`).not.toContain("type-display");
      expect(code, `${name} bans Instrument Serif body`).not.toContain("Instrument Serif");
    }
  });
});

describe("profile commerce grounded blue (D1/D7/D15)", () => {
  it("no white-wash chips or white hardcodes in any commerce file", () => {
    for (const [name, code] of Object.entries(files())) {
      expect(code, `${name} bans bg-white wash`).not.toMatch(/bg-white\//);
      // D15.1 on-primary/on-error (light text on primary/danger fills) is
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

  it("no warning-token, red-*, or one-off hue hardcodes in any commerce file", () => {
    for (const [name, code] of Object.entries(files())) {
      expect(code, `${name} bans warning token`).not.toMatch(
        /bg-warning|text-warning|fill-warning|var\(--warning\)|variant:\s*"warning"/
      );
      expect(code, `${name} bans red-* hardcodes`).not.toMatch(/red-300|red-400|red-500|red-600/);
      expect(code, `${name} bans one-off hues`).not.toMatch(
        /sky-|lime|teal-|zinc-|orange-|rose-|purple-|violet-|emerald-|cyan-|amber-|gray-500/
      );
      expect(code, `${name} bans purple exception`).not.toContain("#8b5cf6");
    }
  });

  it("no dark: branches, no glow utilities, no 0.75rem outliers", () => {
    for (const [name, code] of Object.entries(files())) {
      expect(code, `${name} bans dark:`).not.toMatch(/dark:/);
      expect(code, `${name} bans glow`).not.toMatch(/btn-glow|hover-glow/);
      expect(code, `${name} bans 0.75rem radius`).not.toMatch(/0\.75rem/);
    }
  });
});

describe("profile commerce status chips (D7)", () => {
  it("orders maps searching/assigned to info, en_route/pending to pending (no warning)", () => {
    const { orders } = files();
    expect(orders).toMatch(/searching:\s*"info"/);
    expect(orders).toMatch(/assigned:\s*"info"/);
    expect(orders).toMatch(/en_route:\s*"pending"/);
    expect(orders).toMatch(/pending:\s*"pending"/);
    expect(orders).toMatch(/completed:\s*"success"/);
    expect(orders).toMatch(/cancelled:\s*"danger"/);
  });

  it("payments maps pending to pending, refunded to info (no warning)", () => {
    const { payments } = files();
    expect(payments).toMatch(/pending:\s*\{\s*variant:\s*"pending"/);
    expect(payments).toMatch(/completed:\s*\{\s*variant:\s*"success"/);
    expect(payments).toMatch(/failed:\s*\{\s*variant:\s*"danger"/);
    expect(payments).toMatch(/refunded:\s*\{\s*variant:\s*"info"/);
  });

  it("warranty ClaimStatusBadge remaps non-sanctioned store colors to pending", () => {
    const { warranty } = files();
    expect(warranty, "warranty funnels unknown colors to pending").toMatch(/pending/);
    expect(warranty, "warranty allowlists sanctioned variants with pending fallback").toMatch(/\["info", "pending", "success", "danger", "default"\]/);
    expect(warranty, "warranty bans warning passthrough").not.toMatch(/variant:\s*"warning"|bg-warning|text-warning/);
  });

  it("subscription status + PlanCard use pending/success/danger roles only", () => {
    const { subscription, planCard } = files();
    expect(subscription).not.toMatch(/variant:\s*"warning"|text-warning|bg-warning/);
    expect(planCard).not.toMatch(/variant:\s*"warning"|text-warning|bg-warning/);
    expect(planCard, "current-plan chip is pending-role").toMatch(/pending/);
  });

  it("clutchd-card tiers resolve to token roles, never hue literals", () => {
    const { clutchdCard } = files();
    const tierBlock = clutchdCard.slice(
      clutchdCard.indexOf("TIER_CONFIG"),
      clutchdCard.indexOf("getTierConfig")
    );
    expect(tierBlock).not.toMatch(/#[0-9a-fA-F]{3,6}/);
    expect(tierBlock).not.toMatch(/sky|lime|teal|zinc|gray|orange|rose|purple|violet|emerald|cyan|amber/);
  });
});

describe("profile commerce behavior preserved", () => {
  it("keeps data routes, stores, modals, and download flows identical", () => {
    const f = files();
    expect(f.orders).toContain("/jobs/history");
    expect(f.orders).toContain("downloadOrderReceipt");
    expect(f.favorites).toContain("/favorites");
    expect(f.favorites).toContain("/marketplace/product/id");
    expect(f.payments).toContain("/payments/history");
    expect(f.payments).toContain("downloadPaymentReceipt");
    expect(f.warranty).toContain("WarrantyClaimsStore");
    expect(f.warranty).toContain("WarrantyTerms");
    expect(f.warranty).toContain("NewClaimForm");
    expect(f.subscription).toContain("useSubscriptionStore");
    expect(f.subscription).toContain("ConfirmModal");
    expect(f.subscription).toContain("BackendHealth");
    expect(f.planCard).toContain("onSubscribe");
    expect(f.clutchdCard).toContain("/card/offers");
    expect(f.clutchdCard).toContain("navigator.clipboard");
    expect(f.warrantyTerms).toContain('variant = "card"');
  });
});
