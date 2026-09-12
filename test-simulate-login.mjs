import { chromium } from 'playwright';

const browser = await chromium.launch({ 
  executablePath: '/home/dinusus/.cache/ms-playwright/chromium-1228/chrome-linux64/chrome',
  headless: true 
});

const context = await browser.newContext({
  // Clear any persisted auth state so we start logged-out
  storageState: undefined,
  // Bypass CSP so our API interception works (CSP blocks the request before route handler)
  bypassCSP: true,
});
const page = await context.newPage();

// Collect ALL console activity
const logs = [];
page.on('console', msg => logs.push(`[${msg.type()}] ${msg.text()}`));
page.on('pageerror', err => logs.push(`[PAGE_ERROR] ${err.message}\n${err.stack?.slice(0,1000)}`));

// ── Intercept ALL API calls to /auth/login and return a mock successful response ──
await page.route('**/auth/login', async (route) => {
  const req = route.request();
  console.log(`[MOCK] Intercepted ${req.method()} ${req.url()}`);
  await route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({
      token: 'mock-jwt-token-12345',
      user: {
        id: 'mock-user-001',
        name: 'Test Customer',
        email: 'test@test.com',
        role: 'customer',
        phone: '+1234567890',
        avatar: null,
      }
    })
  });
});

// Also intercept Google OAuth callback if it fires
await page.route('**/auth/oauth/**', async (route) => {
  await route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({
      token: 'mock-oauth-token-12345',
      user: {
        id: 'mock-oauth-001',
        name: 'Google User',
        email: 'google@test.com',
        role: 'customer',
        provider: 'google',
      }
    })
  });
});

// Intercept sessionStorage/refresh calls that might fire after login
await page.route('**/auth/refresh', async (route) => {
  await route.fulfill({
    status: 401,
    contentType: 'application/json',
    body: JSON.stringify({ detail: 'No session' })
  });
});

console.log("=== Navigating to /auth ===");
await page.goto('http://localhost:3000/auth', { waitUntil: 'networkidle', timeout: 30000 });
await page.waitForTimeout(2000);

console.log("=== Page loaded ===");
const pageState = await page.evaluate(() => ({
  url: window.location.href,
  title: document.title,
  hasForm: !!document.querySelector('form'),
  h1Text: document.querySelector('h1, h2')?.textContent?.slice(0, 50),
}));
console.log('Page state:', JSON.stringify(pageState, null, 2));

// Fill the form and submit
console.log("\n=== Filling form and submitting ===");
const emailInput = await page.$('input[type="email"]');
const passInput = await page.$('input[type="password"]');
const submitBtn = await page.$('button[type="submit"]');

if (!emailInput || !passInput || !submitBtn) {
  console.log("❌ Could not find form elements");
  await browser.close();
  process.exit(1);
}

await emailInput.fill('test@test.com');
await passInput.fill('Test123!');
await submitBtn.click();

// Wait for the login flow to complete - effects, navigation, etc.
// We wait longer to capture any cascading errors
console.log("Waiting for login to process...");
await page.waitForTimeout(8000);

// Check current URL - might have navigated to dashboard
const afterState = await page.evaluate(() => ({
  url: window.location.href,
  bodySample: document.body?.textContent?.slice(0, 500) || '',
}));
console.log('\nAfter login state:', JSON.stringify(afterState, null, 2));

// Check for React error #185 in console logs
console.log("\n=== Filtered Error Logs ===");
const errorLogs = logs.filter(l => 
  l.includes('Maximum') || l.includes('nested') || l.includes('#185') || 
  l.includes('update depth') || l.includes('PAGE_ERROR') ||
  l.includes('[error]')
);
if (errorLogs.length === 0) {
  console.log("✅ NO error #185 detected in console!");
} else {
  errorLogs.forEach(l => console.log(l));
}

// Also check the page for React error boundary
const errBoundary = await page.evaluate(() => {
  const boundary = document.querySelector('.flex.items-center.justify-center.p-8');
  const errTexts = [];
  document.querySelectorAll('*').forEach(el => {
    if (el.textContent?.includes('Something went wrong')) errTexts.push(el.textContent?.slice(0, 200));
    if (el.textContent?.includes('Maximum update')) errTexts.push(el.textContent?.slice(0, 200));
  });
  return { boundaryFound: !!boundary, errTexts };
});
console.log('\nError boundary check:', JSON.stringify(errBoundary));

// Print all logs for thorough analysis
console.log("\n=== ALL Console Logs ===");
logs.forEach(l => console.log(l));

await browser.close();

// Exit with error if error #185 was found
const hasError185 = errorLogs.some(l => 
  l.includes('Maximum update depth exceeded') || l.includes('#185')
);
process.exit(hasError185 ? 1 : 0);
