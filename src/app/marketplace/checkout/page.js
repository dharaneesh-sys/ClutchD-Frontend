"use client";

import { useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  CheckCircle,
  ChevronLeft,
  CreditCard,
  Wallet,
  Banknote,
  MapPin,
  Package,
} from "lucide-react";
import { useCartStore } from "@/store/cartStore";
import { useOrderStore } from "@/store/orderStore";
import { Button } from "@/components/ui/Button";
import { cn, formatCurrency } from "@/lib/utils";

const DELIVERY_FREE_THRESHOLD = 500;
const DELIVERY_CHARGE = 49;

const PAYMENT_METHODS = [
  { id: "cod", label: "Cash on Delivery", icon: Banknote, description: "Pay when you receive" },
  { id: "upi", label: "UPI", icon: Wallet, description: "Google Pay, PhonePe, Paytm" },
  { id: "card", label: "Card", icon: CreditCard, description: "Credit & Debit cards" },
];

const INITIAL_FORM = { name: "", phone: "", address: "", city: "", pincode: "" };

/* ── Validation ─────────────────────────────────────────────────── */

function validateForm(form) {
  const errs = {};
  if (!form.name.trim() || form.name.trim().length < 2) errs.name = "Name is required";
  if (!form.phone.trim() || !/^\d{10}$/.test(form.phone.trim()))
    errs.phone = "Valid 10-digit phone required";
  if (!form.address.trim() || form.address.trim().length < 5)
    errs.address = "Address must be at least 5 characters";
  if (!form.city.trim()) errs.city = "City is required";
  if (!form.pincode.trim() || !/^\d{6}$/.test(form.pincode.trim()))
    errs.pincode = "Valid 6-digit pincode required";
  return errs;
}

/* ── Page Component ─────────────────────────────────────────────── */

