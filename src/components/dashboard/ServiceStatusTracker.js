import { SERVICE_STATUS, GST_RATE } from "@/lib/constants";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import { Search, UserCheck, Navigation, Wrench, CreditCard, CheckCircle2, Phone, MessageSquare, MapPin, Star } from "lucide-react";

export function ServiceStatusTracker({ request, onComplete, onCancel }) {

  if (!request) return null;

  const steps = [
    { id: SERVICE_STATUS.SEARCHING, label: "Finding Mechanic", icon: Search },
    { id: SERVICE_STATUS.ASSIGNED, label: "Assigned", icon: UserCheck },
    { id: SERVICE_STATUS.EN_ROUTE, label: "En Route", icon: Navigation },
    { id: SERVICE_STATUS.IN_PROGRESS, label: "Fixing Vehicle", icon: Wrench },
    { id: SERVICE_STATUS.PAYMENT_PENDING, label: "Invoice", icon: CreditCard },
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
                    <span className="font-semibold">₹{pricing.serviceAmount?.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-text-primary">
                    <span>Convenience Fee</span>
                    <span className="font-semibold">₹{pricing.convenienceFee?.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-text-primary">
                    <span>Cancellation Fee</span>
                    <span className="font-semibold">₹{pricing.cancellationFee?.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-text-primary">
                    <span>Distance ({pricing.distanceKm?.toFixed(1)} km)</span>
                    <span className="font-semibold">₹{pricing.distanceFee?.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-text-primary">
                    <span>GST ({GST_RATE * 100}%)</span>
                    <span className="font-semibold">₹{pricing.gstAmount?.toFixed(2)}</span>
                  </div>
                  <div className="border-t pt-3 mt-3 flex justify-between font-bold text-base border-border-subtle text-text-primary">
                    <span>Total</span>
                    <span className="text-icon-highlight">₹{pricing.totalAmount?.toFixed(2)}</span>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-text-muted">Loading pricing...</p>
              )}
            </div>
            <Button className="w-full" size="lg" onClick={() => onComplete(request)}>
              Pay ₹{pricing?.totalAmount?.toFixed(0) || "—"} & Review
            </Button>
          </div>
        );

      case SERVICE_STATUS.COMPLETED:
        return (
          <div className="text-center py-6 mt-4">
            <div className="inline-flex flex-col gap-4">
               <div>
                 <p className="text-sm mb-1 text-text-muted">Estimated Amount</p>
                 <p className="text-3xl font-bold tracking-tight text-text-primary">
                   ₹{request.priceEstimate?.min || "—"} – ₹{request.priceEstimate?.max || "—"}
                 </p>
                 <p className="text-xs mt-1 text-text-dim">Final amount confirmed after review</p>
               </div>
               <Button onClick={() => onComplete(request)}>Pay & Review</Button>
            </div>
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

      <div className="flex-1 flex flex-col justify-center">
        {renderStatusCard()}
      </div>

      {request.status !== SERVICE_STATUS.COMPLETED && (
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
