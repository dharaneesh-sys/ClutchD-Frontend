import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { render, screen } from "@testing-library/react";
import { Button } from "../Button.js";
import { Badge } from "../Badge.js";
import { GlassCard } from "../GlassCard.js";
import { Input } from "../Input.js";
import { Select } from "../Select.js";
import { FileUpload } from "../FileUpload.js";
import { Skeleton, CardSkeleton } from "../Skeleton.js";
import { Shimmer } from "../Shimmer.js";

const uiDir = path.resolve(process.cwd(), "src/components/ui");
const src = (f) => fs.readFileSync(path.join(uiDir, f), "utf8");

const FLAT_CARD_BG = "bg-[var(--surface)]";
const FLAT_CARD_BORDER = "border-[var(--color-border-subtle)]";
const expectFlatCard = (card) => {
  expect(card).toBeTruthy();
  expect(card.className).toContain(FLAT_CARD_BG);
  expect(card.className).toContain(FLAT_CARD_BORDER);
  expect(card.className).toContain("rounded-2xl");
  expect(card.className).not.toContain("glass-lux");
  expect(card.className).not.toContain("backdrop-blur");
  expect(card.className).not.toContain("bg-transparent");
};

describe("Wave-1 Task 2: primitives restyle contract (D1/D4/D8/D11/D15)", () => {
  it("Button variants render with grounded-blue primary, rounded-xl, lucide Loader2, focus-visible ring", () => {
    const { rerender, container } = render(<Button>Save</Button>);
    const btn = container.querySelector("button");
    expect(btn.className).toContain("rounded-xl");
    expect(btn.className).toContain("var(--primary)");
    expect(btn.className).not.toContain("text-white");
    expect(btn.className).toContain("focus-visible:");

    rerender(<Button variant="tonal">Tonal</Button>);
    expect(container.querySelector("button").className).toContain("var(--color-surface-");

    rerender(<Button variant="outline">Outline</Button>);
    expect(container.querySelector("button").className).toContain("var(--color-surface-");

    rerender(<Button variant="danger">Delete</Button>);
    expect(container.querySelector("button").className).toContain("var(--danger)");

    rerender(<Button isLoading>Busy</Button>);
    expect(container.querySelector("button svg")).toBeTruthy();
    expect(container.querySelector("button").disabled).toBe(true);
  });

  it("Badge supports default/success/danger/info/pending/glass/warning; warning maps to pending, glass to neutral", () => {
    const { rerender, container } = render(<Badge variant="info">Assigned</Badge>);
    expect(container.textContent).toContain("Assigned");
    expect(container.querySelector("span").className).toContain("var(--info)");
    expect(container.querySelector("span").className).toContain("rounded-full");

    rerender(<Badge variant="pending">Queued</Badge>);
    expect(container.querySelector("span").className).toContain("var(--pending");

    rerender(<Badge variant="warning">Awaiting</Badge>);
    const warning = container.querySelector("span");
    expect(warning.className).toContain("var(--pending-bg)");
    expect(warning.className).toContain("var(--pending-text)");
    expect(warning.className).toContain("var(--pending)");
    expect(warning.className).not.toContain("var(--info)");

    rerender(<Badge variant="glass">Neutral</Badge>);
    expect(container.querySelector("span").className).toContain("var(--color-badge-bg)");
    expect(container.querySelector("span").className).toContain("var(--color-badge-text)");

    for (const unknown of ["not-a-variant", "constructor"]) {
      rerender(<Badge variant={unknown}>Unknown</Badge>);
      expect(container.querySelector("span").className).toContain("var(--color-badge-bg)");
      expect(container.querySelector("span").className).toContain("var(--color-badge-text)");
    }

    rerender(<Badge variant="success">Done</Badge>);
    expect(container.querySelector("span").className).toContain("var(--success)");

    rerender(<Badge variant="danger">Failed</Badge>);
    expect(container.querySelector("span").className).toContain("var(--danger)");

    const badgeSrc = src("Badge.js");
    expect(badgeSrc).toContain("warning: pendingVariant");
    expect(badgeSrc).not.toMatch(/#[0-9a-fA-F]{3,6}|\bwhite\//);
  });

  it("GlassCard defaults to a flat opaque surface", () => {
    const { container } = render(<GlassCard>Default card</GlassCard>);
    expectFlatCard(container.firstChild);
  });

  it.each([
    "strong",
    "outlined",
    "flat",
    "glass",
    "glass-lux",
    "glass-lux-interactive",
    "elevated",
    "filled",
  ])("GlassCard legacy variant %s resolves to the flat surface", (variant) => {
    const { container } = render(<GlassCard variant={variant}>Legacy card</GlassCard>);
    expectFlatCard(container.firstChild);
  });

  it.each(["legacy-mystery", "constructor"])(
    "GlassCard unknown variant %s falls back to flat, never a pass-through class",
    (variant) => {
      const { container } = render(<GlassCard variant={variant}>Unknown card</GlassCard>);
      expectFlatCard(container.firstChild);
      expect(container.firstChild.className).not.toContain(variant);
    }
  );

  it("Input renders label, rounded-xl control, focus-visible ring, danger-token error state", () => {
    const { container } = render(<Input label="Name" error="Required" />);
    expect(screen.getByText("Name")).toBeTruthy();
    const input = container.querySelector("input");
    expect(input.getAttribute("aria-invalid")).toBe("true");
    expect(input.className).toContain("rounded-xl");
    expect(input.className).toContain("focus-visible:");
    expect(input.className).toContain("var(--danger)");
    expect(input.className).not.toContain("red-500");
    expect(screen.getByText("Required")).toBeTruthy();
  });

  it("Select renders options, rounded-xl, danger-token error state", () => {
    const { container } = render(
      <Select
        label="City"
        placeholder="Pick one"
        options={[{ value: "a", label: "Alpha" }]}
        error="Pick one"
      />
    );
    expect(screen.getByText("Alpha")).toBeTruthy();
    const select = container.querySelector("select");
    expect(select.className).toContain("rounded-xl");
    expect(select.className).toContain("var(--danger)");
    expect(select.className).not.toContain("red-500");
  });

  it("FileUpload renders dropzone prompt, rounded-xl, danger-token error state", () => {
    const { container } = render(<FileUpload label="Docs" onChange={() => {}} error="Too big" />);
    expect(container.textContent).toContain("Click to upload");
    expect(container.querySelector("input[type=file]")).toBeTruthy();
    expect(container.innerHTML).toContain("rounded-xl");
    expect(container.innerHTML).toContain("var(--danger)");
    expect(container.innerHTML).not.toContain("red-500");
  });

  it("Skeleton/Shimmer use token surfaces, shimmer-pulse motion, no white hardcodes", () => {
    const { container } = render(<Skeleton variant="title" />);
    expect(container.querySelector("div").className).toContain("shimmer-pulse");
    render(<CardSkeleton />);
    render(<Shimmer variant="text" />);
    for (const f of ["Skeleton.js", "Shimmer.js"]) {
      expect(src(f)).not.toMatch(/\bbg-white\/|\bborder-white\/|\btext-white|\bfrom-white\//);
      expect(src(f)).not.toMatch(/stone-|zinc-|animate-pulse/);
    }
    expect(src("Skeleton.js")).toContain("shimmer-pulse");
  });
});
