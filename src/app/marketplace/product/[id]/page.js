import ProductDetailClient from './client';

export function generateStaticParams() {
  return [
    { id: 'prod-1' },
    { id: 'prod-2' },
    { id: 'prod-3' },
    { id: 'prod-4' },
    { id: 'prod-5' },
    { id: 'prod-6' },
    { id: 'prod-7' },
    { id: 'prod-8' },
  ];
}

export default async function Page({ params }) {
  const { id } = await params;
  return <ProductDetailClient id={id} />;
}
