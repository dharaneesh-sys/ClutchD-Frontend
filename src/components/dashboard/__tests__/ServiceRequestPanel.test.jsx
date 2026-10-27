// Task 15: isolated ServiceRequestPanel checks. The API module is replaced in
// this test only (vehicles load as an empty list); no data ships in product code.
import "@testing-library/jest-dom/vitest";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

const apiMock = vi.hoisted(() => ({ get: vi.fn(() => Promise.resolve({ data: [] })) }));
vi.mock("@/lib/api", () => ({ default: apiMock }));
vi.mock("@/components/subscription/SubscriptionBadge", () => ({ SubscriptionBadge: () => null }));

import { useTrackingStore } from "@/store/trackingStore";
import { useToastStore } from "@/store/toastStore";
import { MAP_DEFAULT_CENTER } from "@/lib/constants";
import { ServiceRequestPanel } from "../ServiceRequestPanel.js";

const warning = vi.fn();

beforeEach(() => {
  warning.mockReset();
  useToastStore.setState({ warning });
  useTrackingStore.setState({ userLocation: [11.05, 76.99], gpsStatus: "granted" });
});

function fill({ issue = "Flat Tire", description = "Rear tyre went flat on the highway" } = {}) {
  fireEvent.click(screen.getByRole("radio", { name: issue }));
  fireEvent.change(screen.getByLabelText("Describe the problem"), { target: { value: description } });
}

describe("ServiceRequestPanel (task 15)", () => {
  it("issue chips are a 2/3-column radio grid with a clear selected state", () => {
    render(<ServiceRequestPanel onSubmit={vi.fn()} />);
    const chip = screen.getByRole("radio", { name: "Flat Tire" });
    const grid = chip.closest("label").parentElement;
    expect(grid.className).toMatch(/grid-cols-2/);
    expect(grid.className).toMatch(/min-\[390px\]:grid-cols-3/);
    fireEvent.click(chip);
    expect(chip).toBeChecked();
    expect(chip.closest("label").className).toContain("border-[var(--primary)]");
  });

  it("shows no price before an issue is chosen", () => {
    render(<ServiceRequestPanel onSubmit={vi.fn()} />);
    expect(screen.queryByText(/₹500 – ₹2000/)).toBeNull();
    expect(screen.getByText("—")).toBeInTheDocument();
  });

  it("submits the unchanged payload keys to onSubmit", async () => {
    const onSubmit = vi.fn(() => Promise.resolve());
    render(<ServiceRequestPanel onSubmit={onSubmit} />);
    fill();
    fireEvent.click(screen.getByRole("button", { name: /Request Service/ }));
    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    const payload = onSubmit.mock.calls[0][0];
    expect(payload).toMatchObject({
      issueTag: "flat_tire",
      description: "Rear tyre went flat on the highway",
      requestType: "auto",
    });
    // Page adds customerLat/customerLng; the panel never invents them.
    expect(payload).not.toHaveProperty("customerLat");
  });

  it("without a real location shows the existing warning and does not submit", async () => {
    useTrackingStore.setState({ userLocation: MAP_DEFAULT_CENTER, gpsStatus: "idle" });
    const onSubmit = vi.fn();
    render(<ServiceRequestPanel onSubmit={onSubmit} />);
    fill();
    fireEvent.click(screen.getByRole("button", { name: /Request Service/ }));
    await waitFor(() => expect(warning).toHaveBeenCalledWith(expect.stringMatching(/Set your pickup location first/)));
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("a 4-character description shows inline validation", async () => {
    const onSubmit = vi.fn();
    render(<ServiceRequestPanel onSubmit={onSubmit} />);
    fill({ description: "flat" });
    fireEvent.click(screen.getByRole("button", { name: /Request Service/ }));
    expect(await screen.findByText(/min 10 chars/)).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("shows the store error inline", () => {
    render(<ServiceRequestPanel onSubmit={vi.fn()} error="Server unreachable" />);
    expect(screen.getByRole("alert")).toHaveTextContent("Server unreachable");
  });
});
