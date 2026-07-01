import CategoryProductsClient from './client';

export function generateStaticParams() {
  return [
    { id: 'engine-parts' },
    { id: 'brake-parts' },
    { id: 'electrical' },
    { id: 'suspension' },
    { id: 'filters' },
    { id: 'accessories' },
  ];
}

export default async function Page({ params }) {
  const { id } = await params;
  return <CategoryProductsClient id={id} />;
}
