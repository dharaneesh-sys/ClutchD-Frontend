"use client";

import { LifeBuoy } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";

/** P0 Support tab placeholder (plan task 8). Task 25 replaces it with real content. */
export function PartnerSupport() {
  return (
    <EmptyState
      icon={LifeBuoy}
      title="Support"
      description="Support content is coming after the pilot"
    />
  );
}
