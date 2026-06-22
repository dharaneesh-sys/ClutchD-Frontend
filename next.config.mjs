/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    optimizePackageImports: ["lucide-react", "recharts"],
  },
  output:
    process.env.NEXT_PUBLIC_BUILD_MODE !== "export" ? "standalone" : "export",
  images: {
    unoptimized: true,
  },
  env: {
    NEXT_PUBLIC_DEMO_MODE: process.env.NEXT_PUBLIC_DEMO_MODE || "true",
    NEXT_PUBLIC_BUILD_MODE: process.env.NEXT_PUBLIC_BUILD_MODE || "",
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          // ── Anti-clickjacking ──────────────────────────────────────────
          { key: "X-Frame-Options", value: "DENY" },

          // ── MIME-sniffing protection ───────────────────────────────────
          { key: "X-Content-Type-Options", value: "nosniff" },

          // ── Referrer policy ────────────────────────────────────────────
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },

          // ── Legacy XSS filter (redundant with CSP, kept for old browsers) ─
          { key: "X-XSS-Protection", value: "1; mode=block" },

          // ── Feature / Permissions policy ───────────────────────────────
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(self)",
          },

          // ── HTTP Strict-Transport-Security (HSTS) ──────────────────────
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains",
          },

          // ── Content-Security-Policy ────────────────────────────────────
          {
            key: "Content-Security-Policy",
            value: [
              // Fallback for directives not explicitly listed
              "default-src 'self'",

              // ── script-src ──────────────────────────────────────────
              // Notes on 'unsafe-inline' and 'unsafe-eval':
              //   • 'unsafe-inline' — Required by Next.js App Router:
              //     RSC payload scripts, router data, and <Script> are
              //     delivered as inline <script> tags. These cannot carry
              //     nonces unless a per-request middleware generates them.
              //     TODO: Switch to nonce-based + 'strict-dynamic' via
              //     middleware for stricter control.
              //   • 'unsafe-eval'   — Required in development for webpack
              //     HMR / React Fast Refresh. Production builds of Next.js
              //     16 do not eval() application code, but this flag stays
              //     so the same config works in both modes.
              //   • Domains:
              //     - accounts.google.com       — Google OAuth Sign-In
              //     - checkout.razorpay.com     — Razorpay payment SDK
              //     - raw.githubusercontent.com — Leaflet marker icons
              //       loaded by react-leaflet
              `script-src 'self' https://accounts.google.com https://checkout.razorpay.com https://raw.githubusercontent.com 'unsafe-inline' 'unsafe-eval'`,

              // ── style-src ───────────────────────────────────────────
              //   'unsafe-inline' — Next.js injects inline styles for
              //   CSS-in-JS and RSC. Leaflet CSS is served from unpkg.
              `style-src 'self' 'unsafe-inline' https://unpkg.com`,

              // ── img-src ─────────────────────────────────────────────
              //   data:   — inline images / icons
              //   https:  — remote images (maps, user avatars, QR codes)
              //   blob:   — dynamically generated image blobs
              `img-src 'self' data: https: blob:`,

              // ── connect-src ─────────────────────────────────────────
              //   'self'                      — same-origin API calls
              //   nominatim.openstreetmap.org — reverse-geocode lookups
              //   router.project-osrm.org     — route/path calculations
              //   api.razorpay.com            — Razorpay payment gateway
              //                                backend API calls from SDK
              //   wss:                        — WebSocket connections
              //                                (dynamic WS_URL per env)
              `connect-src 'self' https://nominatim.openstreetmap.org https://router.project-osrm.org https://api.razorpay.com wss:`,

              // ── font-src ────────────────────────────────────────────
              `font-src 'self' data:`,

              // ── frame-src ───────────────────────────────────────────
              //   accounts.google.com — Google OAuth popup / redirect
              `frame-src https://accounts.google.com`,

              // ── frame-ancestors ─────────────────────────────────────
              //   Deny embedding anywhere (defence-in-depth alongside
              //   X-Frame-Options: DENY for clickjacking protection).
              `frame-ancestors 'none'`,
            ].join("; "),
          },
        ],
      },
    ];
  },
};

// Conditional bundle analyzer
const analyzeConfig =
  process.env.ANALYZE === "true"
    ? (await import("@next/bundle-analyzer")).default({
        enabled: true,
      })(nextConfig)
    : nextConfig;

export default analyzeConfig;
