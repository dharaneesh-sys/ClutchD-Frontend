import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { jobStatusVariant, filterJobs } from "../JobMonitor.js";
import { disputeStatusVariant } from "../DisputePanel.js";
import { paymentStatusVariant } from "../PaymentsManager.js";
import { statusBadge, statusLabel } from "../PayoutManager.js";
import { warrantyStatusVariant } from "../WarrantyPanel.js";
import { escrowStatusVariant } from "../../dashboard/EscrowStatus.js";
import { SERVICE_STATUS } from "@/lib/constants";

const adminDir = path.resolve(process.cwd(), "src/components/admin");
const dashboardDir = path.resolve(process.cwd(), "src/components/dashboard");
const appAdminDir = path.resolve(process.cwd(), "src/app/admin");
const TOUCHED = [
  path.join(appAdminDir, "jobs/page.js"),
  path.join(appAdminDir, "disputes/page.js"),
  path.join(appAdminDir, "payments/page.js"),
  path.join(appAdminDir, "payouts/page.js"),
  path.join(appAdminDir, "warranty/page.js"),
  path.join(adminDir, "JobMonitor.js"),
  path.join(adminDir, "DisputePanel.js"),
  path.join(adminDir, "PaymentsManager.js"),
  path.join(adminDir, "PayoutManager.js"),
  path.join(adminDir, "WarrantyPanel.js"),
  path.join(dashboardDir, "PaymentModal.js"),
  path.join(dashboardDir, "EscrowStatus.js"),
  path.join(dashboardDir, "ETAIndicator.js"),
];
const src = (f) => fs.readFileSync(f, "utf8");
const ALLOWED = new Set(["info", "pending", "success", "danger", "default"]);

describe("Wave-5 Task 13: admin ops status chips (D1/D7/D11/D15)", () => {
  it("jobStatusVariant maps every job status to info/pending/success/danger/default only", () => {
    expect(jobStatusVariant("Searching")).toBe("info");
    expect(jobStatusVariant("En Route")).toBe("pending");
    expect(jobStatusVariant("In Progress")).toBe("default");
    expect(jobStatusVariant("Nearing Completion")).toBe("pending");
    expect(jobStatusVariant("Completed")).toBe("success");
    for (const s of ["Searching", "En Route", "In Progress", "Nearing Completion", "Completed", "unknown"]) {
      expect(ALLOWED.has(jobStatusVariant(s))).toBe(true);
    }
  });

  it("filterJobs returns all on All, filters by status, empty on no-match", () => {
    const rows = [
      { id: "a", status: "Searching" },
      { id: "b", status: "En Route" },
      { id: "c", status: "In Progress" },
    ];
    expect(filterJobs(rows, "All")).toHaveLength(3);
    expect(filterJobs(rows, "Searching")).toEqual([rows[0]]);
    expect(filterJobs(rows, "En Route")).toEqual([rows[1]]);
    expect(filterJobs(rows, "no-match")).toHaveLength(0);
  });

  it("disputeStatusVariant maps Open to danger, all others to pending", () => {
    expect(disputeStatusVariant("Open")).toBe("danger");
    expect(disputeStatusVariant("In Review")).toBe("pending");
    for (const s of ["Open", "In Review", "unknown"]) {
      expect(ALLOWED.has(disputeStatusVariant(s))).toBe(true);
    }
  });

  it("paymentStatusVariant maps every payment status to info/pending/success/danger only", () => {
    expect(paymentStatusVariant("Captured")).toBe("success");
    expect(paymentStatusVariant("Pending")).toBe("pending");
    expect(paymentStatusVariant("Failed")).toBe("danger");
    expect(paymentStatusVariant("Refunded")).toBe("info");
    for (const s of ["Captured", "Pending", "Failed", "Refunded", "unknown"]) {
      expect(ALLOWED.has(paymentStatusVariant(s))).toBe(true);
    }
  });

  it("payout statusBadge/statusLabel use pending for queued, success for paid", () => {
    expect(statusBadge("ready")).toBe("pending");
    expect(statusBadge("paid")).toBe("success");
    expect(statusBadge("below_threshold")).toBe("pending");
    expect(statusLabel("ready")).toBe("Ready");
    expect(statusLabel("paid")).toBe("Paid");
    expect(statusLabel("below_threshold")).toBe("Below Threshold");
  });

  it("warrantyStatusVariant maps every claim status to info/pending/success/danger only", () => {
    expect(warrantyStatusVariant("submitted")).toBe("info");
    expect(warrantyStatusVariant("under_review")).toBe("pending");
    expect(warrantyStatusVariant("approved")).toBe("success");
    expect(warrantyStatusVariant("rejected")).toBe("danger");
  });

  it("escrowStatusVariant maps escrow machine states to pending/success/danger", () => {
    expect(escrowStatusVariant(SERVICE_STATUS.PAYMENT_ESCROW)).toBe("pending");
    expect(escrowStatusVariant(SERVICE_STATUS.PAYMENT_RELEASED)).toBe("success");
    expect(escrowStatusVariant(SERVICE_STATUS.PAYMENT_DISPUTE)).toBe("danger");
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

  it("touched scope has zero one-off hues and zero slash-opacity white hardcodes (D1.1)", () => {
    const hues = TOUCHED.filter((f) =>
      /green-500|red-500|blue-500|purple-500|lime|teal-|sky-|rose-|orange-/.test(src(f))
    );
    expect(hues).toEqual([]);
    const whites = TOUCHED.filter((f) => /white\//.test(src(f)));
    expect(whites).toEqual([]);
  });
});
