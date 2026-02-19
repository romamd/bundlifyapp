import { test as base, type Page } from '@playwright/test';

/**
 * Stub external CDN resources that block rendering outside the Shopify iframe.
 * NO API mocking — all /api/* calls hit the real backend.
 */
async function stubExternalCdn(page: Page) {
  // Stub App Bridge CDN — prevents blank page outside Shopify iframe
  await page.route('**/cdn.shopify.com/**', (route) =>
    route.fulfill({ status: 200, contentType: 'application/javascript', body: '/* app bridge stubbed */' }),
  );

  // Stub Polaris CSS to avoid slow CDN loads in tests
  await page.route('**/unpkg.com/**', (route) =>
    route.fulfill({ status: 200, contentType: 'text/css', body: '/* polaris stubbed */' }),
  );
}

/**
 * Extended test fixture that stubs CDN resources for standalone rendering.
 * All API calls go to the real backend — no mocking.
 */
export const test = base.extend<{ cdnStub: void }>({
  cdnStub: [
    async ({ page }, use) => {
      await stubExternalCdn(page);
      await use();
    },
    { auto: true },
  ],
});

export { expect } from '@playwright/test';
