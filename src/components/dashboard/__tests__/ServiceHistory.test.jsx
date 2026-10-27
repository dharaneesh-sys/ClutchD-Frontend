// Task 18: isolated ServiceHistory checks. The API module is replaced in this
// test only; the jobs below are props-shaped test inputs, not shipped data.
import "@testing-library/jest-dom/vitest";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

const apiMock = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn(), delete: vi.fn() }));
vi.mock("@/lib/api", () => ({ default: apiMock, extractApiError: (_e, fallback) => fallback }));
vi.mock("@/components/ui/ToastProvider", () => ({ useToast: () => ({ error: vi.fn(), success: vi.fn() }) }));

import { ServiceHistory } from "../ServiceHistory.js";

const completed = { id: "job-completed-1", status: "completed", issueTag: "flat_tire", createdAt: "2026-10-20T10:00:00Z", isPaid: true, pricing: { totalAmount: 650 } };
const cancelled = { id: "job-cancelled-1", status: "cancelled", issueTag: "battery_dead", createdAt: "2026-10-21T10:00:00Z", isPaid: false };

beforeEach(() => apiMock.get.mockReset());

describe("ServiceHistory (task 18)", () => {
  it("renders completed and cancelled rows with status; cancelled has no payment action", async () => {
    apiMock.get.mockResolvedValueOnce({ data: { jobs: [completed, cancelled] } });
    render(<ServiceHistory />);
    const rows = await screen.findAllByTestId("history-row");
    expect(rows).toHaveLength(2);
    expect(rows[0]).toHaveTextContent("Flat Tire");
    expect(rows[0]).toHaveTextContent("Completed");
    expect(rows[0]).toHaveTextContent("₹650.00");
    expect(rows[1]).toHaveTextContent("Cancelled");
    expect(rows[1].querySelectorAll("button")).toHaveLength(0);
    expect(screen.queryByText(/warranty|Payment Held|Released/i)).toBeNull();
  });

  it("filters client-side", async () => {
    apiMock.get.mockResolvedValueOnce({ data: { jobs: [completed, cancelled] } });
    render(<ServiceHistory />);
    await screen.findAllByTestId("history-row");
    fireEvent.click(screen.getByRole("button", { name: /Cancelled/ }));
    expect(screen.getAllByTestId("history-row")).toHaveLength(1);
    expect(screen.getByTestId("history-row")).toHaveTextContent("Cancelled");
  });

  it("unpaid completed job without a real total shows — and no pay CTA", async () => {
    apiMock.get.mockResolvedValueOnce({ data: { jobs: [{ ...completed, isPaid: false, pricing: null, priceEstimate: { min: 500 } }] } });
    render(<ServiceHistory />);
    const row = await screen.findByTestId("history-row");
    expect(row).toHaveTextContent("—");
    expect(row).not.toHaveTextContent("500");
    expect(screen.queryByRole("button", { name: /^Pay/ })).toBeNull();
  });

  it("a failed /jobs/history shows the real error with retry", async () => {
    apiMock.get.mockRejectedValueOnce(new Error("Network Error"));
    apiMock.get.mockResolvedValueOnce({ data: { jobs: [] } });
    render(<ServiceHistory />);
    expect(await screen.findByRole("alert")).toHaveTextContent("Couldn't load your history");
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));
    expect(await screen.findByText("No history yet")).toBeInTheDocument();
  });
});
