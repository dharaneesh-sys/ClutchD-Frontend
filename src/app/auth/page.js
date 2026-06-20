"use client";

import { useState } from "react";
import { LoginCard } from "@/components/auth/LoginCard";
import { SignUpCard } from "@/components/auth/SignUpCard";
import { useThemeStore } from "@/store/themeStore";

export default function AuthPage() {
  const [isLoginView, setIsLoginView] = useState(true);
  const { theme } = useThemeStore();
  const isLight = theme === "light";

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-8 relative overflow-hidden page-enter">
      <div className="w-full max-w-7xl grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center px-4 relative z-10">
        <div className="order-2 lg:order-1 flex flex-col justify-center text-center lg:text-left lg:pr-12">
          <div>
            <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-6 backdrop-blur-md hidden sm:inline-flex ${isLight ? "bg-yellow-500/10 border border-yellow-500/20" : "bg-white/5 border border-white/10"}`}>
              <span className={`w-2 h-2 rounded-full ${isLight ? "bg-yellow-500" : "bg-primary-light"}`} />
              <span className={`text-xs font-medium ${isLight ? "text-yellow-800" : "text-primary-light"}`}>Now live in Coimbatore</span>
            </div>

            <h1 className={`text-5xl lg:text-7xl font-extrabold tracking-tight mb-6 leading-[1.1] ${isLight ? "text-slate-900" : "text-white"}`}>
              Vehicle Service,<br />
              <span className="gradient-text">On Demand.</span>
            </h1>

            <p className={`text-lg mb-10 max-w-xl mx-auto lg:mx-0 leading-relaxed ${isLight ? "text-slate-600" : "text-primary-light/80"}`}>
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
                  <span className={`font-semibold mb-1 ${isLight ? "text-yellow-700" : "text-primary-light"}`}>{feat.title}</span>
                  <span className={`text-sm ${isLight ? "text-slate-500" : "text-white/50"}`}>{feat.desc}</span>
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
            <p className={isLight ? "text-slate-600" : "text-primary-light/70"}>
              {isLoginView ? "Don\u0027t have an account?" : "Already have an account?"}
              <button
                onClick={() => setIsLoginView(!isLoginView)}
                className={`ml-2 font-semibold transition-colors focus:outline-none ${isLight ? "text-yellow-600 hover:text-yellow-700" : "text-primary-light hover:text-primary"}`}
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
