"use client";

import { ShieldCheck, Info } from "lucide-react";

/**
 * WarrantyTerms — Displays the ClutchD warranty policy covering parts and labor.
 *
 * Two display variants:
 *   - "card" (default): Standalone card with icon header, used on receipt/invoice.
 *   - "inline": Compact text block used on booking confirmation.
 *
 * Usage:
 *   <WarrantyTerms variant="card" />
 *   <WarrantyTerms variant="inline" />
 */
export function WarrantyTerms({ variant = "card" }) {
  const terms = [
    {
      label: "Parts Warranty",
      value: "12 months or 12,000 km",
      detail: "Whichever comes first",
    },
    {
      label: "Labor Warranty",
      value: "6 months or 6,000 km",
      detail: "Whichever comes first",
    },
  ];

  const exclusions = [
    "Damage from misuse, neglect, or accidents",
    "Normal wear and tear items (brake pads, wipers, etc.)",
    "Unauthorized repairs or modifications",
    "Consequential damages or towing costs",
  ];

  if (variant === "inline") {
    return (
      <div className="rounded-xl border p-4 bg-bg-card border-border-subtle">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 bg-primary/10 text-primary">
            <ShieldCheck size={18} />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-xs font-bold uppercase tracking-wider text-text-dim mb-2">
              Warranty Coverage
            </h4>
            <div className="space-y-1.5 text-sm">
              {terms.map((t) => (
                <div key={t.label} className="flex justify-between text-text-primary">
                  <span>{t.label}</span>
                  <span className="font-medium text-icon-highlight">{t.value}</span>
                </div>
              ))}
              <p className="text-[10px] text-text-muted mt-0.5">
                Coverage begins on the date of service completion.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border p-5 bg-bg-card border-border-subtle">
      {/* Header */}
      <div className="flex items-start gap-4">
        <div className="w-11 h-11 rounded-full flex items-center justify-center shrink-0 bg-primary/10 text-primary">
          <ShieldCheck size={22} />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-bold uppercase tracking-wider text-text-dim">
            Warranty Terms
          </h4>
          <p className="text-xs mt-1 text-text-muted">
            Every service comes with our standard warranty coverage.
          </p>
        </div>
      </div>

      {/* Terms grid */}
      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
        {terms.map((t) => (
          <div
            key={t.label}
            className="rounded-lg border p-3 border-border-subtle bg-surface-soft"
          >
            <p className="text-[10px] uppercase tracking-wider text-text-dim mb-1">
              {t.label}
            </p>
            <p className="text-sm font-bold text-icon-highlight">{t.value}</p>
            <p className="text-[10px] text-text-muted mt-0.5">{t.detail}</p>
          </div>
        ))}
      </div>

      {/* Exclusions */}
      <details className="mt-4 group">
        <summary className="flex items-center gap-1.5 text-xs text-text-muted cursor-pointer hover:text-icon-highlight transition-colors list-none">
          <Info size={12} className="group-open:text-icon-highlight" />
          <span>What&apos;s not covered</span>
        </summary>
        <ul className="mt-2 space-y-1">
          {exclusions.map((e) => (
            <li
              key={e}
              className="text-[11px] text-text-muted flex items-start gap-2"
            >
              <span className="block w-1 h-1 rounded-full bg-text-dim mt-1.5 shrink-0" />
              {e}
            </li>
          ))}
        </ul>
      </details>
    </div>
  );
}
