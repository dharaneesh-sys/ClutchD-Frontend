"use client";

import { PartnerQueue } from "@/components/partner/PartnerQueue";

/** Mechanic job queue: offers + assigned jobs (shared partner queue). */
export function IncomingJobs({ onChat }) {
  return <PartnerQueue title="Job Queue" subtitle="Offers and your active jobs" onChat={onChat} />;
}
