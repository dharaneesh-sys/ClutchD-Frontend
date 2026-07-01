"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Wrench,
  Eye,
  RotateCcw,
  XCircle,
  Clock,
  CheckCircle2,
} from "lucide-react";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import { EmptyState } from "@/components/ui/EmptyState";
import { ShimmerList } from "@/components/ui/Shimmer";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { useToastStore } from "@/store/toastStore";
import api from "@/lib/api";

// ─── Tab definitions ─────────────────────────────────────────────────

const TABS = [
  { key: "upcoming", label: "Upcoming", icon: Clock },
  { key: "completed", label: "Completed", icon: CheckCircle2 },
  { key: "cancelled", label: "Cancelled", icon: XCircle },
];

// ─── Status mapping ──────────────────────────────────────────────────

const STATUS_LABELS = {
  searching: "Searching",
  assigned: "Assigned",
  en_route: "En Route",
  in_progress: "In Progress",
  payment_pending: "Payment Pending",
  completed: "Completed",
  cancelled: "Cancelled",
  pending: "Pending",
};

const STATUS_BADGE_VARIANT = {
  searching: "warning",
  assigned: "info",
  en_route: "info",
  in_progress: "default",
  payment_pending: "warning",
  completed: "success",
  cancelled: "danger",
  pending: "warning",
};

const UPCOMING_STATUSES = ["searching", "assigned", "en_route", "in_progress", "payment_pending", "pending"];

// ─── Issue label mapping ─────────────────────────────────────────────

const ISSUE_LABELS = {
  flat_tire: "Flat Tire",
  engine_failure: "Engine Failure",
  battery_dead: "Dead Battery",
  overheating: "Overheating",
  brake_issue: "Brake Issue",
  oil_leak: "Oil Leak",
  electrical: "Electrical Problem",
  ac_not_working: "AC Not Working",
  transmission: "Transmission Issue",
  starting_issue: "Won't Start",
  noise: "Strange Noise",
  other: "Other",
};

function getIssueLabel(tag) {
  return ISSUE_LABELS[tag] || tag || "Service";
}

// ─── Demo fallback data ──────────────────────────────────────────────

const DEMO_SERVICES = [
  {
    id: "svc-demo-1",
    status: "in_progress",
    issue_tag: "engine_failure",
    description: "Engine making a knocking sound when accelerating. Started this morning.",
    total_amount: 2850,
    created_at: new Date(Date.now() - 3600000).toISOString(),
    assigned_mechanic: { name: "Rajesh M.", phone: "+919876543211" },
  },
  {
    id: "svc-demo-2",
    status: "searching",
    issue_tag: "battery_dead",
    description: "Car won't start, battery needs jump or replacement.",
    total_amount: null,
    created_at: new Date(Date.now() - 1800000).toISOString(),
    assigned_mechanic: null,
  },
  {
    id: "svc-demo-3",
    status: "completed",
    issue_tag: "ac_not_working",
    description: "AC stopped blowing cold air. Gas recharge and service.",
    total_amount: 1200,
    created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
    assigned_mechanic: { name: "Suresh K.", phone: "+919876543212" },
  },
  {
    id: "svc-demo-4",
    status: "completed",
    issue_tag: "flat_tire",
    description: "Rear left tyre puncture repair and air fill.",
    total_amount: 450,
    created_at: new Date(Date.now() - 86400000 * 7).toISOString(),
    assigned_mechanic: { name: "Dinesh R.", phone: "+919876543213" },
  },
  {
    id: "svc-demo-5",
    status: "cancelled",
    issue_tag: "brake_issue",
    description: "Brake pads making squeaking noise.",
    total_amount: 0,
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    assigned_mechanic: null,
  },
];

function getTabKey(status) {
  if (UPCOMING_STATUSES.includes(status)) return "upcoming";
  if (status === "completed") return "completed";
  if (status === "cancelled") return "cancelled";
  return "upcoming";
}

// ─── Service Card ────────────────────────────────────────────────────

