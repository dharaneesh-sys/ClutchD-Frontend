"use client";

import {
  User,
  Mail,
  Shield,
  MapPin,
  CreditCard,
  Settings,
  Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/authStore";

// ─── Placeholder Section ──────────────────────────────────────────────

function PlaceholderSection({ icon: Icon, title, description, actionLabel }) {
  return (
    <div className="glass-lux rounded-2xl p-5 space-y-3">
      <div className="flex items-center gap-3">
        <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-white/10 ring-1 ring-white/10 flex items-center justify-center">
          <Icon size={18} className="text-text-dim" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-foreground">{title}</h3>
          <p className="text-xs text-text-muted mt-0.5">{description}</p>
        </div>
        {actionLabel && (
          <button
            type="button"
            className={cn(
              "flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg",
              "text-primary-light bg-primary/10 hover:bg-primary/20 transition-colors"
            )}
          >
            <Plus size={14} />
            {actionLabel}
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const { user, isAuthenticated } = useAuthStore();

  const displayName = user?.name || user?.email || "Guest";
  const displayEmail = user?.email || "—";
  const displayRole = user?.role
    ? user.role.charAt(0).toUpperCase() + user.role.slice(1)
    : "—";

  return (
    <div className="p-4 page-enter">
      {/* Header */}
      <div className="space-y-1 mb-7">
        <h1 className="type-headline-3 text-foreground">Profile</h1>
        <p className="type-body-2 text-muted">Manage your account</p>
      </div>

      {/* User Card */}
      <div className="glass-lux rounded-2xl p-5 mb-6">
        <div className="flex items-center gap-4">
          {/* Avatar */}
          <div className="flex-shrink-0 w-16 h-16 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 ring-2 ring-white/10 flex items-center justify-center">
            <User size={28} className="text-primary-light" />
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold text-foreground truncate">
              {displayName}
            </h2>
            <div className="flex flex-col gap-1 mt-1.5">
              <span className="inline-flex items-center gap-1.5 text-xs text-text-muted">
                <Mail size={12} className="shrink-0" />
                {displayEmail}
              </span>
              <span className="inline-flex items-center gap-1.5 text-xs text-text-muted capitalize">
                <Shield size={12} className="shrink-0" />
                {displayRole}
              </span>
            </div>
          </div>

          {/* Auth status indicator */}
          <span
            className={cn(
              "flex-shrink-0 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1",
              "text-[0.625rem] font-semibold tracking-wide uppercase",
              isAuthenticated
                ? "bg-emerald-500/15 text-emerald-300"
                : "bg-amber-500/15 text-amber-300"
            )}
          >
            <span
              className={cn(
                "w-1.5 h-1.5 rounded-full",
                isAuthenticated ? "bg-emerald-400" : "bg-amber-400"
              )}
            />
            {isAuthenticated ? "Active" : "Guest"}
          </span>
        </div>
      </div>

      {/* Placeholder Sections */}
      <div className="space-y-3">
        <PlaceholderSection
          icon={MapPin}
          title="Saved Addresses"
          description="No addresses saved yet. Add a delivery address for faster checkout."
          actionLabel="Add"
        />

        <PlaceholderSection
          icon={CreditCard}
          title="Payment Methods"
          description="No payment methods added yet. Link a card or UPI for seamless payments."
          actionLabel="Add"
        />

        <PlaceholderSection
          icon={Settings}
          title="Settings"
          description="Notifications, privacy, and account preferences."
        />
      </div>
    </div>
  );
}
