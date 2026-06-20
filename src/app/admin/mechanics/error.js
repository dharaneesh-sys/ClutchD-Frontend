"use client";

import ErrorCard from "@/components/ui/ErrorCard";

export default function Error({ error, reset }) {
  return <ErrorCard error={error} onRetry={reset} />;
}