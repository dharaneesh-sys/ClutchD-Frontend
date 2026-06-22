"use client";

import { DemoModeProvider } from "@/lib/demo/demoModeProvider";
import { DemoToolbar } from "@/components/ui/DemoToolbar";

export default function DemoModeWrapper() {
  return (
    <DemoModeProvider>
      <DemoToolbar />
    </DemoModeProvider>
  );
}
