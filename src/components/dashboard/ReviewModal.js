import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { reviewSchema } from "@/lib/validators";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { StarRating } from "@/components/ui/StarRating";
import { cn } from "@/lib/utils";

export function ReviewModal({ isOpen, onClose, providerName, onSubmit }) {
  const [rating, setRating] = useState(0);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(reviewSchema),
    defaultValues: { rating: 0 }
  });

  const handleRatingChange = (newRating) => {
    setRating(newRating);
    setValue("rating", newRating, { shouldValidate: true });
  };

  const submitHandler = async (data) => {
    await onSubmit(data);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Rate Your Service">
      <div className="text-center mb-6">
        <div className="w-16 h-16 rounded-full mx-auto mb-4 border flex items-center justify-center text-xl font-bold bg-surface-soft border-border-subtle text-icon-highlight">
           {providerName && providerName.length >= 2 ? providerName.substring(0, 2).toUpperCase() : "⭐"}
        </div>
        <h3 className="text-lg font-bold mb-1 text-text-primary">How was your experience?</h3>
        <p className="text-sm text-text-muted">Rate the service provided by {providerName || "the professional"}</p>
      </div>

      <form onSubmit={handleSubmit(submitHandler)} className="space-y-6">
        <div className="flex flex-col items-center gap-2">
          <StarRating 
            max={5} 
            size={40} 
            rating={rating} 
            interactive={true} 
            onChange={handleRatingChange} 
          />
          {errors.rating && <p className="text-sm text-red-500 mt-2">Please provide a rating</p>}
        </div>

        <div className="w-full">
          <label className="mb-2 block text-sm font-medium text-text-primary">
            Leave a comment (Optional)
          </label>
            <textarea
              className="w-full rounded-xl border px-4 py-3 text-sm transition-all min-h-[120px] resize-none bg-bg-card border-border-subtle text-text-primary placeholder:text-text-dim focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              placeholder="Tell us what you liked or what could be improved..."
              {...register("comment")}
            />
        </div>

        <div className="flex gap-4 pt-4 border-t border-border-subtle">
           <Button type="button" variant="secondary" className="flex-1" onClick={onClose}>
             Skip
           </Button>
           <Button type="submit" className="flex-1" disabled={rating === 0}>
             Submit Review
           </Button>
        </div>
      </form>
    </Modal>
  );
}
