// Wave-3 Task 7 — RED-first tests: settings toggles persist + theme works.
// Routes/data/modal behavior frozen; only styling + persistence asserted.
import "@testing-library/jest-dom/vitest";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), back: vi.fn() }),
  usePathname: () => "/marketplace/profile/settings",
}));

const apiMocks = vi.hoisted(() => ({
  get: vi.fn(),
  put: vi.fn(),
  delete: vi.fn(),
}));
vi.mock("@/lib/api", () => ({
  default: { get: apiMocks.get, put: apiMocks.put, delete: apiMocks.delete },
  extractApiError: (err, fallback) => fallback || "Error",
}));

vi.mock("@/lib/navigation", () => ({ navigateToAuth: vi.fn() }));
vi.mock("@/lib/exportLocalUserData", () => ({ downloadLocalUserData: vi.fn(() => null) }));

import SettingsPage from "@/app/marketplace/profile/settings/page";
import { themeStore } from "@/store/themeStore";
import { useAuthStore } from "@/store/authStore";

const SETTINGS_PAYLOAD = {
  push_notifications: false,
  sms_notifications: false,
  email_notifications: false,
  theme: "light",
  language: "en",
};

beforeEach(() => {
  apiMocks.get.mockReset().mockResolvedValue({ data: { ...SETTINGS_PAYLOAD } });
  apiMocks.put.mockReset().mockResolvedValue({ data: {} });
  apiMocks.delete.mockReset();
  localStorage.clear();
  themeStore.setState({ theme: "light" });
  useAuthStore.setState({ user: { id: "u1", role: "customer" } });
});

async function renderReady() {
  render(<SettingsPage />);
  await waitFor(() => expect(apiMocks.get).toHaveBeenCalledWith("/settings"));
  // skeleton gone => switches mounted
  await screen.findAllByRole("switch");
}

describe("settings notification toggles persist (data flow frozen)", () => {
  it("toggling push persists push_notifications via PUT", async () => {
    await renderReady();
    const switches = screen.getAllByRole("switch");
    expect(switches[0]).toHaveAttribute("aria-checked", "false");
    fireEvent.click(switches[0]);
    await waitFor(() =>
      expect(apiMocks.put).toHaveBeenCalledWith("/settings", { push_notifications: true })
    );
    expect(switches[0]).toHaveAttribute("aria-checked", "true");
  });

  it("toggling sms persists sms_notifications via PUT", async () => {
    await renderReady();
    const switches = screen.getAllByRole("switch");
    fireEvent.click(switches[1]);
    await waitFor(() =>
      expect(apiMocks.put).toHaveBeenCalledWith("/settings", { sms_notifications: true })
    );
  });

  it("toggling email persists email_notifications via PUT", async () => {
    await renderReady();
    const switches = screen.getAllByRole("switch");
    fireEvent.click(switches[2]);
    await waitFor(() =>
      expect(apiMocks.put).toHaveBeenCalledWith("/settings", { email_notifications: true })
    );
  });
});

describe("settings theme control works in both themes (D2)", () => {
  it("selecting Dark applies dark app-wide and persists the preference", async () => {
    await renderReady();
    fireEvent.click(screen.getByRole("button", { name: /dark/i }));
    expect(themeStore.getState().theme).toBe("dark");
    await waitFor(() =>
      expect(apiMocks.put).toHaveBeenCalledWith("/settings", { theme: "dark" })
    );
  });

  it("selecting Light applies light app-wide and persists the preference", async () => {
    themeStore.setState({ theme: "dark" });
    await renderReady();
    fireEvent.click(screen.getByRole("button", { name: /^light/i }));
    expect(themeStore.getState().theme).toBe("light");
    await waitFor(() =>
      expect(apiMocks.put).toHaveBeenCalledWith("/settings", { theme: "light" })
    );
  });
});

describe("settings token contract (D1/D5)", () => {
  it("toggle off-state and section chrome use tokens, not white washes", async () => {
    const fs = await import("node:fs");
    const path = await import("node:path");
    const code = fs.readFileSync(
      path.resolve(process.cwd(), "src/app/marketplace/profile/settings/page.js"),
      "utf8"
    );
    expect(code).not.toMatch(/bg-white\//);
    expect(code).not.toMatch(/border-white|ring-white|divide-white|hover:bg-white/);
    expect(code).toContain("bg-surface-soft");
  });
});
