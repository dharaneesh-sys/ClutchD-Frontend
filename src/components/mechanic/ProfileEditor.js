import { useState } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { MultiSelect } from "@/components/ui/MultiSelect";
import { EXPERTISE_OPTIONS } from "@/lib/constants";
import { User, MapPin, Phone, Loader2, QrCode, Star } from "lucide-react";
import { KycBadge } from "@/components/ui/KycBadge";
import { useAuthStore } from "@/store/authStore";
import { useToast } from "@/components/ui/ToastProvider";
import api from "@/lib/api";
import { resolveMediaUrl } from "@/lib/mediaUrl";

export function ProfileEditor() {
  const user = useAuthStore((s) => s.user);
  const updateUserData = useAuthStore((s) => s.updateUserData);
  const { error: showError } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [expertise, setExpertise] = useState(user?.expertise || []);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [formData, setFormData] = useState({
    fullName: user?.name || user?.email?.split("@")[0] || "",
    phone: user?.phone || "",
    location: user?.location || "",
    upiId: user?.upiId || "",
  });

  if (!user) {
    return (
      <GlassCard className="p-6 h-full flex items-center justify-center">
        <p className="text-[var(--text-muted)]">Loading profile...</p>
      </GlassCard>
    );
  }

  const displayName = user.name || user.email?.split("@")[0] || "User";
  const displayInitials = displayName.substring(0, 2).toUpperCase();

  const handleSave = async () => {
    setSaving(true);
    setSaveError("");
    try {
      const payload = {
        ...formData,
        expertise,
        upiId: formData.upiId || undefined,
      };
      const res = await api.patch("/providers/profile", payload);
      updateUserData(res.data.user);
      setIsEditing(false);
    } catch (e) {
      console.warn("Failed to update profile", e);
      const detail = e.response?.data?.detail;
      const message = typeof detail === "string" ? detail : "Check the highlighted fields and try again.";
      setSaveError(message);
      showError("Failed to update profile. " + (typeof detail === "string" ? detail : ""));
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <GlassCard className="p-4 sm:p-6 h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-semibold tracking-tight text-[var(--foreground)]">Your Profile</h2>
        <Button variant="outline" size="sm" onClick={() => { setIsEditing(!isEditing); setSaveError(""); }} disabled={saving}>
          {isEditing ? "Cancel" : "Edit Profile"}
        </Button>
      </div>

      <div className="flex items-center gap-4 mb-6">
        <div className="w-16 h-16 shrink-0 rounded-full overflow-hidden flex items-center justify-center relative group border bg-[var(--surface-soft)] border-[var(--border)]">
          {user.image ? (
             <img src={resolveMediaUrl(user.image)} alt="Profile" className="w-full h-full object-cover" />
          ) : (
            <span className="text-xl font-semibold text-[var(--primary-dark)]">
               {displayInitials}
            </span>
          )}
          {isEditing && (
             <div className="absolute inset-0 bg-[var(--glass-overlay-scrim)] flex items-center justify-center cursor-pointer">
                <span className="text-xs text-[var(--on-splash)]">Change</span>
             </div>
          )}
        </div>
        <div>
          <h3 className="text-lg font-semibold text-[var(--foreground)] truncate">{displayName}</h3>
           <p className="text-sm text-[var(--text-muted)]">Independent Mechanic</p>
          <div className="flex items-center gap-2 mt-1.5">
            <KycBadge user={user} />
          </div>
          <div className="flex items-center gap-1 text-xs text-[var(--text-muted)] mt-1">
            <Star size={12} aria-hidden="true" className="fill-[var(--pending)] text-[var(--pending)]" />
            {user.rating ?? "—"} rating
          </div>
        </div>
      </div>

      <div className="space-y-4 flex-1">
        <Input 
          label="Full Name" 
          name="fullName"
          icon={User} 
          value={isEditing ? formData.fullName : displayName}
          onChange={handleChange}
          disabled={!isEditing} 
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input 
            label="Phone" 
            name="phone"
            icon={Phone} 
            value={isEditing ? formData.phone : (user.phone || "")}
            placeholder={isEditing ? "" : "— Not set"}
            onChange={handleChange}
            disabled={!isEditing} 
          />
          <Input 
            label="Location" 
            name="location"
            icon={MapPin} 
            value={isEditing ? formData.location : (user.location || "")}
            placeholder={isEditing ? "" : "— Not set"}
            onChange={handleChange}
            disabled={!isEditing} 
          />
        </div>
        
        {isEditing ? (
          <MultiSelect 
            label="Expertise" 
            options={EXPERTISE_OPTIONS} 
            value={expertise} 
            onChange={setExpertise} 
          />
        ) : (
          <div>
              <label className="mb-1.5 block text-sm font-medium text-[var(--foreground)]">Expertise</label>
            <div className="flex flex-wrap gap-2">
               {user.expertise?.length > 0 ? user.expertise.map(exp => {
                 const label = EXPERTISE_OPTIONS.find(o => o.value === exp)?.label || exp;
                  return (
                    <span key={exp} className="px-2.5 py-1 rounded-lg text-xs font-medium bg-[var(--surface-soft)] border border-[var(--border)] text-[var(--foreground)]">
                      {label}
                    </span>
                  )
               }) : (
                 <span className="text-xs text-[var(--text-muted)]">— No expertise set</span>
               )}
            </div>
          </div>
        )}

        {/* UPI ID */}
        {isEditing ? (
          <Input 
            label="UPI ID (for payouts)" 
            name="upiId"
            icon={QrCode} 
            placeholder="yourname@upi"
            value={formData.upiId}
            onChange={handleChange}
          />
        ) : (
          <div>
              <label className="mb-1.5 block text-sm font-medium text-[var(--foreground)]">UPI ID</label>
             <div className="flex min-h-[44px] items-center gap-2 px-3 py-2.5 rounded-xl border text-sm bg-[var(--surface-soft)] border-[var(--border)] text-[var(--foreground)]">
               <QrCode size={14} aria-hidden="true" className="text-[var(--primary-dark)]" />
              {user?.upiId || <span className="text-[var(--text-muted)]">— Not set. Add your UPI ID to receive payouts.</span>}
            </div>
          </div>
        )}
      </div>

      {isEditing && saveError && (
        <p role="alert" className="mt-4 rounded-xl border border-[color-mix(in_srgb,var(--danger)_30%,transparent)] bg-[color-mix(in_srgb,var(--danger)_8%,transparent)] p-3 text-sm text-[var(--danger-ink)]">
          {saveError}
        </p>
      )}

      {isEditing && (
        <div className="mt-6 pt-6 border-t flex justify-end border-[var(--border)]">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <><Loader2 size={16} aria-hidden="true" className="animate-spin" /> Saving...</> : "Save Changes"}
          </Button>
        </div>
      )}
    </GlassCard>
  );
}
