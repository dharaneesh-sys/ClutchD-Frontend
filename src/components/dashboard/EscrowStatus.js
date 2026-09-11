"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { BackendHealth } from "@/lib/backendHealth";
import { SERVICE_STATUS } from "@/lib/constants";
import { Shield, CheckCheck, AlertTriangle, ArrowRight, ThumbsUp } from "lucide-react";

/**
 * Escrow state machine visual component.
 *
 * States: PAYMENT_ESCROW → (release) → PAYMENT_RELEASED → COMPLETED
 *         PAYMENT_ESCROW → (dispute) → PAYMENT_DISPUTE
 *
 * When BackendHealth.isAvailable() === false the component still renders
 * correctly — all state transitions are managed optimistically in the
 * parent store so the UI works fully offline/demo.
 */
export function EscrowStatus({ status, paymentAmount, onRelease, onDispute }) {
  const [disputeReason, setDisputeReason] = useState("Issue with service");
  const isBackendUnavailable = BackendHealth.isAvailable() === false;

  switch (status) {
    case SERVICE_STATUS.PAYMENT_ESCROW:
      return (
        <div className="rounded-xl border p-5 bg-bg-card border-border-subtle">
          <div className="flex items-start gap-4">
            <div className="w-11 h-11 rounded-full flex items-center justify-center shrink-0 bg-amber-500/10 text-amber-400">
              <Shield size={22} />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-bold uppercase tracking-wider text-text-dim">
                Payment Escrow
              </h4>
              <p className="text-sm mt-1 text-text-muted">
                Payment held securely — released to the mechanic once you confirm completion.
              </p>
              <div className="mt-4 flex flex-col gap-2">
                <Button
                  onClick={onRelease}
                  size="md"
                  className="w-full"
                >
                  <ThumbsUp size={16} className="mr-2" />
                  Release Payment
                </Button>
                {onDispute && (
                  <div className="flex flex-col gap-2">
                    <label htmlFor="escrow-dispute-reason" className="text-xs text-text-muted">
                      Reason for dispute
                    </label>
                    <select
                      id="escrow-dispute-reason"
                      value={disputeReason}
                      onChange={(e) => setDisputeReason(e.target.value)}
                      className="w-full rounded-lg bg-white/[0.04] border border-white/10 px-3 py-2 text-sm text-foreground" 
                    >
                      <option value="Issue with service">Issue with service</option>
                      <option value="Service not completed">Service not completed</option>
                      <option value="Overcharged">Overcharged</option>
                      <option value="Provider never arrived">Provider never arrived</option>
                      <option value="Other">Other</option>
                    </select>
                    <button
                      type="button"
                      onClick={() => onDispute(disputeReason)}
                      className="w-full text-sm text-red-400 hover:text-red-300 transition-colors py-2 rounded-lg hover:bg-red-500/5"
                    >
                      <AlertTriangle size={14} className="inline mr-1.5 -mt-0.5" />
                      Raise a Dispute
                    </button>
                  </div>
                )}
              </div>
              {isBackendUnavailable && (
                <p className="text-[10px] mt-3 text-amber-500/70 flex items-center gap-1">
                  <ArrowRight size={10} />
                  Offline mode — state managed locally
                </p>
              )}
            </div>
          </div>
        </div>
      );

    case SERVICE_STATUS.PAYMENT_RELEASED:
      return (
        <div className="rounded-xl border p-5 bg-bg-card border-border-subtle">
          <div className="flex items-start gap-4">
            <div className="w-11 h-11 rounded-full flex items-center justify-center shrink-0 bg-primary/10 text-primary">
              <CheckCheck size={22} />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-bold uppercase tracking-wider text-text-dim">
                Payment Released
              </h4>
              <p className="text-sm mt-1 text-text-muted">
                Payment released to the mechanic. Thank you for your business!
              </p>
              {isBackendUnavailable && (
                <p className="text-[10px] mt-3 text-amber-500/70 flex items-center gap-1">
                  <ArrowRight size={10} />
                  Offline mode — state managed locally
                </p>
              )}
            </div>
          </div>
        </div>
      );

    case SERVICE_STATUS.PAYMENT_DISPUTE:
      return (
        <div className="rounded-xl border p-5 bg-bg-card border-border-subtle">
          <div className="flex items-start gap-4">
            <div className="w-11 h-11 rounded-full flex items-center justify-center shrink-0 bg-red-500/10 text-red-400">
              <AlertTriangle size={22} />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-bold uppercase tracking-wider text-text-dim">
                Dispute Active
              </h4>
              <p className="text-sm mt-1 text-text-muted">
                Dispute raised — your payment is secure while we review the case.
              </p>
              {isBackendUnavailable && (
                <p className="text-[10px] mt-3 text-amber-500/70 flex items-center gap-1">
                  <ArrowRight size={10} />
                  Offline mode — state managed locally
                </p>
              )}
            </div>
          </div>
        </div>
      );

    default:
      return null;
  }
}
