"use client";

import dynamic from "next/dynamic";

const DemoToolbar = dynamic(() => import("./DemoToolbar").then((mod) => mod.DemoToolbar), { ssr: false });

export default function DemoModeWrapper() {
  return <DemoToolbar />;
}
