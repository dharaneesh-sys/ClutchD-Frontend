import { useState } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { MultiSelect } from "@/components/ui/MultiSelect";
import { EXPERTISE_OPTIONS } from "@/lib/constants";
import { Building2, MapPin, Phone, Clock, Users, Loader2, QrCode, Star } from "lucide-react";
import { KycBadge } from "@/components/ui/KycBadge";
import { useAuthStore } from "@/store/authStore";
import { useToast } from "@/components/ui/ToastProvider";
import api from "@/lib/api";
import { resolveMediaUrl } from "@/lib/mediaUrl";

export function GarageProfile() {
  const user = useAuthStore((s) => s.user);
  const updateUserData = useAuthStore((s) => s.updateUserData);
  const { error: showError } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [services, setServices] = useState(user?.services || []);
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    garageName: user?.name || user?.garageName || "",
    phone: user?.phone || "",
    location: user?.location || "",
    operatingHours: user?.operatingHours || "",
    mechanicCount: user?.mechanicCount || "",
    upiId: user?.upiId || "",
  });

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        ...formData,
        mechanicCount: formData.mechanicCount ? parseInt(formData.mechanicCount) : 0,
        services,
        upiId: formData.upiId || undefined,
      };
      const res = await api.patch("/providers/profile", payload);
      updateUserData(res.data.user);
      setIsEditing(false);
    } catch (e) {
      console.warn("Failed to update garage profile", e);
      showError("Failed to update profile. " + (e.response?.data?.detail || ""));
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
        <h2 className="text-lg font-semibold tracking-tight text-[var(--foreground)]">Garage Profile</h2>
        <Button variant="ghost" size="sm" onClick={() => setIsEditing(!isEditing)} disabled={saving}>
          {isEditing ? "Cancel" : "Edit Details"}
        </Button>
      </div>

      <div className="flex items-center gap-4 mb-8 pb-6 border-b border-[var(--border)]">
        <div className="w-16 h-16 shrink-0 rounded-2xl overflow-hidden flex items-center justify-center border bg-[var(--surface-soft)] border-[var(--border)]">
          {user?.image ? (
             <img src={resolveMediaUrl(user.image)} alt="Garage" className="w-full h-full object-cover" />
          ) : (
            <Building2 size={32} className="text-[var(--primary-dark)]" />
          )}
        </div>
        <div>
          <h3 className="text-xl font-semibold text-[var(--foreground)]">{user?.name || user?.garageName || "Your Garage"}</h3>
           {user?.ownerName && <p className="text-sm text-[var(--text-muted)]">Managed by {user.ownerName}</p>}
          <div className="flex items-center gap-3 mt-2">
              <div className="flex items-center gap-1 text-xs text-[var(--text-muted)]">
                <Star size={12} aria-hidden="true" className="fill-[var(--pending)] text-[var(--pending)]" />
                {user?.rating ?? "—"} rating
              </div>
              <KycBadge user={user} />
          </div>
        </div>
      </div>

      <div className="space-y-4 flex-1">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input 
            label="Garage Name" 
            name="garageName"
            icon={Building2} 
            value={isEditing ? formData.garageName : (user?.name || user?.garageName || "")} 
            onChange={handleChange}
            disabled={!isEditing} 
          />
          <Input 
            label="Contact Phone" 
            name="phone"
            icon={Phone} 
            value={isEditing ? formData.phone : (user?.phone || "")} 
            onChange={handleChange}
            disabled={!isEditing} 
          />
        </div>
        
        <Input 
          label="Location Address" 
          name="location"
          icon={MapPin} 
          value={isEditing ? formData.location : (user?.location || "")} 
          onChange={handleChange}
          disabled={!isEditing} 
        />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input 
            label="Operating Hours" 
            name="operatingHours"
            icon={Clock} 
            value={isEditing ? formData.operatingHours : (user?.operatingHours || "")} 
            onChange={handleChange}
            disabled={!isEditing} 
          />
          <Input 
            label="Staff Capacity" 
            name="mechanicCount"
            icon={Users} 
            type="number"
            value={isEditing ? formData.mechanicCount : (user?.mechanicCount || "")} 
            onChange={handleChange}
            disabled={!isEditing} 
          />
        </div>
        
        {isEditing ? (
          <MultiSelect 
            label="Services Offered" 
            options={EXPERTISE_OPTIONS} 
            value={services} 
            onChange={setServices} 
          />
        ) : (
          <div>
              <label className="mb-1.5 block text-sm font-medium text-[var(--foreground)]">Services Offered</label>
            <div className="flex flex-wrap gap-2">
               {user?.services?.length > 0 ? user.services.map(exp => {
                 const label = EXPERTISE_OPTIONS.find(o => o.value === exp)?.label || exp;
                 return (
                    <span key={exp} className="px-2.5 py-1 rounded-lg text-xs font-medium bg-surface-soft border border-[var(--border)] text-[var(--foreground)]">
                      {label}
                    </span>
                 )
               }) : (
                 <span className="text-xs text-[var(--text-muted)]">— No services set</span>
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
            placeholder="garagename@upi"
            value={formData.upiId}
            onChange={handleChange}
          />
        ) : (
          <div>
              <label className="mb-1.5 block text-sm font-medium text-[var(--foreground)]">UPI ID</label>
             <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm bg-[var(--surface-soft)] border-[var(--border)] text-[var(--foreground)]">
               <QrCode size={14} className="text-[var(--primary-dark)]" />
              {user?.upiId || <span className="text-[var(--text-muted)]">— Not set. Add your UPI ID to receive payouts.</span>}
            </div>
          </div>
        )}
      </div>

      {isEditing && (
        <div className="mt-6 pt-6 border-t flex justify-end border-[var(--border)]">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <><Loader2 size={16} className="animate-spin" aria-hidden="true" /> Saving...</> : "Save Details"}
          </Button>
        </div>
      )}
    </GlassCard>
  );
}
