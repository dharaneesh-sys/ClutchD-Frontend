"use client";

import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useDemoMode } from "@/lib/demo/demoMode";
import { wsSimulator } from "@/lib/demo/wsSimulator";
import { resetDemoState } from "@/lib/demo/apiInterceptor";

const ROLES = [
  { value: "customer", label: "Customer", icon: "👤" },
  { value: "mechanic", label: "Mechanic", icon: "🔧" },
  { value: "garage", label: "Garage", icon: "🏭" },
];

const TOUR_STEPS_TOTAL = 6;

export function DemoToolbar() {
  const {
    isDemoMode,
    demoUser,
    isTourActive,
    tourStep,
    enableDemo,
    disableDemo,
    startTour,
    advanceTour,
    setDemoRole,
    createDemoRequest,
    advanceDemoRequestStatus,
  } = useDemoMode();

  const [collapsed, setCollapsed] = useState(false);
  const [roleOpen, setRoleOpen] = useState(false);

  // Sync window.__DEMO_MODE__ and wsSimulator on toggle
  useEffect(() => {
    if (isDemoMode) {
      window.__DEMO_MODE__ = true;
      if (!wsSimulator.isActive()) {
        wsSimulator.start();
      }
    } else {
      window.__DEMO_MODE__ = false;
      if (wsSimulator.isActive()) {
        wsSimulator.stop();
      }
      resetDemoState();
    }
  }, [isDemoMode]);

  const handleToggle = useCallback(() => {
    if (isDemoMode) {
      disableDemo();
    } else {
      enableDemo("customer");
    }
  }, [isDemoMode, enableDemo, disableDemo]);

  const handleRoleChange = useCallback(
    (role) => {
      setDemoRole(role);
      setRoleOpen(false);
    },
    [setDemoRole]
  );

  const handleCreateRequest = useCallback(() => {
    createDemoRequest();
  }, [createDemoRequest]);

  const handleAdvanceStatus = useCallback(() => {
    advanceDemoRequestStatus();
  }, [advanceDemoRequestStatus]);

  const handleReset = useCallback(() => {
    disableDemo();
    // Brief delay then re-enable fresh
    setTimeout(() => {
      enableDemo("customer");
    }, 150);
  }, [disableDemo, enableDemo]);

  const handleStartTour = useCallback(() => {
    startTour();
  }, [startTour]);

  const handleNextTourStep = useCallback(() => {
    advanceTour();
  }, [advanceTour]);

  const handlePrevTourStep = useCallback(() => {
    // Tour doesn't expose a go-back, so we restart
    startTour();
  }, [startTour]);

  const activeRole = ROLES.find((r) => r.value === demoUser?.role) || ROLES[0];

  if (collapsed) {
    return (
      <motion.button
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0, opacity: 0 }}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.95 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
        onClick={() => setCollapsed(false)}
        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 glass-lux-interactive hover-glow active-press px-4 py-2.5 flex items-center gap-2.5"
        style={{ borderRadius: "999px" }}
        title="Expand Demo Toolbar"
      >
        {isDemoMode && (
          <span
            className="inline-block w-2 h-2 rounded-full animate-pulse"
            style={{ backgroundColor: "var(--primary)" }}
          />
        )}
        <span
          className="type-label-1 uppercase tracking-widest"
          style={{ color: isDemoMode ? "var(--primary)" : "var(--on-surface-variant)" }}
        >
          Demo
        </span>
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ color: "var(--on-surface-variant)" }}
        >
          <polyline points="18 15 12 9 6 15" />
        </svg>
      </motion.button>
    );
  }

  return (
    <AnimatePresence>
      <motion.div
        key="demo-toolbar"
        initial={{ y: 80, opacity: 0, scale: 0.92 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 80, opacity: 0, scale: 0.92 }}
        transition={{ type: "spring", stiffness: 320, damping: 30 }}
        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[min(92vw,540px)]"
      >
        <div className="glass-lux-strong glass-lux-border-animated p-0 overflow-visible">
          <div className="flex items-center justify-between px-4 py-3 border-b"
            style={{ borderColor: "var(--glass-lux-border)" }}
          >
            <div className="flex items-center gap-3">
              <button
                onClick={handleToggle}
                className="relative inline-flex h-7 w-12 items-center rounded-full transition-colors duration-300 focus-lux"
                style={{
                  backgroundColor: isDemoMode
                    ? "var(--primary)"
                    : "rgba(var(--color-white-rgb), 0.08)",
                }}
                aria-label={`Toggle demo mode ${isDemoMode ? "off" : "on"}`}
              >
                <motion.span
                  layout
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  className="inline-block h-5 w-5 rounded-full shadow-md"
                  style={{
                    backgroundColor: "#fff",
                    marginLeft: isDemoMode ? "auto" : "3px",
                    marginRight: isDemoMode ? "3px" : "auto",
                  }}
                />
              </button>

              <span className="type-title-3 select-none" style={{ color: "var(--foreground)" }}>
                Demo Mode
              </span>

              <AnimatePresence>
                {isDemoMode && (
                  <motion.span
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 500, damping: 25 }}
                    className="type-label-2 uppercase px-2 py-0.5 rounded-full animate-pulse border-rotate"
                    style={{
                      backgroundColor: "rgba(var(--color-primary-rgb), 0.12)",
                      color: "var(--primary)",
                      border: "1px solid rgba(var(--color-primary-rgb), 0.2)",
                    }}
                  >
                    Demo
                  </motion.span>
                )}
              </AnimatePresence>
            </div>

            <div className="flex items-center gap-2">
              {isDemoMode && (
                <motion.div
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 12 }}
                  className="relative"
                >
                  <button
                    onClick={() => setRoleOpen(!roleOpen)}
                    className="glass-lux-interactive px-3 py-1.5 type-label-1 flex items-center gap-1.5"
                    style={{
                      borderRadius: "0.5rem",
                      color: "var(--foreground)",
                    }}
                  >
                    <span>{activeRole.icon}</span>
                    <span>{activeRole.label}</span>
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      style={{
                        color: "var(--on-surface-variant)",
                        transform: roleOpen ? "rotate(180deg)" : "rotate(0deg)",
                        transition: "transform 0.2s ease",
                      }}
                    >
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </button>

                  <AnimatePresence>
                    {roleOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -8, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -8, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="absolute bottom-full mb-2 right-0 w-40 glass-lux-strong overflow-hidden"
                        style={{ borderRadius: "0.75rem", zIndex: 60 }}
                      >
                        {ROLES.map((role) => (
                          <button
                            key={role.value}
                            onClick={() => handleRoleChange(role.value)}
                            className="w-full text-left px-3 py-2.5 type-body-2 flex items-center gap-2 transition-colors"
                            style={{
                              color:
                                role.value === demoUser?.role
                                  ? "var(--primary)"
                                  : "var(--on-surface)",
                              backgroundColor:
                                role.value === demoUser?.role
                                  ? "rgba(var(--color-primary-rgb), 0.08)"
                                  : "transparent",
                            }}
                            onMouseEnter={(e) => {
                              if (role.value !== demoUser?.role) {
                                e.currentTarget.style.backgroundColor = "rgba(var(--color-white-rgb), 0.04)";
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (role.value !== demoUser?.role) {
                                e.currentTarget.style.backgroundColor = "transparent";
                              }
                            }}
                          >
                            <span>{role.icon}</span>
                            <span>{role.label}</span>
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )}

              <button
                onClick={() => setCollapsed(true)}
                className="glass-lux-interactive p-1.5 active-press"
                style={{ borderRadius: "0.5rem", color: "var(--on-surface-variant)" }}
                title="Minimize toolbar"
                aria-label="Minimize demo toolbar"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>
            </div>
          </div>

          <AnimatePresence>
            {isDemoMode && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
                className="overflow-hidden"
              >
                <div className="px-4 py-3 space-y-3">
                  <AnimatePresence>
                    {isTourActive && (
                      <motion.div
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        className="flex items-center justify-between px-3 py-2"
                        style={{
                          backgroundColor: "rgba(var(--color-primary-rgb), 0.06)",
                          borderRadius: "0.625rem",
                          border: "1px solid rgba(var(--color-primary-rgb), 0.1)",
                        }}
                      >
                        <button
                          onClick={handlePrevTourStep}
                          className="glass-lux-interactive px-2 py-1 active-press"
                          style={{ borderRadius: "0.375rem", color: "var(--on-surface-variant)" }}
                          aria-label="Previous step"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="15 18 9 12 15 6" />
                          </svg>
                        </button>

                        <div className="flex items-center gap-2">
                          <span className="type-label-1" style={{ color: "var(--primary)" }}>
                            Step {tourStep + 1}/{TOUR_STEPS_TOTAL}
                          </span>
                          <div className="flex items-center gap-1">
                            {Array.from({ length: TOUR_STEPS_TOTAL }).map((_, i) => (
                              <span
                                key={i}
                                className="inline-block w-1.5 h-1.5 rounded-full transition-all duration-300"
                                style={{
                                  backgroundColor:
                                    i <= tourStep
                                      ? "var(--primary)"
                                      : "rgba(var(--color-white-rgb), 0.12)",
                                  transform: i === tourStep ? "scale(1.3)" : "scale(1)",
                                }}
                              />
                            ))}
                          </div>
                        </div>

                        <button
                          onClick={handleNextTourStep}
                          className="glass-lux-interactive px-2 py-1 active-press"
                          style={{ borderRadius: "0.375rem", color: "var(--primary)" }}
                          aria-label="Next step"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="9 18 15 12 9 6" />
                          </svg>
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="flex items-center gap-2">
                    {!isTourActive && (
                      <motion.button
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={handleStartTour}
                        className="glass-lux-interactive hover-lift active-press px-4 py-2 type-label-1 flex items-center gap-2 flex-1 justify-center"
                        style={{
                          borderRadius: "0.625rem",
                          color: "var(--primary)",
                          border: "1px solid rgba(var(--color-primary-rgb), 0.15)",
                        }}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="10" />
                          <polygon points="10 8 16 12 10 16 10 8" fill="currentColor" stroke="none" />
                        </svg>
                        Investor Tour
                      </motion.button>
                    )}

                    {!isTourActive && (
                      <>
                        <motion.button
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.05 }}
                          whileHover={{ scale: 1.04 }}
                          whileTap={{ scale: 0.96 }}
                          onClick={handleCreateRequest}
                          className="glass-lux-interactive hover-lift active-press px-3 py-2 type-label-1 flex items-center gap-1.5"
                          style={{
                            borderRadius: "0.625rem",
                            color: "var(--on-surface)",
                          }}
                        >
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="12" y1="5" x2="12" y2="19" />
                            <line x1="5" y1="12" x2="19" y2="12" />
                          </svg>
                          Create
                        </motion.button>

                        <motion.button
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.1 }}
                          whileHover={{ scale: 1.04 }}
                          whileTap={{ scale: 0.96 }}
                          onClick={handleAdvanceStatus}
                          className="glass-lux-interactive hover-lift active-press px-3 py-2 type-label-1 flex items-center gap-1.5"
                          style={{
                            borderRadius: "0.625rem",
                            color: "var(--on-surface)",
                          }}
                        >
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="13 17 18 12 13 7" />
                            <polyline points="6 17 11 12 6 7" />
                          </svg>
                          Advance
                        </motion.button>

                        <motion.button
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.15 }}
                          whileHover={{ scale: 1.04 }}
                          whileTap={{ scale: 0.96 }}
                          onClick={handleReset}
                          className="glass-lux-interactive hover-lift active-press px-3 py-2 type-label-1 flex items-center gap-1.5"
                          style={{
                            borderRadius: "0.625rem",
                            color: "var(--danger)",
                          }}
                        >
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="1 4 1 10 7 10" />
                            <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
                          </svg>
                          Reset
                        </motion.button>
                      </>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
