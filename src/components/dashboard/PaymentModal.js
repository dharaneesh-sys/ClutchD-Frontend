import { useState, useEffect, useRef } from "react";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import { CreditCard, Smartphone, QrCode, Banknote, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { useThemeStore } from "../../store/themeStore";
import api from "../../lib/api";

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

export function PaymentModal({ isOpen, onClose, amount, jobId, onSuccess }) {
  const [method, setMethod] = useState("upi");
  const [payState, setPayState] = useState("idle"); // idle | processing | success | failed
  const [errorMsg, setErrorMsg] = useState("");
  const [qrData, setQrData] = useState(null);
  const qrPollRef = useRef(null);
  const { theme } = useThemeStore();
  const isLight = theme === "light";

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
      if (qrPollRef.current) clearInterval(qrPollRef.current);
    }
  }, [isOpen]);

  const amountPaise = (amount || 0) * 100;

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
                amount,
                status: "success",
                transactionId: response.razorpay_payment_id,
              });
            }, 1500);
          } catch {
            setPayState("failed");
            setErrorMsg("Payment verification failed. Contact support if money was deducted.");
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
        setErrorMsg(resp.error?.description || "Payment failed. Please try again.");
      });
      rzp.open();
    } catch (err) {
      setPayState("failed");
      setErrorMsg(err.response?.data?.detail || "Could not initiate payment. Please try again.");
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
                amount,
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
      setErrorMsg(err.response?.data?.detail || "QR code generation failed.");
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
        onSuccess({ method: "cash", amount, status: "success", transactionId: "CASH_" + Date.now() });
      }, 1500);
    } catch (err) {
      setPayState("failed");
      setErrorMsg(err.response?.data?.detail || "Cash confirmation failed.");
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
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Payment Successful">
        <div className="text-center py-8">
          <div className={`w-20 h-20 rounded-full mx-auto flex items-center justify-center mb-4 ${isLight ? "bg-green-100" : "bg-emerald-500/20"}`}>
            <CheckCircle2 size={40} className={isLight ? "text-green-600" : "text-emerald-400"} />
          </div>
          <h3 className={`text-xl font-bold mb-2 ${isLight ? "text-slate-900" : "text-white"}`}>Payment Complete!</h3>
          <p className={`text-sm ${isLight ? "text-slate-500" : "text-emerald-100/60"}`}>₹{amount} paid successfully</p>
        </div>
      </Modal>
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Complete Payment">
      <div className="text-center mb-6">
        <p className={`text-sm mb-1 ${isLight ? "text-slate-500" : "text-emerald-100/60"}`}>Total Amount Due</p>
        <p className={`text-4xl font-bold tracking-tight ${isLight ? "text-slate-900" : "text-white"}`}>₹{amount}</p>
      </div>

      {/* Error */}
      {payState === "failed" && errorMsg && (
        <div className={`flex items-center gap-2 p-3 rounded-xl mb-4 text-sm ${isLight ? "bg-red-50 border border-red-200 text-red-700" : "bg-red-500/10 border border-red-500/30 text-red-300"}`}>
          <XCircle size={16} className="shrink-0" />
          {errorMsg}
        </div>
      )}

      {/* Method selection */}
      <div className="space-y-2 mb-6">
        <label className={`text-sm font-medium mb-2 block ${isLight ? "text-slate-700" : "text-emerald-100/80"}`}>Select Payment Method</label>
        {METHODS.map(({ id, label, desc, icon: Icon }) => (
          <div
            key={id}
            onClick={() => { setMethod(id); setQrData(null); setPayState("idle"); setErrorMsg(""); }}
            className={`flex items-center gap-4 p-3.5 rounded-xl border cursor-pointer transition-all ${
              method === id
                ? (isLight ? "bg-yellow-500/15 border-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.12)]" : "bg-emerald-500/20 border-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.12)]")
                : (isLight ? "bg-slate-50 border-slate-200 hover:bg-yellow-50" : "bg-white/5 border-white/10 hover:bg-white/10")
            }`}
          >
            <div className={`w-9 h-9 rounded-full flex items-center justify-center ${isLight ? "bg-yellow-500/20 text-yellow-600" : "bg-white/10 text-emerald-400"}`}>
              <Icon size={18} />
            </div>
            <div className="flex-1">
              <h4 className={`font-medium text-sm ${isLight ? "text-slate-900" : "text-white"}`}>{label}</h4>
              <p className={`text-xs ${isLight ? "text-slate-500" : "text-white/50"}`}>{desc}</p>
            </div>
            <div className={`w-4.5 h-4.5 rounded-full border-2 flex items-center justify-center ${method === id ? (isLight ? "border-yellow-600" : "border-emerald-400") : (isLight ? "border-slate-300" : "border-white/30")}`}>
              {method === id && <div className={`w-2 h-2 rounded-full ${isLight ? "bg-yellow-600" : "bg-emerald-400"}`} />}
            </div>
          </div>
        ))}
      </div>

      {/* QR Code display */}
      {method === "qr" && qrData && (
        <div className={`p-4 rounded-xl border text-center mb-6 animate-in slide-in-from-top-2 ${isLight ? "bg-slate-50 border-slate-200" : "bg-black/20 border-white/5"}`}>
          <div className="w-44 h-44 bg-white p-2 rounded-lg mx-auto mb-3 border-2 border-emerald-500/30">
            <img src={qrData.image_url} alt="QR Code" className="w-full h-full object-contain" />
          </div>
          <p className={`text-sm font-medium mb-1 ${isLight ? "text-slate-700" : "text-white"}`}>Scan to Pay ₹{amount}</p>
          <p className={`text-xs ${isLight ? "text-slate-500" : "text-emerald-100/50"}`}>Waiting for payment...</p>
          <div className="flex items-center justify-center gap-2 mt-2">
            <Loader2 size={14} className="animate-spin text-emerald-400" />
            <span className="text-xs text-emerald-400">Checking...</span>
          </div>
        </div>
      )}

      {/* Pay button */}
      {!(method === "qr" && qrData) && (
        <Button className="w-full" size="lg" onClick={handlePay} isLoading={payState === "processing"}>
          {method === "cash" ? `Confirm Cash ₹${amount}` : `Pay ₹${amount} Securely`}
        </Button>
      )}

      {/* Trust footer */}
      <div className={`mt-4 pt-3 border-t text-center ${isLight ? "border-slate-200" : "border-white/5"}`}>
        <p className={`text-[10px] uppercase tracking-wider ${isLight ? "text-slate-400" : "text-white/20"}`}>
          {method === "cash" ? "Confirmed between you and the mechanic" : "Secured by Razorpay • 256-bit SSL"}
        </p>
      </div>
    </Modal>
  );
}
