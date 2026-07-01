"use client";

import { useState, useEffect, useCallback } from "react";
import {
  MessageCircle,
  Phone,
  Mail,
  Ticket,
  Send,
  Search,
  Clock,
  XCircle,
  ExternalLink,
} from "lucide-react";
import { cn, formatDate } from "@/lib/utils";
import { ShimmerList } from "@/components/ui/Shimmer";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { useToastStore } from "@/store/toastStore";
import { useAuthStore } from "@/store/authStore";
import api from "@/lib/api";

// ─── Demo contact data ───────────────────────────────────────────────

const DEMO_CONTACT = {
  phone: "+91 98765 43210",
  whatsapp: "+919876543210",
  email: "support@clutchd.app",
  hours: "Mon-Sat, 9:00 AM - 8:00 PM",
};

const CATEGORIES = [
  { value: "", label: "Select a category" },
  { value: "general", label: "General" },
  { value: "technical", label: "Technical Issue" },
  { value: "payment", label: "Payment" },
  { value: "account", label: "Account" },
  { value: "other", label: "Other" },
];

const TICKET_STATUS_CONFIG = {
  open: { variant: "info", label: "Open" },
  in_progress: { variant: "warning", label: "In Progress" },
  resolved: { variant: "success", label: "Resolved" },
  closed: { variant: "default", label: "Closed" },
};

const DEMO_TICKETS = [
  {
    id: "TKT-001",
    subject: "Payment not reflecting",
    category: "payment",
    status: "in_progress",
    message: "I made a payment but it's not showing in my history.",
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: "TKT-002",
    subject: "App crashing on startup",
    category: "technical",
    status: "resolved",
    message: "App crashes immediately after opening.",
    created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
  },
];

// ─── Live Chat Modal ─────────────────────────────────────────────────

function LiveChatModal({ isOpen, onClose }) {
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
            "relative w-full max-w-sm rounded-2xl border pointer-events-auto animate-[modal-in_0.25s_ease]",
            "p-6 backdrop-blur-3xl text-center",
            "border-border-subtle bg-surface shadow-[0_30px_80px_rgba(var(--color-black-rgb),0.35)] ring-1 ring-primary/10"
          )}
        >
          <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-amber-500/15 flex items-center justify-center">
            <MessageCircle size={28} className="text-amber-400" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">
            Live Chat is Offline
          </h3>
          <p className="text-sm text-text-muted mb-4">
            Live chat is currently offline. Please email us during business
            hours and we&apos;ll get back to you within 24 hours.
          </p>
          <p className="text-xs text-text-dim mb-4">
            Business hours: {DEMO_CONTACT.hours}
          </p>
          <div className="flex gap-3">
            <Button variant="ghost" className="flex-1" onClick={onClose}>
              Close
            </Button>
            <Button
              className="flex-1"
              onClick={() => {
                window.location.href = `mailto:${DEMO_CONTACT.email}`;
                onClose();
              }}
            >
              <Mail size={14} />
              Email Us
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Raise Ticket Modal ──────────────────────────────────────────────

function RaiseTicketModal({ isOpen, onClose, onTicketCreated }) {
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
      toast.success("Ticket raised successfully!");
      onTicketCreated?.();
      handleClose();
    } catch {
      toast.success("Ticket raised successfully! (Demo mode)");
      onTicketCreated?.();
      handleClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setSubject("");
    setMessage("");
    setCategory("");
    setErrors({});
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      <div
        onClick={handleClose}
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
              Raise a Ticket
            </h2>
            <button
              onClick={handleClose}
              className="rounded-full p-1.5 transition-colors text-text-dim hover:bg-surface-soft hover:text-text-primary"
            >
              <XCircle size={18} />
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
              placeholder="Brief summary of your issue"
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
                placeholder="Describe your issue in detail..."
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
              Submit Ticket
            </Button>
          </form>
        </div>
      </div>
    </>
  );
}

// ─── Contact Card ────────────────────────────────────────────────────

