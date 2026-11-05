"use client";

import { useCallback, useEffect, useState } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { ListRow } from "@/components/ui/ListRow";
import { StatusPill } from "@/components/ui/StatusPill";
import { useToast } from "@/components/ui/ToastProvider";
import api from "@/lib/api";
import { detailText } from "@/store/authStore";
import { BILLING_ENABLED, rupees, pct, INVOICE_STATUS, ONBOARDING_STEPS, ONBOARDING_LABELS } from "@/lib/billing";
import { timeLabel } from "./format";

const dateLabel = (d) => (d ? new Date(`${d}T00:00:00`).toLocaleDateString([], { dateStyle: "medium" }) : "—");

/**
 * Partner earnings accounting: incentive, ledger balance, onboarding and (garages
 * only) monthly rent. Records only — rent is paid outside the app and confirmed
 * by an admin. Renders nothing unless NEXT_PUBLIC_BILLING_ENABLED=true.
 */
export function PartnerBilling({ role }) {
  const { success, error: showError } = useToast();
  const [data, setData] = useState(null);
  const [failed, setFailed] = useState(false);
  const [payingId, setPayingId] = useState(null);
  const [reference, setReference] = useState("");
  const [refError, setRefError] = useState("");
  const [busy, setBusy] = useState(false);
  const isGarage = role === "garage";

  const load = useCallback(async () => {
    setFailed(false);
    try {
      const [inc, led, ob, inv] = await Promise.all([
        api.get("/providers/incentives"),
        api.get("/providers/ledger", { params: { limit: 10 } }),
        api.get("/providers/onboarding"),
        isGarage ? api.get("/providers/rent/invoices", { params: { limit: 6 } }) : Promise.resolve({ data: { items: [] } }),
      ]);
      setData({ inc: inc.data, led: led.data, ob: ob.data, invoices: inv.data.items });
    } catch {
      setFailed(true);
    }
  }, [isGarage]);

  useEffect(() => {
    if (!BILLING_ENABLED) return;
    const id = setTimeout(load, 0);
    return () => clearTimeout(id);
  }, [load]);

  if (!BILLING_ENABLED) return null;

  const submitRef = async (e) => {
    e.preventDefault();
    const ref = reference.trim();
    if (ref.length < 4) return setRefError("Enter the payment reference (at least 4 characters).");
    setRefError("");
    setBusy(true);
    try {
      await api.post(`/providers/rent/invoices/${payingId}/pay`, { reference: ref });
      success("Reference sent. An admin will confirm your payment.");
      setPayingId(null);
      setReference("");
      await load();
    } catch (err) {
      showError(detailText(err?.response?.data?.detail) || "Could not send the reference. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const stepIndex = data ? Math.max(0, ONBOARDING_STEPS.indexOf(data.ob.step)) : 0;

  return (
    <section aria-label="Billing" className="space-y-4">
      {failed && (
        <GlassCard className="p-4">
          <EmptyState title="Couldn't load billing" description="Check your connection and try again." action={<Button onClick={load}>Retry</Button>} />
        </GlassCard>
      )}
      {!failed && !data && <Skeleton className="h-40 w-full rounded-2xl" />}
      {data && (
        <>
          <GlassCard className="p-4">
            <SectionHeader title="Incentives" />
            <p className="mt-2 text-2xl font-bold text-[var(--foreground)]">{rupees(data.inc.earned_paise)}</p>
            <p className="text-sm text-[var(--text-muted)]">
              You earn {pct(data.inc.rate_bps)} of each completed, paid service. Balance: {rupees(data.led.balance_paise)}
            </p>
          </GlassCard>

          {data.ob.step !== "done" && (
            <GlassCard className="p-4">
              <SectionHeader title="Onboarding" />
              <p className="mt-2 text-sm text-[var(--text-muted)]">
                Step {stepIndex + 1} of {ONBOARDING_STEPS.length}: {ONBOARDING_LABELS[data.ob.step]}
              </p>
              <div className="mt-2 h-2 rounded-full bg-[var(--surface-soft)]" role="progressbar" aria-valuemin={0} aria-valuemax={ONBOARDING_STEPS.length - 1} aria-valuenow={stepIndex}>
                <div className="h-2 rounded-full bg-[var(--primary)]" style={{ width: `${(stepIndex / (ONBOARDING_STEPS.length - 1)) * 100}%` }} />
              </div>
            </GlassCard>
          )}

          {isGarage && (
            <GlassCard className="p-4">
              <SectionHeader title="Monthly rent" />
              {data.invoices.length === 0 ? (
                <p className="mt-2 text-sm text-[var(--text-muted)]">No rent invoices yet.</p>
              ) : (
                <div className="mt-2 divide-y divide-[var(--border)]">
                  {data.invoices.map((inv) => {
                    const meta = INVOICE_STATUS[inv.status] || { label: inv.status, tone: "neutral" };
                    const canPay = ["issued", "overdue"].includes(inv.status);
                    return (
                      <div key={inv.id}>
                        <ListRow
                          title={`${rupees(inv.amount_paise)} · ${dateLabel(inv.period_start)}`}
                          subtitle={inv.status === "waived" && inv.waiver_reason ? `Waived: ${inv.waiver_reason}` : `Due ${dateLabel(inv.due_date)}`}
                          trailing={<StatusPill status={inv.status} label={meta.label} />}
                        />
                        {canPay && payingId !== inv.id && (
                          <div className="pb-3">
                            <Button variant="secondary" onClick={() => { setPayingId(inv.id); setReference(""); setRefError(""); }}>
                              I&apos;ve paid — enter reference
                            </Button>
                          </div>
                        )}
                        {payingId === inv.id && (
                          <form onSubmit={submitRef} noValidate className="space-y-2 pb-3">
                            <Input label="Payment reference (UPI/transaction ID)" value={reference} onChange={(e) => setReference(e.target.value)} error={refError} />
                            <div className="flex gap-2">
                              <Button type="submit" disabled={busy}>{busy ? "Sending…" : "Send"}</Button>
                              <Button type="button" variant="ghost" onClick={() => setPayingId(null)}>Cancel</Button>
                            </div>
                          </form>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </GlassCard>
          )}

          <GlassCard className="p-4">
            <SectionHeader title="Recent activity" />
            {data.led.items.length === 0 ? (
              <p className="mt-2 text-sm text-[var(--text-muted)]">Nothing yet. Incentives appear after a paid job completes.</p>
            ) : (
              <div className="mt-2 divide-y divide-[var(--border)]">
                {data.led.items.map((e) => (
                  <ListRow
                    key={e.id}
                    title={e.note || e.kind.replace("_", " ")}
                    subtitle={timeLabel(e.effective_at)}
                    trailing={<span className={e.amount_paise < 0 ? "text-[var(--danger-ink)]" : "text-[var(--success)]"}>{e.amount_paise < 0 ? "−" : "+"}{rupees(Math.abs(e.amount_paise))}</span>}
                  />
                ))}
              </div>
            )}
          </GlassCard>
        </>
      )}
    </section>
  );
}
