// Wave-1 Task 3 (nav shell) — RED-first a11y + glass contract tests for overlays.
// DESIGN.md: D9.4 (focus-trap/restore/portal/ESC/back-stack identical), D5
// (glass-lux 2-variant), D4 (dialogs rounded-2xl, C1), D15.4.6 (M3 dialog:
// 32% scrim, modal-in/backdrop-in), D7 (info/pending roles, no text-warning).
import "@testing-library/jest-dom/vitest";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

import { Modal } from "@/components/ui/Modal";
import { ConfirmModal } from "@/components/ui/ConfirmModal";

beforeEach(() => {
  window.__backEscapeStack = [];
  document.documentElement.setAttribute("data-theme", "light");
  document.body.innerHTML = "";
});

function dialogPanel() {
  return screen.getByRole("dialog");
}

describe.each(["light", "dark"])("Modal a11y in %s theme (D9.4)", (theme) => {
  beforeEach(() => {
    document.documentElement.setAttribute("data-theme", theme);
  });

  it("portals the dialog with aria-modal + labelled title", () => {
    render(
      <Modal isOpen onClose={() => {}} title="Hello">
        <button>Action</button>
      </Modal>,
    );
    const panel = dialogPanel();
    expect(panel).toHaveAttribute("aria-modal", "true");
    expect(panel).toHaveAttribute(
      "aria-labelledby",
      expect.stringMatching(/modal-title-/),
    );
    expect(document.body.contains(panel)).toBe(true);
  });

  it("uses glass-lux + rounded-2xl with the M3 32% scrim (D4/D5/D15.4.6)", () => {
    render(
      <Modal isOpen onClose={() => {}} title="Hello">
        body
      </Modal>,
    );
    const panel = dialogPanel();
    expect(panel.className).toMatch(/glass-lux/);
    expect(panel.className).toMatch(/rounded-2xl/);
    expect(panel.className).not.toMatch(/dark:/);
    const scrim = document.querySelector('[aria-hidden="true"]');
    expect(scrim.className).toMatch(/0,0,0,0\.32/);
  });

  it("closes on Escape and on backdrop click", () => {
    const onClose = vi.fn();
    render(
      <Modal isOpen onClose={onClose} title="Hello">
        body
      </Modal>,
    );
    fireEvent.keyDown(window, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);
    fireEvent.click(document.querySelector('[aria-hidden="true"]'));
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it("traps Tab focus and restores focus on close", async () => {
    const onClose = vi.fn();
    const outside = document.createElement("button");
    outside.textContent = "Outside";
    document.body.appendChild(outside);
    outside.focus();
    const { rerender } = render(
      <Modal isOpen onClose={onClose} title="Hello">
        <button>First</button>
        <button>Second</button>
      </Modal>,
    );
    const panel = dialogPanel();
    const focusables = panel.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );
    const firstFocusable = focusables[0];
    const lastFocusable = focusables[focusables.length - 1];
    await waitFor(() => expect(document.activeElement).toBe(firstFocusable));
    fireEvent.keyDown(document, { key: "Tab", shiftKey: true });
    expect(document.activeElement).toBe(lastFocusable);
    fireEvent.keyDown(document, { key: "Tab" });
    expect(document.activeElement).toBe(firstFocusable);
    rerender(
      <Modal isOpen={false} onClose={onClose} title="Hello">
        <button>First</button>
        <button>Second</button>
      </Modal>,
    );
    expect(document.activeElement).toBe(outside);
    outside.remove();
  });

  it("joins the hardware-back stack and pops on unmount", () => {
    const onClose = vi.fn();
    const { unmount } = render(
      <Modal isOpen onClose={onClose} title="Hello">
        body
      </Modal>,
    );
    expect(window.__backEscapeStack).toHaveLength(1);
    expect(window.__backEscapeStack[0].close).toBe(onClose);
    unmount();
    expect(window.__backEscapeStack).toHaveLength(0);
  });

  it("renders nothing when closed", () => {
    render(
      <Modal isOpen={false} onClose={() => {}} title="Hello">
        body
      </Modal>,
    );
    expect(screen.queryByRole("dialog")).toBeNull();
  });
});

describe("ConfirmModal glass + status roles (D5/D7)", () => {
  it("uses info (not warning) for the non-danger variant", () => {
    render(
      <ConfirmModal
        isOpen
        onClose={() => {}}
        onConfirm={() => {}}
        variant="info"
      />,
    );
    const dialog = screen.getByRole("alertdialog");
    expect(dialog.className).toMatch(/glass-lux/);
    expect(dialog.innerHTML).not.toMatch(/text-warning/);
  });

  it("danger confirm uses the danger token and fires onConfirm", () => {
    const onConfirm = vi.fn();
    render(
      <ConfirmModal
        isOpen
        onClose={() => {}}
        onConfirm={onConfirm}
        title="Delete it?"
        message="Gone forever."
      />,
    );
    expect(screen.getByText("Delete it?")).toBeInTheDocument();
    const confirm = screen.getByRole("button", { name: "Delete" });
    expect(confirm.className).toMatch(/bg-danger/);
    expect(confirm.className).not.toMatch(/bg-red-500/);
    fireEvent.click(confirm);
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });
});
