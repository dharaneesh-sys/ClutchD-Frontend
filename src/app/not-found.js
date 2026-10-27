import Link from "next/link";

export const metadata = {
  title: "404 — ClutchD",
};

export default function NotFound() {
  return (
    <div className="flex items-center justify-center min-h-screen px-4 bg-[var(--background)]">
      <div className="surface-card p-8 sm:p-10 text-center max-w-md w-full">
        <div className="text-6xl font-bold text-[var(--primary-dark)] mb-4">
          404
        </div>
        <h1 className="text-xl font-semibold text-[var(--foreground)] mb-2">Page not found</h1>
        <p className="text-[var(--text-muted)] mb-6 text-sm">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <Link
          href="/"
          className="inline-flex min-h-[44px] items-center gap-2 px-6 rounded-xl bg-[var(--primary)] hover:bg-[var(--primary-dark)] text-[var(--on-primary)] font-semibold text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2"
        >
          Go home
        </Link>
      </div>
    </div>
  );
}
