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

const ctaBase =
  "inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl px-6 text-base font-semibold transition-colors " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--splash-bg)]";

export default function Home() {
  const t = useTranslations();
  useAuthRedirect();

  return (
    <div className="min-h-[100dvh] flex flex-col overflow-x-hidden bg-[var(--background)]">
      {/* Blue hero */}
      <section className="bg-[linear-gradient(180deg,var(--splash-bg)_0%,var(--splash-bg-deep)_100%)] pt-[env(safe-area-inset-top)]">
        <nav className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4 sm:px-8">
          <span className="flex items-center gap-2">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--surface-card)]">
              <Logo size="md" />
            </span>
            <span className="text-lg font-bold text-[var(--on-splash)]">ClutchD</span>
          </span>
          <Link
            href="/auth"
            className="inline-flex min-h-[44px] items-center rounded-xl border border-[var(--on-splash-track)] px-4 text-sm font-semibold text-[var(--on-splash)] hover:bg-[var(--on-splash-track)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--on-splash)]"
          >
            {t("nav.signIn")}
          </Link>
        </nav>

        <div className="mx-auto grid w-full max-w-6xl grid-cols-1 items-center gap-10 px-4 pb-14 pt-6 sm:px-8 lg:grid-cols-2 lg:gap-16 lg:pb-20 lg:pt-10">
          <div className="text-center lg:text-left">
            <span className="mb-6 inline-flex items-center gap-2 rounded-full bg-[var(--on-splash-track)] px-3 py-1.5 text-sm font-medium text-[var(--on-splash)]">
              <span aria-hidden="true" className="h-2 w-2 rounded-full bg-[var(--on-splash)]" />
              {t("hero.badge")}
            </span>
            <h1 className="mb-5 text-4xl font-bold leading-[1.1] tracking-tight text-[var(--on-splash)] sm:text-5xl lg:text-6xl">
              {t("hero.headline")}
            </h1>
            <p className="mx-auto mb-8 max-w-lg text-base leading-relaxed text-[var(--on-splash-muted)] sm:text-lg lg:mx-0">
              {t("hero.subtitle")}
            </p>
            <div className="flex flex-col justify-center gap-3 sm:flex-row lg:justify-start">
              <Link
                href="/auth"
                className={`${ctaBase} bg-[var(--surface-card)] text-[var(--primary-dark)] hover:bg-[var(--surface-soft)]`}
              >
                {t("hero.getStarted")}
                <ArrowRight size={20} aria-hidden="true" />
              </Link>
              <Link
                href="/auth"
                className={`${ctaBase} border border-[var(--on-splash)] text-[var(--on-splash)] hover:bg-[var(--on-splash-track)]`}
              >
                {t("hero.signIn")}
              </Link>
            </div>
          </div>

          {/* How it works — flat white card */}
          <div className="surface-card w-full max-w-md justify-self-center p-6 sm:p-8">
            <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--surface-soft)] text-[var(--primary-dark)]">
              <Zap size={24} aria-hidden="true" />
            </span>
            <h2 className="mb-2 text-xl font-semibold text-[var(--foreground)]">{t("howItWorks.title")}</h2>
            <p className="mb-5 text-sm leading-relaxed text-[var(--text-muted)]">{t("howItWorks.description")}</p>
            <ol className="space-y-2">
              {["step1", "step2", "step3"].map((key, i) => (
                <li key={key} className="flex items-start gap-3 rounded-xl bg-[var(--surface-soft)] p-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--primary)] text-sm font-semibold text-[var(--on-primary)]">
                    {i + 1}
                  </span>
                  <span className="pt-0.5 text-sm leading-relaxed text-[var(--foreground)]">
                    {t(`howItWorks.${key}`)}
                  </span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-8 lg:py-16">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {featureKeys.map(({ icon: Icon, key }) => (
            <div key={key} className="surface-card p-5">
              <span className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--surface-soft)] text-[var(--primary-dark)]">
                <Icon size={22} aria-hidden="true" />
              </span>
              <h4 className="mb-1 font-semibold text-[var(--foreground)]">{t(`features.${key}.title`)}</h4>
              <p className="text-sm leading-relaxed text-[var(--text-muted)]">{t(`features.${key}.desc`)}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
