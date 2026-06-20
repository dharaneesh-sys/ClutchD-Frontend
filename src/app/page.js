"use client";

import Link from "next/link";
import { ArrowRight, Shield, Zap, MapPin, Clock } from "lucide-react";
import { Logo } from "@/components/ui/Logo";

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
    <div className="min-h-screen flex flex-col relative overflow-hidden page-enter">
      <nav className="relative z-10 flex items-center justify-between px-6 sm:px-10 lg:px-16 py-5">
        <div className="flex items-center gap-2.5">
          <Logo size="lg" showText />
        </div>
        <Link
          href="/auth"
          className="glass-lux-interactive px-5 py-2.5 rounded-xl text-sm font-semibold text-white hover:text-primary-light transition-colors"
        >
          Sign In
        </Link>
      </nav>

      <div className="relative z-10 flex-1 flex items-center justify-center px-6 sm:px-10 lg:px-16 py-12">
        <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          <div className="text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-8 glass-lux text-sm">
              <span className="w-2 h-2 rounded-full bg-primary-light" />
              <span className="text-primary-light/90 font-medium">
                Now live in Coimbatore
              </span>
            </div>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.08] text-white mb-6">
              Vehicle Service,
              <br />
              <span className="gradient-text">On Demand.</span>
            </h1>

            <p className="text-lg sm:text-xl text-primary-light/70 max-w-lg mx-auto lg:mx-0 mb-10 leading-relaxed">
              Connect instantly with top-rated mechanics and premium garages
              nearby. Real-time tracking, transparent pricing, and trusted
              professionals.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Link
                href="/auth"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-gradient-to-r from-primary to-primary-light text-white font-bold text-lg shadow-xl shadow-[0_0_20px_rgba(var(--color-primary-rgb),0.25)] hover:shadow-[0_0_30px_rgba(var(--color-primary-rgb),0.4)] transition-all duration-200"
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
          </div>

          <div className="flex justify-center">
            <div className="glass-lux-strong w-full max-w-md p-8 rounded-3xl">
              <div className="mb-6">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-light to-primary flex items-center justify-center mb-4 shadow-lg shadow-[0_0_20px_rgba(var(--color-primary-rgb),0.3)]">
                  <Zap size={28} className="text-white" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">
                  How it works
                </h3>
                <p className="text-primary-light/60 text-sm">
                  Three steps to professional vehicle service
                </p>
              </div>

              <div className="space-y-4">
                {[
                  { num: "01", text: "Describe your issue and share your location" },
                  { num: "02", text: "Get matched with verified mechanics nearby" },
                  { num: "03", text: "Track arrival, approve pricing, and pay securely" },
                ].map((step) => (
                  <div
                    key={step.num}
                    className="flex items-start gap-4 glass-lux-interactive p-4 rounded-xl"
                  >
                     <span className="text-primary-light font-mono font-bold text-lg">
                       {step.num}
                     </span>
                     <span className="text-primary-light/80 text-sm leading-relaxed pt-0.5">
                      {step.text}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="relative z-10 px-6 sm:px-10 lg:px-16 pb-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-6xl mx-auto">
          {features.map((feat) => {
            const Icon = feat.icon;
            return (
              <div
                key={feat.title}
                className="glass-lux-interactive p-5 rounded-2xl text-center group"
              >
                 <div className="w-11 h-11 rounded-xl bg-primary/15 flex items-center justify-center mx-auto mb-3 group-hover:bg-primary/25 transition-colors">
                   <Icon size={20} className="text-primary-light" />
                 </div>
                 <h4 className="text-white font-semibold mb-1.5">{feat.title}</h4>
                 <p className="text-primary-light/50 text-sm leading-relaxed">
                  {feat.desc}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
