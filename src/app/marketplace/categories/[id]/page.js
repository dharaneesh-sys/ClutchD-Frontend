export function generateStaticParams() {
  return [
    { id: "engine-parts" },
    { id: "brake-parts" },
    { id: "electrical" },
    { id: "suspension" },
    { id: "filters" },
    { id: "accessories" },
  ];
}

export default async function CategoryProductsPage({ params }) {
  const { id } = await params;

  return (
    <div className="p-4">
      <div className="glass-lux p-8 rounded-2xl text-center">
        <div className="w-16 h-16 rounded-full bg-surface-soft flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-icon-highlight" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-text-primary mb-2">Category: {id}</h1>
        <p className="text-sm text-text-muted">Products in this category</p>
      </div>
    </div>
  );
}
