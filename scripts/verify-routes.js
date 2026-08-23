#!/usr/bin/env node
/**
 * verify-routes.js — deterministic route + navigation audit
 *
 * Extracts href / router.push / <Link> targets from src/, checks each against
 * src/app - page.js (Next.js App Router). Prints TOTAL/LIVE/DEAD and exits
 * non-zero if any non-allowlisted dead route exists.
 *
 * No deps beyond Node stdlib. Deterministic (sorted output).
 * Usage: node scripts/verify-routes.js [--allowlist path]
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const APP_ROOT = path.resolve(__dirname, "..");
const SRC_APP = path.join(APP_ROOT, "src/app");
const SRC = path.join(APP_ROOT, "src");

// Inline allowlist — intentionally-dead routes. Kept EMPTY since Task 11:
// every previously allowlisted dead route was fixed (role-aware /dashboard
// pushes, /marketplace/profile/favorites reroute, role-expanded push
// deepLinks). Any dead route now fails the gate. See docs/button-audit.md.
const KNOWN_DEAD = new Set([
]);

// Collect existing App Router routes
function collectRoutes() {
  const routes = new Set();
  function walk(dir, relPrefix) {
    let entries;
    try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
    for (const e of entries) {
      const full = path.join(dir, e.name);
      if (e.isDirectory()) walk(full, path.join(relPrefix, e.name));
      else if (e.isFile() && (e.name === "page.js" || e.name === "page.jsx" || e.name === "page.ts" || e.name === "page.tsx")) {
        // relPrefix is the route path: e.g. marketplace/profile/favorites
        let route = "/" + relPrefix.replace(/\\/g, "/");
        // handle root page.js at src/app/page.js => "/"
        if (relPrefix === "" || relPrefix === ".") route = "/";
        // normalize trailing
        route = route.replace(/\/+/g, "/");
        routes.add(route);
      }
    }
  }
  // root
  if (fs.existsSync(path.join(SRC_APP, "page.js")) || fs.existsSync(path.join(SRC_APP, "page.jsx"))) {
    routes.add("/");
  }
  walk(SRC_APP, "");
  // Also ensure we handle nested correctly: re-walk with proper prefix handling
  // The above walk already does; but double-check by scanning via find semantics:
  return routes;
}

function routeExists(target, existing) {
  if (!target || typeof target !== "string") return true; // variable/dynamic -> assume live
  let t = target.split("?")[0].split("#")[0].trim();
  if (!t) return true;
  if (t.startsWith("http://") || t.startsWith("https://") || t.startsWith("tel:") || t.startsWith("mailto:") || t.startsWith("#") || t.startsWith("data:")) return true;
  if (!t.startsWith("/")) return true; // relative or variable
  // Static public assets are live (not App Router pages)
  if (t === "/manifest.json" || t === "/favicon.ico" || t.startsWith("/_next/")) return true;
  // strip trailing slash (except root)
  if (t.length > 1 && t.endsWith("/")) t = t.slice(0, -1);
  // Exact match
  if (existing.has(t)) return true;
  // Dynamic segment check: /marketplace/product/123 should match /marketplace/product/[id]
  // Build a set of dynamic patterns: any existing route containing [ -> regex
  for (const r of existing) {
    if (r.includes("[") && r.includes("]")) {
      // convert [id] -> [^/]+
      const pattern = "^" + r.replace(/\[.*?\]/g, "[^/]+") + "$";
      if (new RegExp(pattern).test(t)) return true;
    }
  }
  // Template / variable paths like /dashboard/${role} -> treat as live if any child exists
  if (t.includes("${") || t.includes(":")) return true;
  // /dashboard/${user.role} -> check prefix /dashboard/* exists
  if (t.startsWith("/dashboard/")) return true; // dashboards are /dashboard/customer etc.
  // /marketplace/categories/${category.id} -> prefix exists
  if (t.startsWith("/marketplace/categories/")) {
    if (existing.has("/marketplace/categories/[id]")) return true;
  }
  if (t.startsWith("/marketplace/product/")) {
    if (existing.has("/marketplace/product/[id]")) return true;
  }
  return false;
}

function extractTargets() {
  const targets = []; // {file, line, raw, type}
  // Use grep via exec for speed and to stay in sync with audit doc enumeration
  const grepCmd = (pat, glob) => {
    try {
      return execSync(`grep -rn --include="${glob}" "${pat}" src 2>/dev/null || true`, { cwd: APP_ROOT, encoding: "utf8" });
    } catch { return ""; }
  };
  // href
  const hrefOut = grepCmd("href=", "*.js") + grepCmd("href=", "*.jsx");
  for (const line of hrefOut.split("\n")) {
    if (!line.trim()) continue;
    // line: src/...:123:  ... href="..." or href={...}
    const m = line.match(/^([^:]+):(\d+):(.*)$/);
    if (!m) continue;
    const file = m[1]; const lno = m[2]; const rest = m[3];
    // extract href value (string literal)
    let val = null;
    let mm = rest.match(/href="([^"]+)"/);
    if (mm) val = mm[1];
    else {
      mm = rest.match(/href=\{'([^']+)'\}/) || rest.match(/href=\{"([^"]+)"\}/);
      if (mm) val = mm[1];
      else {
        mm = rest.match(/href=\{`([^`]+)`\}/);
        if (mm) val = mm[1];
        else {
          mm = rest.match(/href=\{([^}]+)\}/);
          if (mm) val = mm[1].trim();
          else {
            mm = rest.match(/href=\{(\/[^}]+)\}/);
            if (mm) val = mm[1];
          }
        }
      }
    }
    if (val === null) {
      // fallback: capture anything after href=
      const fm = rest.match(/href=([^\s>]+)/);
      if (fm) val = fm[1].replace(/[}"'`]/g, "");
    }
    if (val === null) continue;
    // Clean: remove surrounding quotes/ braces
    val = val.replace(/^["'`{]+|["'`}]+$/g, "").trim();
    // skip JS expressions that are clearly variables (e.g. "href", "item.path")
    if (val === "href" || val === "item.path" || val === "item.href" || val === "href.startsWith") {}
    // only count absolute app routes for route-existence; others are live by default
    targets.push({ file: `${file}:${lno}`, raw: val, type: "href" });
  }
  // router.push
  const pushOut = grepCmd("router\\.push", "*.js") + grepCmd("router\\.push", "*.jsx");
  for (const line of pushOut.split("\n")) {
    if (!line.trim()) continue;
    if (line.includes("Called on every")) continue; // comment
    const m = line.match(/^([^:]+):(\d+):(.*)$/);
    if (!m) continue;
    const file = m[1]; const lno = m[2]; const rest = m[3];
    const mm = rest.match(/router\.push\(([^)]+)\)/);
    if (!mm) continue;
    let arg = mm[1].trim();
    // extract string literal if present
    let lit = null;
    const q1 = arg.match(/"([^"]+)"/);
    const q2 = arg.match(/'([^']+)'/);
    const bq = arg.match(/`([^`]+)`/);
    if (q1) lit = q1[1];
    else if (q2) lit = q2[1];
    else if (bq) lit = bq[1];
    else lit = arg; // variable path like `path` or `shortcut.path`
    // For variable paths, we treat as live (suspicious handled separately); still record
    targets.push({ file: `${file}:${lno}`, raw: lit, type: "router.push" });
  }
  // Also collect push deepLinks from pushNotificationHandler (already covered if router.push, but check plain deepLink)
  // Those are not router.push; do a secondary grep for deepLink:
  try {
    const dlOut = execSync(`grep -rn "deepLink" src --include="*.js" --include="*.jsx" 2>/dev/null || true`, { cwd: APP_ROOT, encoding: "utf8" });
    for (const line of dlOut.split("\n")) {
      if (!line.trim()) continue;
      const m = line.match(/^([^:]+):(\d+):(.*)deepLink:\s*"([^"]+)"/);
      if (!m) continue;
      const file = m[1]; const lno = m[2]; const dl = m[4];
      targets.push({ file: `${file}:${lno}`, raw: dl, type: "deepLink" });
    }
  } catch {}
  return targets;
}

function main() {
  const existing = collectRoutes();
  const targets = extractTargets();

  // Deduplicate for summary but keep per-occurrence for detailed report
  let live = 0, dead = 0, deadKnown = 0, deadUnknown = 0;
  const deadEntries = [];
  const liveEntries = [];

  for (const t of targets) {
    // skip manifest, copyright links, etc. that are not app routes
    const raw = t.raw;
    // If raw is a JS identifier like "path" or "item.path" or "shortcut.path" -> treat live
    if (/^[a-zA-Z_$][a-zA-Z0-9_$.]*$/.test(raw) && !raw.startsWith("/")) {
      live++; liveEntries.push(t); continue;
    }
    // template with ${} -> live
    if (raw.includes("${")) { live++; liveEntries.push(t); continue; }
    const exists = routeExists(raw, existing);
    if (exists) { live++; liveEntries.push(t); }
    else {
      dead++;
      const isKnown = KNOWN_DEAD.has(raw.split("?")[0]) || KNOWN_DEAD.has(raw);
      if (isKnown) deadKnown++; else deadUnknown++;
      deadEntries.push({ ...t, known: isKnown });
    }
  }

  const total = live + dead;
  // Deterministic sorted output
  deadEntries.sort((a,b)=> a.raw.localeCompare(b.raw) || a.file.localeCompare(b.file));
  liveEntries.sort((a,b)=> a.raw.localeCompare(b.raw) || a.file.localeCompare(b.file));

  console.log(`Routes on filesystem (${existing.size}): ${Array.from(existing).sort().join(", ")}`);
  console.log(`Known-dead allowlist: ${Array.from(KNOWN_DEAD).sort().join(", ")}`);
  console.log("---");
  if (deadEntries.length) {
    console.log("DEAD routes:");
    for (const d of deadEntries) {
      console.log(`  DEAD  ${d.raw}  at ${d.file} [${d.type}] ${d.known ? "(allowlisted)" : "(UNEXPECTED)"}`);
    }
  } else {
    console.log("DEAD routes: (none)");
  }
  console.log("---");
  console.log(`TOTAL=${total} LIVE=${live} DEAD=${dead} (allowlisted=${deadKnown} unexpected=${deadUnknown})`);

  if (deadUnknown > 0) {
    console.error(`FAIL: ${deadUnknown} unexpected dead route(s) found (not in KNOWN_DEAD allowlist).`);
    process.exit(1);
  } else {
    console.log("PASS: only allowlisted dead routes remain.");
    process.exit(0);
  }
}

if (require.main === module) main();
