"use client";

export default function OrdersPage() {
  return (
    <div className="p-4">
      <div className="glass-lux p-8 rounded-2xl text-center">
        <div className="w-16 h-16 rounded-full bg-surface-soft flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-icon-highlight" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-text-primary mb-2">Order History</h1>
        <p className="text-sm text-text-muted">View your past orders</p>
      </div>
    </div>
  );
}
