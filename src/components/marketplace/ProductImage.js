"use client";

import { useState, useCallback } from "react";
import { ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Smart product image component with first-letter fallback and glass-morphism placeholder.
 *
 * Renders the product image from a URL. On error or missing src, shows either
 * the first letter of the product name or a generic icon, wrapped in glass-lux styling.
 *
 * @param {string}  src         - Image URL to display
 * @param {string}  alt         - Accessible alt text
 * @param {string}  productName - Product name used for first-letter fallback
 * @param {string}  className   - Additional classes for the container
 */
export function ProductImage({ src, alt = "", productName = "", className }) {
  const [hasError, setHasError] = useState(false);

  const handleError = useCallback(() => setHasError(true), []);

  const showPlaceholder = !src || hasError;
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
            src={src}
            alt={alt}
            onError={handleError}
            className="h-full w-full object-cover"
          />
          {/* Subtle inner border overlay */}
          <div className="pointer-events-none absolute inset-0 rounded-xl ring-1 ring-inset ring-white/5" />
        </>
      )}
    </div>
  );
}
