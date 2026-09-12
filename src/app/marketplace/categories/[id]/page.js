import CategoryProductsClient from './client';

export function generateStaticParams() {
  return [
    { id: 'accessories' },
    { id: 'spare-parts' },
  ];
}

export default async function Page({ params }) {
  const { id } = await params;
  return <CategoryProductsClient id={id} />;
}
