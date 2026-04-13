import { useState } from "react";
import { GlassCard } from "../ui/GlassCard";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { MultiSelect } from "../ui/MultiSelect";
import { EXPERTISE_OPTIONS } from "../../lib/constants";
import { Building2, MapPin, Phone, Clock, Users, Loader2, QrCode } from "lucide-react";
import { useAuthStore } from "../../store/authStore";
import { useThemeStore } from "../../store/themeStore";
import api from "../../lib/api";

export function GarageProfile() {
  const { user, updateUserData } = useAuthStore();
  const { theme } = useThemeStore();
  const isLight = theme === "light";
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
      alert("Failed to update profile. " + (e.response?.data?.detail || ""));
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
        <h2 className={`text-xl font-bold tracking-tight ${isLight ? "text-stone-900" : "text-white"}`}>Garage Profile</h2>
        <Button variant="ghost" size="sm" onClick={() => setIsEditing(!isEditing)} disabled={saving}>
          {isEditing ? "Cancel" : "Edit Details"}
        </Button>
      </div>

      <div className={`flex items-center gap-4 mb-8 pb-6 border-b ${isLight ? "border-stone-200" : "border-white/5"}`}>
        <div className={`w-20 h-20 rounded-2xl overflow-hidden flex items-center justify-center border-2 ${isLight ? "bg-amber-50 border-amber-200" : "bg-emerald-500/20 border-emerald-500/30"}`}>
          {user?.image ? (
             <img src={user.image} alt="Garage" className="w-full h-full object-cover" />
          ) : (
            <Building2 size={32} className={isLight ? "text-amber-600" : "text-emerald-400"} />
          )}
        </div>
        <div>
          <h3 className={`text-xl font-semibold ${isLight ? "text-stone-900" : "text-white"}`}>{user?.name || user?.garageName || "Your Garage"}</h3>
          <p className={`text-sm ${isLight ? "text-stone-500" : "text-emerald-100/60"}`}>Managed by {user?.ownerName || "Owner"}</p>
          <div className="flex items-center gap-3 mt-2">
             <div className="flex items-center text-xs text-amber-500">
               ⭐ {user?.rating ?? "—"} <span className={`ml-1 ${isLight ? "text-stone-400" : "text-emerald-100/40"}`}>Rating</span>
             </div>
             <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${isLight ? "bg-green-50 text-green-700 border border-green-200" : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"}`}>
               Verified Partner
             </span>
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
            <label className={`mb-2 block text-sm font-medium ${isLight ? "text-stone-600" : "text-emerald-100/80"}`}>Services Offered</label>
            <div className="flex flex-wrap gap-2">
               {user?.services?.length > 0 ? user.services.map(exp => {
                 const label = EXPERTISE_OPTIONS.find(o => o.value === exp)?.label || exp;
                 return (
                   <span key={exp} className={`px-2.5 py-1 rounded-md text-xs font-medium ${isLight ? "bg-stone-100 border border-stone-200 text-stone-700" : "bg-white/5 border border-white/10 text-emerald-100"}`}>
                     {label}
                   </span>
                 )
               }) : (
                 <span className={`text-xs ${isLight ? "text-stone-400" : "text-white/30"}`}>No services set</span>
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
            <label className={`mb-2 block text-sm font-medium ${isLight ? "text-stone-600" : "text-emerald-100/80"}`}>UPI ID</label>
            <div className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm ${isLight ? "bg-slate-50 border-stone-200 text-stone-700" : "bg-white/5 border-white/10 text-emerald-100"}`}>
              <QrCode size={14} className={isLight ? "text-amber-600" : "text-emerald-400"} />
              {user?.upiId || <span className={`${isLight ? "text-stone-400" : "text-white/30"}`}>Not set — add your UPI ID to receive payouts</span>}
            </div>
          </div>
        )}
      </div>

      {isEditing && (
        <div className={`mt-6 pt-6 border-t flex justify-end ${isLight ? "border-stone-200" : "border-white/5"}`}>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <><Loader2 size={16} className="animate-spin mr-2" /> Saving...</> : "Save Details"}
          </Button>
        </div>
      )}
    </GlassCard>
  );
}
