import {
  Wrench,
  Disc3,
  Zap,
  Route,
  Filter,
  Package,
  HelpCircle,
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
  "spare-parts": Wrench,
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
 * Fallback icon for unrecognised categories (D8: lucide only, no inline SVG).
 */
const FallbackLucideIcon = HelpCircle;

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
        "bg-surface-soft",
        "ring-1 ring-border-subtle",
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
        <FallbackLucideIcon
          size={dims.icon}
          className="text-text-dim"
          aria-hidden="true"
        />
      )}
    </div>
  );
}
