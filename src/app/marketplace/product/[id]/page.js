import ProductDetailClient from './client';

// Static-export build stub: product IDs are API-driven at runtime
// (see ProductDetailClient fetching by id), so no IDs are knowable
// at build time with the backend offline. Do not remove — `output:
// "export"` (Capacitor) requires at least one static param.
export function generateStaticParams() {
  return [{ id: '_placeholder' }];
}

export default async function Page({ params }) {
  const { id } = await params;
  return <ProductDetailClient id={id} />;
}
