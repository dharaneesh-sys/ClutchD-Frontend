"use client";

import dynamic from "next/dynamic";

const DemoModeWrapper = dynamic(() => import("./DemoModeWrapper"), {
  ssr: false,
});

export default function DemoModeClient({ show }) {
  if (!show) return null;
  return <DemoModeWrapper />;
}
