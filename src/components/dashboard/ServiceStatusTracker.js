import { useState, useEffect } from "react";
import { SERVICE_STATUS, GST_RATE } from "@/lib/constants";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import { EscrowStatus } from "@/components/dashboard/EscrowStatus";
import { WarrantyTerms } from "@/components/dashboard/WarrantyTerms";
import { Search, UserCheck, Navigation, Wrench, CreditCard, CheckCircle2, Shield, CheckCheck, Phone, MessageSquare, MapPin, Star, CarFront, ChevronDown } from "lucide-react";
import api from "@/lib/api";
import { cn } from "@/lib/utils";

export function ServiceStatusTracker({ request, onComplete, onCancel, onReleasePayment, onDisputePayment, onVehicleChange }) {
  const [isVehicleSelectorOpen, setIsVehicleSelectorOpen] = useState(false);
  const [vehicles, setVehicles] = useState([]);

  const fetchVehicles = async () => {
    try {
      const res = await api.get("/vehicles");
      setVehicles(res.data);
    } catch(e) {
      // best effort
    }
  };

  useEffect(() => {
    if (request?.status === SERVICE_STATUS.SEARCHING) {
      fetchVehicles();
    }
  }, [request?.status]);

  if (!request) return null;

  const steps = [
    { id: SERVICE_STATUS.SEARCHING, label: "Finding Mechanic", icon: Search },
    { id: SERVICE_STATUS.ASSIGNED, label: "Assigned", icon: UserCheck },
    { id: SERVICE_STATUS.EN_ROUTE, label: "En Route", icon: Navigation },
    { id: SERVICE_STATUS.IN_PROGRESS, label: "Fixing Vehicle", icon: Wrench },
    { id: SERVICE_STATUS.PAYMENT_PENDING, label: "Invoice", icon: CreditCard },
    { id: SERVICE_STATUS.PAYMENT_ESCROW, label: "Payment Held", icon: Shield },
    { id: SERVICE_STATUS.PAYMENT_RELEASED, label: "Released", icon: CheckCheck },
    { id: SERVICE_STATUS.COMPLETED, label: "Completed", icon: CheckCircle2 },
  ];

  const currentStepIdx = steps.findIndex(s => s.id === request.status);

  // Status-specific content
  const renderStatusCard = () => {
    switch (request.status) {
      case SERVICE_STATUS.SEARCHING:
        return (
          <div className="text-center py-6">
            <div className="w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4 relative bg-surface-soft text-icon-highlight">
              <div className="absolute inset-0 rounded-full border-2 animate-ping border-icon-highlight/30"></div>
              <Search size={28} />
            </div>
            <h3 className="text-lg font-bold mb-2 text-text-primary">Locating Providers Nearby</h3>
            <p className="text-sm text-text-muted">We&apos;re pinging the closest available mechanics to your location.</p>
          </div>
        );

      case SERVICE_STATUS.ASSIGNED:
      case SERVICE_STATUS.EN_ROUTE:
      case SERVICE_STATUS.IN_PROGRESS:
        return (
          <div className="rounded-xl p-4 border mb-6 mt-4 bg-bg-card border-border-subtle">
            <div className="flex items-center gap-4 border-b pb-4 mb-4 border-border-subtle">
              <div className="w-12 h-12 rounded-full flex items-center justify-center overflow-hidden border bg-surface-soft border-border-subtle">
                {request.mechanic?.image ? (
                  <img src={request.mechanic.image} alt="Mechanic profile photo" className="w-full h-full object-cover" />
                ) : (
                  <UserCheck className="text-icon-highlight" />
                )}
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-text-primary">{request.mechanic?.name || "Assigning..."}</h4>
                <div className="flex items-center text-xs mt-0.5 text-icon-highlight">
                  <Star size={12} className="fill-current mr-0.5" /> {request.mechanic?.rating || "—"} <span className="ml-2 text-text-muted">• Verified Provider</span>
                </div>
              </div>
              <div className="flex gap-2 text-text-primary">
                <button type="button" className="w-9 h-9 flex items-center justify-center rounded-full transition-colors bg-surface-soft hover:bg-icon-highlight hover:text-white">
                  <Phone size={16} />
                </button>
                <button type="button" className="w-9 h-9 flex items-center justify-center rounded-full transition-colors bg-surface-soft hover:bg-icon-highlight hover:text-white">
                  <MessageSquare size={16} />
                </button>
              </div>
            </div>
            <div className="flex items-start gap-3 text-sm text-text-primary">
              <MapPin size={16} className="shrink-0 mt-0.5 text-icon-highlight" />
              <div>
                <p className="font-medium mb-0.5 text-text-primary">Estimated Arrival</p>
                <p>{request.mechanic?.distance ? `${request.mechanic.distance} away` : "Calculating..."}</p>
              </div>
            </div>
          </div>
        );

      case SERVICE_STATUS.PAYMENT_PENDING:
        const pricing = request.pricing;
        return (
          <div className="mt-4">
            <div className="rounded-xl border p-5 mb-4 bg-bg-card border-border-subtle">
              <h4 className="text-sm font-bold uppercase tracking-wider mb-4 text-text-dim">
                Invoice Breakdown
              </h4>
              {pricing ? (
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between text-text-primary">
                    <span>Service Fee</span>
                    <span className="font-semibold">₹{Number(pricing.serviceAmount ?? 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-text-primary">
                    <span>Convenience Fee</span>
                    <span className="font-semibold">₹{Number(pricing.convenienceFee ?? 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-text-primary">
                    <span>Cancellation Fee</span>
                    <span className="font-semibold">₹{Number(pricing.cancellationFee ?? 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-text-primary">
                    <span>Distance ({Number(pricing.distanceKm ?? 0).toFixed(1)} km)</span>
                    <span className="font-semibold">₹{Number(pricing.distanceFee ?? 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-text-primary">
                    <span>GST ({GST_RATE * 100}%)</span>
                    <span className="font-semibold">₹{Number(pricing.gstAmount ?? 0).toFixed(2)}</span>
                  </div>
                  <div className="border-t pt-3 mt-3 flex justify-between font-bold text-base border-border-subtle text-text-primary">
                    <span>Total</span>
                    <span className="text-icon-highlight">₹{Number(pricing.totalAmount ?? 0).toFixed(2)}</span>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-text-muted">Loading pricing...</p>
              )}
            </div>
            <WarrantyTerms variant="inline" className="mb-4" />
            <Button className="w-full" size="lg" onClick={() => onComplete(request)}>
              Pay ₹{Number(pricing?.totalAmount ?? 0).toFixed(0) || "—"}
            </Button>
          </div>
        );

      case SERVICE_STATUS.PAYMENT_ESCROW:
      case SERVICE_STATUS.PAYMENT_RELEASED:
      case SERVICE_STATUS.PAYMENT_DISPUTE:
        return (
          <div className="mt-4">
            <EscrowStatus
              status={request.status}
              paymentAmount={request.pricing?.totalAmount}
              onRelease={onReleasePayment}
              onDispute={onDisputePayment}
            />
          </div>
        );

      case SERVICE_STATUS.COMPLETED:
        return (
          <div className="mt-4 space-y-4">
            <div className="text-center py-6">
              <div className="w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4 bg-surface-soft text-primary">
                <CheckCircle2 size={28} />
              </div>
              <h3 className="text-lg font-bold mb-1 text-text-primary">Service Completed</h3>
              <p className="text-sm text-text-muted">
                ₹{Number(request.pricing?.totalAmount ?? 0).toFixed(0) || request.payment?.amount || "—"} paid
              </p>
            </div>
            <WarrantyTerms />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <GlassCard variant="strong" className="w-full p-6 flex flex-col flex-shrink-0">
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-1 text-text-primary">Service Status</h2>
        <p className="text-sm text-text-muted">Track your request in real-time</p>
      </div>

      {/* Progress Timeline */}
      <div className="relative mb-6 pb-2">
        <div className="absolute top-5 left-[10%] right-[10%] h-1 rounded-full bg-bg-card">
          <div 
            className="absolute top-0 left-0 h-full rounded-full transition-all duration-500 bg-primary"
            style={{ width: `${(Math.max(0, currentStepIdx) / (steps.length - 1)) * 100}%` }}
          ></div>
        </div>

        <div className="flex justify-between relative z-10 w-full">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            const isCompleted = idx <= currentStepIdx;
            const isCurrent = idx === currentStepIdx && request.status !== SERVICE_STATUS.COMPLETED;
            
            return (
              <div key={step.id} className="flex-1 flex flex-col items-center">
                <div 
                  className={`relative w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                    isCurrent 
                      ? "bg-primary-strong border-primary text-primary-text shadow-[0_0_15px_rgba(16,185,129,0.4)]"
                      : isCompleted
                        ? "bg-primary border-primary text-white"
                        : "bg-bg-card border-border-subtle text-text-dim"
                  }`}
                >
                  <Icon size={18} />
                </div>
                {/* Text label */}
                <span className={`text-[10px] font-medium mt-2 w-full text-center leading-tight ${isCompleted ? 'text-text-primary' : 'text-text-dim'} ${idx > 0 && idx < steps.length - 1 ? 'hidden sm:block' : ''}`}>
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {request.vehicle && (
        <div className="mb-4 p-3 rounded-xl border bg-bg-card border-border-subtle">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-surface-soft">
                <CarFront size={18} className="text-icon-highlight" />
              </div>
              <div>
                <p className="text-sm font-medium text-text-primary">
                  {request.vehicle.year} {request.vehicle.make} {request.vehicle.model}
                </p>
                <p className="text-xs text-text-muted">
                  {request.vehicle.color}
                  {request.vehicle.plate ? ` · ${request.vehicle.plate}` : ""}
                </p>
              </div>
            </div>
            {request.status === SERVICE_STATUS.SEARCHING && onVehicleChange && (
              <button
                type="button"
                onClick={() => setIsVehicleSelectorOpen((o) => !o)}
                className="text-xs font-medium flex items-center gap-1 px-2.5 py-1.5 rounded-lg transition-colors text-icon-highlight hover:bg-surface-soft"
              >
                Change
                <ChevronDown size={14} className={cn("transition-transform", isVehicleSelectorOpen && "rotate-180")} />
              </button>
            )}
          </div>

          {isVehicleSelectorOpen && (
            <div className="mt-3 pt-3 border-t border-border-subtle space-y-1.5">
              {vehicles.length === 0 ? (
                <p className="text-xs text-text-muted py-2 text-center">No vehicles available</p>
              ) : (
                vehicles.map((v) => {
                  const isSelected = request.vehicleId === v.id;
                  return (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => {
                        onVehicleChange(v.id, v);
                        setIsVehicleSelectorOpen(false);
                      }}
                      className={cn(
                        "w-full flex items-center gap-3 p-2.5 rounded-lg border transition-all text-left",
                        isSelected
                          ? "bg-surface-soft border-border-subtle text-text-primary"
                          : "bg-transparent border-transparent text-text-muted hover:bg-surface-soft hover:border-border-subtle hover:text-text-primary"
                      )}
                    >
                      <CarFront size={16} className={isSelected ? "text-icon-highlight" : "opacity-50"} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {v.year} {v.make} {v.model}
                        </p>
                        {v.plate && (
                          <p className="text-xs text-text-muted truncate">{v.plate}</p>
                        )}
                      </div>
                      {isSelected && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                          Active
                        </span>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          )}
        </div>
      )}

      <div className="flex-1 flex flex-col justify-center">
        {renderStatusCard()}
      </div>

      {request.status !== SERVICE_STATUS.COMPLETED &&
       request.status !== SERVICE_STATUS.PAYMENT_ESCROW &&
       request.status !== SERVICE_STATUS.PAYMENT_RELEASED &&
       request.status !== SERVICE_STATUS.PAYMENT_DISPUTE && (
         <div className="mt-4 pt-4 border-t text-center border-border-subtle">
           <button
             type="button"
             onClick={onCancel}
             className="text-sm text-red-400 hover:text-red-300 transition-colors"
           >
              Cancel Request
           </button>
         </div>
      )}
    </GlassCard>
  );
}
