"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Shield,
  Pencil,
  Loader2,
} from "lucide-react";
import { cn, getInitials, formatDate } from "@/lib/utils";
import { useAuthStore } from "@/store/authStore";
import { Button } from "@/components/ui/Button";
import api from "@/lib/api";

const DEMO_PROFILE = {
  name: "Rahul Sharma",
  email: "rahul.sharma@example.com",
  phone: "+91 98765 43210",
  address: "42, MG Road, Indiranagar, Bangalore – 560038",
  role: "customer",
  createdAt: "2025-08-15T00:00:00.000Z",
  photo: null,
};

export default function AccountDetailsPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchProfile() {
      setIsLoading(true);
      setError(null);
      try {
        const res = await api.get("/profile/me");
        if (!cancelled) {
          setProfile(res.data);
        }
      } catch (err) {
        if (!cancelled) {
          // Fall back to demo data
          setProfile({
            ...DEMO_PROFILE,
            email: user?.email || DEMO_PROFILE.email,
            name: user?.name || DEMO_PROFILE.name,
            phone: user?.phone || DEMO_PROFILE.phone,
            role: user?.role || DEMO_PROFILE.role,
            createdAt: user?.createdAt || DEMO_PROFILE.createdAt,
          });
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    fetchProfile();
    return () => { cancelled = true; };
  }, [user]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  const displayName = profile?.name || user?.name || "User";
  const displayEmail = profile?.email || user?.email || "—";
  const displayPhone = profile?.phone || user?.phone || "—";
  const displayAddress = profile?.address || "—";
  const displayRole = profile?.role || user?.role || "—";
  const memberSince = profile?.createdAt || user?.createdAt;

  return (
    <div className="p-4 sm:p-5 space-y-5 animate-fade-in-up max-w-2xl">
      <div className="space-y-1">
        <h1 className="text-lg font-semibold text-foreground">Account Details</h1>
        <p className="text-sm text-text-muted">Your personal information</p>
      </div>

      {/* Profile Photo & Name */}
      <div className="glass-lux rounded-2xl p-5 flex items-center gap-4">
        <div className="flex-shrink-0 w-16 h-16 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 ring-2 ring-white/10 flex items-center justify-center">
          {displayName !== "User" ? (
            <span className="text-lg font-bold text-primary-light">{getInitials(displayName)}</span>
          ) : (
            <User size={28} className="text-primary-light" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-base font-bold text-foreground truncate">{displayName}</h2>
          <p className="text-xs text-text-muted capitalize mt-0.5">
            <Shield size={11} className="inline mr-1" />
            {typeof displayRole === "string" ? displayRole.charAt(0).toUpperCase() + displayRole.slice(1) : displayRole}
          </p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => router.push("/marketplace/profile/edit")}
        >
          <Pencil size={14} className="mr-1.5" />
          Edit
        </Button>
      </div>

      {/* Details Cards */}
      <div className="space-y-3">
        <DetailRow icon={Mail} label="Email" value={displayEmail} />
        <DetailRow icon={Phone} label="Phone" value={displayPhone} />
        <DetailRow icon={MapPin} label="Address" value={displayAddress} />
        {memberSince && (
          <DetailRow icon={Calendar} label="Member Since" value={formatDate(memberSince)} />
        )}
      </div>
    </div>
  );
}

function DetailRow({ icon: Icon, label, value }) {
  return (
    <div className="glass-lux rounded-2xl p-4 flex items-center gap-3">
      <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-white/[0.05] flex items-center justify-center">
        <Icon size={16} className="text-text-muted" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-text-muted">{label}</p>
        <p className="text-sm font-medium text-foreground mt-0.5 break-words">{value}</p>
      </div>
    </div>
  );
}
