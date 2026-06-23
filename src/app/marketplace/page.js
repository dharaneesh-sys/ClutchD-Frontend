"use client";

export default function MarketplaceHome() {
  return (
    <div className="p-4">
      <div className="glass-lux p-8 rounded-2xl text-center">
        <div className="w-16 h-16 rounded-full bg-surface-soft flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-icon-highlight" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-text-primary mb-2">Marketplace</h1>
        <p className="text-sm text-text-muted">Browse services and products</p>
      </div>
    </div>
  );
}
