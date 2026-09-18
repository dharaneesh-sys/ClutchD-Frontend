import { CategoryProductsWithParams } from './client';

// Static export (Capacitor): the category id arrives via ?id= query param.
// Path-param routes ([id]) only exist for pre-rendered params in
// `output: "export"`; unknown paths 404 and the WebView falls back to
// index.html. Query params work on a single static file.
export default function Page() {
  return <CategoryProductsWithParams />;
}
