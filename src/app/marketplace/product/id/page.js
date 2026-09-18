import { ProductDetailWithParams } from './client';

// Static export (Capacitor): product IDs are API-driven at runtime, so the
// detail page reads the id from the ?id= query param. Path-param routes
// (/product/[id]) only exist for pre-rendered params in `output: "export"`;
// an unknown UUID path has no HTML file and the WebView falls back to
// index.html — the "tap a part → home page" bug. Query params work on a
// single static file.
export default function Page() {
  return <ProductDetailWithParams />;
}
