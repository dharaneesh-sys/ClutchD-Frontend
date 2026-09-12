import { chromium } from 'playwright';

const browser = await chromium.launch({ 
  executablePath: '/home/dinusus/.cache/ms-playwright/chromium-1228/chrome-linux64/chrome',
  headless: true 
});

const page = await browser.newPage();

// Collect ALL console activity
const logs = [];
page.on('console', msg => logs.push(`[${msg.type()}] ${msg.text()}`));
page.on('pageerror', err => logs.push(`[PAGE_ERROR] ${err.message}\n${err.stack?.slice(0,500)}`));

// Also capture React error boundary
page.on('response', resp => {
  if (resp.status() >= 400) logs.push(`[HTTP ${resp.status()}] ${resp.url()}`);
});

console.log("=== Navigating to /auth ===");
await page.goto('http://localhost:3000/auth', { waitUntil: 'networkidle', timeout: 30000 });
await page.waitForTimeout(3000);

console.log("=== Page loaded - checking state ===");
const state = await page.evaluate(() => ({
  html: document.documentElement.outerHTML?.slice(0, 200),
  hasNextRoot: !!document.getElementById('__next'),
  bodyContent: document.querySelector('h1')?.textContent?.slice(0, 50),
  url: window.location.href
}));
console.log('State:', JSON.stringify(state, null, 2));

// Check React root by looking for the app element
const hasRoot = await page.evaluate(() => {
  const root = document.getElementById('__next') || document.getElementById('root') || document.querySelector('[data-nextjs-root]');
  return { id: root?.id, tag: root?.tagName, innerLength: root?.innerHTML?.length };
});
console.log('Root:', JSON.stringify(hasRoot));

// Check for any error elements
const errorEl = await page.evaluate(() => {
  const errs = document.querySelectorAll('[data-error], .error, [role="alert"]');
  return errs.length;
});
console.log('Error elements found:', errorEl);

// Try to fill the form and submit to trigger login
console.log("\n=== Attempting login to trigger error ===");
const emailInput = await page.$('input[type="email"]');
const passInput = await page.$('input[type="password"]');
const submitBtn = await page.$('button[type="submit"]');

if (emailInput && passInput && submitBtn) {
  console.log("Found form elements, filling...");
  await emailInput.fill('test@test.com');
  await passInput.fill('Test123!');
  await submitBtn.click();
  
  // Wait for potential error
  await page.waitForTimeout(5000);
  
  // Check for errors in the page
  const errorText = await page.evaluate(() => {
    // Look for any error text
    const body = document.body?.textContent || '';
    const errorKeywords = ['error', 'wrong', 'maximum', 'nested', 'Something went wrong'];
    const found = errorKeywords.filter(k => body.toLowerCase().includes(k));
    return { found, bodySample: body.slice(0, 1000) };
  });
  console.log('After login submit - error check:', JSON.stringify(errorText, null, 2));
  
  // Also look for the React error boundary fallback
  const boundary = await page.evaluate(() => {
    const fallback = document.querySelector('[data-rsc]');
    const errBoundary = document.querySelector('[data-error-boundary]');
    return { rsc: !!fallback, errBoundary: !!errBoundary };
  });
  console.log('Error boundaries:', JSON.stringify(boundary));
} else {
  console.log("Could not find form elements", { email: !!emailInput, pass: !!passInput, submit: !!submitBtn });
}

// Print all logs (filter noise)
console.log("\n=== Key Console Messages ===");
logs.filter(l => l.includes('ERROR') || l.includes('error') || l.includes('Maximum') || l.includes('nested') || l.includes('#185')).forEach(l => console.log(l));

await browser.close();
