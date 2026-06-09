"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LoginCard } from "../../components/auth/LoginCard";
import { SignUpCard } from "../../components/auth/SignUpCard";
import { PageTransition } from "../../components/ui/PageTransition";
import { useThemeStore } from "../../store/themeStore";

export default function AuthPage() {
  const [isLoginView, setIsLoginView] = useState(true);
  const { theme } = useThemeStore();
  const isLight = theme === "light";

  return (
    <PageTransition>
      <div className="min-h-screen flex items-center justify-center p-4 sm:p-8 relative overflow-hidden">
        <div
          className={`absolute -top-20 -left-20 w-[28rem] h-[28rem] rounded-full blur-[120px] pointer-events-none opacity-70 ${
            isLight ? "bg-yellow-400/30" : "bg-emerald-500/25"
          }`}
          style={{ animation: "float-drift 18s ease-in-out infinite" }}
        />
        <div
          className={`absolute top-[15%] right-[5%] w-[24rem] h-[24rem] rounded-full blur-[140px] pointer-events-none opacity-50 ${
            isLight ? "bg-amber-300/25" : "bg-teal-400/20"
          }`}
          style={{ animation: "float-drift 22s ease-in-out infinite 3s" }}
        />
        <div
          className={`absolute bottom-[10%] left-[15%] w-[20rem] h-[20rem] rounded-full blur-[100px] pointer-events-none opacity-40 ${
            isLight ? "bg-orange-300/20" : "bg-emerald-600/15"
          }`}
          style={{ animation: "float-drift 25s ease-in-out infinite 6s" }}
        />
        <div
          className={`absolute bottom-[5%] right-[20%] w-72 h-72 rounded-full blur-[110px] pointer-events-none opacity-35 ${
            isLight ? "bg-yellow-500/15" : "bg-cyan-400/10"
          }`}
          style={{ animation: "float-drift 20s ease-in-out infinite 9s" }}
        />

        <div className="w-full max-w-7xl grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center px-4 relative z-10">
          <div className="order-2 lg:order-1 flex flex-col justify-center text-center lg:text-left lg:pr-12">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            >
              <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-6 backdrop-blur-md hidden sm:inline-flex ${isLight ? "bg-yellow-500/10 border border-yellow-500/20" : "bg-white/5 border border-white/10"}`}>
                <span className={`w-2 h-2 rounded-full animate-pulse ${isLight ? "bg-yellow-500" : "bg-emerald-400"}`} />
                <span className={`text-xs font-medium ${isLight ? "text-yellow-800" : "text-emerald-100"}`}>Now live in Coimbatore</span>
              </div>

              <h1 className={`text-5xl lg:text-7xl font-extrabold tracking-tight mb-6 leading-[1.1] ${isLight ? "text-slate-900" : "text-white"}`}>
                Vehicle Service,<br />
                <span className="gradient-text">On Demand.</span>
              </h1>

              <p className={`text-lg mb-10 max-w-xl mx-auto lg:mx-0 leading-relaxed ${isLight ? "text-slate-600" : "text-emerald-100/80"}`}>
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
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.5 + idx * 0.1, ease: [0.23, 1, 0.32, 1] }}
                    className={`glass-lux-interactive flex flex-col p-4 rounded-2xl backdrop-blur-sm`}
                  >
                    <span className={`font-semibold mb-1 ${isLight ? "text-yellow-700" : "text-emerald-300"}`}>{feat.title}</span>
                    <span className={`text-sm ${isLight ? "text-slate-500" : "text-white/50"}`}>{feat.desc}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>

          <div className="order-1 lg:order-2 flex flex-col items-center lg:items-end w-full">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="w-full flex justify-center lg:justify-end"
            >
              <AnimatePresence mode="wait">
                {isLoginView ? (
                  <motion.div
                    key="login"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95, filter: "blur(10px)" }}
                    transition={{ duration: 0.3 }}
                    className="w-full flex justify-center lg:justify-end"
                  >
                    <LoginCard />
                  </motion.div>
                ) : (
                  <motion.div
                    key="signup"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95, filter: "blur(10px)" }}
                    transition={{ duration: 0.3 }}
                    className="w-full flex justify-center lg:justify-end"
                  >
                    <SignUpCard />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="mt-6 text-center lg:text-right w-full lg:max-w-md lg:mr-2"
            >
              <p className={isLight ? "text-slate-600" : "text-emerald-100/70"}>
                {isLoginView ? "Don\u0027t have an account?" : "Already have an account?"}
                <button
                  onClick={() => setIsLoginView(!isLoginView)}
                  className={`ml-2 font-semibold transition-colors focus:outline-none ${isLight ? "text-yellow-600 hover:text-yellow-700" : "text-emerald-400 hover:text-emerald-300"}`}
                >
                  {isLoginView ? "Sign Up" : "Log In"}
                </button>
              </p>
            </motion.div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
