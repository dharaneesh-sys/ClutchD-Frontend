// Task 12: isolated LoginCard checks. No network: the auth store's `login` is
// replaced with a spy so only the form/validation branch is exercised.
import "@testing-library/jest-dom/vitest";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));

import { useAuthStore } from "@/store/authStore";
import { LoginCard } from "../LoginCard.js";

const login = vi.fn();

beforeEach(() => {
  login.mockReset();
  useAuthStore.setState({ login, error: null, _signupNeeded: false });
});

describe("LoginCard (task 12)", () => {
  it("shows the five role chips with a clear selected state", () => {
    render(<LoginCard />);
    for (const label of ["Customer", "Mechanic", "Garage", "Seller", "Fleet"]) {
      expect(screen.getByRole("button", { name: new RegExp(label) })).toBeInTheDocument();
    }
    const mechanic = screen.getByRole("button", { name: /Mechanic/ });
    expect(mechanic).toHaveAttribute("aria-pressed", "false");
    fireEvent.click(mechanic);
    expect(mechanic).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: /Customer/ })).toHaveAttribute("aria-pressed", "false");
  });

  it("invalid email shows inline validation and never calls login", async () => {
    render(<LoginCard />);
    const form = screen.getByRole("button", { name: /Sign In/ }).closest("form");
    expect(form).toHaveAttribute("novalidate");
    fireEvent.change(screen.getByLabelText("Email Address"), { target: { value: "not-an-email" } });
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "secret123" } });
    fireEvent.submit(form);
    await waitFor(() => expect(screen.getAllByRole("alert").length).toBeGreaterThan(0));
    expect(login).not.toHaveBeenCalled();
  });

  it("renders a store auth error inline (no phone/OTP field)", () => {
    useAuthStore.setState({ error: "Cannot reach the server. Check your connection." });
    render(<LoginCard />);
    expect(screen.getByRole("alert")).toHaveTextContent("Cannot reach the server");
    expect(screen.queryByLabelText(/phone|otp/i)).toBeNull();
  });

  it("has no pre-filled identity", () => {
    render(<LoginCard />);
    expect(screen.getByLabelText("Email Address")).toHaveValue("");
    expect(screen.getByLabelText("Password")).toHaveValue("");
  });
});
