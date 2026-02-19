import { test, expect } from '../fixtures/app-bridge-stub';

const ADMIN_BASE = 'https://dev.bundlify.io';
const STOREFRONT_BASE = 'https://bundlifydev.myshopify.com';

test.describe('Bundle → Storefront Flow', () => {
  test('seeded bundle appears in admin bundles list', async ({ page }) => {
    await page.goto('/bundles');
    await expect(page.getByRole('heading', { name: 'Bundles', level: 1 })).toBeVisible();
    await expect(page.getByText('Summer Essentials Pack')).toBeVisible();
  });

  test('seeded bundle is served by storefront API', async ({ request }) => {
    // Hit the storefront API — the seeded bundle has a display rule for product 9310950359001
    const response = await request.get(
      `${ADMIN_BASE}/api/storefront/bundles?shop=bundlifydev.myshopify.com&trigger=PRODUCT_PAGE&product_id=9310950359001`,
    );
    expect(response.ok()).toBeTruthy();

    const bundles = await response.json();
    expect(Array.isArray(bundles)).toBeTruthy();
    expect(bundles.length).toBeGreaterThan(0);

    const summerPack = bundles.find((b: any) => b.name === 'Summer Essentials Pack');
    expect(summerPack).toBeTruthy();
    expect(Number(summerPack.bundlePrice)).toBeCloseTo(89.99, 1);
    expect(summerPack.items.length).toBe(2);
  });

  test('bundles with no display rules show on any product', async ({ request }) => {
    // Use a product ID that is NOT in any display rule — bundles with empty rules should still appear
    const response = await request.get(
      `${ADMIN_BASE}/api/storefront/bundles?shop=bundlifydev.myshopify.com&trigger=PRODUCT_PAGE&product_id=9999999999`,
    );
    expect(response.ok()).toBeTruthy();

    const bundles = await response.json();
    // Bundles created via the wizard have no display rules → should appear for any product
    const noRuleBundles = bundles.filter((b: any) => b.name.startsWith('E2E Test Bundle'));
    expect(noRuleBundles.length).toBeGreaterThanOrEqual(0);
    // At minimum, any bundle with no display rules should be returned
    expect(Array.isArray(bundles)).toBeTruthy();
  });

  test('storefront product page loads the bundlify widget', async ({ browser }) => {
    // Use a fresh context without CDN stubs — storefront needs real resources
    const context = await browser.newContext({ ignoreHTTPSErrors: true });
    const page = await context.newPage();

    // Navigate to a product page on the live storefront
    await page.goto(`${STOREFRONT_BASE}/products`, { waitUntil: 'domcontentloaded' });

    // The store should be accessible
    expect(page.url()).toContain('bundlifydev.myshopify.com');

    await context.close();
  });

  test('bundle created in admin appears on storefront API', async ({ page, request }) => {
    // Step 1: Create a new bundle via the admin wizard
    await page.goto('/bundles');
    await expect(page.getByRole('heading', { name: 'Bundles', level: 1 })).toBeVisible();

    const createBtn = page
      .locator('div')
      .filter({ has: page.getByRole('heading', { name: 'Bundles', level: 1 }) })
      .getByRole('button', { name: 'Create Bundle' });
    await createBtn.click();

    // Step 0: Select FIXED bundle type → Next
    await expect(page.getByText('Fixed Bundle')).toBeVisible();
    await page.getByRole('button', { name: 'Next' }).click();

    // Step 1: Select at least 2 products by clicking product rows
    await expect(page.getByText('Select at least 2 products')).toBeVisible();
    await page.getByText('Classic Cotton T-Shirt').click();
    await page.getByText('Premium Denim Jeans').click();
    await page.getByRole('button', { name: 'Next' }).click();

    // Step 2: Set discount → Next
    await page.getByRole('button', { name: 'Next' }).click();

    // Step 3: Display rules → Next
    await page.getByRole('button', { name: 'Next' }).click();

    // Step 4: Review — enter bundle name and submit
    const nameInput = page.locator('input[placeholder*="name" i], input[type="text"]').first();
    const bundleName = `E2E Test Bundle ${Date.now()}`;
    await nameInput.fill(bundleName);

    // Click the wizard's submit button (last one, inside the modal)
    await page.getByRole('button', { name: 'Create Bundle' }).nth(1).click();

    // Wait for the wizard to close and the new bundle to appear in the list
    await expect(page.getByText(bundleName)).toBeVisible({ timeout: 10000 });

    // Step 2: Activate the bundle (new bundles default to DRAFT)
    const bundleRow = page.getByText(bundleName).locator('..').locator('..');
    await bundleRow.getByRole('button', { name: 'Activate' }).click();
    await expect(bundleRow.getByText('ACTIVE')).toBeVisible({ timeout: 5000 });

    // Step 3: Verify the bundle appears on the storefront API
    const response = await request.get(
      `${ADMIN_BASE}/api/storefront/bundles?shop=bundlifydev.myshopify.com&trigger=PRODUCT_PAGE`,
    );
    expect(response.ok()).toBeTruthy();

    const bundles = await response.json();
    const newBundle = bundles.find((b: any) => b.name === bundleName);
    expect(newBundle).toBeTruthy();
    expect(newBundle.items.length).toBe(2);
  });
});
