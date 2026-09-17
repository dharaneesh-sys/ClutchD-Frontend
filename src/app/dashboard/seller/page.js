"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Store,
  ShoppingBag,
  Plus,
  LogOut,
  Package,
  IndianRupee,
  Star,
  TrendingUp,
} from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { useProductStore } from "@/store/productStore";
import { DashboardShell } from "@/components/ui/DashboardShell";
import SplashScreen from "@/components/ui/SplashScreen";
import { MyListings } from "@/components/marketplace/MyListings";
import { NAVIGATION_EVENT } from "@/lib/navigation";
import { formatCurrency } from "@/lib/utils";

export default function SellerDashboardPage() {
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const _hydrated = useAuthStore((s) => s._hydrated);
  const sellerProducts = useProductStore((s) => s.sellerProducts);
  const fetchMyListings = useProductStore((s) => s.fetchMyListings);
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("dashboard");

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

  useEffect(() => {
    if (_hydrated && isAuthenticated) {
      fetchMyListings();
    }
  }, [_hydrated, isAuthenticated, fetchMyListings]);

  const stats = useMemo(() => {
    const total = sellerProducts.length;
    const inStock = sellerProducts.filter((p) => p.availability !== false).length;
    const inventoryValue = sellerProducts.reduce(
      (sum, p) => sum + (Number(p.price) || 0),
      0
    );
    const avgRating =
      total > 0
        ? sellerProducts.reduce((sum, p) => sum + (Number(p.rating) || 0), 0) / total
        : 0;
    return { total, inStock, inventoryValue, avgRating };
  }, [sellerProducts]);

  if (!_hydrated) {
    return <SplashScreen />;
  }

  const sidebarItems = [
    { icon: LayoutDashboard, label: "Dashboard", onClick: () => setActiveTab("dashboard") },
    { icon: Store, label: "My Listings", onClick: () => setActiveTab("listings") },
    { icon: Plus, label: "Upload Part", onClick: () => router.push("/dashboard/seller/upload") },
    { icon: ShoppingBag, label: "Parts Store", onClick: () => router.push("/marketplace") },
  ];

  return (
    <DashboardShell
      title="Seller Dashboard"
      subtitle="Seller Mode"
      user={user}
      mode="customer"
      sidebar={sidebarItems}
    >
      <div className="flex-1 pb-4 lg:pb-6">
        {activeTab === "dashboard" && (
          <div className="space-y-4 lg:space-y-6">
            {/* Welcome + quick actions */}
            <div className="glass-lux rounded-2xl p-5">
              <h2 className="text-lg font-bold text-text-primary">
                Welcome{user?.name ? `, ${user.name}` : ""} 👋
              </h2>
              <p className="mt-1 text-sm text-text-muted">
                Upload spare parts and accessories — your listings go live in the
                Parts Store instantly.
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  onClick={() => router.push("/dashboard/seller/upload")}
                  className="inline-flex items-center gap-2 rounded-2xl bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-all hover:opacity-90"
                >
                  <Plus size={16} />
                  Upload a part
                </button>
                <button
                  onClick={() => router.push("/marketplace")}
                  className="inline-flex items-center gap-2 rounded-2xl border border-border-subtle bg-surface px-4 py-2.5 text-sm font-semibold text-text-primary transition-all hover:bg-surface-soft"
                >
                  <ShoppingBag size={16} />
                  Open Parts Store
                </button>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
              <StatCard
                icon={Package}
                label="Total listings"
                value={String(stats.total)}
              />
              <StatCard
                icon={TrendingUp}
                label="In stock"
                value={String(stats.inStock)}
              />
              <StatCard
                icon={IndianRupee}
                label="Inventory value"
                value={formatCurrency(stats.inventoryValue)}
              />
              <StatCard
                icon={Star}
                label="Avg. rating"
                value={stats.total > 0 ? stats.avgRating.toFixed(1) : "—"}
              />
            </div>

            {/* Recent listings */}
            <div>
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-bold uppercase tracking-wider text-text-muted">
                  Recent listings
                </h3>
                <button
                  onClick={() => setActiveTab("listings")}
                  className="text-sm font-semibold text-primary hover:underline"
                >
                  View all
                </button>
              </div>
              {sellerProducts.length === 0 ? (
                <div className="glass-lux rounded-2xl p-8 text-center">
                  <Package size={32} className="mx-auto mb-3 text-text-muted" />
                  <p className="text-sm font-semibold text-text-primary">
                    No parts listed yet
                  </p>
                  <p className="mt-1 text-sm text-text-muted">
                    Upload your first spare part or accessory to start selling.
                  </p>
                  <button
                    onClick={() => router.push("/dashboard/seller/upload")}
                    className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-all hover:opacity-90"
                  >
                    <Plus size={16} />
                    Upload a part
                  </button>
                </div>
              ) : (
                <MyListings />
              )}
            </div>
          </div>
        )}

        {activeTab === "listings" && (
          <div className="space-y-4">
            <button
              onClick={() => router.push("/dashboard/seller/upload")}
              className="inline-flex items-center gap-2 rounded-2xl bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-all hover:opacity-90"
            >
              <Plus size={16} />
              Upload a part
            </button>
            <MyListings onAddNew={() => router.push("/dashboard/seller/upload")} />
          </div>
        )}
      </div>
    </DashboardShell>
  );
}

function StatCard({ icon: Icon, label, value }) {
  return (
    <div className="glass-lux rounded-2xl p-4">
      <div className="flex items-center gap-2 text-text-muted">
        <Icon size={16} />
        <span className="text-[11px] font-semibold uppercase tracking-wider">
          {label}
        </span>
      </div>
      <p className="mt-2 text-xl font-bold text-text-primary">{value}</p>
    </div>
  );
}
