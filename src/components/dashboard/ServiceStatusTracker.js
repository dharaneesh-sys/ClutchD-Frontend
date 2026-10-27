import Image from "next/image";
import { useState, useEffect } from "react";
import { SERVICE_STATUS, GST_RATE } from "@/lib/constants";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import { StatusPill } from "@/components/ui/StatusPill";
import { Search, UserCheck, Navigation, Wrench, CreditCard, CheckCircle2, XCircle, Phone, Star, CarFront, ChevronDown } from "lucide-react";
import api from "@/lib/api";
import { cn } from "@/lib/utils";
import { formatIndianPlate } from "@/lib/plateFormatter";

/*
 * Full status map (DESIGN.md §0). Six visible stages; `providers_notified` is
 * display-only (DB stays `searching`); `payment_escrow|released|dispute` are
 * frontend-only legacy labels shown as Payment. `cancelled` is terminal.
 * Payment is immediate capture: no escrow hold or release actions.
 */
export const TRACKER_STAGES = [
  { key: "finding", label: "Finding a mechanic", icon: Search, statuses: [SERVICE_STATUS.SEARCHING, SERVICE_STATUS.NOTIFIED] },
  { key: "assigned", label: "Professional assigned", icon: UserCheck, statuses: [SERVICE_STATUS.ASSIGNED] },
  { key: "en_route", label: "On the way", icon: Navigation, statuses: [SERVICE_STATUS.EN_ROUTE] },
  { key: "in_progress", label: "Service in progress", icon: Wrench, statuses: [SERVICE_STATUS.IN_PROGRESS] },
  {
    key: "payment",
    label: "Payment",
    icon: CreditCard,
    statuses: [
      SERVICE_STATUS.PAYMENT_PENDING,
      SERVICE_STATUS.PAYMENT_ESCROW,
      SERVICE_STATUS.PAYMENT_RELEASED,
      SERVICE_STATUS.PAYMENT_DISPUTE,
    ],
  },
  { key: "completed", label: "Completed", icon: CheckCircle2, statuses: [SERVICE_STATUS.COMPLETED] },
];

export function stageIndexFor(status) {
  return TRACKER_STAGES.findIndex((s) => s.statuses.includes(status));
}

const CANCELLABLE = new Set([
  SERVICE_STATUS.SEARCHING,
  SERVICE_STATUS.NOTIFIED,
  SERVICE_STATUS.ASSIGNED,
  SERVICE_STATUS.EN_ROUTE,
  SERVICE_STATUS.IN_PROGRESS,
  SERVICE_STATUS.PAYMENT_PENDING,
]);

// Paid states where the customer can report a problem (dispute).
const DISPUTABLE = new Set([
  SERVICE_STATUS.PAYMENT_ESCROW,
  SERVICE_STATUS.PAYMENT_RELEASED,
  SERVICE_STATUS.COMPLETED,
]);

const money = (v) => {
  const n = Number(v);
  return v === null || v === undefined || !Number.isFinite(n) ? "—" : `₹${n.toFixed(2)}`;
};

