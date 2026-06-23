import {
  Wrench,
  Disc3,
  Zap,
  Route,
  Filter,
  Package,
} from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Maps category values to lucide-react icon components.
 * @type {Object<string, import("lucide-react").LucideIcon>}
 */
const CATEGORY_ICON_MAP = {
  "engine-parts": Wrench,
  "brake-parts": Disc3,
  electrical: Zap,
  suspension: Route,
  filters: Filter,
  accessories: Package,
};

/**
 * Size presets for the icon circle.
 * @type {Object<string, {container: number, icon: number}>}
 */
const SIZE_PRESETS = {
  sm: { container: 32, icon: 16 },
  md: { container: 48, icon: 22 },
  lg: { container: 64, icon: 28 },
};

/**
 * Fallback icon used when the category is not recognised.
 */
function FallbackIcon({ size, className }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="16" />
      <line x1="8" y1="12" x2="16" y2="12" />
    </svg>
  );
}

/**
 * Category icon component.
 *
 * Renders a lucide-react icon mapped from the category value, wrapped in a
 * circular background with glass-morphism styling.
 *
 * @param {string}  category  - Category value (e.g. "engine-parts")
 * @param {"sm"|"md"|"lg"} [size="md"] - Icon size preset
 * @param {string}  className - Additional classes for the wrapper
 */
export function CategoryIcon({ category, size = "md", className }) {
  const IconComponent = CATEGORY_ICON_MAP[category];
  const dims = SIZE_PRESETS[size] || SIZE_PRESETS.md;

  return (
    <div
      className={cn(
        "inline-flex items-center justify-center rounded-full",
        "bg-white/10 backdrop-blur-xl",
        "ring-1 ring-white/10",
        className
      )}
      style={{ width: dims.container, height: dims.container }}
      role="img"
      aria-label={category ? `${category} category` : "Category icon"}
    >
      {IconComponent ? (
        <IconComponent
          size={dims.icon}
          className="text-icon-highlight"
          aria-hidden="true"
        />
      ) : (
        <FallbackIcon
          size={dims.icon}
          className="text-text-dim"
        />
      )}
    </div>
  );
}