function ContactCard({ icon: Icon, label, description, href, color }) {
  return (
    <a
      href={href}
      target={href.startsWith("http") && !href.startsWith("tel") && !href.startsWith("mailto") ? "_blank" : undefined}
      rel={href.startsWith("http") && !href.startsWith("tel") && !href.startsWith("mailto") ? "noopener noreferrer" : undefined}
      className="glass-lux rounded-2xl p-4 flex items-center gap-3 hover:bg-white/[0.08] transition-colors"
    >
      <div
        className={cn(
          "flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center",
          color || "bg-white/10"
        )}
      >
        <Icon size={18} />
      </div>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-foreground">{label}</p>
        <p className="text-xs text-text-muted truncate">{description}</p>
      </div>
    </a>
  );
}

// ─── Ticket Card ─────────────────────────────────────────────────────

function TicketCard({ ticket }) {
  const config = TICKET_STATUS_CONFIG[ticket.status] || { variant: "default", label: ticket.status };

  return (
    <div className="glass-lux rounded-2xl p-4 space-y-3 animate-fade-in-up">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <Ticket size={14} className="shrink-0 text-text-muted" />
            <span className="text-sm font-semibold text-foreground truncate">
              {ticket.subject}
            </span>
          </div>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-[11px] text-text-muted font-mono">
              #{ticket.id}
            </span>
            <span className="text-[11px] text-text-muted">
              {formatDate(ticket.created_at)}
            </span>
          </div>
        </div>
        <Badge variant={config.variant}>{config.label}</Badge>
      </div>

      {ticket.message && (
        <p className="text-xs text-text-dim line-clamp-2">{ticket.message}</p>
      )}
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────

export default function CarePage() {
  const { user, isAuthenticated } = useAuthStore();
  const toast = useToastStore();

  const [showLiveChat, setShowLiveChat] = useState(false);
  const [showRaiseTicket, setShowRaiseTicket] = useState(false);
  const [tickets, setTickets] = useState([]);
  const [isLoadingTickets, setIsLoadingTickets] = useState(false);
  const [ticketNumber, setTicketNumber] = useState("");
  const [ticketSearchResult, setTicketSearchResult] = useState(null);
  const [searchingTicket, setSearchingTicket] = useState(false);

  const fetchTickets = useCallback(async () => {
    if (!isAuthenticated) return;
    setIsLoadingTickets(true);
    try {
      const { data } = await api.get("/tickets");
      const fetched = data?.tickets || data || [];
      setTickets(fetched.length > 0 ? fetched : DEMO_TICKETS);
    } catch {
      setTickets(DEMO_TICKETS);
    } finally {
      setIsLoadingTickets(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const handleTrackTicket = async () => {
    const id = ticketNumber.trim();
    if (!id) {
      toast.warning("Please enter a ticket number");
      return;
    }

    setSearchingTicket(true);
    try {
      const { data } = await api.get(`/tickets/${id}`);
      if (data) {
        setTicketSearchResult(data);
      } else {
        toast.error("Ticket not found");
        setTicketSearchResult(null);
      }
    } catch {
      // Check demo tickets
      const found = DEMO_TICKETS.find((t) => t.id === id || t.id.toLowerCase() === id.toLowerCase());
      if (found) {
        setTicketSearchResult(found);
      } else {
        toast.error("Ticket not found. Please check the ticket number.");
        setTicketSearchResult(null);
      }
    } finally {
      setSearchingTicket(false);
    }
  };

  const contactMethods = [
    {
      icon: MessageCircle,
      label: "WhatsApp",
      description: `Chat on WhatsApp (${DEMO_CONTACT.whatsapp})`,
      href: `https://wa.me/${DEMO_CONTACT.whatsapp}`,
      color: "bg-emerald-500/15 text-emerald-400",
    },
    {
      icon: Phone,
      label: "Call Us",
      description: `${DEMO_CONTACT.phone} | ${DEMO_CONTACT.hours}`,
      href: `tel:${DEMO_CONTACT.phone.replace(/\s/g, "")}`,
      color: "bg-blue-500/15 text-blue-400",
    },
    {
      icon: Mail,
      label: "Email Support",
      description: DEMO_CONTACT.email,
      href: `mailto:${DEMO_CONTACT.email}`,
      color: "bg-primary/15 text-primary-light",
    },
  ];

  return (
    <div className="p-4 page-enter space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="type-headline-3 text-foreground">ClutchD Care</h1>
        <p className="type-body-2 text-muted">
          We&apos;re here to help. Reach out anytime.
        </p>
      </div>

      {/* Live Chat Button */}
      <button
        onClick={() => setShowLiveChat(true)}
        className="glass-lux rounded-2xl p-4 w-full flex items-center gap-3 hover:bg-white/[0.08] transition-colors text-left"
      >
        <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-primary/15 flex items-center justify-center">
          <MessageCircle size={22} className="text-primary-light" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-base font-semibold text-foreground">
            Live Chat
          </p>
          <p className="text-xs text-text-muted mt-0.5">
            Chat with our support team in real-time
          </p>
        </div>
        <ExternalLink size={16} className="text-text-muted shrink-0" />
      </button>

      {/* Contact Methods */}
      <section>
        <h2 className="text-base font-semibold text-foreground mb-3 flex items-center gap-2">
          <Phone size={16} className="text-primary-light" />
          Contact Us
        </h2>
        <div className="space-y-2">
          {contactMethods.map((method) => (
            <ContactCard key={method.label} {...method} />
          ))}
        </div>
      </section>

      {/* Raise Ticket */}
      <section>
        <button
          onClick={() => setShowRaiseTicket(true)}
          className="glass-lux rounded-2xl p-4 w-full flex items-center gap-3 hover:bg-white/[0.08] transition-colors text-left"
        >
          <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-indigo-500/15 flex items-center justify-center">
            <Ticket size={18} className="text-indigo-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground">
              Raise a Ticket
            </p>
            <p className="text-xs text-text-muted">
              Submit a support ticket and we&apos;ll get back to you
            </p>
          </div>
          <ExternalLink size={16} className="text-text-muted shrink-0" />
        </button>
      </section>

      {/* Track Ticket */}
      <section>
        <h2 className="text-base font-semibold text-foreground mb-3 flex items-center gap-2">
          <Search size={16} className="text-primary-light" />
          Track a Ticket
        </h2>
        <div className="glass-lux rounded-2xl p-4 space-y-3">
          <div className="flex gap-2">
            <input
              type="text"
              value={ticketNumber}
              onChange={(e) => setTicketNumber(e.target.value)}
              placeholder="Enter ticket number (e.g., TKT-001)"
              className={cn(
                "flex-1 h-11 rounded-xl border px-4 text-sm transition-all",
                "border-border-subtle bg-white/5 text-foreground placeholder:text-text-dim",
                "focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30"
              )}
              onKeyDown={(e) => e.key === "Enter" && handleTrackTicket()}
            />
            <Button
              onClick={handleTrackTicket}
              isLoading={searchingTicket}
              className="shrink-0"
            >
              <Search size={14} />
              Track
            </Button>
          </div>

          {/* Search Result */}
          {ticketSearchResult && (
            <div className="pt-2">
              <TicketCard ticket={ticketSearchResult} />
            </div>
          )}
        </div>
      </section>

      {/* Your Tickets */}
      {isAuthenticated && (
        <section>
          <h2 className="text-base font-semibold text-foreground mb-3 flex items-center gap-2">
            <Clock size={16} className="text-primary-light" />
            Your Tickets
          </h2>
          {isLoadingTickets ? (
            <ShimmerList count={2} />
          ) : tickets.length > 0 ? (
            <div className="space-y-2">
              {tickets.map((ticket) => (
                <TicketCard key={ticket.id} ticket={ticket} />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={Ticket}
              title="No tickets yet"
              description="Your support tickets will appear here."
            />
          )}
        </section>
      )}

      {/* Business Hours */}
      <div className="glass-lux rounded-2xl p-4 text-center">
        <p className="text-xs text-text-muted">
          Business hours:{" "}
          <span className="text-foreground font-medium">{DEMO_CONTACT.hours}</span>
        </p>
        <p className="text-[10px] text-text-dim mt-1">
          We typically respond within 24 hours during business days
        </p>
      </div>

      {/* Modals */}
      <LiveChatModal
        isOpen={showLiveChat}
        onClose={() => setShowLiveChat(false)}
      />
      <RaiseTicketModal
        isOpen={showRaiseTicket}
        onClose={() => setShowRaiseTicket(false)}
        onTicketCreated={fetchTickets}
      />
    </div>
  );
}
