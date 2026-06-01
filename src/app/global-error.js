"use client";

export default function GlobalError({ error, reset }) {
  return (
    <html lang="en">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                var t = localStorage.getItem('clutchd_theme');
                var d = t === 'light' ? '#fffbff' : '#0a0a0a';
                var f = t === 'light' ? '#1c1b1f' : '#fff';
                var p = '#059669';
                if (!t) {
                  var m = window.matchMedia('(prefers-color-scheme: light)');
                  if (m.matches) { d = '#fffbff'; f = '#1c1b1f'; }
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
      <body style={{ margin: 0, fontFamily: "system-ui, sans-serif", display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", padding: "1rem" }}>
        <div style={{ textAlign: "center", maxWidth: "400px" }}>
          <h2 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "0.5rem" }}>Something Went Wrong</h2>
          <p style={{ color: "var(--fg)", opacity: 0.6, marginBottom: "1.5rem", fontSize: "0.875rem" }}>
            {error?.message || "A critical error occurred."}
          </p>
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
        </div>
      </body>
    </html>
  );
}
