"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShoppingCart, Minus, Plus, Trash2, Tag } from "lucide-react";
import { useCartStore } from "@/store/cartStore";
import { ProductImage } from "@/components/marketplace/ProductImage";
import { Button } from "@/components/ui/Button";
import { cn, formatCurrency } from "@/lib/utils";

const DELIVERY_FREE_THRESHOLD = 500;
const DELIVERY_CHARGE = 49;

export default function CartPage() {
  const router = useRouter();
  const items = useCartStore((s) => s.items);
  const couponCode = useCartStore((s) => s.couponCode);
  const discount = useCartStore((s) => s.discount);
  const removeItem = useCartStore((s) => s.removeItem);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const applyCoupon = useCartStore((s) => s.applyCoupon);

  const [couponInput, setCouponInput] = useState("");
  const [couponError, setCouponError] = useState("");
  const [couponSuccess, setCouponSuccess] = useState("");
  const [showCoupon, setShowCoupon] = useState(false);

  const subtotal = useMemo(
    () => items.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0),
    [items],
  );

  const deliveryCharge =
    subtotal >= DELIVERY_FREE_THRESHOLD || subtotal === 0 ? 0 : DELIVERY_CHARGE;

  const total = Math.max(0, subtotal - discount) + deliveryCharge;

  const handleApplyCoupon = () => {
    const code = couponInput.trim();
    if (!code) {
      setCouponError("Please enter a coupon code");
      setCouponSuccess("");
      return;
    }
    setCouponError("");
    applyCoupon(code);
    setCouponSuccess(`Coupon "${code.toUpperCase()}" applied!`);
    setCouponInput("");
    setShowCoupon(false);
  };

  const handleQuantityChange = (productId, newQty) => {
    if (newQty <= 0) {
      removeItem(productId);
    } else {
      updateQuantity(productId, newQty);
    }
  };

  /* ── Empty State ───────────────────────────────────────────────── */

  if (items.length === 0) {
    return (
      <div className="p-4 animate-fade-in-up">
        <div className="mx-auto max-w-md">
          <div className="glass-lux rounded-2xl p-10 text-center">
            <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-surface-soft">
              <ShoppingCart size={36} className="text-icon-highlight" />
            </div>
            <h1 className="mb-2 text-2xl font-bold text-text-primary">
              Your Cart is Empty
            </h1>
            <p className="mx-auto mb-6 max-w-xs text-sm text-text-muted">
              Looks like you haven&apos;t added anything yet. Browse our
              marketplace to find great products.
            </p>
            <Link
              href="/marketplace"
              className="btn-glow inline-flex h-11 items-center gap-2 rounded-xl px-6 text-sm font-medium text-white transition-all hover-lift active-press"
            >
              <ShoppingCart size={16} />
              Start Shopping
            </Link>
          </div>
        </div>
      </div>
    );
  }

  /* ── Cart Layout ───────────────────────────────────────────────── */

  return (
    <div className="animate-fade-in-up p-4">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">Shopping Cart</h1>
          <p className="mt-0.5 text-sm text-text-muted">
            {items.length} item{items.length !== 1 ? "s" : ""}
          </p>
        </div>

        <div className="flex flex-col gap-6 lg:flex-row">
          {/* ── Items List ─────────────────────────────────────────────── */}
          <div className="flex-1 space-y-4">
            {items.map((item, index) => (
              <div
                key={item.productId}
                className="glass-lux rounded-2xl p-4 animate-fade-in-up"
                style={{ animationDelay: `${index * 60}ms` }}
              >
                <div className="flex items-start gap-4">
                  {/* Image */}
                  <div className="h-20 w-20 flex-shrink-0 sm:h-24 sm:w-24">
                    <ProductImage
                      src={item.image}
                      alt={item.name}
                      productName={item.name}
                      className="rounded-xl"
                    />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="truncate text-sm font-semibold text-foreground sm:text-base">
                      {item.name}
                    </h3>

                    {item.vendorId && (
                      <p className="mt-0.5 text-xs text-text-dim">
                        Vendor #{item.vendorId}
                      </p>
                    )}

                    <p className="mt-1 text-lg font-bold text-text-primary">
                      {formatCurrency(Number(item.price))}
                    </p>

                    {/* Quantity stepper */}
                    <div className="mt-3 flex items-center gap-3">
                      <div className="flex items-center gap-0.5">
                        <button
                          onClick={() =>
                            handleQuantityChange(
                              item.productId,
                              item.quantity - 1,
                            )
                          }
                          className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-text-muted transition-all hover:bg-white/10 hover:text-foreground active:scale-95"
                          aria-label="Decrease quantity"
                        >
                          <Minus size={14} />
                        </button>

                        <span className="tabular-nums w-10 text-center text-sm font-medium text-foreground">
                          {item.quantity}
                        </span>

                        <button
                          onClick={() =>
                            handleQuantityChange(
                              item.productId,
                              item.quantity + 1,
                            )
                          }
                          className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-text-muted transition-all hover:bg-white/10 hover:text-foreground active:scale-95"
                          aria-label="Increase quantity"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Right: line total + remove */}
                  <div className="flex flex-shrink-0 flex-col items-end gap-2">
                    <p className="tabular-nums text-sm font-semibold text-foreground">
                      {formatCurrency(Number(item.price) * item.quantity)}
                    </p>
                    <button
                      onClick={() => removeItem(item.productId)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-text-dim transition-all hover:bg-danger/10 hover:text-danger"
                      aria-label={`Remove ${item.name}`}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* ── Summary Sidebar ────────────────────────────────────────── */}
          <div className="w-full lg:w-80 xl:w-96">
            <div className="glass-lux-strong lg:sticky lg:top-4 space-y-5 rounded-2xl p-6">
              <h2 className="text-lg font-semibold text-foreground">
                Order Summary
              </h2>

              {/* Totals */}
              <div className="space-y-3 text-sm">
                <SummaryRow label="Subtotal" value={formatCurrency(subtotal)} />

                {discount > 0 && (
                  <SummaryRow
                    label={
                      <span className="flex items-center gap-1 text-success">
                        <Tag size={12} /> Discount
                      </span>
                    }
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
                    label={<span className="font-semibold">Total</span>}
                    value={
                      <span className="text-lg font-bold text-text-primary tabular-nums">
                        {formatCurrency(total)}
                      </span>
                    }
                  />
                </div>
              </div>

              {/* Free delivery hint */}
              {deliveryCharge > 0 && (
                <p className="text-xs text-text-dim">
                  Add items worth{" "}
                  {formatCurrency(DELIVERY_FREE_THRESHOLD - subtotal)} more for
                  free delivery.
                </p>
              )}

              {/* Coupon */}
              <div>
                {couponCode || couponSuccess ? (
                  <div className="flex items-center gap-2 rounded-xl bg-success/10 px-3 py-2 text-sm text-success">
                    <Tag size={14} />
                    <span>
                      Coupon <strong>{couponCode.toUpperCase()}</strong> applied
                    </span>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowCoupon((v) => !v)}
                    className="flex items-center gap-1 text-sm text-primary-light transition-colors hover:text-primary"
                  >
                    <Tag size={14} />
                    {showCoupon ? "Hide coupon" : "Have a coupon?"}
                  </button>
                )}

                {showCoupon && !couponCode && (
                  <div className="mt-3">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={couponInput}
                        onChange={(e) => {
                          setCouponInput(e.target.value);
                          setCouponError("");
                        }}
                        placeholder="Enter coupon code"
                        className="flex-1 h-10 rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-foreground placeholder:text-text-dim transition-all focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30"
                        onKeyDown={(e) =>
                          e.key === "Enter" && handleApplyCoupon()
                        }
                      />
                      <button
                        onClick={handleApplyCoupon}
                        className="active-press h-10 rounded-xl border border-primary/30 bg-primary/20 px-4 text-sm font-medium text-primary-light transition-all hover:bg-primary/30"
                      >
                        Apply
                      </button>
                    </div>
                    {couponError && (
                      <p className="mt-1.5 text-xs text-red-400">
                        {couponError}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Checkout CTA */}
              <Button
                className="w-full"
                size="lg"
                onClick={() => router.push("/marketplace/checkout")}
              >
                Proceed to Checkout
              </Button>

              <Link
                href="/marketplace"
                className="block text-center text-sm text-text-muted transition-colors hover:text-text-primary"
              >
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Summary Row Helper ─────────────────────────────────────────── */

function SummaryRow({ label, value }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-text-muted">{label}</span>
      <span className="tabular-nums font-medium text-foreground">{value}</span>
    </div>
  );
}
