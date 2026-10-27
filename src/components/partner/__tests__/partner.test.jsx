// Tasks 20-25: isolated partner checks. API/toast are replaced in this test
// only; job/offer objects are real-shape test inputs, not shipped data.
import "@testing-library/jest-dom/vitest";
import { describe, it, expect, vi, beforeEach } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

const apiMock = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() }));
vi.mock("@/lib/api", () => ({ default: apiMock }));
vi.mock("@/components/ui/ToastProvider", () => ({ useToast: () => ({ error: vi.fn(), success: vi.fn() }) }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));
vi.mock("@/components/charts/area-chart", () => ({ AreaChart: ({ children }) => <div data-testid="chart">{children}</div>, Area: () => null }));

import { deriveStats } from "@/hooks/useProviderOverview";
import { PartnerHome } from "../PartnerHome";
import { OfferCard, JobCard } from "../RequestCard";
import { PartnerQueue } from "../PartnerQueue";
import { ProviderHistory } from "../ProviderHistory";
import { EarningsChart } from "@/components/mechanic/EarningsChart";
import { money } from "../format";

const today = new Date().toISOString().slice(0, 10);

beforeEach(() => {
  for (const f of Object.values(apiMock)) f.mockReset();
});

describe("overview stats (task 20)", () => {
  it("derives today earnings, all-time completed and active from real payloads", () => {
    const s = deriveStats({
      earnings: { data: [{ name: "Mon", earnings: 540, date: today }], total: 900 },
      activeJobs: [{ id: "a" }, { id: "b" }],
      history: [{ status: "completed" }, { status: "cancelled" }, { status: "completed" }],
    });
    expect(s).toMatchObject({ todayEarnings: 540, completedCount: 2, activeCount: 2, completedCapped: false });
  });

  it("failed fetches give null (rendered as —), never invented numbers", () => {
    expect(deriveStats({ earnings: null, activeJobs: null, history: null })).toMatchObject({
      todayEarnings: null, completedCount: null, activeCount: null,
    });
  });

  it("PartnerHome renders tiles, retry and quick actions", () => {
    const onRetry = vi.fn();
    render(
      <PartnerHome
        hasError
        onRetry={onRetry}
        stats={[{ label: "Today", value: "₹540" }, { label: "Completed", value: "—" }, { label: "Active", value: 2 }]}
        actions={[{ label: "Earnings", onClick: vi.fn() }]}
      />
    );
    expect(screen.getByText("₹540")).toBeInTheDocument();
    expect(screen.getByText("—")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));
    expect(onRetry).toHaveBeenCalled();
  });

  it("no 4.5 hrs string and no default-online in the mechanic UI", () => {
    const code = fs.readFileSync(path.resolve(process.cwd(), "src/components/mechanic/AvailabilityToggle.js"), "utf8");
    expect(code).not.toMatch(/4\.5 hrs|isOnline \?\? true/);
  });
});

describe("request cards (task 22)", () => {
  it("offer shows a real countdown and — for fields the API does not send", () => {
    const offer = { id: "o1", expiresAt: new Date(Date.now() + 10 * 60000).toISOString(), createdAt: new Date().toISOString(), job: { issueTag: "flat_tire", description: "Rear tyre" } };
    render(<OfferCard offer={offer} onAccept={vi.fn()} onDecline={vi.fn()} />);
    expect(screen.getByRole("timer")).toHaveAccessibleName(/Offer expires in (9|10):/);
    expect(screen.getAllByText("—").length).toBe(3);
    expect(screen.getByRole("button", { name: "Accept" })).toBeEnabled();
  });

  it("expired offer disables Accept and shows Expired", () => {
    const offer = { id: "o1", expiresAt: "2000-01-01T00:00:00Z", job: {} };
    render(<OfferCard offer={offer} onAccept={vi.fn()} onDecline={vi.fn()} />);
    expect(screen.getByRole("button", { name: "Expired" })).toBeDisabled();
  });

  it("offer without expiresAt shows no countdown and no customer name", () => {
    render(<OfferCard offer={{ id: "o1", job: { issueTag: "noise" } }} onAccept={vi.fn()} onDecline={vi.fn()} />);
    expect(screen.queryByRole("timer")).toBeNull();
  });
});

describe("job progress (task 23)", () => {
  const handlers = () => ({ onStartNavigation: vi.fn(), onStartService: vi.fn(), onNavigate: vi.fn(), onBill: vi.fn(), onCollectCash: vi.fn(), onChat: vi.fn() });
  it.each([
    ["assigned", "Start navigation", "onStartNavigation"],
    ["en_route", "Start service", "onStartService"],
    ["in_progress", "Bill customer", "onBill"],
    ["payment_pending", "Collect cash", "onCollectCash"],
  ])("%s → %s", (status, label, fn) => {
    const h = handlers();
    const job = { id: "j1", status, issueTag: "flat_tire", pricing: status === "payment_pending" ? { totalAmount: 500 } : null };
    render(<JobCard job={job} {...h} />);
    fireEvent.click(screen.getByRole("button", { name: new RegExp(label) }));
    expect(h[fn]).toHaveBeenCalledWith(job);
    expect(screen.getByRole("button", { name: /Chat/ })).toBeInTheDocument();
    expect(screen.queryByText(/Picked Up|Deliver/i)).toBeNull();
  });

  it("collect cash is disabled without a real billed total", () => {
    render(<JobCard job={{ id: "j1", status: "payment_pending" }} {...handlers()} />);
    expect(screen.getByRole("button", { name: /Collect cash/ })).toBeDisabled();
  });
});

