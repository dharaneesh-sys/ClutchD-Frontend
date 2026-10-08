import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { STATUS_META, STATUS_FILTERS } from "../KYCApproval.js";
import { filterMechanics } from "../MechanicsManager.js";
import { filterGarages } from "../GaragesManager.js";
import { filterSellers } from "../SellersManager.js";
import { filterUsers } from "../UserTable.js";
import { certStatusVariant } from "../CertificationPanel.js";

const adminDir = path.resolve(process.cwd(), "src/components/admin");
const appAdminDir = path.resolve(process.cwd(), "src/app/admin");
const TOUCHED = [
  path.join(appAdminDir, "page.js"),
  path.join(appAdminDir, "users/page.js"),
  path.join(appAdminDir, "sellers/page.js"),
  path.join(appAdminDir, "mechanics/page.js"),
  path.join(appAdminDir, "garages/page.js"),
  path.join(appAdminDir, "kyc/page.js"),
  path.join(appAdminDir, "certifications/page.js"),
  path.join(adminDir, "KYCApproval.js"),
  path.join(adminDir, "MechanicsManager.js"),
  path.join(adminDir, "GaragesManager.js"),
  path.join(adminDir, "UserTable.js"),
  path.join(adminDir, "SellersManager.js"),
  path.join(adminDir, "CertificationPanel.js"),
  path.join(adminDir, "AdminOverview.js"),
];
const src = (f) => fs.readFileSync(f, "utf8");
const ALLOWED = new Set(["info", "pending", "success", "danger", "default"]);

describe("Wave-5 Task 12: admin identity status chips (D1/D7/D11/D15)", () => {
  it("KYC STATUS_META uses info/pending/success/danger only — warning misnomer gone", () => {
    expect(STATUS_META.submitted.variant).toBe("info");
    expect(STATUS_META.pending.variant).toBe("pending");
    expect(STATUS_META.verified.variant).toBe("success");
    expect(STATUS_META.rejected.variant).toBe("danger");
    for (const meta of Object.values(STATUS_META)) {
      expect(ALLOWED.has(meta.variant)).toBe(true);
    }
  });

  it("KYC STATUS_FILTERS keeps the action-queue order and keys", () => {
    expect(STATUS_FILTERS.map((f) => f.key)).toEqual([
      "",
      "submitted",
      "pending",
      "verified",
      "rejected",
    ]);
  });

  it("filterMechanics matches name/phone/skill case-insensitively, empty query returns all", () => {
    const rows = [
      { fullName: "Ravi Kumar", phone: "98765", expertise: ["Engine", "Brakes"] },
      { fullName: "Asha Devi", phone: "12345", expertise: ["Electrical"] },
    ];
    expect(filterMechanics(rows, "")).toHaveLength(2);
    expect(filterMechanics(rows, "ravi")).toEqual([rows[0]]);
    expect(filterMechanics(rows, "1234")).toEqual([rows[1]]);
    expect(filterMechanics(rows, "engine")).toEqual([rows[0]]);
    expect(filterMechanics(rows, "no-match")).toHaveLength(0);
  });

  it("filterGarages matches garage/owner/phone, empty query returns all", () => {
    const rows = [
      { garageName: "City Auto", ownerName: "Mohan", phone: "99999" },
      { garageName: "Speed Fix", ownerName: "Rita", phone: "11111" },
    ];
    expect(filterGarages(rows, "")).toHaveLength(2);
    expect(filterGarages(rows, "speed")).toEqual([rows[1]]);
    expect(filterGarages(rows, "mohan")).toEqual([rows[0]]);
    expect(filterGarages(rows, "1111")).toEqual([rows[1]]);
    expect(filterGarages(rows, "no-match")).toHaveLength(0);
  });

  it("filterSellers matches store/owner/phone/email, empty query returns all", () => {
    const rows = [
      { storeName: "Parts Hub", ownerName: "Dev", phone: "55555", email: "dev@hub.in" },
      { storeName: "Gear House", ownerName: "Ana", phone: "66666", email: "ana@gear.in" },
    ];
    expect(filterSellers(rows, "")).toHaveLength(2);
    expect(filterSellers(rows, "gear")).toEqual([rows[1]]);
    expect(filterSellers(rows, "DEV")).toEqual([rows[0]]);
    expect(filterSellers(rows, "6666")).toEqual([rows[1]]);
    expect(filterSellers(rows, "ana@gear.in")).toEqual([rows[1]]);
    expect(filterSellers(rows, "no-match")).toHaveLength(0);
  });

  it("filterUsers matches name/id, empty query returns all", () => {
    const rows = [
      { id: "user-abcdef01", name: "Kiran Rao" },
      { id: "user-12345678", name: "Meera Nair" },
    ];
    expect(filterUsers(rows, "")).toHaveLength(2);
    expect(filterUsers(rows, "kiran")).toEqual([rows[0]]);
    expect(filterUsers(rows, "12345678")).toEqual([rows[1]]);
    expect(filterUsers(rows, "no-match")).toHaveLength(0);
  });

  it("certStatusVariant maps every cert status to info/pending/success/danger only", () => {
    expect(certStatusVariant("pending")).toBe("pending");
    expect(certStatusVariant("verified")).toBe("success");
    expect(certStatusVariant("rejected")).toBe("danger");
    expect(ALLOWED.has(certStatusVariant("pending"))).toBe(true);
  });

  it("touched scope has zero warning-variant/badge/token references (D7)", () => {
    const offenders = TOUCHED.filter((f) =>
      /variant=["']warning["']|["']warning["']|bg-warning|text-warning|border-warning|var\(--warning\)/.test(
        src(f)
      )
    );
    expect(offenders).toEqual([]);
  });

  it("touched scope has zero legacy GlassCard variants and zero stone/zinc splits (D1.1/D5)", () => {
    const legacyGlass = TOUCHED.filter((f) =>
      /variant=["'](outlined|elevated|strong|glass|glass-strong|glass-hover|glass-lux-strong|surface-elevated|surface-filled|surface-outlined)["']/.test(
        src(f)
      )
    );
    expect(legacyGlass).toEqual([]);
    const splits = TOUCHED.filter((f) => /stone-|zinc-/.test(src(f)));
    expect(splits).toEqual([]);
  });
});