export default function CheckoutPage() {
  const router = useRouter();

  // Cart
  const items = useCartStore((s) => s.items);
  const couponCode = useCartStore((s) => s.couponCode);
  const discount = useCartStore((s) => s.discount);

  // Order
  const placeOrder = useOrderStore((s) => s.placeOrder);
  const isLoading = useOrderStore((s) => s.isLoading);

  // Local state
  const [step, setStep] = useState("form"); // "form" | "confirmed"
  const [form, setForm] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});
  const [paymentMethod, setPaymentMethod] = useState("cod");
  const [placedOrder, setPlacedOrder] = useState(null);

  const subtotal = useMemo(
    () => items.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0),
    [items],
  );

  const deliveryCharge =
    subtotal >= DELIVERY_FREE_THRESHOLD || subtotal === 0 ? 0 : DELIVERY_CHARGE;

  const total = Math.max(0, subtotal - discount) + deliveryCharge;

  const handleChange = useCallback((field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  }, []);

  /* ── Place Order ───────────────────────────────────────────────── */

  const handlePlaceOrder = useCallback(async () => {
    const errs = validateForm(form);
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    const address = {
      street: form.address.trim(),
      city: form.city.trim(),
      state: "", // simplified — backend/UI can extend
      pincode: form.pincode.trim(),
    };

    const payment = { method: paymentMethod };

    const order = await placeOrder(items, address, payment);
    setPlacedOrder(order);
    setStep("confirmed");
  }, [form, paymentMethod, items, placeOrder]);

  /* ── Redirect if empty cart (only on form step) ───────────────── */

  if (items.length === 0 && step === "form") {
    return (
      <div className="animate-fade-in-up p-4">
        <div className="mx-auto max-w-md">
          <div className="glass-lux rounded-2xl p-10 text-center">
            <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-surface-soft">
              <Package size={36} className="text-icon-highlight" />
            </div>
            <h1 className="mb-2 text-2xl font-bold text-text-primary">
              Nothing to Checkout
            </h1>
            <p className="mx-auto mb-6 max-w-xs text-sm text-text-muted">
              Your cart is empty. Add some items before checking out.
            </p>
            <Link
              href="/marketplace/cart"
              className="btn-glow inline-flex h-11 items-center gap-2 rounded-xl px-6 text-sm font-medium text-white transition-all hover-lift active-press"
            >
              <ChevronLeft size={16} />
              Back to Cart
            </Link>
          </div>
        </div>
      </div>
    );
  }

  /* ── Confirmation Step ────────────────────────────────────────── */

  if (step === "confirmed" && placedOrder) {
    return (
      <div className="animate-fade-in-up p-4">
        <div className="mx-auto max-w-lg">
          <div className="glass-lux-strong rounded-2xl p-8 text-center">
            {/* Animated checkmark */}
            <div className="animate-scale-in mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-success/20">
              <CheckCircle size={44} className="text-success" />
            </div>

            <h1 className="mb-1 text-2xl font-bold text-foreground">
              Order Confirmed!
            </h1>
            <p className="mb-6 text-sm text-text-muted">
              Thank you for your purchase. Your order has been placed.
            </p>

            {/* Order ID badge */}
            <div className="mb-8 inline-block rounded-full bg-surface-soft px-5 py-2 text-sm font-mono font-medium text-text-primary">
              {placedOrder.id}
            </div>

            {/* Summary */}
            <div className="glass-lux mb-8 rounded-xl p-5 text-left">
              <h3 className="mb-3 text-sm font-semibold text-text-muted uppercase tracking-wider">
                Order Summary
              </h3>

              <div className="space-y-3">
                <div className="space-y-2">
                  {placedOrder.items.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="truncate text-foreground">
                        {item.name}{" "}
                        <span className="text-text-dim">&times;{item.quantity}</span>
                      </span>
                      <span className="tabular-nums font-medium text-foreground">
                        {formatCurrency(Number(item.price) * item.quantity)}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="border-t border-white/10 pt-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-text-muted">Total</span>
                    <span className="tabular-nums text-lg font-bold text-text-primary">
                      {formatCurrency(placedOrder.total)}
                    </span>
                  </div>
                </div>

                <div className="border-t border-white/10 pt-3">
                  <div className="flex items-start gap-2 text-xs text-text-dim">
                    <MapPin size={14} className="mt-0.5 shrink-0" />
                    <span>
                      {placedOrder.address.street}, {placedOrder.address.city}
                      {placedOrder.address.pincode &&
                        ` - ${placedOrder.address.pincode}`}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment info */}
            <div className="mb-8 flex items-center justify-center gap-2 text-sm text-text-muted">
              <span>Payment:</span>
              <span className="font-medium capitalize text-foreground">
                {placedOrder.payment?.method || paymentMethod}
              </span>
            </div>

            <Link
              href="/marketplace"
              className="btn-glow inline-flex h-11 items-center gap-2 rounded-xl px-8 text-sm font-medium text-white transition-all hover-lift active-press"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    );
  }

  /* ── Form Step ────────────────────────────────────────────────── */

  return (
    <div className="animate-fade-in-up p-4">
      <div className="mx-auto max-w-6xl">
        {/* Back + Heading */}
        <div className="mb-6">
          <button
            onClick={() => router.push("/marketplace/cart")}
            className="mb-3 flex items-center gap-1 text-sm text-text-muted transition-colors hover:text-text-primary"
          >
            <ChevronLeft size={16} />
            Back to Cart
          </button>
          <h1 className="text-2xl font-bold text-foreground">Checkout</h1>
          <p className="mt-0.5 text-sm text-text-muted">
            Fill in your details to complete the order
          </p>
        </div>

        <div className="flex flex-col gap-6 lg:flex-row">
          {/* ── Left: Form + Payment ───────────────────────────────── */}
          <div className="flex-1 space-y-6">
            {/* Address Form */}
            <div className="glass-lux rounded-2xl p-6">
              <div className="mb-4 flex items-center gap-2">
                <MapPin size={18} className="text-icon-highlight" />
                <h2 className="text-lg font-semibold text-foreground">
                  Delivery Address
                </h2>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <FormField
                    label="Full Name"
                    value={form.name}
                    error={errors.name}
                    placeholder="John Doe"
                    onChange={(v) => handleChange("name", v)}
                  />
                </div>

                <FormField
                  label="Phone Number"
                  value={form.phone}
                  error={errors.phone}
                  placeholder="9876543210"
                  type="tel"
                  maxLength={10}
                  onChange={(v) => handleChange("phone", v.replace(/\D/g, ""))}
                />

                <div className="sm:col-span-2">
                  <FormField
                    label="Address"
                    value={form.address}
                    error={errors.address}
                    placeholder="Street, building, area"
                    onChange={(v) => handleChange("address", v)}
                  />
                </div>

                <FormField
                  label="City"
                  value={form.city}
                  error={errors.city}
                  placeholder="Mumbai"
                  onChange={(v) => handleChange("city", v)}
                />

                <FormField
                  label="Pincode"
                  value={form.pincode}
                  error={errors.pincode}
                  placeholder="400001"
                  type="tel"
                  maxLength={6}
                  onChange={(v) => handleChange("pincode", v.replace(/\D/g, ""))}
                />
              </div>
            </div>

            {/* Payment Method */}
            <div className="glass-lux rounded-2xl p-6">
              <h2 className="mb-4 text-lg font-semibold text-foreground">
                Payment Method
              </h2>

              <div className="grid gap-3 sm:grid-cols-3">
                {PAYMENT_METHODS.map((method) => {
                  const Icon = method.icon;
                  const isActive = paymentMethod === method.id;
                  return (
                    <button
                      key={method.id}
                      type="button"
                      onClick={() => setPaymentMethod(method.id)}
                      className={cn(
                        "active-press flex flex-col items-center gap-2 rounded-xl border p-4 text-center transition-all",
                        isActive
                          ? "border-primary/40 bg-primary/10 text-foreground ring-1 ring-primary/30"
                          : "border-white/10 bg-white/5 text-text-muted hover:border-white/20 hover:bg-white/10 hover:text-foreground",
                      )}
                    >
                      <Icon
                        size={24}
                        className={
                          isActive ? "text-icon-highlight" : "text-text-dim"
                        }
                      />
                      <span className="text-sm font-medium">{method.label}</span>
                      <span className="text-xs text-text-dim">
                        {method.description}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* ── Right: Order Summary ────────────────────────────────── */}
          <div className="w-full lg:w-80 xl:w-96">
            <div className="glass-lux-strong lg:sticky lg:top-4 space-y-5 rounded-2xl p-6">
              <h2 className="text-lg font-semibold text-foreground">
                Order Summary
              </h2>

              {/* Items */}
              <div className="space-y-3">
                {items.map((item) => (
                  <div
                    key={item.productId}
                    className="flex items-center justify-between text-sm"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-foreground">{item.name}</p>
                      <p className="text-xs text-text-dim">
                        Qty: {item.quantity} &times;{" "}
                        {formatCurrency(Number(item.price))}
                      </p>
                    </div>
                    <span className="ml-3 tabular-nums font-medium text-foreground">
                      {formatCurrency(Number(item.price) * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="space-y-3 border-t border-white/10 pt-3 text-sm">
                <SummaryRow
                  label="Subtotal"
                  value={formatCurrency(subtotal)}
                />

                {discount > 0 && (
                  <SummaryRow
                    label={<span className="text-success">Discount</span>}
                    value={
                      <span className="text-success">
                        &minus;{formatCurrency(discount)}
                      </span>
                    }
                  />
                )}

                <SummaryRow
                  label="Delivery"
                  value={
                    deliveryCharge === 0 ? (
                      <span className="text-success">FREE</span>
                    ) : (
                    formatCurrency(deliveryCharge)
                    )
                  }
                />

                <div className="border-t border-white/10 pt-3">
                  <SummaryRow
                    label={<span className="font-semibold text-foreground">Total</span>}
                    value={
                      <span className="text-lg font-bold text-text-primary tabular-nums">
                        {formatCurrency(total)}
                      </span>
                    }
                  />
                </div>
              </div>

              {/* Place Order */}
              <Button
                className="w-full"
                size="lg"
                isLoading={isLoading}
                onClick={handlePlaceOrder}
              >
                {isLoading ? "Placing Order..." : "Place Order"}
              </Button>

              <p className="text-center text-xs text-text-dim">
                This is a demo. No real payment will be processed.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Sub-Components ─────────────────────────────────────────────── */

function SummaryRow({ label, value }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-text-muted">{label}</span>
      <span className="tabular-nums font-medium text-foreground">{value}</span>
    </div>
  );
}

function FormField({ label, value, error, placeholder, onChange, type = "text", maxLength }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-text-muted">
        {label}
      </span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
        className={cn(
          "w-full rounded-2xl border bg-surface px-4 py-3 text-sm text-text-primary transition-all placeholder:text-text-dim",
          "focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30",
          error
            ? "border-red-500/50 focus:border-red-500 focus:ring-red-500/20"
            : "border-border-subtle",
        )}
      />
      {error && (
        <p className="mt-1 text-xs text-red-400">{error}</p>
      )}
    </label>
  );
}
