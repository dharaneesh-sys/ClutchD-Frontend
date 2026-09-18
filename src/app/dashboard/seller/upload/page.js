"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Store } from "lucide-react";
import SplashScreen from "@/components/ui/SplashScreen";
import { useProductStore } from "@/store/productStore";
import { useAuthStore } from "@/store/authStore";
import { SellerProductForm } from "@/components/marketplace/SellerProductForm";
import { BackButton } from "@/components/ui/BackButton";
import { NAVIGATION_EVENT } from "@/lib/navigation";

/**
 * Dedicated upload page for seller part listings (opened instead of the old
 * in-dashboard modal — more room for the form + photo, and Android back
 * returns straight to the seller dashboard).
 */
export default function SellerUploadPage() {
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const _hydrated = useAuthStore((s) => s._hydrated);
  const sellerProducts = useProductStore((s) => s.sellerProducts);
  const router = useRouter();
  const [savedCount, setSavedCount] = useState(0);

  useEffect(() => {
    if (_hydrated && !isAuthenticated) {
      router.push("/auth");
    }
  }, [_hydrated, isAuthenticated, router]);

  // Role guard: only sellers (and admins) belong here.
  useEffect(() => {
    if (!_hydrated || !isAuthenticated || !user?.id) return;
    if (user.id.startsWith("demo-")) return;
    const allowed = ["seller", "admin"];
    if (!allowed.includes(user.role)) {
      router.replace(`/dashboard/${user.role || "customer"}`);
    }
  }, [_hydrated, isAuthenticated, user?.id, user?.role, router]);

  // Listen for navigation events from non-React contexts (axios interceptors)
  useEffect(() => {
    const handleNavigation = (event) => {
      const { path } = event.detail;
      if (path) router.push(path);
    };
    window.addEventListener(NAVIGATION_EVENT, handleNavigation);
    return () => window.removeEventListener(NAVIGATION_EVENT, handleNavigation);
  }, [router]);

  const listingCount = useMemo(() => sellerProducts.length, [sellerProducts]);

  if (!_hydrated) {
    return <SplashScreen />;
  }

  return (
    <div className="min-h-dvh bg-[var(--background)]">
      {/* Header with visible back button */}
      <header className="sticky top-0 z-40 border-b border-border-subtle bg-[var(--background)]/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-lg items-center gap-3 px-4 py-3">
          <BackButton fallback="/dashboard/seller" label="Back" />
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-base font-bold text-text-primary">
              Upload a part
            </h1>
            <p className="truncate text-xs text-text-muted">
              {listingCount} listing{listingCount === 1 ? "" : "s"} live
            </p>
          </div>
          <button
            onClick={() => router.push("/marketplace")}
            aria-label="Open Parts Store"
            className="rounded-xl p-2 text-text-muted transition-colors hover:bg-surface-soft hover:text-text-primary"
          >
            <Store size={20} />
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-lg px-4 py-5 pb-24">
        {savedCount > 0 && (
          <div
            role="status"
            className="mb-4 rounded-2xl border border-primary/30 bg-primary/10 px-4 py-3 text-sm font-semibold text-primary"
          >
            Part listed ✓ — upload another or head back.
          </div>
        )}
        <SellerProductForm
          onSuccess={() => {
            setSavedCount((c) => c + 1);
            // Brief pause so the seller sees the confirmation, then return.
            setTimeout(() => router.push("/dashboard/seller"), 900);
          }}
        />
      </main>
    </div>
  );
}
