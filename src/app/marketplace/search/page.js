"use client";

export default function SearchPage() {
  return (
    <div className="p-4">
      <div className="glass-lux p-8 rounded-2xl text-center">
        <div className="w-16 h-16 rounded-full bg-surface-soft flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-icon-highlight" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-text-primary mb-2">Search</h1>
        <p className="text-sm text-text-muted">Search for products and services</p>
      </div>
    </div>
  );
}
