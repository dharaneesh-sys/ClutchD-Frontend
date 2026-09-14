"use client";

import { useState, useEffect } from "react";
import {
  Building2,
  Users,
  User,
  Mail,
  Phone,
  MapPin,
  FileText,
  CheckCircle,
  ArrowRight,
  Truck,
} from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { BackendHealth } from "@/lib/backendHealth";
import { saveFleetRegistration } from "@/lib/fleet/fleetStorage";
import { cn } from "@/lib/utils";

const FLEET_SIZE_OPTIONS = [
  { value: "1-5", label: "1–5 vehicles" },
  { value: "6-10", label: "6–10 vehicles" },
  { value: "11-25", label: "11–25 vehicles" },
  { value: "26-50", label: "26–50 vehicles" },
  { value: "51-100", label: "51–100 vehicles" },
  { value: "100+", label: "100+ vehicles" },
];

const FLEET_TYPES = [
  { value: "logistics", label: "Logistics / Delivery" },
  { value: "taxi", label: "Taxi / Ride-hailing" },
  { value: "rental", label: "Vehicle Rental" },
  { value: "corporate", label: "Corporate Fleet" },
  { value: "public_transport", label: "Public Transport" },
  { value: "other", label: "Other" },
];

const INITIAL_FORM = {
  companyName: "",
  fleetType: "",
  fleetSize: "",
  contactName: "",
  contactEmail: "",
  contactPhone: "",
  businessAddress: "",
  gstin: "",
};

/**
 * Fleet/B2B registration form.
 *
 * Collects company details for a fleet account. In demo mode (when the
 * backend is unavailable), data is saved to localStorage. When the backend
 * is reachable, it submits via API.
 */
