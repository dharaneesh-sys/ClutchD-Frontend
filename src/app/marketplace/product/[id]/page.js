export function generateStaticParams() {
  return [
    { id: "p-1" },
    { id: "p-2" },
    { id: "p-3" },
    { id: "p-4" },
    { id: "p-5" },
  ];
}

export default async function ProductDetailPage({ params }) {
  const { id } = await params;

  return (
    <div className="p-4">
      <div className="glass-lux p-8 rounded-2xl text-center">
        <div className="w-16 h-16 rounded-full bg-surface-soft flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-icon-highlight" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-text-primary mb-2">Product: {id}</h1>
        <p className="text-sm text-text-muted">Product details and pricing</p>
      </div>
    </div>
  );
}