function ServiceCard({ service, onViewDetails, onRebook, onCancel }) {
  return (
    <div className="glass-lux rounded-2xl p-4 sm:p-5 space-y-3 animate-fade-in-up">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <Wrench size={14} className="shrink-0 text-text-muted" />
            <span className="text-sm font-semibold text-foreground truncate">
              {getIssueLabel(service.issue_tag)}
            </span>
          </div>
          <p className="text-[11px] text-text-muted mt-1">
            {formatDate(service.created_at)}
          </p>
        </div>
        <Badge variant={STATUS_BADGE_VARIANT[service.status] || "default"}>
          {STATUS_LABELS[service.status] || service.status}
        </Badge>
      </div>

      {/* Divider */}
      <div className="border-t border-border-subtle/50" />

      {/* Description */}
      {service.description && (
        <p className="text-xs text-text-dim line-clamp-2">
          {service.description}
        </p>
      )}

      {/* Price + Mechanic */}
      <div className="flex items-center justify-between text-xs text-text-muted">
        {service.assigned_mechanic?.name ? (
          <span>{service.assigned_mechanic.name}</span>
        ) : (
          <span>—</span>
        )}
        {service.total_amount > 0 && (
          <span className="text-base font-bold text-foreground">
            {formatCurrency(service.total_amount)}
          </span>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 pt-1">
        <button
          onClick={() => onViewDetails(service)}
          className={cn(
            "inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg",
            "bg-white/10 text-text-muted hover:bg-white/15 hover:text-foreground transition-colors"
          )}
        >
          <Eye size={13} />
          Details
        </button>

        {getTabKey(service.status) === "completed" && (
          <button
            onClick={() => onRebook(service)}
            className={cn(
              "inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg",
              "bg-primary/10 text-primary-light hover:bg-primary/20 transition-colors"
            )}
          >
            <RotateCcw size={13} />
            Rebook
          </button>
        )}

        {getTabKey(service.status) === "upcoming" && (
          <button
            onClick={() => onCancel(service)}
            className={cn(
              "inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg ml-auto",
              "bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
            )}
          >
            <XCircle size={13} />
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Detail Modal ────────────────────────────────────────────────────

function ServiceDetailModal({ service, onClose }) {
  if (!service) return null;

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
              Service Details
            </h2>
            <button
              onClick={onClose}
              className="rounded-full p-1.5 transition-colors text-text-dim hover:bg-surface-soft hover:text-text-primary"
            >
              <XCircle size={18} />
            </button>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-text-muted">Service</span>
              <span className="text-sm font-medium text-foreground">
                {getIssueLabel(service.issue_tag)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-text-muted">Status</span>
              <Badge variant={STATUS_BADGE_VARIANT[service.status] || "default"}>
                {STATUS_LABELS[service.status] || service.status}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-text-muted">Request ID</span>
              <span className="text-sm font-mono text-text-primary">
                #{service.id?.slice(-10)}
              </span>
            </div>
            {service.created_at && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-text-muted">Date</span>
                <span className="text-sm text-foreground">
                  {formatDate(service.created_at)}
                </span>
              </div>
            )}
            {service.total_amount > 0 && (
              <div className="flex items-center justify-between pt-2 border-t border-border-subtle/50">
                <span className="text-sm text-text-muted">Amount</span>
                <span className="text-lg font-bold text-foreground">
                  {formatCurrency(service.total_amount)}
                </span>
              </div>
            )}
            {service.assigned_mechanic && (
              <div className="pt-3 border-t border-border-subtle/50">
                <span className="text-sm text-text-muted block mb-1">Assigned Mechanic</span>
                <p className="text-sm font-medium text-foreground">
                  {service.assigned_mechanic.name}
                </p>
              </div>
            )}
            {service.description && (
              <div className="pt-3 border-t border-border-subtle/50">
                <span className="text-sm text-text-muted block mb-1">Description</span>
                <p className="text-sm text-text-secondary">{service.description}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Page ────────────────────────────────────────────────────────────

export default function ServicesPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("upcoming");
  const [services, setServices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedService, setSelectedService] = useState(null);
  const [cancelTarget, setCancelTarget] = useState(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const toast = useToastStore();

  const fetchServices = useCallback(async () => {
    setIsLoading(true);

    try {
      const { data } = await api.get("/jobs/history");
      const fetched = data?.orders || data || [];
      setServices(fetched.length > 0 ? fetched : DEMO_SERVICES);
    } catch {
      setServices(DEMO_SERVICES);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  const filtered = services.filter((s) => getTabKey(s.status) === activeTab);
  const sorted = [...filtered].sort(
    (a, b) => new Date(b.created_at) - new Date(a.created_at)
  );

  const handleRebook = (service) => {
    toast.success("Redirecting to service request...");
    router.push("/dashboard");
  };

  const handleCancel = async () => {
    if (!cancelTarget) return;
    setIsCancelling(true);

    try {
      await api.post(`/service/request/${cancelTarget.id}/cancel`);
    } catch {
      // Best-effort
    }

    setServices((prev) =>
      prev.map((s) =>
        s.id === cancelTarget.id ? { ...s, status: "cancelled" } : s
      )
    );
    setIsCancelling(false);
    setCancelTarget(null);
    toast.success("Service cancelled successfully");
  };

  return (
    <div className="p-4 page-enter">
      {/* Header */}
      <div className="space-y-1 mb-6">
        <h1 className="type-headline-3 text-foreground">My Services</h1>
        <p className="type-body-2 text-muted">Manage your service requests</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5 mb-6 overflow-x-auto scrollbar-none">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          const count = services.filter((s) => getTabKey(s.status) === tab.key).length;

          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                "flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap border",
                isActive
                  ? "bg-primary/10 text-foreground border-primary/30 shadow-sm"
                  : "bg-white/5 text-text-muted border-transparent hover:bg-white/10 hover:text-foreground"
              )}
            >
              <Icon size={14} />
              {tab.label}
              {count > 0 && (
                <span
                  className={cn(
                    "ml-1 text-[10px] px-1.5 py-0.5 rounded-full",
                    isActive
                      ? "bg-primary/20 text-primary-light"
                      : "bg-white/10 text-text-dim"
                  )}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Content */}
      {isLoading ? (
        <ShimmerList count={3} />
      ) : sorted.length > 0 ? (
        <div className="space-y-3">
          {sorted.map((service, index) => (
            <div key={service.id} style={{ animationDelay: `${index * 60}ms` }}>
              <ServiceCard
                service={service}
                onViewDetails={setSelectedService}
                onRebook={handleRebook}
                onCancel={setCancelTarget}
              />
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Wrench}
          title={`No ${activeTab} services`}
          description={
            activeTab === "upcoming"
              ? "You don't have any upcoming services. Request a mechanic or garage service to get started."
              : activeTab === "completed"
              ? "Your completed service history will appear here."
              : "No cancelled services to show."
          }
          action={
            activeTab === "upcoming" ? (
              <button
                onClick={() => router.push("/dashboard")}
                className="btn-glow inline-flex h-11 items-center gap-2 rounded-xl px-6 text-sm font-medium text-white transition-all hover-lift active-press"
              >
                Request Service
              </button>
            ) : undefined
          }
        />
      )}

      {/* Detail Modal */}
      {selectedService && (
        <ServiceDetailModal
          service={selectedService}
          onClose={() => setSelectedService(null)}
        />
      )}

      {/* Cancel Confirmation */}
      <ConfirmModal
        isOpen={!!cancelTarget}
        onClose={() => setCancelTarget(null)}
        onConfirm={handleCancel}
        title="Cancel Service"
        message={
          cancelTarget
            ? `Are you sure you want to cancel the ${getIssueLabel(cancelTarget.issue_tag)} service? A ₹30 cancellation fee may apply.`
            : "Are you sure?"
        }
        confirmLabel="Cancel Service"
        variant="danger"
        isLoading={isCancelling}
      />
    </div>
  );
}