describe("PartnerQueue wiring (tasks 21-23)", () => {
  const assigned = { id: "j1", status: "assigned", issueTag: "flat_tire", customerLocation: { lat: 11, lng: 77 } };
  const load = (jobs, offers = []) => {
    apiMock.get.mockImplementation((url) =>
      Promise.resolve({ data: url === "/jobs/incoming" ? { jobs } : { offers } })
    );
  };

  it("accepting an offer posts /offers/:id/accept once", async () => {
    load([], [{ id: "o1", job: { issueTag: "noise" } }]);
    apiMock.post.mockResolvedValue({ data: {} });
    render(<PartnerQueue />);
    fireEvent.click(await screen.findByRole("button", { name: "Accept" }));
    await waitFor(() => expect(apiMock.post).toHaveBeenCalledWith("/offers/o1/accept"));
    expect(apiMock.post).toHaveBeenCalledTimes(1);
  });

  it("Start navigation PATCHes status en_route (no optimistic advance)", async () => {
    load([assigned]);
    apiMock.patch.mockResolvedValue({ data: {} });
    render(<PartnerQueue />);
    fireEvent.click(await screen.findByRole("button", { name: /Start navigation/ }));
    await waitFor(() => expect(apiMock.patch).toHaveBeenCalledWith("/service/request/j1/status", { status: "en_route" }));
  });

  it("a 409 transition leaves the job as it was", async () => {
    load([assigned]);
    apiMock.patch.mockRejectedValue({ response: { status: 409, data: { detail: "Invalid transition" } } });
    render(<PartnerQueue />);
    fireEvent.click(await screen.findByRole("button", { name: /Start navigation/ }));
    await waitFor(() => expect(apiMock.patch).toHaveBeenCalled());
    expect(screen.getByRole("button", { name: /Start navigation/ })).toBeInTheDocument();
  });

  it("bill → invoice sent with the real total and Awaiting payment (not Completed)", async () => {
    load([{ ...assigned, status: "in_progress" }]);
    apiMock.post.mockResolvedValue({ data: { id: "j1", status: "payment_pending", pricing: { totalAmount: 271.4 } } });
    render(<PartnerQueue />);
    fireEvent.click(await screen.findByRole("button", { name: /Bill customer/ }));
    fireEvent.change(screen.getByLabelText(/Your service fee/), { target: { value: "200" } });
    fireEvent.click(screen.getByRole("button", { name: /Send bill/ }));
    const sent = await screen.findByTestId("invoice-sent");
    expect(sent).toHaveTextContent("₹271.40");
    expect(sent).toHaveTextContent("Awaiting payment");
    expect(sent).not.toHaveTextContent("Completed");
    expect(apiMock.post).toHaveBeenCalledWith("/service/request/j1/finalize-price", { serviceAmount: 200 });
  });

  it("cash → completion sheet with the real paid total", async () => {
    load([{ ...assigned, status: "payment_pending", pricing: { totalAmount: 500 } }]);
    apiMock.post.mockResolvedValue({ data: {} });
    render(<PartnerQueue />);
    fireEvent.click(await screen.findByRole("button", { name: /Collect cash/ }));
    fireEvent.click(screen.getByRole("button", { name: "Cash received" }));
    expect(await screen.findByTestId("job-completed")).toHaveTextContent("₹500.00 paid");
    expect(apiMock.post).toHaveBeenCalledWith("/payments/cash", { job_id: "j1", amount: 50000 });
  });

  it("server unreachable shows the real retry state", async () => {
    apiMock.get.mockRejectedValue(new Error("Network Error"));
    render(<PartnerQueue />);
    expect(await screen.findByRole("alert")).toHaveTextContent("Server unreachable");
    expect(screen.getByRole("button", { name: "Retry" })).toBeInTheDocument();
  });

  it("never calls the admin-only assign endpoint", () => {
    for (const f of ["src/components/partner/PartnerQueue.js", "src/components/garage/GarageJobQueue.js", "src/app/dashboard/garage/page.js"]) {
      const code = fs.readFileSync(path.resolve(process.cwd(), f), "utf8");
      expect(code, f).not.toMatch(/api\.post\([^)]*\/assign/);
      expect(code, f).not.toMatch(/providers\/availability/);
    }
  });
});

describe("earnings + history (task 24)", () => {
  it("earnings shows the real total, chart and breakdown rows", () => {
    render(<EarningsChart earnings={{ total: 900, data: [{ name: "Mon", earnings: 540, date: "2026-10-26" }] }} />);
    expect(screen.getByTestId("earnings-total")).toHaveTextContent("₹900");
    expect(screen.getByTestId("chart")).toBeInTheDocument();
    expect(screen.getByText("₹540")).toBeInTheDocument();
  });

  it("history: completed shows amount + paid state, cancelled has no actions, empty is honest", () => {
    const jobs = [
      { id: "1", status: "completed", issueTag: "flat_tire", createdAt: "2026-10-20T10:00:00Z", isPaid: true, pricing: { totalAmount: 650 } },
      { id: "2", status: "cancelled", issueTag: "noise", createdAt: "2026-10-21T10:00:00Z" },
    ];
    const { rerender } = render(<ProviderHistory jobs={jobs} />);
    const rows = screen.getAllByTestId("provider-history-row");
    expect(rows[0]).toHaveTextContent("₹650.00 · Paid");
    expect(rows[1].querySelector("button")).toBeNull();
    rerender(<ProviderHistory jobs={[]} />);
    expect(screen.getByText("No completed jobs yet")).toBeInTheDocument();
  });

  it("non-numeric amounts render —, never NaN", () => {
    expect(money("abc")).toBe("—");
    expect(money(undefined)).toBe("—");
  });
});
