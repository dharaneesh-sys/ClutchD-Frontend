import { cn } from "../../lib/utils";

export function Skeleton({ className, variant = "text" }) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-white/10",
        variant === "text" && "h-4 w-full",
        variant === "title" && "h-6 w-3/4",
        variant === "avatar" && "h-10 w-10 rounded-full",
        variant === "card" && "h-32 w-full rounded-xl",
        variant === "chart" && "h-48 w-full rounded-xl",
        className
      )}
    />
  );
}

export function CardSkeleton() {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5 space-y-4">
      <div className="flex justify-between items-start">
        <div className="space-y-2 flex-1">
          <Skeleton variant="title" />
          <Skeleton className="w-1/2" />
        </div>
        <Skeleton variant="avatar" />
      </div>
      <Skeleton />
      <Skeleton className="w-2/3" />
      <div className="flex justify-between pt-2 border-t border-white/10">
        <Skeleton className="w-20 h-8" />
        <Skeleton className="w-24 h-8" />
      </div>
    </div>
  );
}

export function TableSkeleton({ rows = 5 }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4 items-center p-3">
          <Skeleton className="w-16 h-4" />
          <Skeleton className="flex-1 h-4" />
          <Skeleton className="w-20 h-4" />
          <Skeleton className="w-16 h-6 rounded-full" />
          <Skeleton className="w-8 h-8 rounded-lg" />
        </div>
      ))}
    </div>
  );
}
