"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useDemoMode } from "@/lib/demo/demoContext";
import { wsSimulator } from "@/lib/demo/wsSimulator";
import { resetDemoState } from "@/lib/demo/apiInterceptor";
import { DemoToggle } from "@/components/ui/demo/DemoToggle";
import { RoleSelector } from "@/components/ui/demo/RoleSelector";
import { TourStepper } from "@/components/ui/demo/TourStepper";

export function DemoToolbar() {
  const router = useRouter();
  const {
    isDemoMode,
    demoUser,
    isTourActive,
    tourStep,
    tourLabel,
    tourStepsTotal,
    enableDemo,
    disableDemo,
    startTour,
    advanceTour,
    setDemoRole,
    createDemoRequest,
    advanceDemoRequestStatus,
  } = useDemoMode();

  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    if (!isDemoMode || !demoUser) return;
    const role = demoUser.role;
    if (role === "admin") {
      router.push("/admin");
    } else if (role === "mechanic") {
      router.push("/dashboard/mechanic");
    } else if (role === "garage") {
      router.push("/dashboard/garage");
    } else if (role === "customer") {
      router.push("/dashboard/customer");
    }
  }, [demoUser?.role, isDemoMode, router]);

  // Sync wsSimulator on toggle
  useEffect(() => {
    if (isDemoMode) {
      if (!wsSimulator.isActive()) {
        wsSimulator.start();
      }
    } else {
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

  if (collapsed) {
    return (
      <>
        <style>{`
          @keyframes demoPillPulse {
            0%, 100% { box-shadow: 0 0 4px rgba(255,255,255,0.06); }
            50% { box-shadow: 0 0 14px rgba(255,255,255,0.2); }
          }
          .demo-pill-pulse {
            animation: demoPillPulse 3s ease-in-out infinite;
          }
        `}</style>
        <button
          onClick={() => setCollapsed(false)}
          className="fixed bottom-24 right-4 z-[9999] glass-lux-interactive hover-glow active-press px-2.5 py-1.5 flex items-center gap-1.5 rounded-full demo-pill-pulse"
          title="Expand Demo Toolbar"
        >
          {isDemoMode && (
            <span className="inline-block w-2 h-2 rounded-full bg-[var(--primary)]" />
          )}
          <span
            className={`type-label-1 uppercase tracking-widest text-[11px] ${
              isDemoMode
                ? "text-[var(--primary)]"
                : "text-[var(--on-surface-variant)]"
            }`}
          >
            Demo
          </span>
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-[var(--on-surface-variant)]"
          >
            <polyline points="18 15 12 9 6 15" />
          </svg>
        </button>
      </>
    );
  }

  return (
    <div className="fixed bottom-24 right-4 z-[9999] w-[min(92vw,420px)]">
      <div className="glass-lux-strong p-0 overflow-visible">
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--glass-lux-border)]">
          <DemoToggle isDemoMode={isDemoMode} onToggle={handleToggle} />

          <div className="flex items-center gap-2">
            {isDemoMode && (
              <RoleSelector
                demoUser={demoUser}
                onRoleChange={handleRoleChange}
              />
            )}

            <button
              onClick={() => setCollapsed(true)}
              className="glass-lux-interactive p-1.5 active-press rounded-lg text-[var(--on-surface-variant)]"
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

        {isDemoMode && (
          <TourStepper
            isTourActive={isTourActive}
            tourStep={tourStep}
            tourStepsTotal={tourStepsTotal}
            tourLabel={tourLabel}
            onPrev={handlePrevTourStep}
            onNext={handleNextTourStep}
            onStart={handleStartTour}
            onCreateRequest={handleCreateRequest}
            onAdvanceStatus={handleAdvanceStatus}
            onReset={handleReset}
          />
        )}
      </div>
    </div>
  );
}
