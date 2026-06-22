// Sentry Client SDK — App Router (Next.js 15+)
// This replaces the older sentry.client.config.js pattern.
// See: https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

import * as Sentry from "@sentry/nextjs";

const SENTRY_DSN =
  process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN;

Sentry.init({
  // No DSN at build time — injected at runtime via SENTRY_DSN env var.
  // Sentry events are not sent until a DSN is configured in deployment.
  dsn: SENTRY_DSN || "",

  // Disable Sentry when no DSN is set
  enabled: !!SENTRY_DSN,

  // Capture 100% in dev, 20% in production
  tracesSampleRate: process.env.NODE_ENV === "development" ? 1.0 : 0.2,

  // Session Replay: 10% of sessions, 100% of sessions with errors
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,

  integrations: [Sentry.replayIntegration()],
});

// Instrument router navigations for performance tracing
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
