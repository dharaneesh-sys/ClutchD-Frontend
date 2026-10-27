"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { serviceRequestSchema } from "@/lib/validators";
import { ISSUE_TAGS, MAP_DEFAULT_CENTER } from "@/lib/constants";
import { estimatePrice } from "@/lib/utils";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import { FileUpload } from "@/components/ui/FileUpload";
import { Check, Navigation, CheckCircle2, CarFront, PlusCircle, MapPin, Loader2, LocateFixed, Zap, Wrench, Building2, X } from "lucide-react";
import { useTrackingStore } from "@/store/trackingStore";
import { useToastStore } from "@/store/toastStore";
import { cn } from "@/lib/utils";
import { formatIndianPlate } from "@/lib/plateFormatter";
import api from "@/lib/api";
import { VehicleManagerModal } from "@/components/dashboard/VehicleManagerModal";
import { SubscriptionBadge } from "@/components/subscription/SubscriptionBadge";

function LocationIndicator() {
  const userLocation = useTrackingStore((s) => s.userLocation);
  const gpsStatus = useTrackingStore((s) => s.gpsStatus);
  const requestGPSLocation = useTrackingStore((s) => s.requestGPSLocation);
  const [manualInput, setManualInput] = useState("");
  const [searching, setSearching] = useState(false);
  const [showManual, setShowManual] = useState(false);
  const [searchError, setSearchError] = useState(null);

  const handleManualSearch = async () => {
    if (!manualInput.trim()) return;
    setSearching(true);
    setSearchError(null);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(manualInput)}&limit=1`);
      const data = await res.json();
      if (data.length > 0) {
        const coords = [parseFloat(data[0].lat), parseFloat(data[0].lon)];
        useTrackingStore.getState().setUserLocation(coords);
        setShowManual(false);
      } else {
        setSearchError("Location not found. Try a more specific address.");
      }
    } catch {
      setSearchError("Failed to search location. Check your internet connection.");
    } finally {
      setSearching(false);
    }
  };

  return (
    <div className="p-3 rounded-xl border bg-[var(--surface-soft)] border-[var(--border)]">
      <div className="flex items-center justify-between mb-1">
        <p className="text-sm font-medium flex items-center gap-1.5 text-[var(--foreground)]">
          <MapPin size={14} aria-hidden="true" className="text-[var(--primary-dark)]" />
          Your Location
        </p>
        <div className="flex items-center gap-2">
          {gpsStatus === "granted" && (
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[color-mix(in_srgb,var(--success)_14%,transparent)] text-[var(--success)]">
              GPS Active
            </span>
          )}
          {(gpsStatus === "denied" || gpsStatus === "unavailable") && (
            <button
              type="button"
              onClick={requestGPSLocation}
              className="min-h-[44px] text-xs font-semibold px-3 rounded-full text-[var(--primary-dark)] hover:bg-[var(--surface-card)]"
            >
              <LocateFixed size={10} className="inline mr-1" />
              Retry GPS
            </button>
          )}
        </div>
      </div>

      {gpsStatus === "requesting" && (
        <div className="flex items-center gap-2 mt-1">
          <Loader2 size={12} aria-hidden="true" className="animate-spin text-[var(--primary-dark)]" />
          <span className="text-xs text-[var(--text-muted)]">Detecting your location...</span>
        </div>
      )}

      {gpsStatus === "granted" && userLocation && (
        <p className="text-xs mt-1 text-[var(--text-muted)]">
          <MapPin size={10} className="inline-block mr-0.5 -mt-0.5" />
          {Number(userLocation[0] ?? 0).toFixed(4)}, {Number(userLocation[1] ?? 0).toFixed(4)}
        </p>
      )}

      {(gpsStatus === "denied" || gpsStatus === "unavailable") && (
        <div className="mt-2">
          <p role="alert" className="text-xs mb-2 text-[var(--danger-ink)]">
            {gpsStatus === "denied" ? "Location access was denied." : "GPS not available on this device."}
          </p>
          {!showManual ? (
            <button
              type="button"
              onClick={() => setShowManual(true)}
              className="min-h-[44px] text-sm font-medium underline text-[var(--primary-dark)]"
            >
              Enter location manually
            </button>
          ) : (
            <div className="flex gap-2">
              <input
                type="text"
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value)}
                placeholder="Enter your address or city..."
                aria-label="Address or city"
                className="flex-1 min-h-[44px] rounded-xl border px-3 text-sm transition-colors bg-[var(--surface-card)] border-[var(--border)] text-[var(--foreground)] focus:border-[var(--primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleManualSearch())}
              />
              <button
                type="button"
                onClick={handleManualSearch}
                disabled={searching}
                className="min-h-[44px] px-4 rounded-xl text-sm font-semibold text-[var(--on-primary)] bg-[var(--primary)] hover:bg-[var(--primary-dark)] disabled:opacity-50"
              >
                {searching ? <Loader2 size={12} className="animate-spin" /> : "Find"}
              </button>
            </div>
          )}
        </div>
      )}

      {gpsStatus === "idle" && (
        <div className="mt-1">
          <button
            type="button"
            onClick={requestGPSLocation}
            className="min-h-[44px] text-sm font-medium flex items-center gap-1.5 text-[var(--primary-dark)]"
          >
            <LocateFixed size={14} aria-hidden="true" />
            Detect my location
          </button>
        </div>
      )}

      {searchError && (
        <p role="alert" className="mt-2 text-xs text-[var(--danger-ink)]">
          {searchError}
        </p>
      )}
    </div>
  );
}

export function ServiceRequestPanel({ onSubmit, isLoading, error, onDismissError }) {
  // Indicative range from the selected issue only; nothing is shown before one is chosen.
  const [estimatedPrice, setEstimatedPrice] = useState(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [vehicles, setVehicles] = useState([]);
  const [isVehicleModalOpen, setIsVehicleModalOpen] = useState(false);
  const toast = useToastStore();
  const userLocation = useTrackingStore((s) => s.userLocation);

  // A real pickup location is required before dispatch: either GPS-granted
  // or manually searched. MAP_DEFAULT_CENTER means the user hasn't set one.
  const isLocationReady = Boolean(
    userLocation &&
    (userLocation[0] !== MAP_DEFAULT_CENTER[0] ||
      userLocation[1] !== MAP_DEFAULT_CENTER[1])
  );
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(serviceRequestSchema),
    defaultValues: {
      requestType: "auto",
    }
  });

  const issueTag = watch("issueTag");
  const requestType = watch("requestType");
  const selectedVehicleId = watch("vehicleId");

  const fetchVehicles = async () => {
    try {
      const res = await api.get("/vehicles");
      setVehicles(res.data);
      if (res.data.length > 0 && !selectedVehicleId) {
        setValue("vehicleId", res.data[0].id, { shouldValidate: true });
      }
    } catch(e) {
      // best effort
    }
  };

  useEffect(() => {
    fetchVehicles();
  }, []);

  // Sync requestType radio to trackingStore providerFilter so ProviderList
  // shows only the matching provider type (auto → all, mechanic, garage).
  const setProviderFilter = useTrackingStore((s) => s.setProviderFilter);
  useEffect(() => {
    const filterMap = { auto: "all", mechanic: "mechanic", garage: "garage" };
    setProviderFilter(filterMap[requestType] || "all");
  }, [requestType, setProviderFilter]);

  const handleIssueChange = (value) => {
    setValue("issueTag", value, { shouldValidate: true });
    setEstimatedPrice(value ? estimatePrice(value) : null);
  };

  const submitHandler = async (data) => {
    if (!isLocationReady) {
      toast.warning(
        'Set your pickup location first — use "Locate Me" or search your address.'
      );
      return;
    }
    await onSubmit({
      ...data,
      priceEstimate: estimatedPrice,
    });
    setIsSuccess(true);
  };

  if (isSuccess) {
    return (
      <GlassCard className="w-full h-full p-6 flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4 bg-[var(--surface-soft)]">
          <CheckCircle2 size={32} aria-hidden="true" className="text-[var(--primary-dark)]" />
        </div>
        <h3 className="text-xl font-semibold mb-2 text-[var(--foreground)]">Request sent</h3>
        <p className="mb-2 max-w-xs text-[var(--text-muted)]">
          We&apos;re locating the nearest professionals for your issue. Please wait a moment.
        </p>
      </GlassCard>
    );
  }

  return (
    <GlassCard className="w-full p-4 sm:p-6 flex flex-col relative flex-shrink-0">
      {error && (
        <div role="alert" className="mb-4 p-3 rounded-xl border border-[color-mix(in_srgb,var(--danger)_30%,transparent)] bg-[color-mix(in_srgb,var(--danger)_8%,transparent)] flex items-start gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-[var(--danger-ink)] mb-0.5">Request failed</p>
            <p className="text-xs text-[var(--danger-ink)]">{error}</p>
          </div>
          {onDismissError && (
            <button
              type="button"
              onClick={onDismissError}
              className="-m-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-[var(--danger-ink)] hover:bg-[var(--surface-soft)]"
              aria-label="Dismiss error"
            >
              <X size={16} />
            </button>
          )}
        </div>
      )}
      <div className="mb-5">
        <div className="flex items-center gap-2 mb-1">
          <h2 className="text-lg font-semibold text-[var(--foreground)]">What do you need?</h2>
          <SubscriptionBadge variant="pill" />
        </div>
        <p className="text-sm text-[var(--text-muted)]">Tell us what&apos;s wrong with your vehicle</p>
      </div>

      <form onSubmit={handleSubmit(submitHandler)} className="space-y-5 flex-col">
        <div className="space-y-4">

          {/* GPS Location */}
          <LocationIndicator />
          
          {/* Vehicle Selection */}
          <div className="w-full">
             <div className="flex justify-between items-center mb-2">
                <p id="vehicle-label" className="text-sm font-medium text-[var(--foreground)]">
                  Select Vehicle
                </p>
               <button 
                 type="button" 
                 onClick={() => setIsVehicleModalOpen(true)}
                 className="min-h-[44px] px-1 text-sm font-medium flex items-center gap-1 hover:underline text-[var(--primary-dark)]"
               >
                 <PlusCircle size={14} aria-hidden="true" /> Manage
               </button>
             </div>
             
             {vehicles.length === 0 ? (
               <div className="p-3 rounded-xl border flex items-center justify-between gap-3 bg-[var(--surface-soft)] border-[var(--border)]">
                  <span className="text-sm font-medium text-[var(--foreground)]">No vehicles added</span>
                 <Button type="button" size="sm" onClick={() => setIsVehicleModalOpen(true)}>Add Vehicle</Button>
               </div>
             ) : (
               <div role="radiogroup" aria-labelledby="vehicle-label" className="grid grid-cols-1 gap-2">
                 {vehicles.map(v => (
                   <label 
                     key={v.id}
                     className={cn(
                       "flex min-h-[48px] items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-[var(--ring)]",
                        selectedVehicleId === v.id 
                          ? "bg-[var(--surface-soft)] border-[var(--primary)] text-[var(--foreground)]"
                          : "bg-[var(--surface-card)] border-[var(--border)] text-[var(--text-muted)] hover:bg-[var(--surface-soft)]"
                     )}
                   >
                     <input type="radio" value={v.id} {...register("vehicleId")} className="sr-only" />
                      <CarFront size={18} aria-hidden="true" className={selectedVehicleId === v.id ? "text-[var(--primary-dark)]" : "text-[var(--text-muted)]"} />
                     <span className="font-medium text-sm">{v.year} {v.make} {v.model}</span>
                      {v.license_plate && <span className="text-xs font-mono text-[var(--text-muted)] ml-auto">{formatIndianPlate(v.license_plate)}</span>}
                   </label>
                 ))}
               </div>
             )}
          </div>

          <fieldset>
            <legend className="mb-2 text-sm font-medium text-[var(--foreground)]">What seems to be the issue?</legend>
            <input type="hidden" {...register("issueTag")} />
            <div className="grid grid-cols-2 min-[390px]:grid-cols-3 gap-2">
              {ISSUE_TAGS.map((tag) => {
                const selected = issueTag === tag.value;
                return (
                  <label
                    key={tag.value}
                    className={cn(
                      "relative flex min-h-[44px] cursor-pointer items-center justify-center rounded-xl border px-2 py-2 text-center text-xs font-medium leading-tight transition-colors",
                      "has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-[var(--ring)]",
                      selected
                        ? "border-[var(--primary)] bg-[var(--surface-soft)] text-[var(--primary-dark)]"
                        : "border-[var(--border)] bg-[var(--surface-card)] text-[var(--foreground)] hover:bg-[var(--surface-soft)]"
                    )}
                  >
                    <input
                      type="radio"
                      name="issueTagChoice"
                      value={tag.value}
                      checked={selected}
                      onChange={() => handleIssueChange(tag.value)}
                      className="sr-only"
                    />
                    {selected && (
                      <Check size={12} aria-hidden="true" className="absolute right-1.5 top-1.5" />
                    )}
                    {tag.label}
                  </label>
                );
              })}
            </div>
            {errors.issueTag?.message && (
              <p role="alert" className="mt-1.5 text-xs font-medium text-[var(--danger)]">{errors.issueTag.message}</p>
            )}
          </fieldset>
          
          <div className="w-full">
            <label htmlFor="service-description" className="mb-1.5 block text-sm font-medium text-[var(--foreground)]">
              Describe the problem
            </label>
            <textarea
              id="service-description"
              aria-invalid={!!errors.description}
              className="w-full rounded-xl border px-4 py-3 text-sm transition-colors min-h-[100px] resize-none bg-[var(--surface-card)] border-[var(--border)] text-[var(--foreground)] placeholder:text-[var(--text-muted)] focus:border-[var(--primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
              placeholder="E.g. My car started making a knocking sound and then stalled..."
              {...register("description")}
            />
            {errors.description && (
              <p role="alert" className="mt-1.5 text-xs font-medium text-[var(--danger)]">{errors.description.message}</p>
            )}
          </div>

          <FileUpload
            label="Add photos or video"
            accept="image/*,video/*"
            onChange={(file) => setValue("media", file)}
          />

          <div className="w-full">
            <p id="provider-pref-label" className="mb-2 block text-sm font-medium text-[var(--foreground)]">
              Provider Preference
            </p>
            <div role="radiogroup" aria-labelledby="provider-pref-label" className="flex rounded-xl border border-[var(--border)] overflow-hidden bg-[var(--surface-card)]">
              {[
                { key: "auto", label: "Fastest", icon: Zap },
                { key: "mechanic", label: "Mechanic", icon: Wrench },
                { key: "garage", label: "Garage", icon: Building2 },
              ].map(({ key, label, icon: Icon }) => (
                <label
                  key={key}
                  className={cn(
                    "flex-1 flex min-h-[56px] flex-col items-center justify-center gap-1 py-2 cursor-pointer transition-colors",
                    "text-xs font-semibold has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-inset has-[:focus-visible]:ring-[var(--ring)]",
                    requestType === key
                      ? "bg-[var(--surface-soft)] text-[var(--primary-dark)]"
                      : "text-[var(--text-muted)] hover:bg-[var(--surface-soft)] hover:text-[var(--foreground)]"
                  )}
                >
                  <input
                    type="radio"
                    value={key}
                    className="sr-only"
                    {...register("requestType")}
                  />
                  <Icon size={16} aria-hidden="true" />
                  <span>{label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6 pt-5 border-t flex flex-col sm:flex-row gap-4 sm:items-center justify-between border-[var(--border)]">
          <div>
            <p className="text-xs mb-0.5 text-[var(--text-muted)]">Indicative range (final bill from your provider)</p>
            <p className="text-lg font-semibold tracking-tight text-[var(--foreground)]">
              {estimatedPrice ? `₹${estimatedPrice.min} – ₹${estimatedPrice.max}` : "—"}
            </p>
          </div>
          
          <Button 
            type="submit" 
            size="lg" 
            isLoading={isLoading} 
            className="w-full sm:w-auto"
            disabled={vehicles.length > 0 && !selectedVehicleId}
          >
            <Navigation size={18} aria-hidden="true" />
            Request Service
          </Button>
        </div>
      </form>
      
      <VehicleManagerModal 
        isOpen={isVehicleModalOpen} 
        onClose={() => setIsVehicleModalOpen(false)} 
        onVehiclesChanged={fetchVehicles}
      />
    </GlassCard>
  );
}
