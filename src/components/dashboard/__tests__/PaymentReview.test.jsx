// Task 17: isolated PaymentModal / ReviewModal checks. The API module and
// toast hook are replaced in this test only; no data ships in product code.
import "@testing-library/jest-dom/vitest";
import { describe, it, expect, vi, beforeEach } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

const apiMock = vi.hoisted(() => ({ post: vi.fn(), get: vi.fn() }));
vi.mock("@/lib/api", () => ({ default: apiMock }));
vi.mock("@/components/ui/ToastProvider", () => ({ useToast: () => ({ error: vi.fn(), success: vi.fn() }) }));

import { PaymentModal } from "../PaymentModal.js";
import { ReviewModal } from "../ReviewModal.js";

beforeEach(() => {
  apiMock.post.mockReset();
});

const pricing = { serviceAmount: 1000, convenienceFee: 30, distanceFee: 50, distanceKm: 2, gstAmount: 154, totalAmount: 1234 };

describe("PaymentModal (task 17)", () => {
  it("shows the real total, the breakdown and cash as the default method", () => {
    render(<PaymentModal isOpen onClose={vi.fn()} pricing={pricing} jobId="j1" onSuccess={vi.fn()} />);
    expect(screen.getByTestId("payment-total")).toHaveTextContent("₹1234.00");
    expect(screen.getByRole("radio", { name: /Cash/ })).toHaveAttribute("aria-checked", "true");
    expect(screen.getByRole("button", { name: "Confirm Cash ₹1234" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /View Breakdown/ }));
    expect(screen.getByText("₹1000.00")).toBeInTheDocument();
  });

  it("Razorpay (UPI/card) remains selectable", () => {
    render(<PaymentModal isOpen onClose={vi.fn()} pricing={pricing} jobId="j1" onSuccess={vi.fn()} />);
    fireEvent.click(screen.getByRole("radio", { name: /Google Pay/ }));
    expect(screen.getByRole("button", { name: "Pay ₹1234 Securely" })).toBeInTheDocument();
  });

  it("without a real total shows — and no pay CTA (no 1200 fallback)", () => {
    render(<PaymentModal isOpen onClose={vi.fn()} pricing={null} amount={null} jobId="j1" onSuccess={vi.fn()} />);
    expect(screen.getByTestId("payment-total")).toHaveTextContent("—");
    expect(screen.queryByRole("button", { name: /Confirm Cash|Pay ₹/ })).toBeNull();
    expect(screen.queryByText(/1200/)).toBeNull();
  });

  it("cash posts /payments/cash in paise and calls onSuccess once", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    apiMock.post.mockResolvedValueOnce({ data: {} });
    const onSuccess = vi.fn();
    render(<PaymentModal isOpen onClose={vi.fn()} pricing={pricing} jobId="j1" onSuccess={onSuccess} />);
    fireEvent.click(screen.getByRole("button", { name: "Confirm Cash ₹1234" }));
    await waitFor(() => expect(apiMock.post).toHaveBeenCalledWith("/payments/cash", { job_id: "j1", amount: 123400 }));
    vi.advanceTimersByTime(1600);
    await waitFor(() => expect(onSuccess).toHaveBeenCalledTimes(1));
    vi.useRealTimers();
  });

  it("a failed cash confirmation keeps the sheet open and calls nothing", async () => {
    apiMock.post.mockRejectedValueOnce({ response: { data: { detail: "nope" } } });
    const onSuccess = vi.fn();
    render(<PaymentModal isOpen onClose={vi.fn()} pricing={pricing} jobId="j1" onSuccess={onSuccess} />);
    fireEvent.click(screen.getByRole("button", { name: "Confirm Cash ₹1234" }));
    await waitFor(() => expect(apiMock.post).toHaveBeenCalled());
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(onSuccess).not.toHaveBeenCalled();
  });

  it("source never calls hold/release", () => {
    const root = process.cwd();
    for (const f of ["src/components/dashboard/PaymentModal.js", "src/app/dashboard/customer/page.js"]) {
      const code = fs.readFileSync(path.join(root, f), "utf8");
      expect(code, f).not.toMatch(/holdPayment|releasePayment|\/hold|\/release|Payment Held/);
    }
  });
});

describe("ReviewModal (task 17)", () => {
  const fillAndSubmit = (stars = 4) => {
    fireEvent.click(screen.getAllByRole("button", { name: new RegExp(`${stars} star`, "i") })[0]);
    fireEvent.change(screen.getByLabelText(/Leave a comment/), { target: { value: "Quick and tidy" } });
    fireEvent.click(screen.getByRole("button", { name: /Submit review/ }));
  };

  it("submit is disabled with 0 stars", () => {
    render(<ReviewModal isOpen onClose={vi.fn()} providerName="Ravi" jobId="j1" onSubmit={vi.fn()} />);
    expect(screen.getByRole("button", { name: /Submit review/ })).toBeDisabled();
  });

  it("POSTs /reviews with job_id/rating/comment and closes on 2xx, onSubmit once", async () => {
    apiMock.post.mockResolvedValueOnce({ data: { id: "r1", ok: true } });
    const onClose = vi.fn();
    const onSubmit = vi.fn();
    render(<ReviewModal isOpen onClose={onClose} providerName="Ravi" jobId="j1" onSubmit={onSubmit} />);
    fillAndSubmit(4);
    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
    expect(apiMock.post).toHaveBeenCalledWith("/reviews", { job_id: "j1", rating: 4, comment: "Quick and tidy" });
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it("409 already-reviewed is treated as done", async () => {
    apiMock.post.mockRejectedValueOnce({ response: { status: 409 } });
    const onClose = vi.fn();
    render(<ReviewModal isOpen onClose={onClose} providerName="Ravi" jobId="j1" onSubmit={vi.fn()} />);
    fillAndSubmit(5);
    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
  });

  it("other errors keep it open with an inline error", async () => {
    apiMock.post.mockRejectedValueOnce({ response: { status: 400, data: { detail: "Job must be completed before review" } } });
    const onClose = vi.fn();
    const onSubmit = vi.fn();
    render(<ReviewModal isOpen onClose={onClose} providerName="Ravi" jobId="j1" onSubmit={onSubmit} />);
    fillAndSubmit(3);
    expect(await screen.findByText("Job must be completed before review")).toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();
    expect(onSubmit).not.toHaveBeenCalled();
  });
});
