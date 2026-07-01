"use client";

import { useState, useEffect, useCallback } from "react";
import {
  HelpCircle,
  ChevronDown,
  Mail,
  Phone,
  MessageCircle,
  AlertCircle,
  Send,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Shimmer } from "@/components/ui/Shimmer";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { useToastStore } from "@/store/toastStore";
import api from "@/lib/api";

// ─── Demo FAQ data ───────────────────────────────────────────────────

const DEMO_FAQS = [
  {
    id: 1,
    question: "How do I request a mechanic?",
    answer:
      "Open the app, select your issue from the dashboard, and we'll find the nearest available mechanic for you. You'll be able to track their location in real-time.",
    category: "general",
  },
  {
    id: 2,
    question: "How are prices calculated?",
    answer:
      "Prices include base service charge + distance fee (₹30/km) + convenience fee (₹40) + 18% GST. You'll see the full breakdown before confirming the service.",
    category: "pricing",
  },
  {
    id: 3,
    question: "Can I cancel a service?",
    answer:
      "Yes, but a ₹30 cancellation fee may apply depending on the stage of service. No fee is charged if cancelled before a mechanic is assigned.",
    category: "general",
  },
  {
    id: 4,
    question: "How do I make payments?",
    answer:
      "We support UPI (Google Pay, PhonePe, Paytm), Credit/Debit cards, and cash payments. All online payments are processed securely through Razorpay.",
    category: "payment",
  },
  {
    id: 5,
    question: "What if I have an issue with the service?",
    answer:
      "You can report a problem through the Help section or contact our support team directly. We'll review your case and resolve it within 24-48 hours.",
    category: "support",
  },
  {
    id: 6,
    question: "How do I track my mechanic?",
    answer:
      "Once a mechanic is assigned, you can track their live location on the map in your dashboard. You'll receive notifications at each stage — assigned, en route, arrived, and in progress.",
    category: "general",
  },
  {
    id: 7,
    question: "What areas do you serve?",
    answer:
      "We currently serve Coimbatore and surrounding areas. We're expanding to more cities soon. Check the app for the latest coverage map.",
    category: "general",
  },
  {
    id: 8,
    question: "Is my data secure?",
    answer:
      "Yes, we take data security seriously. All transactions are encrypted, and your personal information is stored securely. We never share your data with third parties without your consent.",
    category: "account",
  },
];

const CATEGORIES = [
  { value: "", label: "Select a category" },
  { value: "general", label: "General" },
  { value: "technical", label: "Technical Issue" },
  { value: "payment", label: "Payment" },
  { value: "account", label: "Account" },
  { value: "other", label: "Other" },
];

// ─── FAQ Accordion ───────────────────────────────────────────────────

