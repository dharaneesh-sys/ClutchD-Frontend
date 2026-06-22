import "./globals.css";

import { ThemeProvider } from "@/components/ui/ThemeProvider";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { AuthInit } from "@/components/ui/AuthInit";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { DemoModeProvider } from "@/lib/demo/demoMode";
import { DemoToolbar } from "@/components/ui/DemoToolbar";
import { ToastProvider } from "@/components/ui/ToastProvider";

export const metadata = {
  title: "ClutchD — On-Demand Mechanic Platform",
  description:
    "Find trusted mechanics and garages near you with ClutchD. Get instant vehicle service with real-time tracking, transparent pricing, and verified professionals.",
  keywords: "mechanic, garage, vehicle service, on-demand, car repair",
  icons: {
    icon: "/favicon.svg",
  },
  openGraph: {
    title: "ClutchD — On-Demand Mechanic Platform",
    description:
      "Find trusted mechanics and garages near you with ClutchD. Get instant vehicle service with real-time tracking, transparent pricing, and verified professionals.",
    siteName: "ClutchD",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "ClutchD — On-Demand Mechanic Platform",
    description:
      "Find trusted mechanics and garages near you with ClutchD. Get instant vehicle service with real-time tracking, transparent pricing, and verified professionals.",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#09090b" },
    { media: "(prefers-color-scheme: light)", color: "#fffbff" },
  ],
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                var t = localStorage.getItem('clutchd_theme');
                document.documentElement.setAttribute('data-theme', t === 'light' ? 'light' : 'dark');
              })();
            `,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col">
        <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[9999] focus:px-4 focus:py-2 focus:rounded-lg focus:bg-[var(--surface)] focus:text-[var(--foreground)] focus:shadow-lg focus:outline-none">
          Skip to main content
        </a>
        <ThemeProvider>
          <DemoModeProvider>
            <AuthInit />
            <ErrorBoundary>
              <div id="main-content">{children}</div>
            </ErrorBoundary>
            <ThemeToggle />
            <DemoToolbar />
            <ToastProvider />
          </DemoModeProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
