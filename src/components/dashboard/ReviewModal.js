import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { reviewSchema } from "@/lib/validators";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { StarRating } from "@/components/ui/StarRating";
import api from "@/lib/api";

/**
 * Review sheet. Persists the review with `POST /reviews` and closes only on a
 * 2xx or a 409 (already reviewed). Any other failure keeps it open with an
 * inline error. `onSubmit` fires exactly once, after the review is stored.
 */
export function ReviewModal({ isOpen, onClose, providerName, jobId, onSubmit }) {
  const [rating, setRating] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(reviewSchema),
    defaultValues: { rating: 0 },
  });

  const handleRatingChange = (newRating) => {
    setRating(newRating);
    setValue("rating", newRating, { shouldValidate: true });
  };

  const submitHandler = async (data) => {
    if (submitting) return;
    if (!jobId) {
      setSubmitError("This job can't be reviewed right now.");
      return;
    }
    setSubmitting(true);
    setSubmitError("");
    let stored = false;
    try {
      await api.post("/reviews", {
        job_id: jobId,
        rating: data.rating,
        comment: data.comment?.trim() ? data.comment.trim() : null,
      });
      stored = true;
    } catch (err) {
      if (err?.response?.status === 409) {
        stored = true; // already reviewed — treat as done
      } else {
        const detail = err?.response?.data?.detail;
        setSubmitError(typeof detail === "string" ? detail : "Could not save your review. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
    if (stored) {
      onSubmit?.(data);
      onClose();
    }
  };

  const initials = providerName && providerName.length >= 2 ? providerName.substring(0, 2).toUpperCase() : "—";

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Rate your service">
      <div className="text-center mb-5">
        <div className="w-14 h-14 rounded-full mx-auto mb-3 border flex items-center justify-center text-lg font-semibold bg-[var(--surface-soft)] border-[var(--border)] text-[var(--primary-dark)]">
          {initials}
        </div>
        <h3 className="text-base font-semibold mb-1 text-[var(--foreground)]">How was your experience?</h3>
        <p className="text-sm text-[var(--text-muted)]">Rate the service provided by {providerName || "the professional"}</p>
      </div>

      <form onSubmit={handleSubmit(submitHandler)} className="space-y-5">
        <div className="flex flex-col items-center gap-2">
          <StarRating max={5} size={40} rating={rating} interactive={true} onChange={handleRatingChange} />
          {errors.rating && (
            <p role="alert" className="text-sm mt-1 text-[var(--danger)]">Please provide a rating</p>
          )}
        </div>

        <div className="w-full">
          <label htmlFor="review-comment" className="mb-1.5 block text-sm font-medium text-[var(--foreground)]">
            Leave a comment (optional)
          </label>
          <textarea
            id="review-comment"
            className="w-full rounded-xl border px-4 py-3 text-sm transition-colors min-h-[110px] resize-none bg-[var(--surface-card)] border-[var(--border)] text-[var(--foreground)] placeholder:text-[var(--text-muted)] focus:border-[var(--primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
            placeholder="Tell us what you liked or what could be improved..."
            maxLength={1000}
            {...register("comment")}
          />
        </div>

        {submitError && (
          <p role="alert" className="rounded-xl border border-[color-mix(in_srgb,var(--danger)_30%,transparent)] bg-[color-mix(in_srgb,var(--danger)_8%,transparent)] p-3 text-sm text-[var(--danger-ink)]">
            {submitError}
          </p>
        )}

        <div className="flex gap-3 pt-4 border-t border-[var(--border)]">
          <Button type="button" variant="secondary" className="flex-1" onClick={onClose}>
            Skip
          </Button>
          <Button type="submit" className="flex-1" disabled={rating === 0} isLoading={submitting}>
            Submit review
          </Button>
        </div>
      </form>
    </Modal>
  );
}
