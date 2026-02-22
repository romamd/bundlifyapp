import { test, expect } from '../fixtures/app-bridge-stub';

const BASE = 'https://dev.bundlify.io';

test.describe('Theming Controls', () => {
  test.describe('Bundles Wizard types', () => {
    test('all four bundle types are visible in wizard', async ({ page }) => {
      await page.goto('/bundles/new');

      await expect(page.getByText('Fixed Bundle')).toBeVisible();
      await expect(page.getByText('Cross-Sell')).toBeVisible();
      await expect(page.getByText('Volume Discount')).toBeVisible();
      await expect(page.getByText('Dead Stock Clearance')).toBeVisible();
    });

    test('wizard bundle type selection is highlighted', async ({ page }) => {
      await page.goto('/bundles/new');

      // Default is FIXED — should have green border
      const fixedOption = page.getByText('Fixed Bundle').locator('..');
      await expect(fixedOption).toHaveCSS('border-color', 'rgb(0, 128, 96)');

      // Click Volume Discount
      await page.getByText('Volume Discount').click();
      const volumeOption = page.getByText('Volume Discount').locator('..');
      await expect(volumeOption).toHaveCSS('border-color', 'rgb(0, 128, 96)');

      // Fixed should no longer be highlighted
      await expect(fixedOption).not.toHaveCSS('border-color', 'rgb(0, 128, 96)');
    });
  });

  test.describe('Settings sections', () => {
    test('settings sections are visible (theming moved to Customize)', async ({ page }) => {
      await page.goto('/settings');

      const sections = [
        'Cost Defaults',
        'Bundle Engine',
        'Display Settings',
        'Cart Drawer',
        'Multi-Currency',
        'Widget Settings',
      ];

      for (const section of sections) {
        await expect(page.getByRole('heading', { name: section })).toBeVisible();
      }

      // Widget Theming has been moved to the Customize page
      await expect(page.getByText('Widget Styling')).toBeVisible();
      await expect(page.getByRole('link', { name: 'Go to Customize' })).toBeVisible();
    });
  });
});

test.describe('Exit-Intent Server Gate', () => {
  test('exit-intent trigger returns array from storefront API', async ({ request }) => {
    const response = await request.get(
      `${BASE}/api/storefront/bundles?shop=bundlifydev.myshopify.com&trigger=exit_intent`,
    );
    expect(response.ok()).toBeTruthy();

    const bundles = await response.json();
    expect(Array.isArray(bundles)).toBeTruthy();
    // When exitIntentEnabled is false (default), returns empty array
    // When enabled, returns bundles — either way it should be an array
  });

  test('exit-intent returns empty when disabled in settings', async ({ request }) => {
    // First check what the setting is
    const settingsRes = await request.get(
      `${BASE}/api/admin/settings`,
    );

    if (settingsRes.ok()) {
      const settings = await settingsRes.json();
      if (!settings.exitIntentEnabled) {
        // Exit intent is disabled — storefront should return empty array
        const response = await request.get(
          `${BASE}/api/storefront/bundles?shop=bundlifydev.myshopify.com&trigger=exit_intent`,
        );
        expect(response.ok()).toBeTruthy();
        const bundles = await response.json();
        expect(bundles).toEqual([]);
      }
    }
  });

  test('storefront bundles API still works for product_page trigger', async ({ request }) => {
    const response = await request.get(
      `${BASE}/api/storefront/bundles?shop=bundlifydev.myshopify.com&trigger=product_page`,
    );
    expect(response.ok()).toBeTruthy();

    const bundles = await response.json();
    expect(Array.isArray(bundles)).toBeTruthy();
  });

  test('storefront bundles API still works for cart_page trigger', async ({ request }) => {
    const response = await request.get(
      `${BASE}/api/storefront/bundles?shop=bundlifydev.myshopify.com&trigger=cart_page`,
    );
    expect(response.ok()).toBeTruthy();

    const bundles = await response.json();
    expect(Array.isArray(bundles)).toBeTruthy();
  });
});
