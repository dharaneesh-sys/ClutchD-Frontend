"use client";

import { useCallback, useEffect, useState } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { ListRow } from "@/components/ui/ListRow";
import { StatusPill } from "@/components/ui/StatusPill";
import { useToast } from "@/components/ui/ToastProvider";
import api from "@/lib/api";
import { detailText } from "@/store/authStore";
import { rupees, pct, INVOICE_STATUS } from "@/lib/billing";

const FILTERS = [
  { value: "", label: "All" },
  { value: "payment_pending", label: "To confirm" },
  { value: "overdue", label: "Overdue" },
  { value: "issued", label: "Due" },
];

/** Admin: rent amount/due day, global incentive rate, and the invoice queue. */
export function BillingAdmin() {
  const { success, error: showError } = useToast();
  const [cfg, setCfg] = useState(null);
  const [rule, setRule] = useState(null);
  const [rentRupees, setRentRupees] = useState("");
  const [dueDay, setDueDay] = useState("");
  const [ratePct, setRatePct] = useState("");
  const [filter, setFilter] = useState("payment_pending");
  const [invoices, setInvoices] = useState(null);
  const [waiveId, setWaiveId] = useState(null);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [loadError, setLoadError] = useState(false);

  const fail = (err, fallback) => showError(detailText(err) || fallback);

  const loadInvoices = useCallback(async () => {
    try {
      const { data } = await api.get("/admin/rent/invoices", { params: { status: filter || undefined, limit: 50 } });
      setInvoices(data.items);
    } catch {
      setLoadError(true);
    }
  }, [filter]);

  useEffect(() => {
    const id = setTimeout(async () => {
      try {
        const [c, r] = await Promise.all([api.get("/admin/rent/config"), api.get("/admin/incentives/rules")]);
        setCfg(c.data);
        setRentRupees(String(c.data.rent_amount_paise / 100));
        setDueDay(String(c.data.rent_due_day));
        const g = r.data.find((x) => x.scope === "global");
        setRule(g || null);
        setRatePct(String((g?.rate_bps ?? 500) / 100));
      } catch {
        setLoadError(true);
      }
    }, 0);
    return () => clearTimeout(id);
  }, []);

  useEffect(() => {
    const id = setTimeout(loadInvoices, 0);
    return () => clearTimeout(id);
  }, [loadInvoices]);

  const saveConfig = async (e) => {
    e.preventDefault();
    const paise = Math.round(Number(rentRupees) * 100);
    const day = Number(dueDay);
    if (!Number.isFinite(paise) || paise <= 0 || !Number.isInteger(day) || day < 1 || day > 28) {
      return showError("Rent must be above ₹0 and the due day between 1 and 28.");
    }
    setBusy(true);
    try {
      const { data } = await api.put("/admin/rent/config", { rent_amount_paise: paise, rent_due_day: day });
      setCfg(data);
      success("Rent settings saved.");
    } catch (err) {
      fail(err?.response?.data?.detail, "Could not save rent settings.");
    } finally {
      setBusy(false);
    }
  };

  const saveRate = async (e) => {
    e.preventDefault();
    const bps = Math.round(Number(ratePct) * 100);
    if (!Number.isFinite(bps) || bps <= 0 || bps > 10000) return showError("Rate must be between 0.01% and 100%.");
    setBusy(true);
    try {
      const { data } = await api.put("/admin/incentives/rules", { rate_bps: bps, scope: "global" });
      setRule(data);
      success("Incentive rate saved. It applies to jobs completed from now on.");
    } catch (err) {
      fail(err?.response?.data?.detail, "Could not save the incentive rate.");
    } finally {
      setBusy(false);
    }
  };

  const act = async (id, action, body) => {
    setBusy(true);
    try {
      await api.post(`/admin/rent/invoices/${id}/${action}`, body);
      success(action === "confirm" ? "Payment confirmed." : "Invoice waived.");
      setWaiveId(null);
      setReason("");
      await loadInvoices();
    } catch (err) {
      fail(err?.response?.data?.detail, "Action failed. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      {loadError && <p role="alert" className="text-sm text-[var(--danger-ink)]">Couldn&apos;t load billing data. Is billing enabled on the server?</p>}
      <div className="grid gap-4 lg:grid-cols-2">
        <GlassCard className="p-4">
          <SectionHeader title="Monthly rent" />
          <form onSubmit={saveConfig} noValidate className="mt-3 space-y-3">
            <Input label="Rent per garage (₹)" inputMode="decimal" value={rentRupees} onChange={(e) => setRentRupees(e.target.value)} />
            <Input label="Due day of month (1–28)" inputMode="numeric" value={dueDay} onChange={(e) => setDueDay(e.target.value)} />
            <Button type="submit" disabled={busy || !cfg}>Save rent settings</Button>
          </form>
        </GlassCard>
        <GlassCard className="p-4">
          <SectionHeader title="Incentive" />
          <p className="mt-1 text-sm text-[var(--text-muted)]">Current global rate: {pct(rule?.rate_bps ?? 500)} of each paid service.</p>
          <form onSubmit={saveRate} noValidate className="mt-3 space-y-3">
            <Input label="Global rate (%)" inputMode="decimal" value={ratePct} onChange={(e) => setRatePct(e.target.value)} />
            <Button type="submit" disabled={busy}>Save rate</Button>
          </form>
        </GlassCard>
      </div>

      <GlassCard className="p-4">
        <SectionHeader title="Rent invoices" />
        <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Filter invoices">
          {FILTERS.map((f) => (
            <Button key={f.value} variant={filter === f.value ? "primary" : "secondary"} aria-pressed={filter === f.value} onClick={() => setFilter(f.value)}>
              {f.label}
            </Button>
          ))}
        </div>
        {invoices === null ? (
          <p className="mt-3 text-sm text-[var(--text-muted)]">Loading…</p>
        ) : invoices.length === 0 ? (
          <p className="mt-3 text-sm text-[var(--text-muted)]">No invoices in this view.</p>
        ) : (
          <div className="mt-3 divide-y divide-[var(--border)]">
            {invoices.map((inv) => (
              <div key={inv.id} className="py-2">
                <ListRow
                  title={`${rupees(inv.amount_paise)} · ${inv.period_start}`}
                  subtitle={`${inv.reference ? `Ref ${inv.reference} · ` : ""}Garage ${inv.garage_id.slice(0, 8)}`}
                  trailing={<StatusPill status={inv.status} label={(INVOICE_STATUS[inv.status] || {}).label} />}
                />
                {["payment_pending", "issued", "overdue"].includes(inv.status) && waiveId !== inv.id && (
                  <div className="flex gap-2 pt-2">
                    {inv.status === "payment_pending" && <Button disabled={busy} onClick={() => act(inv.id, "confirm")}>Confirm paid</Button>}
                    <Button variant="secondary" onClick={() => { setWaiveId(inv.id); setReason(""); }}>Waive…</Button>
                  </div>
                )}
                {waiveId === inv.id && (
                  <form noValidate className="space-y-2 pt-2" onSubmit={(e) => { e.preventDefault(); if (reason.trim().length < 3) return showError("A reason is required to waive rent."); act(inv.id, "waive", { reason: reason.trim() }); }}>
                    <Input label="Reason for waiver" value={reason} onChange={(e) => setReason(e.target.value)} />
                    <div className="flex gap-2">
                      <Button type="submit" disabled={busy}>Waive invoice</Button>
                      <Button type="button" variant="ghost" onClick={() => setWaiveId(null)}>Cancel</Button>
                    </div>
                  </form>
                )}
              </div>
            ))}
          </div>
        )}
      </GlassCard>
    </div>
  );
}
