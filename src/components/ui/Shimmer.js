import { cn } from "../../lib/utils";

const shimmerStyles = {
  base: "relative overflow-hidden rounded-xl",
};

const shimmerVariants = {
  text: "h-4 w-full",
  title: "h-6 w-3/4",
  subtitle: "h-5 w-1/2",
  avatar: "h-10 w-10 rounded-full",
  card: "h-32 w-full",
  chart: "h-48 w-full",
  button: "h-10 w-24 rounded-lg",
  badge: "h-6 w-16 rounded-full",
  image: "h-48 w-full rounded-xl",
};

export function Shimmer({ className, variant = "text", children, ...props }) {
  return (
    <div
      className={cn(
        shimmerStyles.base,
        shimmerVariants[variant] || shimmerVariants.text,
        className
      )}
      {...props}
    >
      <div
        className={cn(
          "absolute inset-0 rounded-[inherit]",
          "bg-gradient-to-r from-transparent via-white/[0.06] to-transparent",
          "shimmer-slide"
        )}
        style={{
          animation: "shimmer-slide 2s ease-in-out infinite",
          backgroundSize: "200% 100%",
        }}
      />
      {children}
    </div>
  );
}

export function ShimmerCard({ className, lines = 3, hasAvatar = true, hasActions = true }) {
  return (
    <div
      className={cn(
        "glass-lux rounded-2xl p-5 space-y-4",
        className
      )}
    >
      <div className="flex justify-between items-start">
        <div className="space-y-2.5 flex-1">
          <Shimmer variant="title" />
          <Shimmer variant="subtitle" className="w-2/3" />
        </div>
        {hasAvatar && <Shimmer variant="avatar" />}
      </div>

      <div className="space-y-2.5">
        {Array.from({ length: lines }).map((_, i) => (
          <Shimmer
            key={i}
            variant="text"
            className={i === lines - 1 ? "w-3/4" : "w-full"}
          />
        ))}
      </div>

      {hasActions && (
        <div className="flex justify-between pt-3 border-t border-white/[0.06]">
          <Shimmer variant="button" />
          <Shimmer variant="button" className="w-20" />
        </div>
      )}
    </div>
  );
}

export function ShimmerList({ count = 4, className }) {
  return (
    <div className={cn("space-y-3", className)}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="glass-lux rounded-xl p-4 flex items-center gap-4"
        >
          <Shimmer variant="avatar" />
          <div className="flex-1 space-y-2">
            <Shimmer variant="text" className="w-1/3" />
            <Shimmer variant="text" className="w-2/3" />
          </div>
          <Shimmer variant="badge" />
        </div>
      ))}
    </div>
  );
}

export function ShimmerTable({ rows = 5, columns = 4, className }) {
  return (
    <div className={cn("space-y-3", className)}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4 items-center p-3">
          {Array.from({ length: columns }).map((_, j) => (
            <Shimmer
              key={j}
              variant={j === 0 ? "avatar" : "text"}
              className={j === 0 ? "h-8 w-8 rounded-lg" : "flex-1 h-4"}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
