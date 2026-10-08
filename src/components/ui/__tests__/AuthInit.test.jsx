import { describe, it, expect, vi, beforeEach } from "vitest";
import { render } from "@testing-library/react";

const mockRestoreSession = vi.hoisted(() => vi.fn());
const mockRegisterOnlineFlush = vi.hoisted(() => vi.fn());

vi.mock("@/store/authStore", () => ({
  useAuthStore: {
    getState: () => ({ _hydrated: true, restoreSession: mockRestoreSession }),
    persist: { hasHydrated: () => true },
  },
}));

vi.mock("@/lib/offline/requestQueue", () => ({
  registerOnlineFlush: mockRegisterOnlineFlush,
}));

import { AuthInit } from "@/components/ui/AuthInit";

describe("AuthInit (Wave-6 Task 14)", () => {
  beforeEach(() => {
    mockRestoreSession.mockClear();
    mockRegisterOnlineFlush.mockClear();
  });

  it("renders nothing (headless shell initializer)", () => {
    const { container } = render(<AuthInit />);
    expect(container.innerHTML).toBe("");
  });

  it("restores the session once rehydrated and registers the offline flush", () => {
    render(<AuthInit />);
    expect(mockRestoreSession).toHaveBeenCalledTimes(1);
    expect(mockRegisterOnlineFlush).toHaveBeenCalledTimes(1);
  });
});
