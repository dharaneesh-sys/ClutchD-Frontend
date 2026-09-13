"use client";

import { Award, ShieldCheck, Wrench, Hexagon } from "lucide-react";
import { cn } from "@/lib/utils";
import { CERTIFICATIONS } from "@/lib/constants";

const CERT_STYLE = {
  ase: {
    gradient: "from-emerald-500/25 to-emerald-500/10",
    text: "text-emerald-300",
    border: "border-emerald-500/35",
    glow: "rgba(52,211,153,0.15)",
    icon: Award,
  },
  toyota: {
    gradient: "from-red-500/25 to-red-500/10",
    text: "text-red-300",
    border: "border-red-500/35",
    glow: "rgba(239,68,68,0.15)",
    icon: ShieldCheck,
  },
  honda: {
    gradient: "from-blue-500/25 to-blue-500/10",
    text: "text-blue-300",
    border: "border-blue-500/35",
    glow: "rgba(59,130,246,0.15)",
    icon: Wrench,
  },
  bosch: {
    gradient: "from-primary/25 to-primary/10",
    text: "text-primary-light",
    border: "border-primary/35",
    glow: "rgba(16,185,129,0.15)",
    icon: Hexagon,
  },
};

function formatExpiry(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return null;
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function isExpired(dateStr) {
  if (!dateStr) return false;
  return new Date(dateStr) < new Date();
}

function daysUntilExpiry(dateStr) {
  if (!dateStr) return null;
  const now = new Date();
  const expiry = new Date(dateStr);
  const diff = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));
  return diff;
}

export function CertificationBadge({ certification, issuedDate, expiryDate, showTooltip = true }) {
  const certDef = CERTIFICATIONS.find((c) => c.value === certification);
  if (!certDef) return null;

  const style = CERT_STYLE[certification] || CERT_STYLE.ase;
  const Icon = style.icon;
  const expired = isExpired(expiryDate);
  const expiresIn = daysUntilExpiry(expiryDate);
  const displayExpiry = formatExpiry(expiryDate);
  const displayIssued = formatExpiry(issuedDate);

  const expiryLabel = expired
    ? "Expired"
    : expiresIn !== null && expiresIn <= 30
      ? `${expiresIn}d left`
      : displayExpiry;

  return (
    <div className="group relative inline-flex">
      <span
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold leading-none",
          "backdrop-blur-xl shadow-[0_10px_30px_rgba(var(--color-black-rgb),0.25)]",
          "transition-all duration-200 hover:scale-105",
          style.gradient,
          style.text,
          style.border,
          expired && "opacity-50 grayscale-[0.3]"
        )}
        style={{
          boxShadow: expired ? undefined : `0 4px 12px ${style.glow}`,
        }}
      >
        <Icon size={12} className="shrink-0" />
        <span>{certDef.label}</span>
        {displayExpiry && (
          <span
            className={cn(
              "ml-0.5 pl-1.5 border-l text-[10px] font-medium opacity-70",
              style.border
            )}
          >
            {expiryLabel}
          </span>
        )}
      </span>

      {showTooltip && (
        <div
          className={cn(
            "pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2",
            "opacity-0 group-hover:opacity-100 transition-opacity duration-200",
            "z-50 w-56"
          )}
        >
          <div className="rounded-xl border bg-[#1c1c1f]/95 backdrop-blur-xl p-3 shadow-2xl border-white/10">
            <div className="flex items-center gap-2 mb-1.5">
              <Icon size={14} className={style.text} />
              <span className="text-xs font-bold text-white">{certDef.label}</span>
            </div>
            <p className="text-[11px] text-white/60 mb-2">{certDef.issuer}</p>
            {displayIssued && (
              <div className="flex justify-between text-[10px] text-white/40">
                <span>Issued: {displayIssued}</span>
              </div>
            )}
            {displayExpiry && (
              <div className="flex justify-between text-[10px] text-white/40">
                <span>
                  Expires: {displayExpiry}
                  {expired && (
                    <span className="text-red-400 ml-1">(Expired)</span>
                  )}
                </span>
              </div>
            )}
            {expiresIn !== null && expiresIn > 0 && !expired && (
              <div className="mt-1.5 h-1 rounded-full bg-white/10 overflow-hidden">
                <div
                  className={cn(
                    "h-full rounded-full transition-all",
                    expiresIn > 180 ? "bg-success" : expiresIn > 60 ? "bg-warning" : "bg-danger"
                  )}
                  style={{ width: `${Math.min(100, (expiresIn / 1095) * 100)}%` }}
                />
              </div>
            )}
            <div className="mt-1 text-[9px] text-white/30 text-center">{certDef.description}</div>
          </div>
        </div>
      )}
    </div>
  );
}

export function CertificationBadgeList({ certifications = [], showTooltip = true }) {
  if (!certifications || certifications.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1.5">
      {certifications.map((cert, idx) => (
        <CertificationBadge
          key={`${cert.certification}-${idx}`}
          certification={cert.certification}
          issuedDate={cert.issuedDate}
          expiryDate={cert.expiryDate}
          showTooltip={showTooltip}
        />
      ))}
    </div>
  );
}
