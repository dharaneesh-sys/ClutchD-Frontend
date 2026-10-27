import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { CreditCard, Smartphone, QrCode, Banknote, CheckCircle2, XCircle, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import { GST_RATE } from "@/lib/constants";
import { useToast } from "@/components/ui/ToastProvider";
import { BackendHealth } from "@/lib/backendHealth";
import api from "@/lib/api";

const METHODS = [
  { id: "upi", label: "Google Pay / UPI", desc: "GPay, PhonePe, Paytm, BHIM", icon: Smartphone },
  { id: "qr", label: "Scan QR Code", desc: "Scan with any UPI app", icon: QrCode },
  { id: "card", label: "Card Payment", desc: "Visa, Mastercard, RuPay", icon: CreditCard },
  { id: "cash", label: "Cash", desc: "Pay the mechanic directly", icon: Banknote },
];

function loadRazorpayScript() {
  return new Promise((resolve) => {
    if (typeof window !== "undefined" && window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

// NOTE: offline/simulated payments are intentionally unsupported.
// A payment only succeeds after a backend-confirmed response — never locally.

// Wrapper remounts content on open/close → fresh state, no reset effect needed
export function PaymentModal(props) {
  return <PaymentModalContent key={String(props.isOpen)} {...props} />;
}

function PaymentModalContent({ isOpen, onClose, amount, pricing, jobId, onSuccess }) {
  // Cash is the default method; Razorpay remains available as configured.
  const [method, setMethod] = useState("cash");
  const [payState, setPayState] = useState("idle"); // idle | processing | success | failed
  const [qrData, setQrData] = useState(null);
  const [showBreakdown, setShowBreakdown] = useState(false);
  const qrPollRef = useRef(null);
  const { error: showError, success: showSuccess } = useToast();

  // Only a real backend total is payable. No total → "—" and no pay CTA.
  const rawTotal = pricing?.totalAmount ?? amount;
  const hasTotal = rawTotal !== null && rawTotal !== undefined && Number.isFinite(Number(rawTotal));
  const displayAmount = hasTotal ? Number(rawTotal) : 0;
  const money = (v) => {
    const n = Number(v);
    return v === null || v === undefined || !Number.isFinite(n) ? "—" : `₹${n.toFixed(2)}`;
  };

  // Cleanup QR poll on unmount
  useEffect(() => {
    return () => {
      if (qrPollRef.current) clearInterval(qrPollRef.current);
    };
  }, []);

  useEffect(() => {
    if (payState === "success") {
      showSuccess(`₹${Number(displayAmount).toFixed(2)} paid successfully`);
    }
  }, [payState, displayAmount, showSuccess]);

  const delay = (ms) => new Promise((r) => setTimeout(r, ms));

  const amountPaise = Math.round(displayAmount * 100);

  const handleRazorpayCheckout = async (preferredMethod) => {
    setPayState("processing");

    const backendAvailable = await BackendHealth.check();
    if (!backendAvailable) {
      setPayState("failed");
      showError("Backend unreachable. No payment was taken — try Cash or retry when online.");
      return;
    }

    const loaded = await loadRazorpayScript();
    if (!loaded) {
      setPayState("failed");
      showError("Payment gateway unavailable. No payment was taken — try Cash or QR instead.");
      return;
    }

    try {
      const { data: orderData } = await api.post("/payments/create", {
        job_id: jobId,
        amount: amountPaise,
        currency: "inr",
      });

      const options = {
        key: orderData.key_id,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "ClutchD",
        description: "Vehicle Service Payment",
        order_id: orderData.order_id,
        prefill: {},
        theme: { color: getComputedStyle(document.documentElement).getPropertyValue('--primary').trim() || '#1A73E8' },
        modal: {
          ondismiss: () => setPayState("idle"),
        },
        handler: async (response) => {
          try {
            await api.post("/payments/verify", {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              payment_id: orderData.payment_id,
            });
            setPayState("success");
            setTimeout(() => {
              onSuccess({
                method: preferredMethod,
                amount: displayAmount,
                status: "success",
                transactionId: response.razorpay_payment_id,
              });
            }, 1500);
          } catch {
            setPayState("failed");
            showError("Payment verification failed. Contact support if money was deducted.");
          }
        },
      };

      if (preferredMethod === "upi") {
        options.method = { upi: true, card: false, netbanking: false, wallet: false };
      } else if (preferredMethod === "card") {
        options.method = { card: true, upi: false, netbanking: false, wallet: false };
      }

      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", (resp) => {
        setPayState("failed");
        showError(resp.error?.description || "Payment failed. Please try again.");
      });
      rzp.open();
    } catch (err) {
      setPayState("failed");
      const errorMessage = err.response?.data?.detail
        || (err.code === "ERR_NETWORK" ? "Network error. Please check your connection." : null)
        || "Could not initiate payment. Please try again.";
      showError(errorMessage);
    }
  };

  const handleQRPayment = async () => {
    setPayState("processing");
    try {
      const { data } = await api.post("/payments/qr", {
        job_id: jobId,
        amount: amountPaise,
      });
      setQrData(data);
      setPayState("idle");

      // Poll QR status every 3s
      if (qrPollRef.current) clearInterval(qrPollRef.current);
      qrPollRef.current = setInterval(async () => {
        try {
          const { data: status } = await api.get(`/payments/qr/${data.qr_id}/status`);
          if (status.paid) {
            clearInterval(qrPollRef.current);
            qrPollRef.current = null;
            setPayState("success");
            setTimeout(() => {
              onSuccess({
                method: "qr",
                amount: displayAmount,
                status: "success",
                transactionId: data.qr_id,
              });
            }, 1500);
          }
        } catch {
          // Continue polling
        }
      }, 3000);
    } catch (err) {
      setPayState("failed");
      showError(err.response?.data?.detail || "QR code generation failed.");
    }
  };

  const handleCashPayment = async () => {
    setPayState("processing");
    try {
      await api.post("/payments/cash", {
        job_id: jobId,
        amount: amountPaise,
      });
      setPayState("success");
      setTimeout(() => {
        onSuccess({ method: "cash", amount: displayAmount, status: "success", transactionId: "CASH_" + Date.now() });
      }, 1500);
    } catch (err) {
      setPayState("failed");
      showError(err.response?.data?.detail || "Cash confirmation failed.");
    }
  };

  const handlePay = () => {
    if (!hasTotal) return;
    if (method === "upi" || method === "card") {
      handleRazorpayCheckout(method);
    } else if (method === "qr") {
      handleQRPayment();
    } else if (method === "cash") {
      handleCashPayment();
    }
  };

  if (payState === "success") {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Payment Successful">
        <div className="text-center py-8">
          <div className="w-16 h-16 rounded-full mx-auto flex items-center justify-center mb-4 bg-[color-mix(in_srgb,var(--success)_14%,transparent)]">
            <CheckCircle2 size={32} aria-hidden="true" className="text-[var(--success)]" />
          </div>
          <h3 className="text-lg font-semibold mb-1 text-[var(--foreground)]">Payment complete</h3>
          <p className="text-sm text-[var(--text-muted)]">₹{Number(displayAmount).toFixed(2)} paid successfully</p>
        </div>
      </Modal>
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Complete Payment">
      <div className="text-center mb-4">
        <p className="text-sm mb-1 text-[var(--text-muted)]">Total amount due</p>
        <p data-testid="payment-total" className="text-3xl font-semibold tracking-tight text-[var(--foreground)] tabular-nums">{money(hasTotal ? displayAmount : null)}</p>
        {!hasTotal && (
          <p className="mt-1 text-xs text-[var(--text-muted)]">Waiting for the final bill from your provider.</p>
        )}
      </div>

      {/* Itemized breakdown toggle */}
      {pricing && (
        <div className="mb-4">
          <button
            type="button"
            onClick={() => setShowBreakdown(!showBreakdown)}
            aria-expanded={showBreakdown}
            className="w-full min-h-[44px] flex items-center justify-between p-3 rounded-xl border text-sm transition-colors bg-[var(--surface-card)] border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--surface-soft)]"
          >
            <span className="font-medium">View Breakdown</span>
            {showBreakdown ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
          {showBreakdown && (
            <div className="mt-2 p-4 rounded-xl border space-y-2 text-sm bg-[var(--surface-soft)] border-[var(--border)]">
              <div className="flex justify-between text-text-primary">
                <span>Service Fee</span>
                <span className="font-medium">{money(pricing.serviceAmount)}</span>
              </div>
              <div className="flex justify-between text-text-primary">
                <span>Convenience Fee</span>
                <span className="font-medium">{money(pricing.convenienceFee)}</span>
              </div>
              <div className="flex justify-between text-text-primary">
                <span>Cancellation Fee</span>
                <span className="font-medium">{money(pricing.cancellationFee)}</span>
              </div>
              <div className="flex justify-between text-text-primary">
                <span>Distance{Number.isFinite(Number(pricing.distanceKm)) ? ` (${Number(pricing.distanceKm).toFixed(1)} km)` : ""}</span>
                <span className="font-medium">{money(pricing.distanceFee)}</span>
              </div>
              <div className="flex justify-between text-text-primary">
                <span>GST ({GST_RATE * 100}%)</span>
                <span className="font-medium">{money(pricing.gstAmount)}</span>
              </div>
              <div className="border-t pt-2 mt-2 flex justify-between font-bold border-border-subtle text-text-primary">
                <span>Grand Total</span>
                <span className="text-[var(--primary-dark)]">{money(pricing.totalAmount)}</span>
              </div>
              <p className="text-[11px] mt-2 text-[var(--text-muted)]">
                Platform fee goes to ClutchD • Service fee goes to your provider
              </p>
            </div>
          )}
        </div>
      )}

      

      {/* Method selection */}
      <div role="radiogroup" aria-labelledby="pay-method-label" className="space-y-2 mb-5">
        <p id="pay-method-label" className="text-sm font-medium mb-2 block text-[var(--foreground)]">Payment method</p>
        {METHODS.map(({ id, label, desc, icon: Icon }) => (
          <button
            key={id}
            type="button"
            role="radio"
            aria-checked={method === id}
            onClick={() => { setMethod(id); setQrData(null); setPayState("idle"); }}
            className={`w-full min-h-[56px] flex items-center gap-3 p-3 rounded-xl border text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] ${
              method === id
                ? "bg-[var(--surface-soft)] border-[var(--primary)]"
                : "bg-[var(--surface-card)] border-[var(--border)] hover:bg-[var(--surface-soft)]"
            }`}
          >
            <span className="w-9 h-9 shrink-0 rounded-full flex items-center justify-center bg-[var(--surface-soft)] text-[var(--primary-dark)]">
              <Icon size={18} aria-hidden="true" />
            </span>
            <span className="flex-1">
              <span className="block font-medium text-sm text-[var(--foreground)]">{label}</span>
              <span className="block text-xs text-[var(--text-muted)]">{desc}</span>
            </span>
            <span aria-hidden="true" className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${method === id ? "border-[var(--primary)]" : "border-[var(--border-strong)]"}`}>
              {method === id && <span className="w-2.5 h-2.5 rounded-full bg-[var(--primary)]" />}
            </span>
          </button>
        ))}
      </div>

      {/* QR Code display */}
      {method === "qr" && qrData && (
        <div className="p-4 rounded-xl border text-center mb-6 bg-[var(--surface-card)] border-[var(--border)]">
          {/* QR stays on white in both themes so scanners can read it. */}
          <div className="w-44 h-44 bg-white p-2 rounded-lg mx-auto mb-3 border border-[var(--border)]">
            <Image src={qrData.image_url} alt={`QR code for ₹${Number(displayAmount).toFixed(2)}`} width={176} height={176} className="w-full h-full object-contain" unoptimized />
          </div>
          <p className="text-sm font-medium mb-1 text-[var(--foreground)]">Scan to Pay ₹{Number(displayAmount).toFixed(2)}</p>
          <p className="text-xs text-[var(--text-muted)]">Waiting for payment...</p>
          <div className="flex items-center justify-center gap-2 mt-2">
            <Loader2 size={14} aria-hidden="true" className="animate-spin text-[var(--primary-dark)]" />
            <span className="text-xs text-[var(--primary-dark)]">Checking...</span>
          </div>
        </div>
      )}

      {/* Pay button */}
      {hasTotal && !(method === "qr" && qrData) && (
        <Button className="w-full" size="lg" onClick={handlePay} isLoading={payState === "processing"}>
          {method === "cash" ? `Confirm Cash ₹${Number(displayAmount).toFixed(0)}` : `Pay ₹${Number(displayAmount).toFixed(0)} Securely`}
        </Button>
      )}

      {/* Trust footer */}
      <div className="mt-4 pt-3 border-t text-center border-[var(--border)]">
        <p className="text-[11px] uppercase tracking-wider text-[var(--text-muted)]">
          {method === "cash" ? "Confirmed between you and the mechanic" : "Secured by Razorpay • 256-bit SSL"}
        </p>
      </div>
    </Modal>
  );
}

