import { useState } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { MultiSelect } from "@/components/ui/MultiSelect";
import { EXPERTISE_OPTIONS } from "@/lib/constants";
import { User, MapPin, Phone, Loader2, QrCode } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { useToast } from "@/components/ui/ToastProvider";
import api from "@/lib/api";

export function ProfileEditor() {
  const { user, updateUserData } = useAuthStore();
  const { error: showError } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [expertise, setExpertise] = useState(user?.expertise || []);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    fullName: user?.name || user?.email?.split("@")[0] || "",
    phone: user?.phone || "",
    location: user?.location || "",
    upiId: user?.upiId || "",
  });

  if (!user) {
    return (
      <GlassCard variant="strong" className="p-6 h-full flex items-center justify-center">
        <p className="text-text-muted">Loading profile...</p>
      </GlassCard>
    );
  }

  const displayName = user.name || user.email?.split("@")[0] || "User";
  const displayInitials = displayName.substring(0, 2).toUpperCase();

  const handleSave = async () => {
    setSaving(true);
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
      showError("Failed to update profile. " + (e.response?.data?.detail || ""));
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <GlassCard variant="strong" className="p-4 sm:p-6 h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold tracking-tight text-text-primary">Your Profile</h2>
        <Button variant="ghost" size="sm" onClick={() => setIsEditing(!isEditing)} disabled={saving}>
          {isEditing ? "Cancel" : "Edit Profile"}
        </Button>
      </div>

      <div className="flex items-center gap-4 mb-8">
        <div className="w-20 h-20 rounded-full overflow-hidden flex items-center justify-center relative group border-2 bg-surface-soft border-border-subtle">
          {user.image ? (
             <img src={user.image} alt="Profile" className="w-full h-full object-cover" />
          ) : (
            <span className="text-2xl font-bold text-icon-highlight">
               {displayInitials}
            </span>
          )}
          {isEditing && (
             <div className="absolute inset-0 bg-black/60 flex items-center justify-center cursor-pointer">
                <span className="text-xs text-white">Change</span>
             </div>
          )}
        </div>
        <div>
          <h3 className="text-xl font-semibold text-text-primary">{displayName}</h3>
           <p className="text-sm text-text-muted">Independent Mechanic</p>
          <div className="flex items-center text-xs text-amber-500 mt-1">
            ⭐ {user.rating ?? "—"} Rating
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
            onChange={handleChange}
            disabled={!isEditing} 
          />
          <Input 
            label="Location" 
            name="location"
            icon={MapPin} 
            value={isEditing ? formData.location : (user.location || "")}
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
              <label className="mb-2 block text-sm font-medium text-text-muted">Expertise</label>
            <div className="flex flex-wrap gap-2">
               {user.expertise?.length > 0 ? user.expertise.map(exp => {
                 const label = EXPERTISE_OPTIONS.find(o => o.value === exp)?.label || exp;
                  return (
                    <span key={exp} className="px-2.5 py-1 rounded-md text-xs font-medium bg-surface-soft border border-border-subtle text-text-primary">
                      {label}
                    </span>
                  )
               }) : (
                 <span className="text-xs text-text-dim">No expertise set</span>
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
              <label className="mb-2 block text-sm font-medium text-text-muted">UPI ID</label>
             <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm bg-surface-soft border-border-subtle text-text-primary">
               <QrCode size={14} className="text-icon-highlight" />
              {user?.upiId || <span className="text-text-dim">Not set — add your UPI ID to receive payouts</span>}
            </div>
          </div>
        )}
      </div>

      {isEditing && (
        <div className="mt-6 pt-6 border-t flex justify-end border-border-subtle">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <><Loader2 size={16} className="animate-spin mr-2" /> Saving...</> : "Save Changes"}
          </Button>
        </div>
      )}
    </GlassCard>
  );
}