export function FleetRegistrationForm({ onRegistered }) {
  const [form, setForm] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isBackendAvailable, setIsBackendAvailable] = useState(null); // null = unchecked
  const [submitted, setSubmitted] = useState(false);

  // Check backend availability on mount
  useEffect(() => {
    const available = BackendHealth.isAvailable();
    setIsBackendAvailable(available);
    // If never checked, kick off a check
    if (available === null) {
      BackendHealth.check().then(setIsBackendAvailable);
    }
  }, []);
  const validate = () => {
    const newErrors = {};
    if (!form.companyName.trim()) newErrors.companyName = "Company name is required";
    if (!form.fleetType) newErrors.fleetType = "Select fleet type";
    if (!form.fleetSize) newErrors.fleetSize = "Select fleet size";
    if (!form.contactName.trim()) newErrors.contactName = "Contact name is required";
    if (!form.contactEmail.trim()) {
      newErrors.contactEmail = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.contactEmail)) {
      newErrors.contactEmail = "Invalid email address";
    }
    if (!form.contactPhone.trim()) {
      newErrors.contactPhone = "Phone number is required";
    } else if (!/^[\d\s+\-()]{7,20}$/.test(form.contactPhone)) {
      newErrors.contactPhone = "Invalid phone number";
    }
    if (!form.businessAddress.trim()) newErrors.businessAddress = "Business address is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    // Clear error on change
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);

    // Build the fleet account object
    const fleetAccount = {
      id: "fleet-" + Date.now(),
      companyName: form.companyName.trim(),
      fleetType: form.fleetType,
      fleetSize: form.fleetSize,
      contactName: form.contactName.trim(),
      contactEmail: form.contactEmail.trim(),
      contactPhone: form.contactPhone.trim(),
      businessAddress: form.businessAddress.trim(),
      gstin: form.gstin.trim(),
      registeredAt: new Date().toISOString(),
      tier: "bronze",
      totalJobsCompleted: 0,
      totalSpent: 0,
      discountRate: 5,
      priorityDispatch: true,
      vehicles: [],
      serviceHistory: [],
    };

    if (isBackendAvailable) {
      try {
        const api = (await import("@/lib/api")).default;
        const res = await api.post("/fleet/register", fleetAccount);
        if (res.data) {
          saveFleetRegistration(res.data); // mirror to localStorage as fallback
        }
      } catch {
        // Backend failed — fall back to localStorage
        saveFleetRegistration(fleetAccount);
      }
    } else {
      // Demo mode — persist to localStorage
      saveFleetRegistration(fleetAccount);
    }

    setIsSubmitting(false);
    setSubmitted(true);
    onRegistered?.(fleetAccount);
  };

  if (submitted) {
    return (
      <GlassCard variant="glass-lux-strong" className="w-full max-w-lg mx-auto p-8 text-center">
        <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-5">
          <CheckCircle size={36} className="text-green-400" />
        </div>
        <h2 className="text-2xl font-bold text-foreground mb-2">Registration Submitted!</h2>
        <p className="text-text-muted mb-6 max-w-sm mx-auto">
          Your fleet account for <span className="font-semibold text-foreground">{form.companyName}</span>{" "}
          is being set up. You&apos;ll receive priority dispatch and volume discounts.
        </p>
        <Button onClick={() => onRegistered?.(null, true)} size="lg">
          Go to Fleet Dashboard
          <ArrowRight size={18} className="ml-2" />
        </Button>
      </GlassCard>
    );
  }

  return (
    <GlassCard variant="glass-lux-strong" className="w-full max-w-lg mx-auto p-6 sm:p-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center">
          <Truck size={24} className="text-primary-light" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-foreground">Fleet / B2B Registration</h2>
          <p className="text-sm text-text-muted">
            {isBackendAvailable
              ? "Register your fleet for priority dispatch"
              : "Demo mode — data saved locally"}
          </p>
        </div>
      </div>

      {/* Backend status badge */}
      {isBackendAvailable !== null && (
        <div className="mb-6">
          <Badge variant={isBackendAvailable ? "success" : "glass"}>
            {isBackendAvailable ? "Backend Available" : "Demo Mode — Local Storage"}
          </Badge>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Company Info */}
        <div className="space-y-1">
          <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider flex items-center gap-2">
            <Building2 size={14} />
            Company Information
          </h3>
          <div className="h-px bg-border-subtle" />
        </div>

        <Input
          label="Company Name *"
          placeholder="Your Fleet Ltd."
          icon={Building2}
          value={form.companyName}
          onChange={(e) => handleChange("companyName", e.target.value)}
          error={errors.companyName}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="Fleet Type *"
            placeholder="Select type"
            options={FLEET_TYPES}
            value={form.fleetType}
            onChange={(e) => handleChange("fleetType", e.target.value)}
            error={errors.fleetType}
          />
          <Select
            label="Fleet Size *"
            placeholder="Select size"
            options={FLEET_SIZE_OPTIONS}
            value={form.fleetSize}
            onChange={(e) => handleChange("fleetSize", e.target.value)}
            error={errors.fleetSize}
          />
        </div>

        {/* Contact Info */}
        <div className="space-y-1 pt-2">
          <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider flex items-center gap-2">
            <User size={14} />
            Contact Information
          </h3>
          <div className="h-px bg-border-subtle" />
        </div>

        <Input
          label="Contact Person *"
          placeholder="Full name"
          icon={User}
          value={form.contactName}
          onChange={(e) => handleChange("contactName", e.target.value)}
          error={errors.contactName}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Email Address *"
            type="email"
            placeholder="name@company.com"
            icon={Mail}
            value={form.contactEmail}
            onChange={(e) => handleChange("contactEmail", e.target.value)}
            error={errors.contactEmail}
          />
          <Input
            label="Phone Number *"
            type="tel"
            placeholder="+91 98765 43210"
            icon={Phone}
            value={form.contactPhone}
            onChange={(e) => handleChange("contactPhone", e.target.value)}
            error={errors.contactPhone}
          />
        </div>

        {/* Business Address */}
        <div className="space-y-1 pt-2">
          <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider flex items-center gap-2">
            <MapPin size={14} />
            Business Details
          </h3>
          <div className="h-px bg-border-subtle" />
        </div>

        <Input
          label="Business Address *"
          placeholder="Street, city, state, pincode"
          icon={MapPin}
          value={form.businessAddress}
          onChange={(e) => handleChange("businessAddress", e.target.value)}
          error={errors.businessAddress}
        />

        <Input
          label="GSTIN (optional)"
          placeholder="33AABCU9603R1ZL"
          icon={FileText}
          value={form.gstin}
          onChange={(e) => handleChange("gstin", e.target.value)}
          error={errors.gstin}
        />

        {/* Benefits notice */}
        <div className={cn(
          "rounded-xl p-4 border",
          "bg-primary/5 border-primary/20"
        )}>
          <div className="flex items-start gap-3">
            <Truck size={18} className="text-primary-light shrink-0 mt-0.5" />
            <div className="text-xs text-text-muted space-y-1">
              <p className="font-semibold text-foreground text-sm">Fleet Benefits</p>
              <p>✓ Priority dispatch — your vehicles get serviced first</p>
              <p>✓ Volume discounts — up to 20% off on bulk service bookings</p>
              <p>✓ Dedicated fleet manager and consolidated billing</p>
            </div>
          </div>
        </div>

        <Button type="submit" className="w-full" size="lg" isLoading={isSubmitting}>
          Register Fleet
          <ArrowRight size={18} className="ml-2" />
        </Button>
      </form>
    </GlassCard>
  );
}
