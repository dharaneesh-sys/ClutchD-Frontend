import { useEffect, useId, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

const FOCUSABLE =
  'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  className,
  maxWidth = "max-w-md",
  role = "dialog",
}) {
  const modalRef = useRef(null);
  const previousActiveElement = useRef(null);
  const reactId = useId();
  const titleId = `modal-title-${reactId}`;
  // SSR-safe mount gate for the portal: server snapshot false, client snapshot true
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  useEffect(() => {
    if (isOpen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => { document.body.style.overflow = prev; };
    }
  }, [isOpen]);

  // Save focus on open, restore on close
  useEffect(() => {
    if (isOpen) {
      previousActiveElement.current = document.activeElement;
      const raf = requestAnimationFrame(() => {
        if (modalRef.current) {
          const focusable = modalRef.current.querySelectorAll(FOCUSABLE);
          if (focusable.length > 0) {
            focusable[0].focus();
          } else {
            modalRef.current.focus();
          }
        }
      });
      return () => cancelAnimationFrame(raf);
    }

    if (previousActiveElement.current && typeof previousActiveElement.current.focus === "function") {
      previousActiveElement.current.focus();
      previousActiveElement.current = null;
    }
  }, [isOpen]);

  // Focus trap (Tab/Shift+Tab)
  useEffect(() => {
    if (!isOpen) return;

    const handleTabKey = (e) => {
      if (e.key !== "Tab" || !modalRef.current) return;

      const focusable = modalRef.current.querySelectorAll(FOCUSABLE);
      if (focusable.length === 0) {
        e.preventDefault();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener("keydown", handleTabKey);
    return () => document.removeEventListener("keydown", handleTabKey);
  }, [isOpen]);

  // Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleEsc = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [isOpen, onClose]);

  // Hardware back / gesture: close this modal instead of navigating while
  // it is open. BackButtonHandler pops the top entry first, so the most
  // recently opened dialog closes before any page-level back fires.
  useEffect(() => {
    if (!isOpen || typeof window === "undefined") return undefined;
    const stack = (window.__backEscapeStack = window.__backEscapeStack || []);
    const entry = { close: onClose };
    stack.push(entry);
    return () => {
      const i = stack.indexOf(entry);
      if (i >= 0) stack.splice(i, 1);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const canPortal =
    mounted && typeof window !== "undefined" && typeof document !== "undefined";

  const modalContent = (
    <>
      {/* Backdrop — z-10040: above ALL page chrome (map chips z-400,
          NotificationBell z-500, ChatWidget z-900) so nothing bleeds
          through the dimmed overlay. No floating chrome exists (D9.3). */}
      <div
        onClick={onClose}
        data-testid="modal-scrim"
        className="fixed inset-0 z-[10040] animate-[backdrop-in_0.2s_ease] bg-[var(--glass-overlay-scrim)]"
        aria-hidden="true"
      />

      {/* Modal Container — portals above the BottomNav (z-40) and every
          fixed page widget. Safe-centering: items-start + my-auto
          centers the dialog when it fits, and when the Android keyboard
          shrinks the viewport the container scrolls — nothing is ever
          pushed below the screen or clipped unreachable. */}
      {/* Mobile: bottom sheet pinned to the safe area. sm+: centered modal. */}
      <div className="fixed inset-0 z-[10041] flex items-end sm:items-start justify-center p-0 sm:p-4 sm:px-6 overflow-y-auto w-full h-full pointer-events-none">
        <div
          ref={modalRef}
          role={role}
          aria-modal="true"
          aria-labelledby={titleId}
          tabIndex={-1}
          className={cn(
            "relative w-full pointer-events-auto animate-[modal-in_0.25s_ease] motion-reduce:animate-none",
            "rounded-t-2xl sm:rounded-2xl border border-[var(--border)] bg-[var(--surface-card)] shadow-[var(--shadow-card)]",
            "p-5 sm:p-6 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:my-auto",
            maxWidth,
            className
          )}
        >
          {/* Header */}
          <div
            aria-hidden="true"
            className="mx-auto -mt-2 mb-3 h-1.5 w-10 rounded-full bg-[var(--border)] sm:hidden"
          />
          <div className="flex items-center justify-between gap-3 mb-5">
            <h2
              id={titleId}
              className="text-lg font-semibold tracking-tight text-[var(--foreground)]"
            >
              {title}
            </h2>
            <button
              onClick={onClose}
              aria-label="Close modal"
              className="-mr-2 flex h-11 w-11 items-center justify-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] text-[var(--text-muted)] hover:bg-[var(--surface-soft)] hover:text-[var(--foreground)]"
            >
              <X size={20} />
            </button>
          </div>

           {/* Content — flex-basis cap instead of a dvh calc so the inner
               area shrinks with the container instead of overflowing it */}
           <div className="max-h-[70dvh] sm:max-h-[60dvh] overflow-y-auto pr-1 custom-scrollbar">
            {children}
           </div>
        </div>
      </div>
    </>
  );

  if (canPortal) {
    return createPortal(modalContent, document.body);
  }

  return modalContent;
}
