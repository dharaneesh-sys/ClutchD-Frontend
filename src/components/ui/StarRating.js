import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Star rating. Interactive: a radio-like row of labelled buttons
 * ("1 star" … "5 stars"). Read-only: one image with the rating as its name.
 */
export function StarRating({ rating = 0, max = 5, size = 16, interactive = false, onChange }) {
  const stars = Array.from({ length: max }, (_, i) => i + 1);

  const icon = (value) => (
    <Star
      size={size}
      aria-hidden="true"
      className={cn(
        "transition-colors",
        value <= rating
          ? "fill-[var(--pending)] text-[var(--pending)]"
          : "fill-transparent text-[var(--border-strong)]"
      )}
    />
  );

  if (!interactive) {
    return (
      <span role="img" aria-label={`${rating} out of ${max} stars`} className="flex items-center gap-1">
        {stars.map((v) => (
          <span key={v}>{icon(v)}</span>
        ))}
      </span>
    );
  }

  return (
    <div role="group" aria-label="Rating" className="flex items-center gap-1">
      {stars.map((v) => (
        <button
          key={v}
          type="button"
          aria-label={`${v} ${v === 1 ? "star" : "stars"}`}
          aria-pressed={v <= rating}
          onClick={() => onChange && onChange(v)}
          className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
        >
          {icon(v)}
        </button>
      ))}
    </div>
  );
}
