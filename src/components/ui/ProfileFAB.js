"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { User } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { getInitials } from "@/lib/utils";

/**
 * Floating profile button positioned at the bottom-right.
 * Navigates to /marketplace/profile on click.
 *
 * Hidden on marketplace routes (they have BottomNav with profile tab),
 * visible on dashboard and other authenticated pages.
 *
 * Positioned above the ThemeToggle button (z-index one lower) so it
 * sits slightly below it if both are present.
 */
export function ProfileFAB() {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, _isRestoring, user } = useAuthStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(timer);
  }, []);

  // Hidden during restore, on unauthenticated pages, or on marketplace routes
  const isMarketplace = pathname?.startsWith("/marketplace");
  const isAuthPage = pathname?.startsWith("/auth");
  const isVisible = mounted && isAuthenticated && !_isRestoring && !isMarketplace && !isAuthPage;

  if (!isVisible) return null;

  const initials = user?.name ? getInitials(user.name) : null;

  return (
    <button
      onClick={() => router.push("/marketplace/profile")}
      aria-label="Profile"
      className="p-3 rounded-full transition-all duration-300 shadow-lg backdrop-blur-xl z-[9998] fixed bottom-8 right-8
        translate-y-[-4rem]
        bg-zinc-900/90 border-2 border-primary/40 text-primary-light hover:bg-zinc-800 hover-glow
      "
      title="Profile"
    >
      {initials ? (
        <span className="text-xs font-bold">{initials}</span>
      ) : (
        <User size={22} />
      )}
    </button>
  );
}
