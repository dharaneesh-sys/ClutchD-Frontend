import ProductDetailClient from './client';

export const dynamic = 'force-dynamic';

export default async function Page({ params }) {
  const { id } = await params;
  return <ProductDetailClient id={id} />;
}
