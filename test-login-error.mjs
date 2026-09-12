import { chromium } from 'playwright';

const browser = await chromium.launch({ 
  executablePath: '/home/dinusus/.cache/ms-playwright/chromium-1228/chrome-linux64/chrome',
  headless: true 
});

const page = await browser.newPage();
page.on('console', msg => {
  console.log(`[BROWSER ${msg.type()}] ${msg.text()}`);
});
page.on('pageerror', err => {
  console.log(`[BROWSER ERROR] ${err.message}`);
  console.log(err.stack);
});

console.log("=== Navigating to /auth ===");
await page.goto('http://localhost:3000/auth', { waitUntil: 'networkidle', timeout: 30000 });

const title = await page.title();
console.log(`Page title: ${title}`);

// Wait a moment for React to settle
await page.waitForTimeout(2000);

// Get any console errors
const errors = await page.evaluate(() => {
  // Check if React root exists and is mounted
  const root = document.getElementById('__next');
  const hasReactRoot = !!root;
  const htmlTheme = document.documentElement.getAttribute('data-theme');
  return { hasReactRoot, htmlTheme };
});
console.log('Page state:', JSON.stringify(errors, null, 2));

// Check for the login form
const content = await page.textContent('body');
console.log("Body contains 'On Demand':", content.includes('On Demand'));
console.log("Body contains 'Sign In':", content.includes('Sign In'));

// Check gradient text color
const gradientColor = await page.evaluate(() => {
  const el = document.querySelector('.gradient-text');
  if (!el) return 'no .gradient-text found';
  const style = window.getComputedStyle(el);
  return {
    backgroundImage: style.backgroundImage,
    color: style.color
  };
});
console.log('Gradient text style:', JSON.stringify(gradientColor, null, 2));

// Check if we can see the login form
const snapshot = await page.accessibility.snapshot();
console.log("Page has interactive elements:", !!snapshot?.children?.length);

await browser.close();
