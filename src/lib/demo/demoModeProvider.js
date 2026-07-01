"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { DemoModeContext } from "@/lib/demo/demoContext";
import { useAuthStore } from "@/store/authStore";
import { useServiceStore } from "@/store/serviceStore";
import { useTrackingStore } from "@/store/trackingStore";

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

const DEMO_USERS = {
  customer: {
    id: "demo-cust-1",
    email: "demo@clutchd.in",
    name: "Arun Kumar",
    phone: "+91 98765 43210",
    role: "customer",
    isVerified: true,
  },
  mechanic: {
    id: "demo-mech-1",
    email: "mechanic@clutchd.in",
    name: "Rajesh M.",
    phone: "+91 98765 43211",
    role: "mechanic",
    isVerified: true,
  },
  garage: {
    id: "demo-garage-1",
    email: "garage@clutchd.in",
    name: "Priya Auto Works",
    phone: "+91 98765 43212",
    role: "garage",
    businessName: "Priya Auto Works",
    isVerified: true,
  },
  admin: {
    id: "demo-admin-1",
    email: "admin@clutchd.in",
    name: "Admin",
    role: "admin",
  },
};

let _mockPromise = null;
let _mock = {};

async function _ensureMock() {
  if (!_mockPromise) {
    _mockPromise = import("@/lib/demo/mockData");
    const m = await _mockPromise;
    _mock = m;
  }
  return _mock;
}

export function DemoModeProvider({ children }) {
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [demoUser, setDemoUser] = useState(null);
  const [demoRequest, setDemoRequest] = useState(null);
  const [isTourActive, setIsTourActive] = useState(false);
  const [tourStep, setTourStep] = useState(0);

  const mechanicsRef = useRef([]);
  const garagesRef = useRef([]);
  const stepTimeoutsRef = useRef([]);
  const vehiclesRef = useRef([]);
  const notificationsRef = useRef([]);

  // Preload mock once on mount — dynamic import keeps it out of critical bundle.
  useEffect(() => {
    _ensureMock().then((m) => {
      mechanicsRef.current = m.MOCK_MECHANICS ? [...m.MOCK_MECHANICS] : [];
      garagesRef.current = m.MOCK_GARAGES ? [...m.MOCK_GARAGES] : [];
      vehiclesRef.current = m.MOCK_VEHICLES ? [...m.MOCK_VEHICLES] : [];
      notificationsRef.current = m.MOCK_NOTIFICATIONS ? [...m.MOCK_NOTIFICATIONS] : [];
    });
  }, []);

  const getM = () => _mock;

  const enableDemo = useCallback((role = "customer") => {
    const user = DEMO_USERS[role] || DEMO_USERS.customer;
    setDemoUser(user);
    setIsDemoMode(true);
    useAuthStore.getState().setDemoUser(user);
    if (typeof window !== "undefined") {
      window.__DEMO_USER__ = user;
      sessionStorage.setItem("demo_token", "demo-jwt-token-12345");
      import("../tokenStore").then((t) => {
        t.setDemoAccessToken("demo-jwt-token-12345");
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
      window.__DEMO_USER__ = null;
      sessionStorage.removeItem("demo_token");
      import("../tokenStore").then((t) => {
        t.clearAccessToken();
      });
    }
  }, []);

  const startTour = useCallback(() => {
    const m = getM();
    setIsTourActive(true);
    setTourStep(0);
    const role = demoUser?.role || "customer";
    if (role === "customer" && m.createMockServiceRequest) {
      setDemoRequest(m.createMockServiceRequest());
    }
  }, [demoUser]);

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

  useEffect(() => {
    if (!isTourActive || !demoUser) return;

    stepTimeoutsRef.current.forEach(clearTimeout);
    stepTimeoutsRef.current = [];
    const m = getM();
    const role = demoUser.role;
    const step = tourStep;

    if (role === "customer") {
      if (step === 1) {
        useTrackingStore.getState().setUserLocation([11.0208, 76.9558]);
        useTrackingStore.setState({
          nearbyMechanics: m.MOCK_MECHANICS
            ? m.MOCK_MECHANICS.filter((mec) => mec.available)
            : [],
          nearbyGarages: m.MOCK_GARAGES || [],
        });
      } else if (step === 2) {
        if (m.createMockServiceRequest) {
          const req = m.createMockServiceRequest();
          setDemoRequest(req);
          useServiceStore.setState({ activeRequest: req });
        }
      } else if (step === 3) {
        if (m.MOCK_MECHANICS) {
          const mechanic = m.MOCK_MECHANICS[0];
          setDemoRequest((prev) =>
            prev ? { ...prev, mechanic, status: "assigned" } : prev
          );
          useServiceStore.setState((s) => ({
            activeRequest: s.activeRequest
              ? { ...s.activeRequest, mechanic, status: "assigned" }
              : null,
          }));
          const t1 = setTimeout(() => {
            useTrackingStore.getState().setMechanicLocation([11.022, 76.958]);
            useServiceStore.setState((s) => ({
              activeRequest: s.activeRequest
                ? { ...s.activeRequest, status: "en_route" }
                : null,
            }));
          }, 1000);
          const t2 = setTimeout(() => {
            useServiceStore.setState((s) => ({
              activeRequest: s.activeRequest
                ? { ...s.activeRequest, status: "in_progress" }
                : null,
            }));
          }, 2500);
          stepTimeoutsRef.current.push(t1, t2);
        }
      } else if (step === 4) {
        const pricing = {
          totalAmount: 850,
          serviceAmount: 570,
          convenienceFee: 50,
          cancellationFee: 0,
          distanceKm: 3.2,
          distanceFee: 100,
          gstAmount: 130,
        };
        setDemoRequest((prev) =>
          prev ? { ...prev, status: "payment_pending", pricing } : prev
        );
        useServiceStore.setState((s) => ({
          activeRequest: s.activeRequest
            ? { ...s.activeRequest, status: "payment_pending", pricing }
            : null,
        }));
      } else if (step === 5) {
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
    const user = DEMO_USERS[role] || DEMO_USERS.customer;
    setDemoUser(user);
    useAuthStore.getState().setDemoUser(user);
    if (typeof window !== "undefined") {
      window.__DEMO_USER__ = user;
    }
    setDemoRequest(null);
  }, []);

  const createDemoRequest = useCallback((overrides = {}) => {
    const m = getM();
    if (!m.createMockServiceRequest) return null;
    const req = m.createMockServiceRequest(overrides);
    setDemoRequest(req);
    return req;
  }, []);

  const advanceDemoRequestStatus = useCallback(() => {
    setDemoRequest((prev) => {
      if (!prev) return prev;
      const m = getM();
      const statuses = m.DEMO_SERVICE_STATUSES || [];
      const idx = statuses.indexOf(prev.status);
      if (idx < statuses.length - 1) {
        const nextStatus = statuses[idx + 1];
        return {
          ...prev,
          status: nextStatus,
          mechanic: idx === 0 && m.MOCK_MECHANICS ? m.MOCK_MECHANICS[0] : prev.mechanic,
          pricing:
            nextStatus === "payment_pending"
              ? { totalAmount: 850, partsCost: 350, laborCost: 500, tax: 0 }
              : prev.pricing,
        };
      }
      return prev;
    });
  }, []);

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
