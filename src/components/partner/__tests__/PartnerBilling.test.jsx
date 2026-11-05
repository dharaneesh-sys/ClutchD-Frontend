import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";

const get = vi.fn();
const post = vi.fn();
vi.mock("@/lib/api", () => ({ default: { get: (...a) => get(...a), post: (...a) => post(...a) } }));
vi.mock("@/components/ui/ToastProvider", () => ({ useToast: () => ({ success: vi.fn(), error: vi.fn() }) }));

const invoice = { id: "i1", amount_paise: 49900, period_start: "2026-11-01", due_date: "2026-11-01", status: "issued" };

function wire() {
  get.mockImplementation((url) => {
    if (url === "/providers/incentives") return Promise.resolve({ data: { rate_bps: 500, earned_paise: 5000, recent: [] } });
    if (url === "/providers/ledger") return Promise.resolve({ data: { items: [], balance_paise: 5000 } });
    if (url === "/providers/onboarding") return Promise.resolve({ data: { step: "services" } });
    if (url === "/providers/rent/invoices") return Promise.resolve({ data: { items: [invoice] } });
  });
}

describe("PartnerBilling", () => {
  beforeEach(() => { vi.resetModules(); get.mockReset(); post.mockReset(); });

  it("renders nothing and makes no calls when the flag is off", async () => {
    vi.stubEnv("NEXT_PUBLIC_BILLING_ENABLED", "false");
    const { PartnerBilling } = await import("../PartnerBilling");
    const { container } = render(<PartnerBilling role="garage" />);
    expect(container.innerHTML).toBe("");
    expect(get).not.toHaveBeenCalled();
  });

  it("shows real figures and submits a rent reference (garage)", async () => {
    vi.stubEnv("NEXT_PUBLIC_BILLING_ENABLED", "true");
    wire();
    post.mockResolvedValue({ data: {} });
    const { PartnerBilling } = await import("../PartnerBilling");
    render(<PartnerBilling role="garage" />);
    expect(await screen.findByText("₹50.00")).toBeTruthy();
    expect(screen.getByText(/5% of each completed/)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /enter reference/i }));
    fireEvent.change(screen.getByLabelText(/Payment reference/), { target: { value: "ab" } });
    fireEvent.click(screen.getByRole("button", { name: "Send" }));
    expect(await screen.findByText(/at least 4 characters/)).toBeTruthy();
    expect(post).not.toHaveBeenCalled();
    fireEvent.change(screen.getByLabelText(/Payment reference/), { target: { value: "UPI123456" } });
    fireEvent.click(screen.getByRole("button", { name: "Send" }));
    await waitFor(() => expect(post).toHaveBeenCalledWith("/providers/rent/invoices/i1/pay", { reference: "UPI123456" }));
  });

  it("mechanics see no rent section and never call the rent endpoint", async () => {
    vi.stubEnv("NEXT_PUBLIC_BILLING_ENABLED", "true");
    wire();
    const { PartnerBilling } = await import("../PartnerBilling");
    render(<PartnerBilling role="mechanic" />);
    await screen.findByText("₹50.00");
    expect(screen.queryByText("Monthly rent")).toBeNull();
    expect(get).not.toHaveBeenCalledWith("/providers/rent/invoices", expect.anything());
  });
});
