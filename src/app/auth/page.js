"use client";

import { useState } from "react";
import { LoginCard } from "@/components/auth/LoginCard";
import { SignUpCard } from "@/components/auth/SignUpCard";
import { useAuthRedirect } from "@/hooks/useAuthRedirect";
export default function AuthPage() {
  // /auth?mode=signup opens the sign-up view directly — used by the
  // "Create an account" action on the login card after a 404 (unknown email).
  // Read at mount only: the primary toggle path is the onNeedSignUp callback,
  // so no Suspense-wrapped useSearchParams is needed (static-export safe).
  const [isLoginView, setIsLoginView] = useState(() => {
    if (typeof window === "undefined") return true;
    return new URLSearchParams(window.location.search).get("mode") !== "signup";
  });

  useAuthRedirect();

  return (
    <div className="min-h-[100dvh] bg-[var(--background)] px-4 pb-8 pt-[max(1.5rem,env(safe-area-inset-top))] sm:px-8 page-enter">
      <div className="mx-auto grid w-full max-w-6xl grid-cols-1 items-center gap-8 lg:min-h-[calc(100dvh-4rem)] lg:grid-cols-2 lg:gap-16">
        <div className="order-2 text-center lg:order-1 lg:pr-12 lg:text-left">
          <span className="mb-5 hidden items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface-card)] px-3 py-1.5 sm:inline-flex">
            <span aria-hidden="true" className="h-2 w-2 rounded-full bg-[var(--primary)]" />
            <span className="text-xs font-medium text-[var(--text-muted)]">Now live in Coimbatore</span>
          </span>

          <h1 className="mb-4 text-3xl font-bold leading-[1.15] tracking-tight text-[var(--foreground)] sm:text-4xl lg:text-5xl">
            Vehicle Service,<br />
            <span className="text-[var(--primary-dark)]">On Demand.</span>
          </h1>

          <p className="mx-auto mb-8 max-w-xl text-base leading-relaxed text-[var(--text-muted)] lg:mx-0">
            Connect instantly with top-rated mechanics and premium garages nearby.
            Real-time tracking, transparent pricing, and trusted professionals.
          </p>

          <div className="mx-auto grid max-w-lg grid-cols-2 gap-3 text-left lg:mx-0">
            {[
              { title: "24/7 Support", desc: "Always available" },
              { title: "Live Tracking", desc: "See mechanic on map" },
              { title: "Verified Pros", desc: "Background checked" },
              { title: "Upfront Pricing", desc: "No hidden fees" },
            ].map((feat) => (
              <div key={feat.title} className="surface-card flex flex-col p-4">
                <span className="mb-1 font-semibold text-[var(--foreground)]">{feat.title}</span>
                <span className="text-sm text-[var(--text-muted)]">{feat.desc}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="order-1 flex w-full flex-col items-center lg:order-2 lg:items-end">
          <div className="flex w-full justify-center lg:justify-end">
            {isLoginView ? (
              <LoginCard onNeedSignUp={setIsLoginView} />
            ) : (
              <SignUpCard />
            )}
          </div>

          <p className="mt-4 w-full text-center text-[var(--text-muted)] lg:max-w-md lg:text-right">
            {isLoginView ? "Don\u0027t have an account?" : "Already have an account?"}
            <button
              type="button"
              onClick={() => setIsLoginView(!isLoginView)}
              className="ml-1 min-h-[44px] px-1 font-semibold text-[var(--primary-dark)] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] rounded"
            >
              {isLoginView ? "Sign Up" : "Log In"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
