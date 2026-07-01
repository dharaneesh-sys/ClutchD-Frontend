"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { User, Camera, Loader2 } from "lucide-react";
import { cn, getInitials } from "@/lib/utils";
import { useAuthStore } from "@/store/authStore";
import { useToastStore } from "@/store/toastStore";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import api from "@/lib/api";

const DEMO_PROFILE = {
  name: "Rahul Sharma",
  email: "rahul.sharma@example.com",
  phone: "+91 98765 43210",
  address: "42, MG Road, Indiranagar, Bangalore - 560038",
  photo: null,
};

function validateForm({ name, phone, address }) {
  const errors = {};
  if (!name || name.trim().length < 2) {
    errors.name = "Name must be at least 2 characters";
  }
  const digits = phone ? phone.replace(/\D/g, "") : "";
  if (!phone || digits.length < 10) {
    errors.phone = "Phone must have at least 10 digits";
  }
  if (!address || address.trim().length < 5) {
    errors.address = "Address must be at least 5 characters";
  }
  return errors;
}

export default function EditProfilePage() {
  const { user, updateUserData } = useAuthStore();
  const toast = useToastStore();
  const router = useRouter();
  const fileInputRef = useRef(null);

  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
  });
  const [photoPreview, setPhotoPreview] = useState(null);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadProfile() {
      try {
        const res = await api.get("/profile/me");
        const p = res.data;
        setForm({
          name: p.name || "",
          phone: p.phone || "",
          email: p.email || user?.email || "",
          address: p.address || "",
        });
        if (p.photo) setPhotoPreview(p.photo);
      } catch {
        // Demo fallback
        setForm({
          name: user?.name || DEMO_PROFILE.name,
          phone: user?.phone || DEMO_PROFILE.phone,
          email: user?.email || DEMO_PROFILE.email,
          address: user?.address || DEMO_PROFILE.address,
        });
      } finally {
        setIsLoading(false);
      }
    }
    loadProfile();
  }, [user]);

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setPhotoPreview(ev.target.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validation = validateForm(form);
    if (Object.keys(validation).length > 0) {
      setErrors(validation);
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        name: form.name.trim(),
        phone: form.phone.trim(),
        address: form.address.trim(),
        ...(photoPreview && photoPreview.startsWith("data:") ? { photo: photoPreview } : {}),
      };
      const res = await api.put("/profile/me", payload);
      updateUserData(res.data.user || payload);
      toast.success("Profile updated successfully");
      router.push("/marketplace/profile");
    } catch (err) {
      // Demo fallback — update locally even if API fails
      updateUserData({
        name: form.name.trim(),
        phone: form.phone.trim(),
        address: form.address.trim(),
      });
      toast.success("Profile updated (offline mode)");
      router.push("/marketplace/profile");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-5 space-y-5 animate-fade-in-up max-w-2xl">
      <div className="space-y-1">
        <h1 className="text-lg font-semibold text-foreground">Edit Profile</h1>
        <p className="text-sm text-text-muted">Update your personal information</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Profile Photo */}
        <div className="glass-lux rounded-2xl p-5 flex flex-col items-center gap-3">
          <div className="relative">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 ring-2 ring-white/10 flex items-center justify-center overflow-hidden">
              {photoPreview ? (
                <img src={photoPreview} alt="Profile" className="w-full h-full object-cover" />
              ) : form.name ? (
                <span className="text-2xl font-bold text-primary-light">
                  {getInitials(form.name)}
                </span>
              ) : (
                <User size={32} className="text-primary-light" />
              )}
            </div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center shadow-lg hover:bg-primary-dark transition-colors"
              aria-label="Change profile photo"
            >
              <Camera size={14} />
            </button>
          </div>
          <p className="text-xs text-text-muted">Tap the camera icon to change photo</p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handlePhotoChange}
            className="hidden"
          />
        </div>

        {/* Form Fields */}
        <div className="glass-lux rounded-2xl p-5 space-y-4">
          <Input
            label="Full Name"
            value={form.name}
            onChange={handleChange("name")}
            error={errors.name}
            placeholder="Enter your full name"
          />

          <Input
            label="Phone Number"
            type="tel"
            value={form.phone}
            onChange={handleChange("phone")}
            error={errors.phone}
            placeholder="Enter your phone number"
          />

          <Input
            label="Email"
            type="email"
            value={form.email}
            disabled
            onChange={() => {}}
          />

          <div className="w-full">
            <label className="mb-2 block text-sm font-medium text-text-muted">
              Address
            </label>
            <textarea
              value={form.address}
              onChange={handleChange("address")}
              placeholder="Enter your address"
              rows={3}
              className={cn(
                "w-full rounded-2xl border px-4 py-3 text-sm transition-all",
                "border-white/[0.08] bg-surface text-foreground placeholder:text-text-dim",
                "shadow-[inset_0_1px_0_rgba(var(--color-white-rgb),0.04)]",
                "focus:border-primary focus:bg-surface focus:outline-none",
                "focus:ring-1 focus:ring-primary/30",
                errors.address && "border-red-500/50 focus:border-red-500 focus:ring-red-500/20"
              )}
            />
            {errors.address && (
              <p className="mt-1.5 text-xs text-red-400">{errors.address}</p>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="secondary"
            onClick={() => router.back()}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            isLoading={isSubmitting}
            className="flex-1"
          >
            {isSubmitting ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </form>
    </div>
  );
}
