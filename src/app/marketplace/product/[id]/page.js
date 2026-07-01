import ProductDetailClient from './client';

export function generateStaticParams() {
  return [
    { id: 'prod-001' },
    { id: 'prod-002' },
    { id: 'prod-003' },
    { id: 'prod-004' },
    { id: 'prod-005' },
    { id: 'prod-006' },
    { id: 'prod-007' },
    { id: 'prod-008' },
  ];
}

export default async function Page({ params }) {
  const { id } = await params;
  return <ProductDetailClient id={id} />;
}
