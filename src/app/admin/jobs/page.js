"use client";

import { JobMonitor } from "@/components/admin/JobMonitor";

export default function JobsPage() {
  return (
    <div className="max-w-6xl mx-auto flex flex-col h-[calc(100dvh-8rem)]">
      <div className="mb-6 flex-shrink-0">
        <h2 className="type-headline-3 mb-2 text-text-primary">Active Jobs Monitor</h2>
        <p className="type-body-2 text-text-muted">Live view of all service requests across the platform.</p>
      </div>
      
      <div className="flex-1 min-h-[500px]">
        <JobMonitor />
      </div>
    </div>
  );
}
