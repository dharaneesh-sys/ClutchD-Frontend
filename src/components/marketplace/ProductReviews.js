"use client";

import { useState, useEffect, useCallback } from "react";
import { Star, CheckCircle, MessageSquare, Plus } from "lucide-react";
import { cn, formatDate } from "@/lib/utils";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";

// ── Helpers ──────────────────────────────────────────────

/**
 * Formats a date string as a relative time like "2 days ago".
 * Falls back to short date format if the date is too old.
 */
function relativeDate(dateStr) {
  if (!dateStr) return "";
  const now = Date.now();
  const date = new Date(dateStr).getTime();
  if (isNaN(date)) return formatDate(dateStr);

  const diffMs = now - date;
  const seconds = Math.floor(diffMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const weeks = Math.floor(days / 7);
  const months = Math.floor(days / 30);

  if (seconds < 60) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days === 1) return "yesterday";
  if (days < 7) return `${days}d ago`;
  if (weeks < 5) return `${weeks}w ago`;
  if (months < 12) return `${months}mo ago`;
  return formatDate(dateStr);
}

/**
 * Compute rating distribution from a list of reviews.
 * Returns an array of 5 entries, one per star (5 → 1), each with { count, percentage }.
 */
function computeDistribution(reviews) {
  const counts = [0, 0, 0, 0, 0]; // index 0 = 1-star, index 4 = 5-star
  reviews.forEach((r) => {
    const idx = Math.min(Math.max(Math.round(r.rating), 1), 5) - 1;
    counts[idx]++;
  });
  const total = reviews.length || 1;
  return counts
    .map((count, i) => ({ star: i + 1, count, percentage: (count / total) * 100 }))
    .reverse(); // 5-star first
}

// ── Sub-components ───────────────────────────────────────

/**
 * Inline star rating display (read-only, compact).
 */
function ReadOnlyStars({ rating, size = 14 }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={size}
          className={cn(
            "transition-colors",
            i <= rating
              ? "fill-amber-400 text-amber-400"
              : "fill-white/10 text-white/30"
          )}
          aria-hidden="true"
        />
      ))}
    </div>
  );
}

/**
 * Interactive star selector for the review form.
 */
function InteractiveStars({ rating, onChange, size = 36 }) {
  const [hovered, setHovered] = useState(0);

  return (
    <div className="flex items-center justify-center gap-1.5" role="radiogroup" aria-label="Rating">
      {[1, 2, 3, 4, 5].map((i) => {
        const active = i <= (hovered || rating);
        return (
          <button
            key={i}
            type="button"
            role="radio"
            aria-checked={rating === i}
            aria-label={`${i} star${i > 1 ? "s" : ""}`}
            onClick={() => onChange(i)}
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(0)}
            className="focus:outline-none transition-transform hover:scale-125 active:scale-90"
          >
            <Star
              size={size}
              className={cn(
                "transition-all duration-150",
                active
                  ? "fill-amber-400 text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]"
                  : "fill-white/10 text-white/30 hover:fill-amber-300/40 hover:text-amber-300/40"
              )}
            />
          </button>
        );
      })}
    </div>
  );
}

/**
 * Individual review card.
 */
function ReviewCard({ review }) {
  return (
    <div className="rounded-xl border border-border-subtle bg-surface-container-low p-4 transition-all hover:border-white/15">
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-center gap-2.5 min-w-0">
          {/* Avatar circle with initial */}
          <div className="flex-shrink-0 w-9 h-9 rounded-full bg-surface-mid flex items-center justify-center text-xs font-bold text-icon-highlight">
            {review.userName
              ? review.userName
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()
                  .slice(0, 2)
              : "??"}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-text-primary truncate">
              {review.userName}
            </p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <ReadOnlyStars rating={review.rating} size={12} />
              <span className="text-[11px] text-text-dim whitespace-nowrap">
                {relativeDate(review.date)}
              </span>
            </div>
          </div>
        </div>

        {/* Verified badge */}
        {review.verified && (
          <span className="flex-shrink-0 inline-flex items-center gap-1 rounded-full border border-green-500/30 bg-green-500/10 px-2 py-0.5 text-[11px] font-medium text-green-400 backdrop-blur-sm">
            <CheckCircle size={12} />
            Verified
          </span>
        )}
      </div>

      <p className="text-sm text-text-muted leading-relaxed mt-1.5">
        {review.text}
      </p>
    </div>
  );
}

