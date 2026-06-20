"use client";

import { createContext, useContext, useState, useCallback, useRef, useEffect } from "react";
import {
  MOCK_USERS,
  MOCK_MECHANICS,
  MOCK_GARAGES,
  MOCK_VEHICLES,
  MOCK_NOTIFICATIONS,
  DEMO_SERVICE_STATUSES,
  createMockServiceRequest,
} from "@/lib/demo/mockData";
import { useAuthStore } from "@/store/authStore";
import { useServiceStore } from "@/store/serviceStore";
import { useTrackingStore } from "@/store/trackingStore";

const DemoModeContext = createContext(null);

// Per-role guided tour steps showcasing every feature
const ROLE_TOURS = {
  customer: [
    "Explore live map of nearby mechanics and garages",
    "Add a vehicle to your profile (make, model, plate)",
    "Create a service request — describe your issue and get price estimates",
    "Track the mechanic en-route with real-time location updates",
    "Review invoice, complete payment via UPI or card",
    "Rate the service and leave a review",
  ],
  mechanic: [
    "Toggle your availability to receive incoming job requests",
    "View your job queue with customer details and location",
    "Accept a job and navigate to the customer's location",
    "Update job status as you perform the service",
    "Complete the job and receive payment confirmation",
    "Check your earnings history and completed jobs",
  ],
  garage: [
    "View and update your garage business profile",
    "Browse the current job queue assigned to your garage",
    "Assign jobs to mechanics in your team",
    "Track all active jobs across your team in real-time",
    "View business analytics — jobs completed, revenue, ratings",
    "Review earnings breakdown and team performance",
  ],
  admin: [
    "View platform-wide statistics — users, mechanics, garages, revenue",
    "Browse all registered users on the platform",
    "Manage mechanics — verify, review, and monitor activity",
    "Review garages — performance, ratings, compliance",
    "Monitor all jobs across the platform in real-time",
    "View payment transactions, disputes, and KYC status",
  ],
};

const TOUR_STEPS_TOTAL = 6;

