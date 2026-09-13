// Visual check: screenshot key screens in light + dark themes (runs from project cwd)
const { chromium } = require("playwright");

const BASE = "http://localhost:3000";
const shots = [
  { path: "/auth", name: "auth" },
  { path: "/marketplace", name: "marketplace" },
  { path: "/dashboard/customer", name: "customer-dashboard" },
  { path: "/dashboard/seller", name: "seller-dashboard" },
  { path: "/marketplace/profile", name: "profile" },
  { path: "/marketplace/profile/clutchd-card", name: "card" },
  { path: "/marketplace/profile/settings", name: "settings" },
];

(async () => {
  const browser = await chromium.launch();
  for (const theme of ["light", "dark"]) {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const page = await ctx.newPage();
    // Set theme BEFORE first navigation via addInitScript
    await page.addInitScript((t) => {
      try { window.localStorage.setItem("clutchd_theme", t); } catch {}
    }, theme);
    for (const s of shots) {
      try {
        await page.goto(BASE + s.path, { waitUntil: "networkidle", timeout: 25000 });
      } catch (e) { console.log(`nav warn ${s.path}: ${e.message.split("\n")[0]}`); }
      await page.waitForTimeout(1500);
      await page.screenshot({ path: `/tmp/shot-${theme}-${s.name}.png`, fullPage: false });
      console.log(`${theme}/${s.name} done`);
    }
    await ctx.close();
  }
  await browser.close();
})();