/**
 * Rating distribution bar row.
 */
function DistributionRow({ star, percentage, count }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="w-6 text-right text-xs font-medium text-text-dim shrink-0">
        {star}
      </span>
      <Star
        size={12}
        className="fill-amber-400 text-amber-400 shrink-0"
        aria-hidden="true"
      />
      <div className="relative flex-1 h-2 rounded-full overflow-hidden bg-white/5">
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-amber-400 to-amber-500 transition-all duration-500"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="w-8 text-right text-xs text-text-dim shrink-0 tabular-nums">
        {count}
      </span>
    </div>
  );
}

// ── Review Form Modal ────────────────────────────────────

/**
 * Modal form for submitting a new review.
 */
function ReviewFormModal({ isOpen, onClose, onSubmit }) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      if (rating === 0) {
        setError("Please select a star rating");
        return;
      }
      if (!comment.trim()) {
        setError("Please write a review comment");
        return;
      }
      setError("");
      setSubmitting(true);
      try {
        await onSubmit({ rating, text: comment.trim() });
        setRating(0);
        setComment("");
        onClose();
      } catch {
        setError("Failed to submit review. Please try again.");
      } finally {
        setSubmitting(false);
      }
    },
    [rating, comment, onSubmit, onClose]
  );

  const handleClose = useCallback(() => {
    if (!submitting) {
      setRating(0);
      setComment("");
      setError("");
      onClose();
    }
  }, [submitting, onClose]);

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Write a Review">
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Star rating selector */}
        <div className="space-y-3">
          <label className="block text-sm font-medium text-text-primary text-center">
            Rate this product
          </label>
          <InteractiveStars rating={rating} onChange={setRating} size={36} />
          <p className="text-center text-xs text-text-dim">
            {rating === 0
              ? "Tap a star to rate"
              : rating === 1
                ? "Poor"
                : rating === 2
                  ? "Below average"
                  : rating === 3
                    ? "Average"
                    : rating === 4
                      ? "Good"
                      : "Excellent"}
          </p>
        </div>

        {/* Comment textarea */}
        <div className="space-y-1.5">
          <label
            htmlFor="review-comment"
            className="block text-sm font-medium text-text-primary"
          >
            Your review
          </label>
          <textarea
            id="review-comment"
            rows={4}
            placeholder="Share your experience with this product — what did you like or dislike?"
            value={comment}
            onChange={(e) => {
              setComment(e.target.value);
              if (error) setError("");
            }}
            className={cn(
              "w-full rounded-xl border px-4 py-3 text-sm transition-all resize-none",
              "bg-bg-card placeholder:text-text-dim",
              "text-text-primary focus:outline-none focus:ring-2",
              error
                ? "border-red-500/50 focus:border-red-500 focus:ring-red-500/20"
                : "border-border-subtle focus:border-primary focus:ring-primary/20"
            )}
            disabled={submitting}
          />
          {error && (
            <p className="text-xs text-red-400 mt-1">{error}</p>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <Button
            type="button"
            variant="secondary"
            className="flex-1"
            onClick={handleClose}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            className="flex-1"
            disabled={rating === 0 || !comment.trim()}
            isLoading={submitting}
          >
            {submitting ? "Submitting…" : "Submit Review"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

// ── Main Component ───────────────────────────────────────

/**
 * ProductReviews — Full reviews section for a product detail page.
 *
 * Features:
 *  - Review summary with average rating and distribution bars
 *  - Sortable/filterable list of reviews
 *  - "Write a Review" button that opens a submission form in a modal
 *  - Optimistic local state update on submission
 *  - Empty state when no reviews exist
 *  - Verified purchase badges
 *  - Relative date formatting
 *
 * @param {{ productId: string }} props
 */
export function ProductReviews({ productId }) {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);

  // Fetch reviews on mount
  useEffect(() => {
    if (!productId) return;

    let cancelled = false;
    setLoading(true);

    async function fetchReviews() {
      try {
        // Dynamic import so the interceptor is ready
        const api = (await import("@/lib/api")).default;
        const res = await api.get(`/marketplace/products/${productId}/reviews`);
        if (!cancelled) {
          setReviews(res.data.reviews || []);
        }
      } catch {
        if (!cancelled) setReviews([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchReviews();
    return () => { cancelled = true; };
  }, [productId]);

  // Submit a new review (optimistic add)
  const handleSubmitReview = useCallback(
    async ({ rating, text }) => {
      const api = (await import("@/lib/api")).default;

      // Optimistic addition
      const optimistic = {
        id: "rev-optimistic-" + Date.now(),
        productId,
        userName: "You",
        rating,
        text,
        date: new Date().toISOString(),
        verified: false,
      };

      setReviews((prev) => [optimistic, ...prev]);

      try {
        const res = await api.post(
          `/marketplace/products/${productId}/reviews`,
          { rating, text }
        );
        // Replace optimistic with server response
        setReviews((prev) =>
          prev.map((r) =>
            r.id === optimistic.id ? { ...res.data, userName: "You" } : r
          )
        );
      } catch {
        // Roll back on failure
        setReviews((prev) => prev.filter((r) => r.id !== optimistic.id));
        throw new Error("Failed to submit review");
      }
    },
    [productId]
  );

  // Derived data
  const avgRating =
    reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0;
  const distribution = computeDistribution(reviews);

  return (
    <section className="space-y-6">
      {/* ── Heading ── */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-text-primary tracking-tight">
          Customer Reviews
          {reviews.length > 0 && (
            <span className="ml-1.5 text-text-dim font-normal">
              ({reviews.length})
            </span>
          )}
        </h2>
        <Button
          variant="primary"
          size="sm"
          onClick={() => setFormOpen(true)}
          className="gap-1.5"
        >
          <Plus size={16} />
          Write a Review
        </Button>
      </div>

      {/* ── Loading state ── */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-12 text-text-dim">
          <div className="h-8 w-8 rounded-full border-2 border-primary/30 border-t-primary animate-spin mb-3" />
          <p className="text-sm">Loading reviews…</p>
        </div>
      )}

      {/* ── Empty state ── */}
      {!loading && reviews.length === 0 && (
        <EmptyState
          icon={MessageSquare}
          title="No reviews yet"
          description="No reviews yet. Be the first to review!"
          action={
            <Button
              variant="primary"
              size="sm"
              onClick={() => setFormOpen(true)}
              className="gap-1.5"
            >
              <Star size={16} />
              Be the first to review
            </Button>
          }
        />
      )}

      {/* ── Review summary ── */}
      {!loading && reviews.length > 0 && (
        <>
          {/* Summary card */}
          <div className="rounded-xl border border-border-subtle bg-surface-container-low p-5">
            <div className="flex flex-col sm:flex-row items-center gap-5">
              {/* Big average number */}
              <div className="flex flex-col items-center shrink-0">
                <span className="text-4xl font-bold tracking-tight text-text-primary tabular-nums">
                  {avgRating.toFixed(1)}
                </span>
                <ReadOnlyStars rating={Math.round(avgRating)} size={16} />
                <span className="text-xs text-text-dim mt-1">
                  {reviews.length} review{reviews.length !== 1 ? "s" : ""}
                </span>
              </div>

              {/* Distribution bars */}
              <div className="flex-1 w-full space-y-1.5 max-w-xs">
                {distribution.map((d) => (
                  <DistributionRow
                    key={d.star}
                    star={d.star}
                    percentage={d.percentage}
                    count={d.count}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* ── Reviews list ── */}
          <div className="space-y-3">
            {reviews.map((review) => (
              <ReviewCard key={review.id} review={review} />
            ))}
          </div>
        </>
      )}

      {/* ── Review form modal ── */}
      <ReviewFormModal
        isOpen={formOpen}
        onClose={() => setFormOpen(false)}
        onSubmit={handleSubmitReview}
      />
    </section>
  );
}
