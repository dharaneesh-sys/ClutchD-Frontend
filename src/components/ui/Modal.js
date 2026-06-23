import { useEffect, useId, useRef } from "react";
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

  // Lock body scroll
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
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

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 z-40 backdrop-blur-sm animate-[backdrop-in_0.2s_ease] bg-black/50"
        aria-hidden="true"
      />

      {/* Modal Container */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 py-12 px-4 sm:px-6 overflow-y-auto w-full h-full pointer-events-none">
        <div
          ref={modalRef}
          role={role}
          aria-modal="true"
          aria-labelledby={titleId}
          tabIndex={-1}
          className={cn(
            "relative w-full rounded-2xl border pointer-events-auto animate-[modal-in_0.25s_ease]",
            "p-6 backdrop-blur-3xl",
            "border-border-subtle bg-surface shadow-[0_30px_80px_rgba(var(--color-black-rgb),0.35)] ring-1 ring-primary/10",
            maxWidth,
            className
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2
              id={titleId}
              className="text-xl font-semibold tracking-tight text-text-primary"
            >
              {title}
            </h2>
            <button
              onClick={onClose}
              aria-label="Close modal"
              className="rounded-full p-1.5 transition-colors focus:outline-none text-text-dim hover:bg-surface-soft hover:text-text-primary"
            >
              <X size={20} />
            </button>
          </div>

           {/* Content */}
           <div className="max-h-[calc(100vh-8rem)] overflow-y-auto pr-2 custom-scrollbar">
            {children}
           </div>
        </div>
      </div>
    </>
  );
}
