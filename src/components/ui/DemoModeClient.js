"use client";

import dynamic from "next/dynamic";

const DemoModeWrapper = dynamic(() => import("./DemoModeWrapper"), {
  ssr: false,
});

export default function DemoModeClient({ show }) {
  // Always render the toolbar (collapsed pill at top-right) regardless of DEMO_MODE flag.
  // The built-in toggle inside the toolbar lets you enable/disable demo features.
  // When demo mode is off, the toolbar stays as a small "Demo" pill.
  return <DemoModeWrapper />;
}
