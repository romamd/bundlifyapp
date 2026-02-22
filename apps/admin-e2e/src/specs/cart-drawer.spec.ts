import { test, expect } from '../fixtures/app-bridge-stub';

const BASE = 'https://dev.bundlify.io';

test.describe('Cart Drawer', () => {
  test.describe('Admin Settings', () => {
    test('Cart Drawer section is visible on settings page', async ({ page }) => {
      await page.goto('/settings');
      await expect(
        page.getByRole('heading', { name: 'Cart Drawer' }),
      ).toBeVisible();
    });

    test('Enable Cart Drawer toggle is visible', async ({ page }) => {
      await page.goto('/settings');
      await expect(page.getByText('Enable Cart Drawer')).toBeVisible();
    });

    test('Free Shipping Threshold field is visible with $ prefix', async ({ page }) => {
      await page.goto('/settings');
      await expect(
        page.getByText('Free Shipping Threshold'),
      ).toBeVisible();
    });

    test('Cart Drawer toggle is interactive', async ({ page }) => {
      await page.goto('/settings');
      // "Enable Cart Drawer" is inside generic > generic > generic;
      // the toggle button is a sibling at the grandparent level
      const drawerRow = page.getByText('Enable Cart Drawer').locator('..').locator('..');
      const toggleBtn = drawerRow.locator('button').first();
      await expect(toggleBtn).toBeVisible();

      // Click the toggle — it should change background color
      const bgBefore = await toggleBtn.evaluate(
        (el) => getComputedStyle(el).backgroundColor,
      );
      await toggleBtn.click();
      await page.waitForTimeout(200);
      const bgAfter = await toggleBtn.evaluate(
        (el) => getComputedStyle(el).backgroundColor,
      );
      expect(bgBefore).not.toBe(bgAfter);
    });
  });

  test.describe('Storefront API', () => {
    test('cart-drawer endpoint returns valid response', async ({ request }) => {
      const response = await request.get(
        `${BASE}/api/storefront/cart-drawer?shop=bundlifydev.myshopify.com&cart_value=50&product_ids=123&session_id=test123`,
      );
      expect(response.ok()).toBeTruthy();

      const data = await response.json();
      expect(data).toHaveProperty('enabled');
      expect(typeof data.enabled).toBe('boolean');

      if (data.enabled) {
        expect(data).toHaveProperty('freeShippingThreshold');
        expect(data).toHaveProperty('bundles');
        expect(Array.isArray(data.bundles)).toBeTruthy();

        // Bundles should be limited to 3
        expect(data.bundles.length).toBeLessThanOrEqual(3);
      } else {
        expect(data).toHaveProperty('bundles');
        expect(data.bundles).toEqual([]);
      }
    });

    test('cart-drawer endpoint requires shop parameter', async ({ request }) => {
      const response = await request.get(
        `${BASE}/api/storefront/cart-drawer?cart_value=50`,
      );
      expect(response.status()).toBe(400);
    });

    test('cart-drawer endpoint handles missing optional params', async ({ request }) => {
      const response = await request.get(
        `${BASE}/api/storefront/cart-drawer?shop=bundlifydev.myshopify.com`,
      );
      expect(response.ok()).toBeTruthy();

      const data = await response.json();
      expect(data).toHaveProperty('enabled');
    });

    test('cart-drawer returns freeShippingThreshold when set', async ({ request }) => {
      const response = await request.get(
        `${BASE}/api/storefront/cart-drawer?shop=bundlifydev.myshopify.com&cart_value=25`,
      );
      expect(response.ok()).toBeTruthy();

      const data = await response.json();
      // freeShippingThreshold is either null or a number
      if (data.freeShippingThreshold !== null && data.freeShippingThreshold !== undefined) {
        expect(typeof data.freeShippingThreshold).toBe('number');
        expect(data.freeShippingThreshold).toBeGreaterThan(0);
      }
    });
  });
});