export function DemoModeProvider({ children }) {
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [demoUser, setDemoUser] = useState(null);
  const [demoRequest, setDemoRequest] = useState(null);
  const [isTourActive, setIsTourActive] = useState(false);
  const [tourStep, setTourStep] = useState(0);

  // Stable refs for mock data (persist across renders)
  const mechanicsRef = useRef([...MOCK_MECHANICS]);
  const garagesRef = useRef([...MOCK_GARAGES]);
  const stepTimeoutsRef = useRef([]);
  const vehiclesRef = useRef([...MOCK_VEHICLES]);
  const notificationsRef = useRef([...MOCK_NOTIFICATIONS]);

  const enableDemo = useCallback((role = "customer") => {
    const user =
      role === "mechanic"
        ? MOCK_USERS.mechanic
        : role === "garage"
          ? MOCK_USERS.garage
          : role === "admin"
            ? MOCK_USERS.admin
            : MOCK_USERS.customer;
    setDemoUser(user);
    setIsDemoMode(true);
    useAuthStore.getState().setDemoUser(user);
    if (typeof window !== "undefined") {
      window.__DEMO_MODE__ = true;
      window.__DEMO_USER__ = user;
      sessionStorage.setItem("demo_token", "demo-jwt-token-12345");
      import("../tokenStore").then((m) => {
        m.setDemoAccessToken("demo-jwt-token-12345");
      });
    }
  }, []);

  const disableDemo = useCallback(() => {
    setIsDemoMode(false);
    setDemoUser(null);
    setDemoRequest(null);
    setIsTourActive(false);
    setTourStep(0);
    useAuthStore.getState().setDemoUser(null);
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
    const role = demoUser?.role || "customer";
    // Create a service request for customer tour; for other roles just advance steps
    if (role === "customer") {
      setDemoRequest(createMockServiceRequest());
    }
  }, [demoUser, createMockServiceRequest]);

  const advanceTour = useCallback(() => {
    const total = (ROLE_TOURS[demoUser?.role] || ROLE_TOURS.customer).length;
    const nextStep = tourStep + 1;
    if (nextStep >= total) {
      setIsTourActive(false);
      setTourStep(0);
    } else {
      setTourStep(nextStep);
    }
  }, [demoUser, tourStep]);

  // Tour step side effects: push store updates so UI components react to tour progression
  useEffect(() => {
    if (!isTourActive || !demoUser) return;

    stepTimeoutsRef.current.forEach(clearTimeout);
    stepTimeoutsRef.current = [];

    const role = demoUser.role;
    const step = tourStep;

    if (role === "customer") {
      // Step 1: Show live map with nearby mechanics & garages
      if (step === 1) {
        useTrackingStore.getState().setUserLocation([11.0208, 76.9558]);
        useTrackingStore.setState({
          nearbyMechanics: MOCK_MECHANICS.filter((m) => m.available),
          nearbyGarages: MOCK_GARAGES,
        });
      }
      // Step 2: Create a service request (status = "searching")
      else if (step === 2) {
        const req = createMockServiceRequest();
        setDemoRequest(req);
        useServiceStore.setState({ activeRequest: req });
      }
      // Step 3: Track the mechanic — auto-advance through assigned → en_route → in_progress
      else if (step === 3) {
        const mechanic = MOCK_MECHANICS[0];
        setDemoRequest((prev) => (prev ? { ...prev, mechanic, status: "assigned" } : prev));
        useServiceStore.setState((s) => ({
          activeRequest: s.activeRequest ? { ...s.activeRequest, mechanic, status: "assigned" } : null,
        }));
        const t1 = setTimeout(() => {
          useTrackingStore.getState().setMechanicLocation([11.022, 76.958]);
          useServiceStore.setState((s) => ({
            activeRequest: s.activeRequest ? { ...s.activeRequest, status: "en_route" } : null,
          }));
        }, 1000);
        const t2 = setTimeout(() => {
          useServiceStore.setState((s) => ({
            activeRequest: s.activeRequest ? { ...s.activeRequest, status: "in_progress" } : null,
          }));
        }, 2500);
        stepTimeoutsRef.current.push(t1, t2);
      }
      // Step 4: Review invoice + complete payment via UPI or card
      else if (step === 4) {
        const pricing = {
          totalAmount: 850,
          serviceAmount: 570,
          convenienceFee: 50,
          cancellationFee: 0,
          distanceKm: 3.2,
          distanceFee: 100,
          gstAmount: 130,
        };
        setDemoRequest((prev) => (prev ? { ...prev, status: "payment_pending", pricing } : prev));
        useServiceStore.setState((s) => ({
          activeRequest: s.activeRequest ? { ...s.activeRequest, status: "payment_pending", pricing } : null,
        }));
      }
      // Step 5: Complete job + leave a review
      else if (step === 5) {
        useServiceStore.getState().completeRequest({
          method: "upi",
          amount: 850,
          transactionId: "TXN-DEMO-" + Date.now(),
        });
      }
    } else if (role === "mechanic") {
      if (step === 1) {
        useTrackingStore.getState().setUserLocation([11.0208, 76.9558]);
      }
    }
  }, [tourStep, isTourActive, demoUser]);

  const setDemoRole = useCallback((role) => {
    const user =
      role === "mechanic"
        ? MOCK_USERS.mechanic
        : role === "garage"
          ? MOCK_USERS.garage
          : role === "admin"
            ? MOCK_USERS.admin
            : MOCK_USERS.customer;
    setDemoUser(user);
    useAuthStore.getState().setDemoUser(user);
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

  // Current tour step label derived from active role
  const tourLabel = isTourActive
    ? (ROLE_TOURS[demoUser?.role] || ROLE_TOURS.customer)[tourStep] || ""
    : "";
  const tourStepsTotal = (ROLE_TOURS[demoUser?.role] || ROLE_TOURS.customer).length;

  const value = {
    isDemoMode,
    demoUser,
    demoRequest,
    isTourActive,
    tourStep,
    tourLabel,
    tourStepsTotal,
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
