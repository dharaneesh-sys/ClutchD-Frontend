// Wave-1 Task 4 (cards) — RED-first contract tests for ProfileMenu.
// DESIGN.md: D1 (grounded blue + danger token, no red-*/white-* hardcodes),
// D3 (label-2 section heads), D4 (rows cards rounded-2xl), D5 (glass-lux rows),
// D7/D15 (danger role for SOS), D8 (lucide only), D9 (menu entries/nav targets frozen).
import "@testing-library/jest-dom/vitest";
import { describe, it, expect, vi, beforeEach } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { render, screen, fireEvent } from "@testing-library/react";

const navMocks = vi.hoisted(() => ({ push: vi.fn(), path: "/marketplace/profile" }));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: navMocks.push }),
  usePathname: () => navMocks.path,
}));
const sosMocks = vi.hoisted(() => ({
  sos: {
    loading: false,
    status: "idle",
    errorMsg: null,
    queuedMsg: null,
    isOnline: true,
    handleSOS: vi.fn(),
    handleConfirm: vi.fn(),
    dismissMessages: vi.fn(),
  },
}));
vi.mock("@/components/ui/useSOS", () => ({ useSOS: () => sosMocks.sos }));

import { ProfileMenu } from "@/components/profile/ProfileMenu";
import { useAuthStore } from "@/store/authStore";

const profileDir = path.resolve(process.cwd(), "src/components/profile");
const src = () => fs.readFileSync(path.join(profileDir, "ProfileMenu.js"), "utf8");

beforeEach(() => {
  navMocks.push.mockClear();
  sosMocks.sos.handleSOS.mockClear();
  sosMocks.sos.loading = false;
  sosMocks.sos.status = "idle";
  sosMocks.sos.queuedMsg = null;
  useAuthStore.setState({ user: { role: "customer" } });
});

describe("ProfileMenu render + nav (targets frozen per D9)", () => {
  it("renders account + activity entries for a customer", () => {
    render(<ProfileMenu />);
    expect(screen.getByText("Account Details")).toBeTruthy();
    expect(screen.getByText("Orders")).toBeTruthy();
    expect(screen.getByText("Emergency SOS")).toBeTruthy();
  });

  it("navigates to the entry path on click (target unchanged)", () => {
    render(<ProfileMenu />);
    fireEvent.click(screen.getByText("Orders"));
    expect(navMocks.push).toHaveBeenCalledWith("/marketplace/profile/orders");
  });

  it("fires the SOS handler from the inline row", () => {
    render(<ProfileMenu />);
    fireEvent.click(screen.getByText("Emergency SOS"));
    expect(sosMocks.sos.handleSOS).toHaveBeenCalled();
  });
});

describe("ProfileMenu contract (D1/D3/D4/D5/D7/D8)", () => {
  it("glass-lux row cards + rounded-2xl with semantic dividers (no divide-white)", () => {
    const code = src();
    expect(code).toContain("glass-lux");
    expect(code).not.toContain("glass-lux-interactive");
    expect(code).toContain("rounded-2xl");
    expect(code).toMatch(/divide-border-subtle/);
    expect(code).not.toMatch(/divide-white/);
  });

  it("SOS + destructive states use the danger role, no red-*/white-* hardcodes", () => {
    const code = src();
    expect(code).toContain("var(--danger)");
    expect(code).not.toMatch(/red-400|red-500/);
    expect(code).not.toMatch(/bg-white\/|text-white|hover:bg-white/);
    expect(code).not.toMatch(/\/15\[0\.06\]/);
  });

  it("section heads use the label-2 step; icons are lucide only", () => {
    const code = src();
    expect(code).toMatch(/type-label-2|label-2/);
    expect(code).toContain("lucide-react");
    expect(code).not.toContain("<svg");
  });
});
