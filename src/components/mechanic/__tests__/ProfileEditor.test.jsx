// Task 13: isolated ProfileEditor checks. The API module is replaced in this
// test only; no fixture ships in product code.
import "@testing-library/jest-dom/vitest";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

const apiMock = vi.hoisted(() => ({ patch: vi.fn() }));
vi.mock("@/lib/api", () => ({ default: apiMock }));
vi.mock("@/components/ui/ToastProvider", () => ({ useToast: () => ({ error: vi.fn() }) }));

import { useAuthStore } from "@/store/authStore";
import { ProfileEditor } from "../ProfileEditor.js";

// Shape of a real session user with optional fields missing.
const sessionUser = { id: "u1", role: "mechanic", email: "pat@example.com", name: "Pat Kumar", kycStatus: "submitted" };

beforeEach(() => {
  apiMock.patch.mockReset();
  useAuthStore.setState({ user: sessionUser, updateUserData: vi.fn() });
});

describe("ProfileEditor (task 13)", () => {
  it("shows honest placeholders for missing fields, never fake values", () => {
    render(<ProfileEditor />);
    expect(screen.getByText("Pat Kumar")).toBeInTheDocument();
    expect(screen.getByLabelText("Phone")).toHaveAttribute("placeholder", "— Not set");
    expect(screen.getByLabelText("Phone")).toHaveValue("");
    expect(screen.getByText(/— Not set\. Add your UPI ID/)).toBeInTheDocument();
    expect(screen.getAllByText("—", { exact: false }).length).toBeGreaterThan(0);
    expect(screen.getByText("KYC Under Review")).toBeInTheDocument();
    expect(screen.queryByText(/%/)).toBeNull();
  });

  it("server error on save shows an inline error and re-enables Save", async () => {
    apiMock.patch.mockRejectedValueOnce({ response: { status: 500, data: {} } });
    render(<ProfileEditor />);
    fireEvent.click(screen.getByRole("button", { name: "Edit Profile" }));
    const save = screen.getByRole("button", { name: "Save Changes" });
    fireEvent.click(save);
    expect(await screen.findByRole("alert")).toHaveTextContent("try again");
    await waitFor(() => expect(screen.getByRole("button", { name: "Save Changes" })).not.toBeDisabled());
    expect(apiMock.patch).toHaveBeenCalledWith("/providers/profile", expect.objectContaining({ fullName: "Pat Kumar" }));
  });

  it("422 detail string is shown inline", async () => {
    apiMock.patch.mockRejectedValueOnce({ response: { status: 422, data: { detail: "Invalid UPI ID" } } });
    render(<ProfileEditor />);
    fireEvent.click(screen.getByRole("button", { name: "Edit Profile" }));
    fireEvent.click(screen.getByRole("button", { name: "Save Changes" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Invalid UPI ID");
  });
});
