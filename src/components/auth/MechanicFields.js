import { useState } from "react";
import { Mail, Lock, User, Phone, MapPin } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { MultiSelect } from "@/components/ui/MultiSelect";
import { FileUpload } from "@/components/ui/FileUpload";
import { EXPERTISE_OPTIONS } from "@/lib/constants";

export function MechanicFields({ register, errors, setValue, watch }) {
  const watchExpertise = watch("expertise") || [];
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsCoords, setGpsCoords] = useState(null);

  const handleExpertiseChange = (val) => {
    setValue("expertise", val, { shouldValidate: true });
  };

  const handleFileChange = (file) => {
    setValue("profileImage", file);
  };

  const handleAadhaarChange = (file) => {
    setValue("aadhaarPhoto", file);
  };

  const handleLicenseChange = (file) => {
    setValue("licensePhoto", file);
  };

  const handleGetLocation = () => {
    if (typeof window === "undefined" || !navigator.geolocation) return;
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setValue("latitude", latitude);
        setValue("longitude", longitude);
        setGpsCoords({ latitude, longitude });
        setGpsLoading(false);
      },
      () => setGpsLoading(false),
      { timeout: 10000, enableHighAccuracy: true },
    );
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Full Name"
          icon={User}
          placeholder="e.g. Vijay Kumar"
          {...register("fullName")}
          error={errors.fullName?.message}
        />
        <Input
          label="Phone Number"
          icon={Phone}
          placeholder="10-digit number"
          {...register("phone")}
          error={errors.phone?.message}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Email Address"
          type="email"
          icon={Mail}
          placeholder="name@example.com"
          {...register("email")}
          error={errors.email?.message}
        />
        <Select
          label="Experience"
          placeholder="Select years..."
          options={[
            { value: "0-2", label: "0-2 years" },
            { value: "3-5", label: "3-5 years" },
            { value: "5-10", label: "5-10 years" },
            { value: "10+", label: "10+ years" },
          ]}
          {...register("experience")}
          error={errors.experience?.message}
        />
      </div>

      <MultiSelect
        label="Expertise / Skills"
        options={EXPERTISE_OPTIONS}
        value={watchExpertise}
        onChange={handleExpertiseChange}
        error={errors.expertise?.message}
        placeholder="Select areas of expertise..."
      />

      {/* Location */}
      <div className="flex gap-2 items-start">
        <div className="flex-1 min-w-0">
          <Input
            label="Location"
            icon={MapPin}
            placeholder="e.g. RS Puram or use GPS"
            {...register("location")}
            error={errors.location?.message}
          />
        </div>
        <button
          type="button"
          onClick={handleGetLocation}
          disabled={gpsLoading}
          className="mt-6 inline-flex items-center gap-1.5 rounded-2xl border border-border-subtle bg-surface px-3 py-3 text-sm font-medium text-primary transition-colors hover:bg-primary/5 disabled:opacity-50 shrink-0"
        >
          <MapPin size={16} />
          {gpsLoading ? "Detecting..." : "Use GPS"}
        </button>
      </div>
      {gpsCoords && (
        <p className="text-xs text-text-muted mt-1">
          GPS: {gpsCoords.latitude.toFixed(4)}, {gpsCoords.longitude.toFixed(4)}
        </p>
      )}
      <input type="hidden" {...register("latitude")} />
      <input type="hidden" {...register("longitude")} />
      {errors.latitude && (
        <p className="text-xs text-red-500 mt-1">{errors.latitude.message}</p>
      )}

      {/* Passwords */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Password"
          type="password"
          icon={Lock}
          placeholder="Min 6 characters"
          {...register("password")}
          error={errors.password?.message}
        />
        <Input
          label="Confirm Password"
          type="password"
          icon={Lock}
          placeholder="Repeat password"
          {...register("confirmPassword")}
          error={errors.confirmPassword?.message}
        />
      </div>

      {/* Profile Image */}
      <FileUpload
        label="Profile / ID Proof"
        onChange={handleFileChange}
        value={watch("profileImage")}
        error={errors.profileImage?.message}
      />

      {/* KYC Documents */}
      <div className="space-y-1 pt-2">
        <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider">
          KYC Documents (optional, speeds up verification)
        </h3>
        <div className="h-px bg-border-subtle" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FileUpload
          label="Aadhaar Card Photo"
          onChange={handleAadhaarChange}
          value={watch("aadhaarPhoto")}
          error={errors.aadhaarPhoto?.message}
        />
        <FileUpload
          label="Driving License Photo"
          onChange={handleLicenseChange}
          value={watch("licensePhoto")}
          error={errors.licensePhoto?.message}
        />
      </div>
    </div>
  );
}
