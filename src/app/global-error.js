"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function GlobalError({ error, reset }) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);
  return (
    <html lang="en">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                var t = localStorage.getItem('clutchd_theme');
                var d = t === 'light' ? '#fdfdff' : '#0a0a0a';
                var f = t === 'light' ? '#171a2e' : '#fff';
                var p = '#4aa5f5';
                if (!t) {
                  var m = window.matchMedia('(prefers-color-scheme: light)');
                  if (m.matches) { d = '#fdfdff'; f = '#171a2e'; }
                }
                document.body.style.background = d;
                document.body.style.color = f;
                document.documentElement.style.setProperty('--bg', d);
                document.documentElement.style.setProperty('--fg', f);
                document.documentElement.style.setProperty('--p', p);
              })();
            `,
          }}
        />
      </head>
      <body style={{ margin: 0, fontFamily: "system-ui, sans-serif", display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100dvh", padding: "1rem" }}>
        <div style={{ textAlign: "center", maxWidth: "400px" }}>
          <h2 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "0.5rem" }}>Something Went Wrong</h2>
          <p style={{ color: "var(--fg)", opacity: 0.6, marginBottom: "1.5rem", fontSize: "0.875rem" }}>
            {error?.message || "A critical error occurred."}
          </p>
          <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center", flexWrap: "wrap" }}>
            <button
              onClick={() => reset()}
              style={{
                padding: "0.75rem 1.5rem",
                borderRadius: "0.75rem",
                background: "var(--p)",
                color: "#fff",
                border: "none",
                fontWeight: 600,
                fontSize: "0.875rem",
                cursor: "pointer",
              }}
            >
              Try Again
            </button>
            <button
              onClick={() => {
                try {
                  sessionStorage.setItem("clutchd_force_auth_redirect", "1");
                } catch {}
                // Hard navigation — fully tears down the crashed React tree.
                window.location.assign("/auth");
              }}
              style={{
                padding: "0.75rem 1.5rem",
                borderRadius: "0.75rem",
                background: "transparent",
                color: "var(--p)",
                border: "1px solid var(--p)",
                fontWeight: 600,
                fontSize: "0.875rem",
                cursor: "pointer",
              }}
            >
              Go to Login
            </button>
          </div>
          <button
            onClick={() => {
              try {
                localStorage.clear();
                sessionStorage.clear();
              } catch {}
              window.location.assign("/auth");
            }}
            style={{
              marginTop: "1rem",
              background: "none",
              border: "none",
              color: "var(--fg)",
              opacity: 0.5,
              fontSize: "0.75rem",
              textDecoration: "underline",
              cursor: "pointer",
            }}
          >
            Clear app data and restart
          </button>
        </div>
      </body>
    </html>
  );
}
