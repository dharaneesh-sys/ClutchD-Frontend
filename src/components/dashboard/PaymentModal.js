import { useState, useEffect, useRef } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { CreditCard, Smartphone, QrCode, Banknote, CheckCircle2, XCircle, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import { useThemeStore } from "@/store/themeStore";
import { GST_RATE } from "@/lib/constants";
import { useToast } from "@/components/ui/ToastProvider";
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

export function PaymentModal({ isOpen, onClose, amount, pricing, jobId, onSuccess }) {
  const [method, setMethod] = useState("upi");
  const [payState, setPayState] = useState("idle"); // idle | processing | success | failed
  const [qrData, setQrData] = useState(null);
  const [showBreakdown, setShowBreakdown] = useState(false);
  const qrPollRef = useRef(null);
  const { theme } = useThemeStore();
  const { error: showError, success: showSuccess } = useToast();
  const isLight = theme === "light";

  // Use the finalized total if available, else fall back to passed amount
  const displayAmount = pricing?.totalAmount ?? amount ?? 0;

  // Cleanup QR poll on unmount
  useEffect(() => {
    return () => {
      if (qrPollRef.current) clearInterval(qrPollRef.current);
    };
  }, []);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setPayState("idle");
      setErrorMsg("");
      setQrData(null);
      setShowBreakdown(false);
      if (qrPollRef.current) clearInterval(qrPollRef.current);
    }
  }, [isOpen]);

  // Demo mode: auto-process payment after showing the modal briefly
  useEffect(() => {
    if (!isOpen || payState !== "idle") return;
    const isDemo = typeof window !== "undefined" && window.__DEMO_MODE__;
    if (!isDemo) return;

    const showTimer = setTimeout(() => {
      setPayState("processing");
      const completeTimer = setTimeout(() => {
        setPayState("success");
        const callbackTimer = setTimeout(() => {
          onSuccess({
            method,
            amount: displayAmount,
            status: "success",
            transactionId: "TXN_DEMO_" + Date.now(),
          });
        }, 1500);
        return () => clearTimeout(callbackTimer);
      }, 800);
      return () => clearTimeout(completeTimer);
    }, 2000);
    return () => clearTimeout(showTimer);
  }, [isOpen, payState, method, displayAmount, onSuccess]);

  const amountPaise = Math.round(displayAmount * 100);

  const handleRazorpayCheckout = async (preferredMethod) => {
    setPayState("processing");
    setErrorMsg("");

    try {
      // 1. Create order on backend
      const { data: orderData } = await api.post("/payments/create", {
        job_id: jobId,
        amount: amountPaise,
        currency: "inr",
      });

      // 2. Load Razorpay SDK
      const loaded = await loadRazorpayScript();
      if (!loaded) {
        setPayState("failed");
        setErrorMsg("Failed to load payment gateway. Please try again.");
        return;
      }

      // 3. Open Razorpay checkout
      const options = {
        key: orderData.key_id,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "ClutchD",
        description: "Vehicle Service Payment",
        order_id: orderData.order_id,
        prefill: {},
        theme: { color: isLight ? "#eab308" : "#10b981" },
        modal: { ondismiss: () => setPayState("idle") },
        handler: async (response) => {
          // 4. Verify on backend
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

      // Set preferred method
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
      showError(err.response?.data?.detail || "Could not initiate payment. Please try again.");
    }
  };

  const handleQRPayment = async () => {
    setPayState("processing");
    setErrorMsg("");
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
    if (method === "upi" || method === "card") {
      handleRazorpayCheckout(method);
    } else if (method === "qr") {
      handleQRPayment();
    } else if (method === "cash") {
      handleCashPayment();
    }
  };

  // Success state
  if (payState === "success") {
    useEffect(() => {
      showSuccess(`₹${displayAmount.toFixed(2)} paid successfully`);
    }, []);
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Payment Successful">
        <div className="text-center py-8">
          <div className="w-20 h-20 rounded-full mx-auto flex items-center justify-center mb-4 bg-surface-soft">
            <CheckCircle2 size={40} className="text-icon-highlight" />
          </div>
          <h3 className="text-xl font-bold mb-2 text-text-primary">Payment Complete!</h3>
          <p className="text-sm text-text-muted">₹{displayAmount.toFixed(2)} paid successfully</p>
        </div>
      </Modal>
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Complete Payment">
      <div className="text-center mb-4">
        <p className="text-sm mb-1 text-text-muted">Total Amount Due</p>
        <p className="text-4xl font-bold tracking-tight text-text-primary">₹{displayAmount.toFixed(2)}</p>
      </div>

      {/* Itemized breakdown toggle */}
      {pricing && (
        <div className="mb-4">
          <button
            type="button"
            onClick={() => setShowBreakdown(!showBreakdown)}
            className="w-full flex items-center justify-between p-3 rounded-xl border text-sm transition-all bg-bg-card border-border-subtle text-text-primary hover:bg-surface-soft"
          >
            <span className="font-medium">View Breakdown</span>
            {showBreakdown ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
          {showBreakdown && (
            <div className="mt-2 p-4 rounded-xl border space-y-2 text-sm animate-in slide-in-from-top-1 bg-bg-card border-border-subtle">
              <div className="flex justify-between text-text-primary">
                <span>Service Fee</span>
                <span className="font-medium">₹{pricing.serviceAmount?.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-text-primary">
                <span>Convenience Fee</span>
                <span className="font-medium">₹{pricing.convenienceFee?.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-text-primary">
                <span>Cancellation Fee</span>
                <span className="font-medium">₹{pricing.cancellationFee?.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-text-primary">
                <span>Distance ({pricing.distanceKm?.toFixed(1)} km)</span>
                <span className="font-medium">₹{pricing.distanceFee?.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-text-primary">
                <span>GST ({GST_RATE * 100}%)</span>
                <span className="font-medium">₹{pricing.gstAmount?.toFixed(2)}</span>
              </div>
              <div className="border-t pt-2 mt-2 flex justify-between font-bold border-border-subtle text-text-primary">
                <span>Grand Total</span>
                <span className="text-icon-highlight">₹{pricing.totalAmount?.toFixed(2)}</span>
              </div>
              <p className="text-[10px] mt-2 text-text-dim">
                Platform fee goes to ClutchD • Service fee goes to your provider
              </p>
            </div>
          )}
        </div>
      )}

      

      {/* Method selection */}
      <div className="space-y-2 mb-6">
        <label className="text-sm font-medium mb-2 block text-text-primary">Select Payment Method</label>
        {METHODS.map(({ id, label, desc, icon: Icon }) => (
          <div
            key={id}
            onClick={() => { setMethod(id); setQrData(null); setPayState("idle"); setErrorMsg(""); }}
            className={`flex items-center gap-4 p-3.5 rounded-xl border cursor-pointer transition-all ${
              method === id
                ? "bg-surface-soft border-border-subtle shadow-[0_0_10px_rgba(234,179,8,0.12)]"
                : "bg-bg-card border-border-subtle hover:bg-surface-soft"
            }`}
          >
            <div className="w-9 h-9 rounded-full flex items-center justify-center bg-surface-soft text-icon-highlight">
              <Icon size={18} />
            </div>
            <div className="flex-1">
              <h4 className="font-medium text-sm text-text-primary">{label}</h4>
              <p className="text-xs text-text-muted">{desc}</p>
            </div>
            <div className={`w-4.5 h-4.5 rounded-full border-2 flex items-center justify-center ${method === id ? "border-icon-highlight" : "border-border-subtle"}`}>
              {method === id && <div className="w-2 h-2 rounded-full bg-icon-highlight" />}
            </div>
          </div>
        ))}
      </div>

      {/* QR Code display */}
      {method === "qr" && qrData && (
        <div className="p-4 rounded-xl border text-center mb-6 animate-in slide-in-from-top-2 bg-bg-card border-border-subtle">
          <div className="w-44 h-44 bg-white p-2 rounded-lg mx-auto mb-3 border-2 border-border-subtle">
            <img src={qrData.image_url} alt={`QR code for ₹${displayAmount.toFixed(2)}`} className="w-full h-full object-contain" />
          </div>
          <p className="text-sm font-medium mb-1 text-text-primary">Scan to Pay ₹{displayAmount.toFixed(2)}</p>
          <p className="text-xs text-text-muted">Waiting for payment...</p>
          <div className="flex items-center justify-center gap-2 mt-2">
            <Loader2 size={14} className="animate-spin text-icon-highlight" />
            <span className="text-xs text-icon-highlight">Checking...</span>
          </div>
        </div>
      )}

      {/* Pay button */}
      {!(method === "qr" && qrData) && (
        <Button className="w-full" size="lg" onClick={handlePay} isLoading={payState === "processing"}>
          {method === "cash" ? `Confirm Cash ₹${displayAmount.toFixed(0)}` : `Pay ₹${displayAmount.toFixed(0)} Securely`}
        </Button>
      )}

      {/* Trust footer */}
      <div className="mt-4 pt-3 border-t text-center border-border-subtle">
        <p className="text-[10px] uppercase tracking-wider text-text-dim">
          {method === "cash" ? "Confirmed between you and the mechanic" : "Secured by Razorpay • 256-bit SSL"}
        </p>
      </div>
    </Modal>
  );
}

