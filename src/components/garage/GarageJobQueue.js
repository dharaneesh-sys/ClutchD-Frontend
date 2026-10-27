"use client";

import { PartnerQueue } from "@/components/partner/PartnerQueue";

/**
 * Garage queue: accept offers and work assigned jobs. No dispatch/assign in
 * the pilot — POST /jobs/{id}/assign is admin-only.
 */
export function GarageJobQueue({ onChat }) {
  return <PartnerQueue title="Garage Queue" subtitle="Offers and assigned jobs" onChat={onChat} />;
}
