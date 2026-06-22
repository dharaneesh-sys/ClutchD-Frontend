"use client";

import { createContext, useContext } from "react";

export const DemoModeContext = createContext(null);

export function useDemoMode() {
  const ctx = useContext(DemoModeContext);
  if (!ctx) {
    return {
      isDemoMode: false,
      demoUser: null,
      demoRequest: null,
      isTourActive: false,
      tourStep: 0,
      tourLabel: "",
      tourStepsTotal: 0,
      mechanics: [],
      garages: [],
      vehicles: [],
      notifications: [],
      enableDemo: () => {},
      disableDemo: () => {},
      startTour: () => {},
      advanceTour: () => {},
      setDemoRole: () => {},
      createDemoRequest: () => null,
      advanceDemoRequestStatus: () => {},
    };
  }
  return ctx;
}
