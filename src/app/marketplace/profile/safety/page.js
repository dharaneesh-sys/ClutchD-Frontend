"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Shield,
  ChevronDown,
  Phone,
  AlertTriangle,
  FileText,
  Lock,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Shimmer } from "@/components/ui/Shimmer";
import { Button } from "@/components/ui/Button";
import { useToastStore } from "@/store/toastStore";
import { useRouter } from "next/navigation";
import api from "@/lib/api";

// ─── Demo content ────────────────────────────────────────────────────

const DEMO_PRIVACY_POLICY = `Privacy Policy for ClutchD

Last updated: January 1, 2025

1. Information We Collect
We collect information you provide when creating an account, making a booking, or contacting support. This includes your name, email address, phone number, vehicle details, and location data.

2. How We Use Your Information
We use your information to provide and improve our services, process payments, send service updates, and respond to your inquiries.

3. Data Sharing
We do not sell your personal information. We may share data with service providers (mechanics, garages) as necessary to fulfill your service request, and with payment processors for transaction handling.

4. Data Security
We implement industry-standard encryption and security measures to protect your data. All payment transactions are processed through secure, PCI-compliant gateways.

5. Your Rights
You have the right to access, update, or delete your personal information at any time through your account settings.`;

const DEMO_TERMS = `Terms & Conditions for ClutchD

Last updated: January 1, 2025

1. Acceptance of Terms
By using ClutchD, you agree to these terms. If you do not agree, please do not use our services.

2. Service Description
ClutchD connects vehicle owners with mechanics and garages for repair and maintenance services. We facilitate the booking and payment process but are not responsible for the quality of work performed by service providers.

3. User Responsibilities
Users must provide accurate information about their vehicle and the issue. False or misleading information may result in service cancellation without refund.

4. Cancellation Policy
Cancellations made before a mechanic is assigned are free. A ₹30 cancellation fee applies after assignment. No refund after service is in progress.

5. Limitation of Liability
ClutchD's liability is limited to the value of the service fee paid. We are not liable for any indirect damages arising from service delivery.`;

const DEMO_DATA_PROTECTION = `Data Protection at ClutchD

Our Commitment to Your Privacy

• Encryption: All data transmitted between your device and our servers is encrypted using TLS 1.3 protocol.
• Storage: Personal data is stored on secure servers with restricted access. We use AES-256 encryption for sensitive data.
• Access Control: Only authorized personnel with a legitimate business need can access user data.
• Payment Security: All payment processing is handled by Razorpay, a PCI-DSS compliant payment gateway.
• Data Retention: We retain your data only as long as necessary to provide our services and comply with legal obligations.
• Third-Party Audits: Our security practices are regularly audited by independent third-party firms.
• Breach Notification: In the unlikely event of a data breach, we will notify affected users within 72 hours.`;

const EMERGENCY_CONTACTS = [
  { label: "Police", number: "100", icon: Shield },
  { label: "Ambulance", number: "108", icon: Phone },
  { label: "Fire", number: "101", icon: AlertTriangle },
  { label: "Roadside Assistance", number: "+91 98765 43210", icon: Phone },
];

// ─── Expandable Section ──────────────────────────────────────────────

function ExpandableSection({ icon: Icon, title, content, defaultOpen = false }) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div
      className={cn(
        "rounded-2xl border transition-all duration-200 overflow-hidden",
        isOpen
          ? "glass-lux border-primary/20"
          : "bg-white/[0.03] border-border-subtle hover:bg-white/[0.05]"
      )}
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between gap-3 p-4 text-left"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-primary/15 flex items-center justify-center">
            <Icon size={16} className="text-primary-light" />
          </div>
          <span className="text-sm font-semibold text-foreground">{title}</span>
        </div>
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
          <div className="px-4 pb-4 text-sm text-text-muted leading-relaxed border-t border-border-subtle/50 pt-3 whitespace-pre-line">
            {content}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────

export default function SafetyPage() {
  const router = useRouter();
  const toast = useToastStore();

  const [privacyPolicy, setPrivacyPolicy] = useState(null);
  const [terms, setTerms] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchContent = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data } = await api.get("/safety/privacy-policy");
      setPrivacyPolicy(data?.content || DEMO_PRIVACY_POLICY);
    } catch {
      setPrivacyPolicy(DEMO_PRIVACY_POLICY);
    }

    try {
      const { data } = await api.get("/safety/terms");
      setTerms(data?.content || DEMO_TERMS);
    } catch {
      setTerms(DEMO_TERMS);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchContent();
  }, [fetchContent]);

  const handleReportSafetyIssue = () => {
    toast.info("Redirecting to support...");
    router.push("/marketplace/profile/help");
  };

  if (isLoading) {
    return (
      <div className="p-4 page-enter space-y-4">
        <div className="space-y-1 mb-6">
          <Shimmer className="h-7 w-32" />
          <Shimmer className="h-4 w-48" />
        </div>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-border-subtle p-4">
            <Shimmer className="h-6 w-48" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="p-4 page-enter space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="type-headline-3 text-foreground">Safety & Legal</h1>
        <p className="type-body-2 text-muted">
          Privacy, terms, and emergency information
        </p>
      </div>

      {/* Privacy Policy */}
      <section>
        <ExpandableSection
          icon={FileText}
          title="Privacy Policy"
          content={privacyPolicy || DEMO_PRIVACY_POLICY}
        />
      </section>

      {/* Terms & Conditions */}
      <section>
        <ExpandableSection
          icon={FileText}
          title="Terms & Conditions"
          content={terms || DEMO_TERMS}
        />
      </section>

      {/* Data Protection */}
      <section>
        <ExpandableSection
          icon={Lock}
          title="Data Protection"
          content={DEMO_DATA_PROTECTION}
        />
      </section>

      {/* Emergency Contacts */}
      <section>
        <h2 className="text-base font-semibold text-foreground mb-3 flex items-center gap-2">
          <Shield size={16} className="text-primary-light" />
          Emergency Contacts
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {EMERGENCY_CONTACTS.map((contact) => {
            const Icon = contact.icon;
            return (
              <a
                key={contact.label}
                href={`tel:${contact.number.replace(/\s/g, "")}`}
                className="glass-lux rounded-2xl p-4 flex items-center gap-3 hover:bg-white/[0.08] transition-colors"
              >
                <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-red-500/15 flex items-center justify-center">
                  <Icon size={18} className="text-red-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground">
                    {contact.label}
                  </p>
                  <p className="text-sm font-mono text-primary-light">
                    {contact.number}
                  </p>
                </div>
              </a>
            );
          })}
        </div>
      </section>

      {/* Report Safety Issue */}
      <section>
        <button
          onClick={handleReportSafetyIssue}
          className="glass-lux rounded-2xl p-4 w-full flex items-center gap-3 hover:bg-white/[0.08] transition-colors text-left"
        >
          <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-amber-500/15 flex items-center justify-center">
            <AlertTriangle size={18} className="text-amber-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground">
              Report a Safety Issue
            </p>
            <p className="text-xs text-text-muted">
              Contact support to report a safety concern
            </p>
          </div>
          <ExternalLink size={16} className="text-text-muted shrink-0" />
        </button>
      </section>
    </div>
  );
}
