import Link from "next/link";

export const metadata = {
  title: "404 — ClutchD",
};

export default function NotFound() {
  return (
    <div className="flex items-center justify-center min-h-screen px-4 bg-[var(--background)]">
      <div className="glass p-8 sm:p-12 text-center max-w-md w-full">
        <div className="text-6xl font-black bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] bg-clip-text text-transparent mb-4">
          404
        </div>
        <h1 className="text-xl font-bold text-[var(--foreground)] mb-2">Page Not Found</h1>
        <p className="text-[var(--foreground)]/60 mb-8 text-sm">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <Link
          href="/auth"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[var(--primary)] hover:opacity-90 text-white font-semibold text-sm transition-all duration-200"
        >
          Go Home
        </Link>
      </div>
    </div>
  );
}
