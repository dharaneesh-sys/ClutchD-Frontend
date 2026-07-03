"use client";

import { useDemoMode } from "@/lib/demo/demoContext";
import dynamic from "next/dynamic";

const DemoModeWrapper = dynamic(() => import("./DemoModeWrapper"), {
  ssr: false,
});

export default function DemoModeClient({ show }) {
  const { isDemoMode } = useDemoMode();

  // Only render the demo toolbar when demo mode is actively enabled.
  // Once disabled from settings, the toolbar is fully removed from the DOM.
  if (!isDemoMode) return null;

  return <DemoModeWrapper />;
}
