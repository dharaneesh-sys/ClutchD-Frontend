// Task 16: status-map matrix for the customer tracker. Status values are
// passed as props; no network (the vehicle fetch is stubbed in this test).
import "@testing-library/jest-dom/vitest";
import { describe, it, expect, vi } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { render, screen, fireEvent } from "@testing-library/react";

vi.mock("@/lib/api", () => ({ default: { get: vi.fn(() => Promise.resolve({ data: [] })) } }));

import { ServiceStatusTracker, TRACKER_STAGES } from "../ServiceStatusTracker.js";

const mechanic = { name: "Ravi", rating: 4.6 };
const pricing = { serviceAmount: 1000, convenienceFee: 30, distanceFee: 50, distanceKm: 3.2, gstAmount: 194.4, totalAmount: 1274.4 };

const renderWith = (request, handlers = {}) =>
  render(
    <ServiceStatusTracker
      request={request}
      onComplete={handlers.onComplete ?? vi.fn()}
      onCancel={handlers.onCancel ?? vi.fn()}
      onDisputePayment={handlers.onDisputePayment ?? vi.fn()}
    />
  );

describe("ServiceStatusTracker status map (task 16)", () => {
  it("has exactly six stages", () => {
    expect(TRACKER_STAGES.map((s) => s.label)).toEqual([
      "Finding a mechanic",
      "Professional assigned",
      "On the way",
      "Service in progress",
      "Payment",
      "Completed",
    ]);
  });

  it.each([
    ["searching", "Finding a mechanic", { cancel: true, pay: false, dispute: false }],
    ["providers_notified", "Finding a mechanic", { cancel: true, pay: false, dispute: false }],
    ["assigned", "Professional assigned", { cancel: true, pay: false, dispute: false }],
    ["en_route", "On the way", { cancel: true, pay: false, dispute: false }],
    ["in_progress", "Service in progress", { cancel: true, pay: false, dispute: false }],
    ["payment_pending", "Payment", { cancel: true, pay: true, dispute: false }],
    ["payment_dispute", "Payment", { cancel: false, pay: false, dispute: false }],
    ["completed", "Completed", { cancel: false, pay: false, dispute: true }],
    ["cancelled", "Cancelled", { cancel: false, pay: false, dispute: false }],
  ])("%s → %s with matching actions", (status, label, actions) => {
    renderWith({ id: "j1", status, mechanic, pricing });
    expect(screen.getByTestId("stage-label")).toHaveTextContent(label);
    expect(!!screen.queryByRole("button", { name: "Cancel request" })).toBe(actions.cancel);
    expect(!!screen.queryByRole("button", { name: /^Pay ₹/ })).toBe(actions.pay);
    expect(!!screen.queryByRole("button", { name: "Report a problem" })).toBe(actions.dispute);
    expect(screen.queryByText(/Payment Held|Released|Release/)).toBeNull();
    expect(screen.queryByText(/Picked Up|Delivery/i)).toBeNull();
  });

  it("payment_pending without a real total shows no pay CTA and — totals", () => {
    renderWith({ id: "j1", status: "payment_pending", mechanic, pricing: { serviceAmount: 1000 } });
    expect(screen.queryByRole("button", { name: /^Pay/ })).toBeNull();
    expect(screen.getAllByText("—").length).toBeGreaterThan(0);
  });

  it("pay calls onComplete with the request", () => {
    const onComplete = vi.fn();
    const request = { id: "j1", status: "payment_pending", mechanic, pricing };
    renderWith(request, { onComplete });
    fireEvent.click(screen.getByRole("button", { name: "Pay ₹1274" }));
    expect(onComplete).toHaveBeenCalledWith(request);
  });

  it("a missing mechanic hides the provider card instead of rendering a blank", () => {
    renderWith({ id: "j1", status: "assigned" });
    expect(screen.queryByTestId("provider-card")).toBeNull();
    expect(screen.queryByText("Assigning...")).toBeNull();
  });

  it("dispute submits the reason", () => {
    const onDisputePayment = vi.fn();
    renderWith({ id: "j1", status: "completed", mechanic, pricing }, { onDisputePayment });
    fireEvent.click(screen.getByRole("button", { name: "Report a problem" }));
    fireEvent.change(screen.getByLabelText("What went wrong?"), { target: { value: "Brakes still squeal" } });
    fireEvent.click(screen.getByRole("button", { name: "Submit" }));
    expect(onDisputePayment).toHaveBeenCalledWith("Brakes still squeal");
  });

  it("source never calls hold/release or shows escrow/warranty", () => {
    const code = fs.readFileSync(path.resolve(process.cwd(), "src/components/dashboard/ServiceStatusTracker.js"), "utf8");
    expect(code).not.toMatch(/\/hold|\/release|EscrowStatus|WarrantyTerms|onReleasePayment|Verified Provider/);
  });
});
