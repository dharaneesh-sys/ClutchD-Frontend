"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { PageTransition } from "../components/ui/PageTransition";
import { ArrowRight, Shield, Zap, MapPin, Clock } from "lucide-react";

const staggerContainer = {
  animate: {
    transition: { staggerChildren: 0.1 },
  },
};

const staggerItem = {
  initial: { opacity: 0, y: 20 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { type: "tween", ease: [0.23, 1, 0.32, 1], duration: 0.5 },
  },
};

const features = [
  {
    icon: Zap,
    title: "Instant Connect",
    desc: "Get matched with nearby mechanics in seconds, not hours.",
  },
  {
    icon: MapPin,
    title: "Live Tracking",
    desc: "Watch your mechanic arrive in real-time on the map.",
  },
  {
    icon: Shield,
    title: "Verified Pros",
    desc: "Every mechanic and garage is background-checked and rated.",
  },
  {
    icon: Clock,
    title: "24/7 Available",
    desc: "Round-the-clock service for emergencies and scheduled repairs.",
  },
];

export default function Home() {
  return (
    <PageTransition>
      <div className="min-h-screen flex flex-col relative overflow-hidden">
        <div
          className="absolute -top-40 -left-40 w-[34rem] h-[34rem] rounded-full blur-[140px] pointer-events-none opacity-60 bg-emerald-500/20"
          style={{ animation: "float-drift 20s ease-in-out infinite" }}
        />
        <div
          className="absolute top-[30%] right-[-10%] w-[28rem] h-[28rem] rounded-full blur-[160px] pointer-events-none opacity-40 bg-teal-400/15"
          style={{ animation: "float-drift 26s ease-in-out infinite 4s" }}
        />
        <div
          className="absolute bottom-[-10%] left-[20%] w-[24rem] h-[24rem] rounded-full blur-[120px] pointer-events-none opacity-30 bg-cyan-400/10"
          style={{ animation: "float-drift 22s ease-in-out infinite 8s" }}
        />

        <nav className="relative z-10 flex items-center justify-between px-6 sm:px-10 lg:px-16 py-5">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white font-bold tracking-tighter text-sm shadow-lg shadow-emerald-500/20">
              C
            </div>
            <span className="text-xl font-bold tracking-tight text-white">
              ClutchD
            </span>
          </div>
          <Link
            href="/auth"
            className="glass-lux-interactive px-5 py-2.5 rounded-xl text-sm font-semibold text-white hover:text-emerald-300 transition-colors"
          >
            Sign In
          </Link>
        </nav>

        <div className="relative z-10 flex-1 flex items-center justify-center px-6 sm:px-10 lg:px-16 py-12">
          <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
              className="text-center lg:text-left"
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-8 glass-lux text-sm">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-emerald-200/90 font-medium">
                  Now live in Coimbatore
                </span>
              </div>

              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.08] text-white mb-6">
                Vehicle Service,
                <br />
                <span className="gradient-text">On Demand.</span>
              </h1>

              <p className="text-lg sm:text-xl text-emerald-100/70 max-w-lg mx-auto lg:mx-0 mb-10 leading-relaxed">
                Connect instantly with top-rated mechanics and premium garages
                nearby. Real-time tracking, transparent pricing, and trusted
                professionals.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Link
                  href="/auth"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold text-lg shadow-xl shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300"
                >
                  Get Started
                  <ArrowRight size={20} />
                </Link>
                <Link
                  href="/auth"
                  className="glass-lux-interactive inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl text-white font-semibold text-lg"
                >
                  Sign In
                </Link>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2, ease: [0.23, 1, 0.32, 1] }}
              className="flex justify-center"
            >
              <div className="glass-lux-strong glass-lux-border-animated w-full max-w-md p-8 rounded-3xl">
                <div className="mb-6">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center mb-4 shadow-lg shadow-emerald-500/30">
                    <Zap size={28} className="text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2">
                    How it works
                  </h3>
                  <p className="text-emerald-100/60 text-sm">
                    Three steps to professional vehicle service
                  </p>
                </div>

                <motion.div
                  variants={staggerContainer}
                  initial="initial"
                  animate="animate"
                  className="space-y-4"
                >
                  {[
                    { num: "01", text: "Describe your issue and share your location" },
                    { num: "02", text: "Get matched with verified mechanics nearby" },
                    { num: "03", text: "Track arrival, approve pricing, and pay securely" },
                  ].map((step) => (
                    <motion.div
                      key={step.num}
                      variants={staggerItem}
                      className="flex items-start gap-4 glass-lux-interactive p-4 rounded-xl"
                    >
                      <span className="text-emerald-400 font-mono font-bold text-lg">
                        {step.num}
                      </span>
                      <span className="text-emerald-100/80 text-sm leading-relaxed pt-0.5">
                        {step.text}
                      </span>
                    </motion.div>
                  ))}
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>

        <div className="relative z-10 px-6 sm:px-10 lg:px-16 pb-12">
          <motion.div
            variants={staggerContainer}
            initial="initial"
            animate="animate"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-6xl mx-auto"
          >
            {features.map((feat) => {
              const Icon = feat.icon;
              return (
                <motion.div
                  key={feat.title}
                  variants={staggerItem}
                  className="glass-lux-interactive p-5 rounded-2xl text-center group"
                >
                  <div className="w-11 h-11 rounded-xl bg-emerald-500/15 flex items-center justify-center mx-auto mb-3 group-hover:bg-emerald-500/25 transition-colors">
                    <Icon size={20} className="text-emerald-400" />
                  </div>
                  <h4 className="text-white font-semibold mb-1.5">{feat.title}</h4>
                  <p className="text-emerald-100/50 text-sm leading-relaxed">
                    {feat.desc}
                  </p>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </div>
    </PageTransition>
  );
}
