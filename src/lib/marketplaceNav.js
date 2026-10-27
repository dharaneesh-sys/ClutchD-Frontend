/** Pushed/detail marketplace screens get a back arrow; top-level tabs never do. */
export function marketplaceShowsBack(path = "") {
  return (
    path.startsWith("/marketplace/categories/") ||
    path.startsWith("/marketplace/product") ||
    path.startsWith("/marketplace/checkout")
  );
}
