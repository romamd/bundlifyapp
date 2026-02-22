import { test, expect } from '../fixtures/app-bridge-stub';

test.describe('Navigation', () => {
  test('renders all 8 nav tabs', async ({ page }) => {
    await page.goto('/');
    const nav = page.locator('nav');
    const links = nav.locator('a');
    await expect(links).toHaveCount(8);

    const labels = ['Dashboard', 'Products', 'Bundles', 'Analytics', 'A/B Tests', 'Integrations', 'Customize', 'Settings'];
    for (const label of labels) {
      await expect(nav.getByText(label)).toBeVisible();
    }
  });

  test('clicking each tab navigates to the correct page', async ({ page }) => {
    await page.goto('/');

    const routes: Array<{ label: string; path: string; heading: string }> = [
      { label: 'Products', path: '/products', heading: 'Products' },
      { label: 'Bundles', path: '/bundles', heading: 'Bundles' },
      { label: 'Settings', path: '/settings', heading: 'Settings' },
      { label: 'Dashboard', path: '/', heading: 'Dashboard' },
    ];

    for (const route of routes) {
      await page.locator('nav').getByText(route.label).click();
      await expect(page).toHaveURL(route.path);
      await expect(page.getByRole('heading', { name: route.heading, level: 1 })).toBeVisible();
    }
  });

  test('active tab is visually highlighted', async ({ page }) => {
    await page.goto('/bundles');
    const bundlesLink = page.locator('nav').getByText('Bundles');
    await expect(bundlesLink).toHaveCSS('font-weight', '600');
  });
});
