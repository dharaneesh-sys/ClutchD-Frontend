"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { resolveMediaUrl } from "@/lib/mediaUrl";

const MAX_ATTEMPTS = 3;
/** A load that hasn't finished in 12s is treated as stalled (the funnel edge
 * can leave connections hanging forever — the img then renders as an empty
 * box with neither load nor error fired, which looks like a missing photo). */
const LOAD_TIMEOUT_MS = 12000;

/**
 * Smart product image component with first-letter fallback and glass-morphism placeholder.
 *
 * Renders the product image from a URL. On error OR a stalled load, retries
 * with a cache-buster (the media host can drop connections on weak links;
 * a retry on a fresh socket almost always succeeds). Only after all attempts
 * fail does it fall back to the product-name letter placeholder.
 *
 * @param {string}  src         - Image URL to display
 * @param {string}  alt         - Accessible alt text
 * @param {string}  productName - Product name used for first-letter fallback
 * @param {string}  className   - Additional classes for the container
 */
export function ProductImage({ src, alt = "", productName = "", className }) {
  const [hasError, setHasError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const timerRef = useRef(null);

  // Reset retry state when the source changes — done during render (the
  // React-recommended pattern) so a new image starts with a clean slate
  // without a cascading effect render.
  const [prevSrc, setPrevSrc] = useState(resolveMediaUrl(src));
  const currentSrc = resolveMediaUrl(src);
  if (prevSrc !== currentSrc) {
    setPrevSrc(currentSrc);
    setHasError(false);
    setAttempt(0);
  }

  const resolvedSrc = resolveMediaUrl(src);
  const bustedSrc =
    resolvedSrc && attempt > 0
      ? `${resolvedSrc}${resolvedSrc.includes("?") ? "&" : "?"}r=${attempt}`
      : resolvedSrc;

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const handleLoad = useCallback(() => {
    clearTimer();
  }, [clearTimer]);

  const handleError = useCallback(() => {
    clearTimer();
    setAttempt((prev) => {
      if (prev + 1 < MAX_ATTEMPTS) {
        // Back off a moment — immediate retries on a dead socket fail too.
        timerRef.current = setTimeout(() => setAttempt(prev + 1), 800 * (prev + 1));
        return prev;
      }
      setHasError(true);
      return prev;
    });
  }, [clearTimer]);

  // Stall watchdog: an image that hasn't loaded within the window counts as
  // a failed attempt and triggers a cache-busted retry.
  useEffect(() => {
    if (!resolvedSrc || hasError) return undefined;
    clearTimer();
    timerRef.current = setTimeout(() => {
      setAttempt((prev) => {
        if (prev + 1 < MAX_ATTEMPTS) {
          timerRef.current = setTimeout(() => setAttempt(prev + 1), 800 * (prev + 1));
          return prev;
        }
        setHasError(true);
        return prev;
      });
    }, LOAD_TIMEOUT_MS);
    return clearTimer;
  }, [resolvedSrc, attempt, hasError, clearTimer]);

  useEffect(() => clearTimer, [clearTimer]);

  const showPlaceholder = !resolvedSrc || hasError;
  const firstLetter = productName ? productName.trim().charAt(0).toUpperCase() : null;

  return (
    <div
      className={cn(
        "relative aspect-square w-full overflow-hidden rounded-xl",
        className
      )}
    >
      {showPlaceholder ? (
        <div className="flex h-full w-full flex-col items-center justify-center glass-lux">
          {firstLetter ? (
            <span className="select-none text-4xl font-bold leading-none tracking-tight text-text-dim">
              {firstLetter}
            </span>
          ) : (
            <ImageIcon size={32} className="text-text-dim" />
          )}

          {/* Inline SVG accent — subtle geometric ring */}
          <svg
            className="pointer-events-none absolute inset-0 h-full w-full"
            viewBox="0 0 200 200"
            fill="none"
            aria-hidden="true"
          >
            <circle
              cx="100"
              cy="100"
              r="72"
              stroke="currentColor"
              className="text-white/5"
              strokeWidth="1.5"
            />
            <circle
              cx="100"
              cy="100"
              r="52"
              stroke="currentColor"
              className="text-white/[0.03]"
              strokeWidth="1"
            />
          </svg>
        </div>
      ) : (
        <>
          <img
            key={bustedSrc}
            src={bustedSrc}
            alt={alt}
            onLoad={handleLoad}
            onError={handleError}
            decoding="async"
            className="h-full w-full object-cover"
          />
          {/* Subtle inner border overlay */}
          <div className="pointer-events-none absolute inset-0 rounded-xl ring-1 ring-inset ring-white/5" />
        </>
      )}
    </div>
  );
}
