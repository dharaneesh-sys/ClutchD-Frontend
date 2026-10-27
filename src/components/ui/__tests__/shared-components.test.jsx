import "@testing-library/jest-dom/vitest";
import { describe, it, expect, vi, afterEach } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { Wallet, Wrench } from "lucide-react";
import { StatTile } from "../StatTile.js";
import { QuickActionTile } from "../QuickActionTile.js";
import { ListRow } from "../ListRow.js";
import { SectionHeader } from "../SectionHeader.js";
import { StatusPill, statusMeta } from "../StatusPill.js";
import { PageHeader } from "../PageHeader.js";
import { CountdownRing, formatRemaining } from "../CountdownRing.js";

const uiDir = path.resolve(process.cwd(), "src/components/ui");
const FILES = [
  "StatTile.js", "QuickActionTile.js", "ListRow.js", "SectionHeader.js",
  "StatusPill.js", "PageHeader.js", "CountdownRing.js",
];

afterEach(() => vi.useRealTimers());

describe("Task 7: shared presentational components", () => {
  it("use design tokens only (no raw hex) and accept className", () => {
    for (const f of FILES) {
      const code = fs.readFileSync(path.join(uiDir, f), "utf8");
      expect(code, f).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
      expect(code, f).toContain("className");
      expect(code, f).toMatch(/export function /);
    }
  });

  it("StatTile renders label/value/hint and shows — for missing values", () => {
    const { rerender } = render(
      <StatTile label="Today" value="₹540" hint="3 jobs" icon={Wallet} tone="success" className="x-tile" />
    );
    expect(screen.getByText("Today")).toBeInTheDocument();
    expect(screen.getByText("₹540")).toBeInTheDocument();
    expect(screen.getByText("3 jobs")).toBeInTheDocument();
    rerender(<StatTile label="Today" value={null} />);
    expect(screen.getByText("—")).toBeInTheDocument();
  });

  it("QuickActionTile is a ≥44px button that fires onClick", () => {
    const onClick = vi.fn();
    render(<QuickActionTile icon={Wrench} label="Jobs" badge={2} onClick={onClick} />);
    const btn = screen.getByRole("button", { name: /Jobs/ });
    expect(btn.className).toContain("min-h-[44px]");
    expect(screen.getByLabelText("2 new")).toBeInTheDocument();
    fireEvent.click(btn);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("ListRow with onClick is a native button (Enter/Space activatable)", () => {
    const onClick = vi.fn();
    render(<ListRow title="Oil change" subtitle="12 Oct" trailing="₹300" chevron onClick={onClick} />);
    const row = screen.getByRole("button", { name: /Oil change/ });
    expect(row.tagName).toBe("BUTTON");
    row.focus();
    expect(row).toHaveFocus();
    fireEvent.click(row);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("ListRow without onClick is not interactive", () => {
    render(<ListRow title="Static" />);
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("SectionHeader renders title and action", () => {
    render(<SectionHeader title="Upcoming" action={<a href="#x">See all</a>} />);
    expect(screen.getByRole("heading", { name: "Upcoming" })).toBeInTheDocument();
    expect(screen.getByText("See all")).toBeInTheDocument();
  });

  it.each([
    ["searching", "info"],
    ["assigned", "info"],
    ["en_route", "pending"],
    ["in_progress", "pending"],
    ["payment_pending", "pending"],
    ["completed", "success"],
    ["cancelled", "danger"],
  ])("StatusPill maps %s to %s with a text label", (status, tone) => {
    const { container } = render(<StatusPill status={status} />);
    const pill = container.firstChild;
    expect(pill.dataset.tone).toBe(tone);
    expect(pill.textContent.trim().length).toBeGreaterThan(0);
  });

  it("StatusPill unknown status renders neutral with the raw label", () => {
    const { container } = render(<StatusPill status="mystery_state" />);
    expect(container.firstChild.dataset.tone).toBe("neutral");
    expect(container.textContent).toContain("mystery_state");
    expect(statusMeta(undefined).label).toBe("—");
  });

  it("StatusPill never uses Picked Up / Delivery copy", () => {
    const code = fs.readFileSync(path.join(uiDir, "StatusPill.js"), "utf8");
    expect(code).not.toMatch(/picked.?up|deliver/i);
  });

  it("PageHeader shows back only when onBack is given", () => {
    const onBack = vi.fn();
    const { rerender } = render(<PageHeader title="Home" />);
    expect(screen.queryByRole("button", { name: "Go back" })).toBeNull();
    rerender(<PageHeader title="Product" subtitle="Brake pads" onBack={onBack} />);
    fireEvent.click(screen.getByRole("button", { name: "Go back" }));
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it("CountdownRing shows remaining time as an accessible timer", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-27T10:00:00Z"));
    render(<CountdownRing expiresAt="2026-10-27T10:10:00Z" />);
    const timer = screen.getByRole("timer");
    expect(timer).toHaveAccessibleName("Offer expires in 10:00");
    act(() => vi.advanceTimersByTime(5000));
    expect(screen.getByRole("timer")).toHaveAccessibleName("Offer expires in 9:55");
  });

  it("CountdownRing with an expired timestamp renders Expired and fires nothing", () => {
    const { container } = render(<CountdownRing expiresAt="2000-01-01T00:00:00Z" />);
    expect(screen.getByText("Expired")).toBeInTheDocument();
    expect(container.querySelector("button")).toBeNull();
  });

  it("CountdownRing renders nothing without a real expiresAt", () => {
    const { container } = render(<CountdownRing expiresAt={undefined} />);
    expect(container.firstChild).toBeNull();
    const bad = render(<CountdownRing expiresAt="not-a-date" />);
    expect(bad.container.firstChild).toBeNull();
  });

  it("CountdownRing stops ticking while the document is hidden", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-27T10:00:00Z"));
    render(<CountdownRing expiresAt="2026-10-27T10:10:00Z" />);
    const hidden = vi.spyOn(document, "hidden", "get").mockReturnValue(true);
    act(() => document.dispatchEvent(new Event("visibilitychange")));
    act(() => vi.advanceTimersByTime(30000));
    // No ticks while hidden: label is still the value from before hiding.
    expect(screen.getByRole("timer")).toHaveAccessibleName("Offer expires in 10:00");
    hidden.mockReturnValue(false);
    act(() => document.dispatchEvent(new Event("visibilitychange")));
    // Resyncs to the real server clock when visible again.
    expect(screen.getByRole("timer")).toHaveAccessibleName("Offer expires in 9:30");
    hidden.mockRestore();
  });

  it("formatRemaining pads seconds", () => {
    expect(formatRemaining(65000)).toBe("1:05");
  });
});
