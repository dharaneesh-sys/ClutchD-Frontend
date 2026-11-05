import { describe, it, expect, beforeEach, vi } from "vitest";
import { useToastStore } from "@/store/toastStore";
import { useAuthStore } from "@/store/authStore";
import { handleRefreshFailure } from "@/lib/authRefresh";

describe("toast flood guard", () => {
  beforeEach(() => useToastStore.getState().clearToasts());
  it("does not stack identical toasts and caps the stack", () => {
    const t = useToastStore.getState();
    for (let i = 0; i < 20; i++) t.error("Could not load your saved vehicles.");
    expect(useToastStore.getState().toasts).toHaveLength(1);
    for (let i = 0; i < 10; i++) t.error(`distinct ${i}`);
    expect(useToastStore.getState().toasts.length).toBeLessThanOrEqual(3);
  });
});

describe("handleRefreshFailure", () => {
  it("resets the auth store so /auth cannot bounce back to the dashboard", async () => {
    useAuthStore.setState({ user: { id: "u1", role: "mechanic" }, isAuthenticated: true, _hydrated: true });
    const nav = vi.fn();
    window.addEventListener("clutchd:navigate", nav);
    handleRefreshFailure();
    await vi.waitFor(() => expect(nav).toHaveBeenCalledTimes(1));
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
    expect(useAuthStore.getState().user).toBeNull();
    handleRefreshFailure(); // parallel 401 burst: no second redirect
    await new Promise((r) => setTimeout(r, 20));
    expect(nav).toHaveBeenCalledTimes(1);
  });
});
