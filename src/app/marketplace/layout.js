"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { BottomNav } from "@/components/ui/BottomNav";
import { MarketplaceMenu } from "@/components/ui/MarketplaceMenu";
import { Logo } from "@/components/ui/Logo";
import { marketplaceShowsBack } from "@/lib/marketplaceNav";
import { DashboardTabBar, MECHANIC_TABS, GARAGE_TABS, SELLER_TABS } from "@/components/dashboard/DashboardTabBar";
import { useAuthStore } from "@/store/authStore";
import { NAVIGATION_EVENT } from "@/lib/navigation";

/** Routes every signed-in role may browse: the shared account area
 *  (profile) and listing preview/store browse. Customer-only commerce
 *  actions (cart, checkout, search, categories, …) redirect other roles
 *  to their own dashboard so each role stays in its own environment. */
const SHARED_PREFIXES = ["/marketplace/profile", "/marketplace/product"];
const SHARED_EXACT = ["/marketplace"];

/** A marketplace path is customer-only when it is not shared. */
const isCustomerOnlyPath = (path) =>
  !SHARED_EXACT.includes(path) &&
  !SHARED_PREFIXES.some((prefix) => path.startsWith(prefix));

export default function MarketplaceLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const _hydrated = useAuthStore((s) => s._hydrated);

  const isCustomer = user?.role === "customer";
  const isMechanic = user?.role === "mechanic";
  const isAdmin = user?.role === "admin";
  const isGarage = user?.role === "garage";
  const isSeller = user?.role === "seller";

  // Role isolation: customer commerce pages (cart, checkout, search,
  // categories) bounce every other role back to their own dashboard.
  // Admin keeps full access for support/moderation.
  useEffect(() => {
    if (!_hydrated || !isAuthenticated || !user?.role) return;
    if (isCustomer || isAdmin) return;
    if (isCustomerOnlyPath(pathname)) {
      router.replace(`/dashboard/${user.role}`);
    }
  }, [_hydrated, isAuthenticated, user?.role, pathname, isCustomer, isAdmin, router]);

  // Listen for navigation events from non-React contexts (e.g., axios interceptors)
  useEffect(() => {
    const handleNavigation = (event) => {
      const { path } = event.detail;
      if (path) {
        router.push(path);
      }
    };
    window.addEventListener(NAVIGATION_EVENT, handleNavigation);
    return () => window.removeEventListener(NAVIGATION_EVENT, handleNavigation);
  }, [router]);

  const handleBack = () => {
    if (typeof window !== "undefined" && window.history.length <= 1) {
      // No history (deep link / cold start): fall back to the signed-in
      // user's dashboard, or the marketplace home when logged out.
      router.push(user?.role ? `/dashboard/${user.role}` : "/marketplace");
    } else {
      router.back();
    }
  };

  // Bottom bar is role-scoped everywhere in the marketplace:
  // - signed-in non-customers always see their own dashboard tabs
  //   (never the customer parts-store nav)
  // - customers see their dashboard tabs on profile pages, the store
  //   nav everywhere else
  // - logged-out users see the store nav
  let bottomNav = <BottomNav />;
  if (isSeller) {
    bottomNav = <DashboardTabBar tabs={SELLER_TABS} />;
  } else if (isMechanic || isAdmin) {
    bottomNav = <DashboardTabBar tabs={MECHANIC_TABS} />;
  } else if (isGarage) {
    bottomNav = <DashboardTabBar tabs={GARAGE_TABS} />;
  } else if (isCustomer && pathname.startsWith("/marketplace/profile")) {
    bottomNav = <DashboardTabBar />;
  }

  const showBack = marketplaceShowsBack(pathname);

  return (
    <div className="min-h-[100dvh] flex flex-col bg-[var(--background)]">
      <header className="sticky top-0 z-50 flex items-center gap-2 border-b border-[var(--border)] bg-[var(--surface-card)] px-2 pb-2 pt-[max(0.5rem,env(safe-area-inset-top))] sm:px-4">
        {showBack ? (
          <button
            type="button"
            onClick={handleBack}
            className="flex h-11 w-11 items-center justify-center rounded-full text-[var(--foreground)] hover:bg-[var(--surface-soft)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
            aria-label="Go back"
          >
            <ArrowLeft size={20} aria-hidden="true" />
          </button>
        ) : (
          <span className="pl-2">
            <Logo size="md" showText />
          </span>
        )}
        <span className="flex-1" />
        <MarketplaceMenu />
      </header>
      <main className="flex-1 pb-[calc(64px+env(safe-area-inset-bottom)+1rem)] lg:pb-6">{children}</main>
      {bottomNav}
    </div>
  );
}
