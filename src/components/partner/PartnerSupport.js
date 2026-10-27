"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, LifeBuoy, Phone, LogOut, AlertTriangle } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Skeleton } from "@/components/ui/Skeleton";
import { useAuthStore } from "@/store/authStore";
import { useToast } from "@/components/ui/ToastProvider";
import api from "@/lib/api";

const CATEGORIES = [
  { value: "general", label: "General" },
  { value: "technical", label: "Technical Issue" },
  { value: "payment", label: "Payment" },
  { value: "account", label: "Account" },
  { value: "other", label: "Other" },
];

// Shown only when a real number is configured at build time.
const SUPPORT_PHONE = process.env.NEXT_PUBLIC_SUPPORT_PHONE || "";

/** Partner Support tab: real FAQs (GET /faq), ticket form (POST /tickets), log out. */
export function PartnerSupport() {
  const router = useRouter();
  const logout = useAuthStore((s) => s.logout);
  const { success, error: showError } = useToast();
  const [faqs, setFaqs] = useState(null);
  const [faqError, setFaqError] = useState(false);
  const [openId, setOpenId] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState({ subject: "", message: "", category: "general" });
  const [errors, setErrors] = useState({});
  const [sending, setSending] = useState(false);

  const loadFaqs = useCallback(async () => {
    setFaqError(false);
    setFaqs(null);
    try {
      const { data } = await api.get("/faq");
      const list = Array.isArray(data?.faqs) ? data.faqs : Array.isArray(data) ? data : [];
      setFaqs(list.slice(0, 6));
    } catch {
      setFaqError(true);
      setFaqs([]);
    }
  }, []);

  useEffect(() => {
    const id = setTimeout(loadFaqs, 0);
    return () => clearTimeout(id);
  }, [loadFaqs]);

  const submit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.subject.trim()) errs.subject = "Subject is required";
    if (!form.message.trim()) errs.message = "Message is required";
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setSending(true);
    try {
      await api.post("/tickets", { subject: form.subject.trim(), message: form.message.trim(), category: form.category });
      success("Request sent. Our team will get back to you.");
      setForm({ subject: "", message: "", category: "general" });
      setFormOpen(false);
    } catch (err) {
      const d = err?.response?.data?.detail;
      showError(typeof d === "string" ? d : "Couldn't send your request. Try again.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-5">
      <section className="space-y-3">
        <SectionHeader title="Common questions" />
        {faqs === null ? (
          <div className="space-y-2" aria-busy="true"><Skeleton className="h-12 w-full rounded-xl" /><Skeleton className="h-12 w-full rounded-xl" /></div>
        ) : faqError ? (
          <div role="alert" className="flex items-center justify-between gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface-card)] p-3 text-sm text-[var(--danger-ink)]">
            <span className="flex items-center gap-2"><AlertTriangle size={16} aria-hidden="true" /> Couldn&apos;t load FAQs.</span>
            <Button variant="outline" size="sm" onClick={loadFaqs}>Retry</Button>
          </div>
        ) : faqs.length === 0 ? (
          <p className="rounded-2xl border border-[var(--border)] bg-[var(--surface-card)] p-4 text-sm text-[var(--text-muted)]">No FAQs yet.</p>
        ) : (
          <div className="divide-y divide-[var(--border)] overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface-card)]">
            {faqs.map((f, i) => {
              const id = f.id ?? i;
              const open = openId === id;
              return (
                <div key={id}>
                  <button type="button" aria-expanded={open} onClick={() => setOpenId(open ? null : id)} className="flex min-h-[52px] w-full items-center justify-between gap-3 px-4 text-left text-sm font-medium text-[var(--foreground)] hover:bg-[var(--surface-soft)]">
                    {f.question}
                    <ChevronDown size={16} aria-hidden="true" className={open ? "rotate-180 transition-transform" : "transition-transform"} />
                  </button>
                  {open && <p className="px-4 pb-4 text-sm text-[var(--text-muted)]">{f.answer}</p>}
                </div>
              );
            })}
          </div>
        )}
      </section>

      <GlassCard className="space-y-3 p-4">
        <SectionHeader title="Need help?" />
        {!formOpen ? (
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => setFormOpen(true)}><LifeBuoy size={16} aria-hidden="true" /> Contact support</Button>
            {SUPPORT_PHONE && (
              <a href={`tel:${SUPPORT_PHONE}`} className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-[var(--border)] px-4 text-sm font-semibold text-[var(--primary-dark)] hover:bg-[var(--surface-soft)]">
                <Phone size={16} aria-hidden="true" /> Call support
              </a>
            )}
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-3">
            <Select label="Category" options={CATEGORIES} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
            <Input label="Subject" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} error={errors.subject} />
            <div>
              <label htmlFor="support-message" className="mb-1.5 block text-sm font-medium text-[var(--foreground)]">Message</label>
              <textarea id="support-message" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} className="min-h-[100px] w-full rounded-xl border border-[var(--border)] bg-[var(--surface-card)] px-3 py-2 text-sm text-[var(--foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]" />
              {errors.message && <p role="alert" className="mt-1.5 text-xs font-medium text-[var(--danger)]">{errors.message}</p>}
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="secondary" className="flex-1" onClick={() => setFormOpen(false)}>Cancel</Button>
              <Button type="submit" className="flex-1" isLoading={sending}>Send</Button>
            </div>
          </form>
        )}
      </GlassCard>

      <Button
        variant="outline"
        className="w-full text-[var(--danger-ink)] border-[var(--border)]"
        onClick={async () => {
          await logout();
          router.push("/auth");
        }}
      >
        <LogOut size={16} aria-hidden="true" /> Log out
      </Button>
    </div>
  );
}
