"use client";

export default function CartPage() {
  return (
    <div className="p-4">
      <div className="glass-lux p-8 rounded-2xl text-center">
        <div className="w-16 h-16 rounded-full bg-surface-soft flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-icon-highlight" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-text-primary mb-2">Shopping Cart</h1>
        <p className="text-sm text-text-muted">Review your selected items</p>
      </div>
    </div>
  );
}