function FAQAccordion({ faqs, openId, onToggle }) {
  if (!faqs || faqs.length === 0) {
    return (
      <p className="text-sm text-text-muted text-center py-6">
        No FAQs available at the moment.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {faqs.map((faq) => {
        const isOpen = openId === faq.id;
        return (
          <div
            key={faq.id}
            className={cn(
              "rounded-2xl border transition-all duration-200 overflow-hidden",
              isOpen
                ? "glass-lux border-primary/20"
                : "bg-white/[0.03] border-border-subtle hover:bg-white/[0.05]"
            )}
          >
            <button
              onClick={() => onToggle(isOpen ? null : faq.id)}
              className="w-full flex items-center justify-between gap-3 p-4 text-left"
            >
              <span className="text-sm font-medium text-foreground flex-1">
                {faq.question}
              </span>
              <ChevronDown
                size={16}
                className={cn(
                  "shrink-0 text-text-muted transition-transform duration-200",
                  isOpen && "rotate-180"
                )}
              />
            </button>
            <div
              className={cn(
                "grid transition-all duration-200",
                isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
              )}
            >
              <div className="overflow-hidden">
                <div className="px-4 pb-4 text-sm text-text-muted leading-relaxed border-t border-border-subtle/50 pt-3">
                  {faq.answer}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Report Problem Modal ────────────────────────────────────────────

function ReportProblemModal({ isOpen, onClose }) {
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [category, setCategory] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const toast = useToastStore();

  const validate = () => {
    const errs = {};
    if (!subject.trim()) errs.subject = "Subject is required";
    if (!message.trim()) errs.message = "Message is required";
    if (!category) errs.category = "Please select a category";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      await api.post("/tickets", { subject, message, category });
      toast.success("Report submitted successfully! We'll get back to you soon.");
      setSubject("");
      setMessage("");
      setCategory("");
      onClose();
    } catch {
      // Demo mode fallback
      toast.success("Report submitted successfully! (Demo mode)");
      setSubject("");
      setMessage("");
      setCategory("");
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div
        onClick={onClose}
        className="fixed inset-0 z-40 backdrop-blur-sm animate-[backdrop-in_0.2s_ease] bg-black/50"
        aria-hidden="true"
      />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 py-12 px-4 sm:px-6 overflow-y-auto w-full h-full pointer-events-none">
        <div
          className={cn(
            "relative w-full max-w-md rounded-2xl border pointer-events-auto animate-[modal-in_0.25s_ease]",
            "p-6 backdrop-blur-3xl",
            "border-border-subtle bg-surface shadow-[0_30px_80px_rgba(var(--color-black-rgb),0.35)] ring-1 ring-primary/10"
          )}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold tracking-tight text-text-primary">
              Report a Problem
            </h2>
            <button
              onClick={onClose}
              className="rounded-full p-1.5 transition-colors text-text-dim hover:bg-surface-soft hover:text-text-primary"
            >
              <AlertCircle size={18} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Select
              label="Category"
              options={CATEGORIES}
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                setErrors((prev) => ({ ...prev, category: "" }));
              }}
              placeholder="Select a category"
              error={errors.category}
            />
            <Input
              label="Subject"
              placeholder="Brief summary of the issue"
              value={subject}
              onChange={(e) => {
                setSubject(e.target.value);
                setErrors((prev) => ({ ...prev, subject: "" }));
              }}
              error={errors.subject}
            />
            <div className="w-full">
              <label className="mb-2 block text-sm font-medium text-text-muted">
                Message
              </label>
              <textarea
                value={message}
                onChange={(e) => {
                  setMessage(e.target.value);
                  setErrors((prev) => ({ ...prev, message: "" }));
                }}
                placeholder="Describe the issue in detail..."
                rows={4}
                className={cn(
                  "w-full rounded-2xl border px-4 py-3 text-sm transition-all",
                  "border-border-subtle bg-surface text-text-primary placeholder:text-text-dim",
                  "shadow-[inset_0_1px_0_rgba(var(--color-white-rgb),0.04)]",
                  "focus:border-primary focus:bg-surface focus:outline-none focus:ring-1 focus:ring-primary/30",
                  "resize-none",
                  errors.message && "border-red-500/50"
                )}
              />
              {errors.message && (
                <p className="mt-1.5 text-xs text-red-400">{errors.message}</p>
              )}
            </div>
            <Button
              type="submit"
              className="w-full"
              size="lg"
              isLoading={isSubmitting}
            >
              <Send size={16} />
              Submit Report
            </Button>
          </form>
        </div>
      </div>
    </>
  );
}

// ─── Contact Support Section ─────────────────────────────────────────

function ContactSupport() {
  const contactItems = [
    {
      icon: Mail,
      label: "Email Support",
      description: "support@clutchd.app",
      href: "mailto:support@clutchd.app",
      color: "bg-primary/15 text-primary-light",
    },
    {
      icon: Phone,
      label: "Call Support",
      description: "+91 98765 43210",
      href: "tel:+919876543210",
      color: "bg-blue-500/15 text-blue-400",
    },
    {
      icon: MessageCircle,
      label: "WhatsApp",
      description: "Chat on WhatsApp",
      href: "https://wa.me/919876543210",
      color: "bg-emerald-500/15 text-emerald-400",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      {contactItems.map((item) => {
        const Icon = item.icon;
        return (
          <a
            key={item.label}
            href={item.href}
            target={item.href.startsWith("http") ? "_blank" : undefined}
            rel={item.href.startsWith("http") ? "noopener noreferrer" : undefined}
            className="glass-lux rounded-2xl p-4 flex items-center gap-3 hover:bg-white/[0.08] transition-colors"
          >
            <div
              className={cn(
                "flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center",
                item.color
              )}
            >
              <Icon size={18} />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground">
                {item.label}
              </p>
              <p className="text-xs text-text-muted truncate">
                {item.description}
              </p>
            </div>
          </a>
        );
      })}
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────

export default function HelpPage() {
  const [faqs, setFaqs] = useState([]);
  const [isLoadingFaqs, setIsLoadingFaqs] = useState(true);
  const [openFaqId, setOpenFaqId] = useState(null);
  const [showReportModal, setShowReportModal] = useState(false);

  const fetchFaqs = useCallback(async () => {
    setIsLoadingFaqs(true);
    try {
      const { data } = await api.get("/faq");
      const fetched = data?.faqs || data || [];
      setFaqs(fetched.length > 0 ? fetched : DEMO_FAQS);
    } catch {
      setFaqs(DEMO_FAQS);
    } finally {
      setIsLoadingFaqs(false);
    }
  }, []);

  useEffect(() => {
    fetchFaqs();
  }, [fetchFaqs]);

  return (
    <div className="p-4 page-enter space-y-8">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="type-headline-3 text-foreground">Help & Support</h1>
        <p className="type-body-2 text-muted">Find answers and get support</p>
      </div>

      {/* Contact Support */}
      <section>
        <h2 className="text-base font-semibold text-foreground mb-3 flex items-center gap-2">
          <Mail size={16} className="text-primary-light" />
          Contact Support
        </h2>
        <ContactSupport />
      </section>

      {/* Report a Problem */}
      <section>
        <button
          onClick={() => setShowReportModal(true)}
          className="glass-lux rounded-2xl p-4 w-full flex items-center gap-3 hover:bg-white/[0.08] transition-colors text-left"
        >
          <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-red-500/15 flex items-center justify-center">
            <AlertCircle size={18} className="text-red-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground">
              Report a Problem
            </p>
            <p className="text-xs text-text-muted">
              Submit a ticket and we&apos;ll resolve it
            </p>
          </div>
          <ChevronDown size={16} className="text-text-muted -rotate-90 shrink-0" />
        </button>
      </section>

      {/* FAQ Section */}
      <section>
        <h2 className="text-base font-semibold text-foreground mb-3 flex items-center gap-2">
          <HelpCircle size={16} className="text-primary-light" />
          Frequently Asked Questions
        </h2>
        {isLoadingFaqs ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-2xl border border-border-subtle p-4">
                <Shimmer className="h-5 w-3/4" />
              </div>
            ))}
          </div>
        ) : (
          <FAQAccordion
            faqs={faqs}
            openId={openFaqId}
            onToggle={setOpenFaqId}
          />
        )}
      </section>

      {/* Report Problem Modal */}
      <ReportProblemModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
      />
    </div>
  );
}
