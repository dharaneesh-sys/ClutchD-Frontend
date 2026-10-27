import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

const getJobs = vi.hoisted(() => vi.fn());

vi.mock("@/lib/api", () => ({
  default: { get: getJobs },
}));

import { ScheduledAppointments } from "../ScheduledAppointments.js";

describe("ScheduledAppointments card surface", () => {
  beforeEach(() => {
    getJobs.mockReset();
    getJobs.mockResolvedValue({ data: { jobs: [] } });
  });

  it("renders its flat variant as an opaque card, not a transparent glass surface", async () => {
    render(<ScheduledAppointments onBook={() => {}} />);

    await screen.findByText("No upcoming bookings");

    const card = screen.getByText("Scheduled bookings").closest("div.relative.rounded-2xl");
    expect(card).toBeTruthy();
    expect(card.className).toContain("bg-[var(--surface)]");
    expect(card.className).toContain("border-[var(--color-border-subtle)]");
    expect(card.className).not.toContain("glass-lux");
    expect(card.className).not.toContain("backdrop-blur");
    expect(card.className).not.toContain("bg-transparent");
  });
});
