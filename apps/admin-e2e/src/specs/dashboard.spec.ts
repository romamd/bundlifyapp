import { test, expect } from '../fixtures/app-bridge-stub';

test.describe('Dashboard', () => {
  test('renders dashboard heading and KPI section', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Dashboard', level: 1 })).toBeVisible();
    // KPI cards should render (labels, not specific values)
    await expect(page.getByText('Bundle Revenue')).toBeVisible();
    await expect(page.getByText('Bundle Margin')).toBeVisible();
    await expect(page.getByText('Conversion Rate')).toBeVisible();
  });

  test('displays dead stock summary section', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('Dead Stock Summary')).toBeVisible();
  });

  test('displays top bundles section', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('Top Bundles')).toBeVisible();
  });

  test('date range buttons are interactive', async ({ page }) => {
    await page.goto('/');
    const btn30d = page.getByRole('button', { name: '30 Days' });
    await expect(btn30d).toBeVisible();
    await btn30d.click();
    await expect(btn30d).toHaveCSS('font-weight', '600');
  });

  test('quick actions section navigates to products', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('Quick Actions')).toBeVisible();
    await page.getByRole('button', { name: 'View Products' }).click();
    await expect(page).toHaveURL('/products');
  });
});
