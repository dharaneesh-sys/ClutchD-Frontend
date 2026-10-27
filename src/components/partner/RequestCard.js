"use client";

import { useEffect, useState } from "react";
import { Navigation, Wrench, IndianRupee, Banknote, MessageSquare, MapPin, Clock, Calendar } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import { StatusPill } from "@/components/ui/StatusPill";
import { CountdownRing } from "@/components/ui/CountdownRing";
import { money, issueLabel, timeLabel, realTotal } from "./format";

function Field({ icon: Icon, label, value }) {
  return (
    <div className="min-w-0">
      <dt className="flex items-center gap-1 text-[11px] text-[var(--text-muted)]">
        <Icon size={12} aria-hidden="true" /> {label}
      </dt>
      <dd className="truncate text-sm font-medium text-[var(--foreground)]">{value}</dd>
    </div>
  );
}

/** Pending offer from GET /providers/offers. Price/schedule/distance are not in the payload → "—". */
export function OfferCard({ offer, onAccept, onDecline, busy = false }) {
  const job = offer.job || {};
  const expiresMs = offer.expiresAt ? new Date(offer.expiresAt).getTime() : null;
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!expiresMs) return undefined;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [expiresMs]);
  const expired = expiresMs !== null && Number.isFinite(expiresMs) && expiresMs <= now;
  return (
    <GlassCard data-testid="offer-card" className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <span className="mb-1 inline-block rounded-full bg-[var(--pending-soft)] px-2 py-0.5 text-[11px] font-semibold text-[var(--pending-ink)]">
            New offer
          </span>
          <h4 className="truncate font-semibold text-[var(--foreground)]">{issueLabel(job.issueTag)}</h4>
        </div>
        {offer.expiresAt && <CountdownRing expiresAt={offer.expiresAt} />}
      </div>
      {job.description && <p className="mt-2 line-clamp-2 text-sm text-[var(--text-muted)]">{job.description}</p>}
      <dl className="mt-3 grid grid-cols-3 gap-2">
        <Field icon={IndianRupee} label="Price" value="—" />
        <Field icon={Calendar} label="Scheduled" value="—" />
        <Field icon={MapPin} label="Distance" value="—" />
      </dl>
      <p className="mt-2 flex items-center gap-1 text-xs text-[var(--text-muted)]">
        <Clock size={12} aria-hidden="true" /> {timeLabel(offer.createdAt)}
        {job.customerLocation ? " · location shared" : ""}
      </p>
      <div className="mt-3 flex gap-2 border-t border-[var(--border)] pt-3">
        <Button variant="secondary" className="flex-1" disabled={busy} onClick={() => onDecline(offer)}>
          Decline
        </Button>
        <Button className="flex-1" disabled={busy || expired} onClick={() => onAccept(offer)}>
          {expired ? "Expired" : "Accept"}
        </Button>
      </div>
    </GlassCard>
  );
}

/**
 * Assigned job from GET /jobs/incoming. Actions follow the real status map:
 * assigned → Start navigation · en_route → Start service · in_progress → Bill
 * · payment_pending → Collect cash. Nothing advances optimistically.
 */
export function JobCard({ job, busy = false, onStartNavigation, onStartService, onNavigate, onBill, onCollectCash, onChat, onDelete }) {
  const total = realTotal(job);
  const est = job.priceEstimate;
  const price = total !== null ? money(total) : est?.min != null ? `Est. ${money(est.min, 0)}–${money(est.max, 0)}` : "—";
  const s = job.status;

  return (
    <GlassCard data-testid="job-card" className="p-4">
      <div className="flex items-start justify-between gap-3">
        <h4 className="min-w-0 truncate font-semibold text-[var(--foreground)]">{issueLabel(job.issueTag)}</h4>
        <StatusPill status={s} />
      </div>
      {job.description && <p className="mt-2 line-clamp-2 text-sm text-[var(--text-muted)]">{job.description}</p>}
      <dl className="mt-3 grid grid-cols-3 gap-2">
        <Field icon={IndianRupee} label={total !== null ? "Billed" : "Price"} value={price} />
        <Field icon={Calendar} label="Scheduled" value={job.scheduledAt ? timeLabel(job.scheduledAt) : "—"} />
        <Field icon={MapPin} label="Distance" value={job.mechanic?.distance || "—"} />
      </dl>

      <div className="mt-3 flex flex-wrap gap-2 border-t border-[var(--border)] pt-3">
        {s === "assigned" && (
          <Button className="flex-1" isLoading={busy} onClick={() => onStartNavigation(job)}>
            <Navigation size={16} aria-hidden="true" /> Start navigation
          </Button>
        )}
        {s === "en_route" && (
          <>
            <Button variant="outline" onClick={() => onNavigate(job)}>
              <Navigation size={16} aria-hidden="true" /> Navigate
            </Button>
            <Button className="flex-1" isLoading={busy} onClick={() => onStartService(job)}>
              <Wrench size={16} aria-hidden="true" /> Start service
            </Button>
          </>
        )}
        {s === "in_progress" && (
          <Button className="flex-1" onClick={() => onBill(job)}>
            <IndianRupee size={16} aria-hidden="true" /> Bill customer
          </Button>
        )}
        {s === "payment_pending" && (
          <Button className="flex-1" disabled={total === null} onClick={() => onCollectCash(job)}>
            <Banknote size={16} aria-hidden="true" /> Collect cash
          </Button>
        )}
        {onChat && (
          <Button variant="secondary" onClick={() => onChat(job.id, job.customer)} aria-label="Chat with customer">
            <MessageSquare size={16} aria-hidden="true" /> Chat
          </Button>
        )}
        {onDelete && (
          <Button variant="ghost" size="sm" className="ml-auto text-[var(--text-muted)]" onClick={() => onDelete(job)}>
            Delete
          </Button>
        )}
      </div>
    </GlassCard>
  );
}
