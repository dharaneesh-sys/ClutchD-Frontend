import "./globals.css";

import { ThemeProvider } from "../components/ui/ThemeProvider";
import { ThemeToggle } from "../components/ui/ThemeToggle";
import { AuthInit } from "../components/ui/AuthInit";
import { ErrorBoundary } from "../components/ui/ErrorBoundary";

export const metadata = {
  title: "ClutchD — On-Demand Mechanic Platform",
  description:
    "Find trusted mechanics and garages near you with ClutchD. Get instant vehicle service with real-time tracking, transparent pricing, and verified professionals.",
  keywords: "mechanic, garage, vehicle service, on-demand, car repair",
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
                if (t === 'light') {
                  document.documentElement.classList.add('light');
                } else {
                  document.documentElement.classList.remove('light');
                }
              })();
            `,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-mesh">
        <ThemeProvider>
          <AuthInit />
          <ErrorBoundary>{children}</ErrorBoundary>
          <ThemeToggle />
        </ThemeProvider>
      </body>
    </html>
  );
}
