"use client";

import { createContext, useContext, useState, useCallback, useRef } from "react";
import {
  MOCK_USERS,
  MOCK_MECHANICS,
  MOCK_GARAGES,
  MOCK_VEHICLES,
  MOCK_NOTIFICATIONS,
  DEMO_SERVICE_STATUSES,
  createMockServiceRequest,
} from "./mockData";

const DemoModeContext = createContext(null);

export function DemoModeProvider({ children }) {
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [demoUser, setDemoUser] = useState(null);
  const [demoRequest, setDemoRequest] = useState(null);
  const [isTourActive, setIsTourActive] = useState(false);
  const [tourStep, setTourStep] = useState(0);

  // Stable refs for mock data (persist across renders)
  const mechanicsRef = useRef([...MOCK_MECHANICS]);
  const garagesRef = useRef([...MOCK_GARAGES]);
  const vehiclesRef = useRef([...MOCK_VEHICLES]);
  const notificationsRef = useRef([...MOCK_NOTIFICATIONS]);

  const enableDemo = useCallback((role = "customer") => {
    const user =
      role === "mechanic"
        ? MOCK_USERS.mechanic
        : role === "garage"
          ? MOCK_USERS.garage
          : MOCK_USERS.customer;
    setDemoUser(user);
    setIsDemoMode(true);
    // Signal the API interceptor
    if (typeof window !== "undefined") {
      window.__DEMO_MODE__ = true;
      window.__DEMO_USER__ = user;
      sessionStorage.setItem("demo_token", "demo-jwt-token-12345");
      // Dynamically set token in tokenStore
      import("../tokenStore").then((m) => {
        m.setAccessToken("demo-jwt-token-12345");
      });
    }
  }, []);

  const disableDemo = useCallback(() => {
    setIsDemoMode(false);
    setDemoUser(null);
    setDemoRequest(null);
    setIsTourActive(false);
    setTourStep(0);
    if (typeof window !== "undefined") {
      window.__DEMO_MODE__ = false;
      window.__DEMO_USER__ = null;
      sessionStorage.removeItem("demo_token");
      import("../tokenStore").then((m) => {
        m.clearAccessToken();
      });
    }
  }, []);

  const startTour = useCallback(() => {
    setIsTourActive(true);
    setTourStep(0);
    setDemoRequest(createMockServiceRequest());
  }, []);

  const advanceTour = useCallback(() => {
    setTourStep((prev) => {
      const next = prev + 1;
      if (next >= 1 && next <= DEMO_SERVICE_STATUSES.length) {
        setDemoRequest((prevReq) =>
          prevReq
            ? {
                ...prevReq,
                status: DEMO_SERVICE_STATUSES[next - 1],
                mechanic: next >= 2 ? MOCK_MECHANICS[0] : null,
                pricing:
                  DEMO_SERVICE_STATUSES[next - 1] === "payment_pending"
                    ? { totalAmount: 850, partsCost: 350, laborCost: 500, tax: 0 }
                    : prevReq.pricing,
              }
            : prevReq,
        );
      }
      return next;
    });
  }, []);

  const setDemoRole = useCallback((role) => {
    const user =
      role === "mechanic"
        ? MOCK_USERS.mechanic
        : role === "garage"
          ? MOCK_USERS.garage
          : MOCK_USERS.customer;
    setDemoUser(user);
    if (typeof window !== "undefined") {
      window.__DEMO_USER__ = user;
    }
    setDemoRequest(null);
  }, []);

  const createDemoRequest = useCallback((overrides = {}) => {
    const req = createMockServiceRequest(overrides);
    setDemoRequest(req);
    return req;
  }, []);

  const advanceDemoRequestStatus = useCallback(() => {
    setDemoRequest((prev) => {
      if (!prev) return prev;
      const idx = DEMO_SERVICE_STATUSES.indexOf(prev.status);
      if (idx < DEMO_SERVICE_STATUSES.length - 1) {
        const nextStatus = DEMO_SERVICE_STATUSES[idx + 1];
        return {
          ...prev,
          status: nextStatus,
          mechanic: idx === 0 ? MOCK_MECHANICS[0] : prev.mechanic,
          pricing:
            nextStatus === "payment_pending"
              ? { totalAmount: 850, partsCost: 350, laborCost: 500, tax: 0 }
              : prev.pricing,
        };
      }
      return prev;
    });
  }, []);

  const value = {
    isDemoMode,
    demoUser,
    demoRequest,
    isTourActive,
    tourStep,
    mechanics: mechanicsRef.current,
    garages: garagesRef.current,
    vehicles: vehiclesRef.current,
    notifications: notificationsRef.current,
    enableDemo,
    disableDemo,
    startTour,
    advanceTour,
    setDemoRole,
    createDemoRequest,
    advanceDemoRequestStatus,
  };

  return <DemoModeContext.Provider value={value}>{children}</DemoModeContext.Provider>;
}

export function useDemoMode() {
  const ctx = useContext(DemoModeContext);
  if (!ctx) throw new Error("useDemoMode must be used within DemoModeProvider");
  return ctx;
}
