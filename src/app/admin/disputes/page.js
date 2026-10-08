"use client";

import { DisputePanel } from "@/components/admin/DisputePanel";

export default function DisputesPage() {
  return (
    <div className="max-w-6xl mx-auto flex flex-col h-[calc(100dvh-8rem)]">
      <div className="mb-6 flex-shrink-0">
        <h2 className="type-headline-3 mb-2 text-text-primary">Disputes Resolution</h2>
        <p className="type-body-2 text-text-muted">Handle customer and provider complaints, refunds, and bans.</p>
      </div>
      
      <div className="flex-1 min-h-[500px]">
        <DisputePanel />
      </div>
    </div>
  );
}
