"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  MoreVertical, Sun, Moon, UserCircle, Package, Heart, AlertTriangle, Loader2, LifeBuoy,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useThemeStore } from "@/store/themeStore";
import { useSOS } from "@/components/ui/useSOS";

const rowClass =
  "flex w-full min-h-[44px] items-center gap-3 rounded-xl px-3 text-left transition-colors hover:bg-[var(--surface-soft)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]";

/**
 * Header overflow menu for the marketplace (replaces the old 6th "Menu" nav
 * item). Theme, SOS and help stay reachable for logged-out users.
 */
export function MarketplaceMenu() {
  const router = useRouter();
  const pathname = usePathname();
  const theme = useThemeStore((s) => s.theme);
  const toggleTheme = useThemeStore((s) => s.toggleTheme);
  const sos = useSOS();
  const [open, setOpen] = useState(false);
  const buttonRef = useRef(null);
  const panelRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => {
      if (panelRef.current?.contains(e.target) || buttonRef.current?.contains(e.target)) return;
      setOpen(false);
    };
    const onKey = (e) => {
      if (e.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  // Close on route change.
  useEffect(() => {
    /* eslint-disable-next-line react-hooks/set-state-in-effect */
    setOpen(false);
  }, [pathname]);

  const go = (path) => {
    setOpen(false);
    router.push(path);
  };

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="More options"
        aria-haspopup="true"
        aria-expanded={open}
        className="flex h-11 w-11 items-center justify-center rounded-full text-[var(--foreground)] hover:bg-[var(--surface-soft)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
      >
        <MoreVertical size={20} aria-hidden="true" />
      </button>

      {open && (
        <div
          ref={panelRef}
          role="menu"
          className={cn(
            "absolute right-0 top-full z-[60] mt-2 w-60 rounded-2xl border border-[var(--border)] bg-[var(--surface-card)] p-2 shadow-[var(--elevation-3)]",
            "animate-scale-in motion-reduce:animate-none"
          )}
        >
          <div className="mb-1 border-b border-[var(--border)] pb-1">
            <button role="menuitem" type="button" className={rowClass} onClick={() => go("/marketplace/profile")}>
              <UserCircle size={18} aria-hidden="true" className="text-[var(--text-muted)]" />
              <span className="text-sm font-medium text-[var(--foreground)]">My Profile</span>
            </button>
            <button role="menuitem" type="button" className={rowClass} onClick={() => go("/marketplace/profile/orders")}>
              <Package size={18} aria-hidden="true" className="text-[var(--text-muted)]" />
              <span className="text-sm font-medium text-[var(--foreground)]">Orders</span>
            </button>
            <button role="menuitem" type="button" className={rowClass} onClick={() => go("/marketplace/profile/favorites")}>
              <Heart size={18} aria-hidden="true" className="text-[var(--text-muted)]" />
              <span className="text-sm font-medium text-[var(--foreground)]">Favorites</span>
            </button>
            <button role="menuitem" type="button" className={rowClass} onClick={() => go("/marketplace/profile/help")}>
              <LifeBuoy size={18} aria-hidden="true" className="text-[var(--text-muted)]" />
              <span className="text-sm font-medium text-[var(--foreground)]">Help &amp; Support</span>
            </button>
          </div>

          {/* Emergency SOS — inline 2-tap confirm, no overlay */}
          <button
            role="menuitem"
            type="button"
            onClick={() => sos.handleSOS()}
            disabled={sos.loading || sos.status === "sent" || sos.status === "queued"}
            className={cn(rowClass, "hover:bg-[color-mix(in_srgb,var(--danger)_8%,transparent)]")}
            aria-label="Emergency SOS"
          >
            {sos.loading ? (
              <Loader2 size={18} aria-hidden="true" className="animate-spin text-[var(--danger)]" />
            ) : (
              <AlertTriangle size={18} aria-hidden="true" className="text-[var(--danger)]" />
            )}
            <span className="text-sm font-semibold text-[var(--danger-ink)]">
              {sos.loading
                ? "Sending SOS..."
                : sos.status === "sent"
                  ? "Help En Route!"
                  : sos.status === "queued"
                    ? "SOS Queued"
                    : sos.status === "confirming"
                      ? "Tap again to confirm"
                      : "Emergency SOS"}
            </span>
          </button>
          {sos.queuedMsg && <p className="px-3 pb-1 text-xs text-[var(--primary-dark)]">{sos.queuedMsg}</p>}

          <button role="menuitem" type="button" onClick={toggleTheme} className={cn(rowClass, "justify-between")}>
            <span className="text-sm font-medium text-[var(--foreground)]">Theme</span>
            <span className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
              {theme === "light" ? <Sun size={16} aria-hidden="true" /> : <Moon size={16} aria-hidden="true" />}
              {theme === "light" ? "Light" : "Dark"}
            </span>
          </button>
        </div>
      )}
    </div>
  );
}
