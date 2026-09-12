"use client";

import Link from "next/link";
import { ArrowRight, Shield, Zap, MapPin, Clock } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { useTranslations } from "@/lib/i18n/useTranslations";
import { useAuthRedirect } from "@/hooks/useAuthRedirect";

const featureKeys = [
  { icon: Zap, key: "instantConnect" },
  { icon: MapPin, key: "liveTracking" },
  { icon: Shield, key: "verifiedPros" },
  { icon: Clock, key: "available247" },
];

export default function Home() {
  const t = useTranslations();
  useAuthRedirect();

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden page-enter">
      <nav className="relative z-10 flex items-center justify-between px-6 sm:px-10 lg:px-16 py-6">
        <div className="flex items-center gap-2.5">
          <Logo size="lg" showText />
        </div>
        <Link
          href="/auth"
          className="glass-lux-interactive px-5 py-2.5 rounded-xl text-sm font-semibold text-foreground hover:text-primary-light transition-colors"
        >
          {t('nav.signIn')}
        </Link>
      </nav>

      <div className="relative z-10 flex-1 flex items-center justify-center px-6 sm:px-10 lg:px-16 py-16 lg:py-20">
        <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center">
          <div className="text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-10 glass-lux text-sm">
              <span className="w-2 h-2 rounded-full bg-primary-light animate-pulse" />
              <span className="text-primary-light/90 font-medium">
                {t('hero.badge')}
              </span>
            </div>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.08] text-foreground mb-8">
              {t('hero.headline')}
            </h1>

            <p className="text-lg sm:text-xl text-primary-light/70 max-w-lg mx-auto lg:mx-0 mb-12 leading-relaxed">
              {t('hero.subtitle')}
            </p>

            <div className="flex flex-col sm:flex-row gap-5 justify-center lg:justify-start">
              <Link
                href="/auth"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-gradient-to-r from-primary to-primary-light text-white font-bold text-lg shadow-xl shadow-[0_0_20px_rgba(var(--color-primary-rgb),0.25)] hover:shadow-[0_0_30px_rgba(var(--color-primary-rgb),0.4)] hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
              >
                {t('hero.getStarted')}
                <ArrowRight size={20} />
              </Link>
              <Link
                href="/auth"
                className="glass-lux-interactive inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl text-foreground font-semibold text-lg hover:bg-white/10 active:scale-[0.98] transition-all duration-200"
              >
                {t('hero.signIn')}
              </Link>
            </div>
          </div>

          <div className="flex justify-center">
            <div className="glass-lux-strong w-full max-w-md p-8 sm:p-10 rounded-3xl">
              <div className="mb-8">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-light to-primary flex items-center justify-center mb-5 shadow-lg shadow-[0_0_20px_rgba(var(--color-primary-rgb),0.3)]">
                  <Zap size={28} className="text-white" />
                </div>
                <h3 className="text-2xl font-bold text-foreground mb-3">
                  {t('howItWorks.title')}
                </h3>
                <p className="text-primary-light/60 text-sm leading-relaxed">
                  {t('howItWorks.description')}
                </p>
              </div>

              <div className="space-y-3">
                {[
                  { num: "01", key: "step1" },
                  { num: "02", key: "step2" },
                  { num: "03", key: "step3" },
                ].map((step) => (
                  <div
                    key={step.num}
                    className="flex items-start gap-4 glass-lux-interactive p-4 rounded-xl hover:bg-white/5 transition-colors"
                  >
                     <span className="text-primary-light font-mono font-bold text-lg leading-none mt-0.5">
                       {step.num}
                     </span>
                     <span className="text-primary-light/80 text-sm leading-relaxed">
                      {t(`howItWorks.${step.key}`)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="relative z-10 px-6 sm:px-10 lg:px-16 pb-16 lg:pb-20">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 max-w-6xl mx-auto">
          {featureKeys.map((feat) => {
            const Icon = feat.icon;
            return (
              <div
                key={feat.key}
                className="glass-lux-interactive p-6 rounded-2xl text-center group hover-lift"
              >
                 <div className="w-12 h-12 rounded-xl bg-primary/15 flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/25 group-hover:scale-110 transition-all duration-200">
                   <Icon size={22} className="text-primary-light" />
                 </div>
                 <h4 className="text-foreground font-semibold mb-2">{t(`features.${feat.key}.title`)}</h4>
                  <p className="text-primary-light/50 text-sm leading-relaxed">
                   {t(`features.${feat.key}.desc`)}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