function ProviderCard({ mechanic }) {
  if (!mechanic || !mechanic.name) return null;
  const distance = mechanic.distance;
  return (
    <div data-testid="provider-card" className="rounded-xl border p-4 bg-[var(--surface-card)] border-[var(--border)]">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 shrink-0 rounded-full flex items-center justify-center overflow-hidden border bg-[var(--surface-soft)] border-[var(--border)]">
          {mechanic.image ? (
            <Image src={mechanic.image} alt="" width={48} height={48} className="w-full h-full object-cover" />
          ) : (
            <UserCheck aria-hidden="true" className="text-[var(--primary-dark)]" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h4 className="truncate font-semibold text-[var(--foreground)]">{mechanic.name}</h4>
          <div className="mt-0.5 flex items-center gap-1 text-xs text-[var(--text-muted)]">
            <Star size={12} aria-hidden="true" className="fill-[var(--pending)] text-[var(--pending)]" />
            {mechanic.rating ?? "—"}
            {distance && <span>· {distance} away</span>}
          </div>
        </div>
        {mechanic.phone && (
          <a
            href={`tel:${mechanic.phone}`}
            aria-label={`Call ${mechanic.name}`}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--surface-soft)] text-[var(--primary-dark)] hover:bg-[var(--border)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
          >
            <Phone size={18} aria-hidden="true" />
          </a>
        )}
      </div>
    </div>
  );
}

function DisputeForm({ onSubmit }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  if (!open) {
    return (
      <Button variant="outline" className="w-full" onClick={() => setOpen(true)}>
        Report a problem
      </Button>
    );
  }
  return (
    <form
      className="space-y-2"
      onSubmit={(e) => {
        e.preventDefault();
        if (reason.trim().length < 5) return;
        onSubmit?.(reason.trim());
        setOpen(false);
      }}
    >
      <label htmlFor="dispute-reason" className="block text-sm font-medium text-[var(--foreground)]">
        What went wrong?
      </label>
      <textarea
        id="dispute-reason"
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        className="w-full min-h-[88px] rounded-xl border px-3 py-2 text-sm bg-[var(--surface-card)] border-[var(--border)] text-[var(--foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
      />
      <div className="flex gap-2">
        <Button type="button" variant="secondary" className="flex-1" onClick={() => setOpen(false)}>
          Cancel
        </Button>
        <Button type="submit" variant="danger" className="flex-1" disabled={reason.trim().length < 5}>
          Submit
        </Button>
      </div>
    </form>
  );
}

export function ServiceStatusTracker({ request, onComplete, onCancel, onDisputePayment, onVehicleChange }) {
  const [isVehicleSelectorOpen, setIsVehicleSelectorOpen] = useState(false);
  const [vehicles, setVehicles] = useState([]);

  const fetchVehicles = async () => {
    try {
      const res = await api.get("/vehicles");
      setVehicles(res.data);
    } catch {
      // best effort
    }
  };

  useEffect(() => {
    if (request?.status === SERVICE_STATUS.SEARCHING) {
      /* eslint-disable-next-line react-hooks/set-state-in-effect */
      fetchVehicles();
    }
  }, [request?.status]);

  if (!request) return null;

  const status = request.status;
  const isCancelled = status === SERVICE_STATUS.CANCELLED;
  const currentIdx = stageIndexFor(status);
  const currentStage = TRACKER_STAGES[currentIdx];
  const pricing = request.pricing;
  const total = pricing?.totalAmount;
  const hasTotal = total !== null && total !== undefined && Number.isFinite(Number(total));

  const renderStatusBody = () => {
    switch (status) {
      case SERVICE_STATUS.SEARCHING:
      case SERVICE_STATUS.NOTIFIED:
        return (
          <div className="py-4 text-center">
            <div className="relative mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--surface-soft)] text-[var(--primary-dark)]">
              <span aria-hidden="true" className="absolute inset-0 rounded-full border-2 border-[var(--primary)] opacity-30 animate-ping motion-reduce:animate-none" />
              <Search size={24} aria-hidden="true" />
            </div>
            <p className="text-sm text-[var(--text-muted)]">
              {status === SERVICE_STATUS.NOTIFIED
                ? "Nearby providers have been notified. Waiting for a response…"
                : "We're contacting the closest available professionals."}
            </p>
          </div>
        );

      case SERVICE_STATUS.ASSIGNED:
      case SERVICE_STATUS.EN_ROUTE:
      case SERVICE_STATUS.IN_PROGRESS:
        return <ProviderCard mechanic={request.mechanic} />;

      case SERVICE_STATUS.PAYMENT_PENDING:
        return (
          <div className="space-y-4">
            <ProviderCard mechanic={request.mechanic} />
            <div className="rounded-xl border p-4 bg-[var(--surface-card)] border-[var(--border)]">
              <h4 className="mb-3 text-sm font-semibold text-[var(--foreground)]">Invoice</h4>
              {pricing ? (
                <dl className="space-y-2 text-sm text-[var(--foreground)]">
                  <div className="flex justify-between"><dt>Service</dt><dd className="font-medium">{money(pricing.serviceAmount)}</dd></div>
                  <div className="flex justify-between"><dt>Convenience fee</dt><dd className="font-medium">{money(pricing.convenienceFee)}</dd></div>
                  {Number(pricing.cancellationFee) > 0 && (
                    <div className="flex justify-between"><dt>Cancellation fee</dt><dd className="font-medium">{money(pricing.cancellationFee)}</dd></div>
                  )}
                  <div className="flex justify-between">
                    <dt>Distance{Number.isFinite(Number(pricing.distanceKm)) ? ` (${Number(pricing.distanceKm).toFixed(1)} km)` : ""}</dt>
                    <dd className="font-medium">{money(pricing.distanceFee)}</dd>
                  </div>
                  <div className="flex justify-between"><dt>GST ({GST_RATE * 100}%)</dt><dd className="font-medium">{money(pricing.gstAmount)}</dd></div>
                  <div className="mt-2 flex justify-between border-t border-[var(--border)] pt-2 text-base font-semibold">
                    <dt>Total</dt><dd className="text-[var(--primary-dark)]">{money(total)}</dd>
                  </div>
                </dl>
              ) : (
                <p className="text-sm text-[var(--text-muted)]">Waiting for the final bill from your provider.</p>
              )}
            </div>
            {hasTotal && (
              <Button className="w-full" size="lg" onClick={() => onComplete(request)}>
                Pay ₹{Number(total).toFixed(0)}
              </Button>
            )}
          </div>
        );

      case SERVICE_STATUS.PAYMENT_ESCROW:
      case SERVICE_STATUS.PAYMENT_RELEASED:
      case SERVICE_STATUS.COMPLETED:
        return (
          <div className="space-y-4">
            <div className="py-2 text-center">
              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-[color-mix(in_srgb,var(--success)_14%,transparent)] text-[var(--success)]">
                <CheckCircle2 size={26} aria-hidden="true" />
              </div>
              <h3 className="text-base font-semibold text-[var(--foreground)]">Service completed</h3>
              <p className="text-sm text-[var(--text-muted)]">{hasTotal ? `₹${Number(total).toFixed(0)} paid` : "Payment received"}</p>
            </div>
            {DISPUTABLE.has(status) && onDisputePayment && <DisputeForm onSubmit={onDisputePayment} />}
          </div>
        );

      case SERVICE_STATUS.PAYMENT_DISPUTE:
        return (
          <p className="rounded-xl border border-[var(--border)] bg-[var(--pending-soft)] p-3 text-sm text-[var(--pending-ink)]">
            Your report was sent. Our support team will review it.
          </p>
        );

      case SERVICE_STATUS.CANCELLED:
        return (
          <div className="py-4 text-center">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-[color-mix(in_srgb,var(--danger)_12%,transparent)] text-[var(--danger)]">
              <XCircle size={26} aria-hidden="true" />
            </div>
            <h3 className="text-base font-semibold text-[var(--foreground)]">Request cancelled</h3>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <GlassCard className="w-full p-4 sm:p-6 flex flex-col flex-shrink-0">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-[var(--foreground)]">Service Status</h2>
          <p data-testid="stage-label" className="text-sm text-[var(--text-muted)]">
            {isCancelled ? "Cancelled" : currentStage?.label ?? "—"}
          </p>
        </div>
        <StatusPill status={status} />
      </div>

      {/* Progress line: 6 stages, current stage named above for screen readers */}
      {!isCancelled && (
        <ol aria-label="Progress" className="relative mb-5 flex justify-between">
          <span aria-hidden="true" className="absolute left-[8%] right-[8%] top-4 h-1 rounded-full bg-[var(--border)]">
            <span
              className="absolute inset-y-0 left-0 rounded-full bg-[var(--primary)] transition-[width] duration-500 motion-reduce:transition-none"
              style={{ width: `${(Math.max(0, currentIdx) / (TRACKER_STAGES.length - 1)) * 100}%` }}
            />
          </span>
          {TRACKER_STAGES.map((stage, idx) => {
            const Icon = stage.icon;
            const done = idx <= currentIdx;
            const current = idx === currentIdx;
            return (
              <li key={stage.key} className="relative z-10 flex flex-1 flex-col items-center" aria-current={current ? "step" : undefined}>
                <span
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-full border-2",
                    done
                      ? "border-[var(--primary)] bg-[var(--primary)] text-[var(--on-primary)]"
                      : "border-[var(--border)] bg-[var(--surface-card)] text-[var(--text-muted)]"
                  )}
                >
                  <Icon size={15} aria-hidden="true" />
                </span>
                <span className={cn("mt-1.5 hidden text-center text-[11px] leading-tight sm:block", done ? "text-[var(--foreground)]" : "text-[var(--text-muted)]")}>
                  {stage.label}
                </span>
              </li>
            );
          })}
        </ol>
      )}

      {request.vehicle && (
        <div className="mb-4 rounded-xl border p-3 bg-[var(--surface-soft)] border-[var(--border)]">
          <div className="flex items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--surface-card)]">
                <CarFront size={18} aria-hidden="true" className="text-[var(--primary-dark)]" />
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-[var(--foreground)]">
                  {request.vehicle.year} {request.vehicle.make} {request.vehicle.model}
                </p>
                <p className="truncate text-xs text-[var(--text-muted)]">
                  {request.vehicle.color}
                  {request.vehicle.plate && (
                    <>
                      {" · "}
                      <span className="font-mono tracking-wider">{formatIndianPlate(request.vehicle.plate)}</span>
                    </>
                  )}
                </p>
              </div>
            </div>
            {status === SERVICE_STATUS.SEARCHING && onVehicleChange && (
              <button
                type="button"
                onClick={() => setIsVehicleSelectorOpen((o) => !o)}
                aria-expanded={isVehicleSelectorOpen}
                className="flex min-h-[44px] items-center gap-1 rounded-lg px-2.5 text-sm font-medium text-[var(--primary-dark)] hover:bg-[var(--surface-card)]"
              >
                Change
                <ChevronDown size={14} aria-hidden="true" className={cn("transition-transform", isVehicleSelectorOpen && "rotate-180")} />
              </button>
            )}
          </div>

          {isVehicleSelectorOpen && (
            <div className="mt-3 space-y-1.5 border-t border-[var(--border)] pt-3">
              {vehicles.length === 0 ? (
                <p className="py-2 text-center text-xs text-[var(--text-muted)]">No vehicles available</p>
              ) : (
                vehicles.map((v) => {
                  const isSelected = request.vehicleId === v.id;
                  return (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => {
                        onVehicleChange(v.id, v);
                        setIsVehicleSelectorOpen(false);
                      }}
                      className={cn(
                        "flex min-h-[44px] w-full items-center gap-3 rounded-lg border p-2.5 text-left transition-colors",
                        isSelected
                          ? "border-[var(--primary)] bg-[var(--surface-card)] text-[var(--foreground)]"
                          : "border-transparent text-[var(--text-muted)] hover:bg-[var(--surface-card)] hover:text-[var(--foreground)]"
                      )}
                    >
                      <CarFront size={16} aria-hidden="true" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium">{v.year} {v.make} {v.model}</span>
                        {v.plate && <span className="block truncate font-mono text-xs tracking-wider text-[var(--text-muted)]">{formatIndianPlate(v.plate)}</span>}
                      </span>
                      {isSelected && <span className="rounded-full bg-[var(--surface-soft)] px-2 py-0.5 text-[11px] font-semibold text-[var(--primary-dark)]">Active</span>}
                    </button>
                  );
                })
              )}
            </div>
          )}
        </div>
      )}

      <div className="flex flex-1 flex-col justify-center">{renderStatusBody()}</div>

      {CANCELLABLE.has(status) && onCancel && (
        <div className="mt-4 border-t border-[var(--border)] pt-3 text-center">
          <button
            type="button"
            onClick={onCancel}
            className="min-h-[44px] rounded-lg px-4 text-sm font-medium text-[var(--danger-ink)] hover:bg-[var(--surface-soft)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
          >
            Cancel request
          </button>
        </div>
      )}
    </GlassCard>
  );
}
