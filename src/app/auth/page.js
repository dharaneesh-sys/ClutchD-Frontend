"use client";

import { useState } from "react";
import { LoginCard } from "@/components/auth/LoginCard";
import { SignUpCard } from "@/components/auth/SignUpCard";
export default function AuthPage() {
  const [isLoginView, setIsLoginView] = useState(true);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-8 relative overflow-hidden page-enter">
      <div className="w-full max-w-7xl grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center px-4 relative z-10">
        <div className="order-2 lg:order-1 flex flex-col justify-center text-center lg:text-left lg:pr-12">
          <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-6 backdrop-blur-md hidden sm:inline-flex bg-primary-soft border border-subtle">
              <span className="w-2 h-2 rounded-full bg-[var(--color-icon-highlight)]" />
              <span className="text-xs font-medium text-[var(--color-badge-text)]">Now live in Coimbatore</span>
            </div>

            <h1 className="text-5xl lg:text-7xl font-extrabold tracking-tight mb-6 leading-[1.1] text-foreground">
              Vehicle Service,<br />
              <span className="gradient-text">On Demand.</span>
            </h1>

            <p className="text-lg mb-10 max-w-xl mx-auto lg:mx-0 leading-relaxed text-on-surface-variant">
              Connect instantly with top-rated mechanics and premium garages nearby.
              Real-time tracking, transparent pricing, and trusted professionals.
            </p>

            <div className="grid grid-cols-2 gap-4 max-w-lg mx-auto lg:mx-0 text-left">
              {[
                { title: "24/7 Support", desc: "Always available" },
                { title: "Live Tracking", desc: "See mechanic on map" },
                { title: "Verified Pros", desc: "Background checked" },
                { title: "Upfront Pricing", desc: "No hidden fees" },
              ].map((feat, idx) => (
                <div
                  key={idx}
                  className={`glass-lux-interactive flex flex-col p-4 rounded-2xl backdrop-blur-sm`}
                >
                  <span className="font-semibold mb-1 text-[var(--color-text-primary)]">{feat.title}</span>
                  <span className="text-sm text-muted">{feat.desc}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="order-1 lg:order-2 flex flex-col items-center lg:items-end w-full">
          <div className="w-full flex justify-center lg:justify-end">
            {isLoginView ? (
              <LoginCard />
            ) : (
              <SignUpCard />
            )}
          </div>

          <div className="mt-6 text-center lg:text-right w-full lg:max-w-md lg:mr-2">
            <p className="text-muted">
              {isLoginView ? "Don\u0027t have an account?" : "Already have an account?"}
              <button
                onClick={() => setIsLoginView(!isLoginView)}
                className="ml-2 font-semibold transition-colors focus:outline-none text-[var(--primary-light)] hover:text-[var(--primary)]"
              >
                {isLoginView ? "Sign Up" : "Log In"}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
