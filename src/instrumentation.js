// Next.js Instrumentation Hook — registers Sentry server/edge SDKs
// This file is auto-detected by Next.js at startup.
// See: https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation

import * as Sentry from "@sentry/nextjs";

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }
}

// Capture errors from Server Components, middleware, and API routes
export const onRequestError = Sentry.captureRequestError;
