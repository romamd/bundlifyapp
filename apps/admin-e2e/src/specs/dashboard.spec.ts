import { test, expect } from '../fixtures/app-bridge-stub';

test.describe('Dashboard', () => {
  test('renders dashboard heading and KPI section', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Dashboard', level: 1 })).toBeVisible();
    // Wait for loading to finish — either KPI cards or "No data yet" will appear
    const kpi = page.getByText('Bundle Revenue');
    const noData = page.getByText('No data yet');
    await expect(kpi.or(noData)).toBeVisible({ timeout: 10000 });
    if (await kpi.isVisible()) {
      await expect(page.getByText('Bundle Margin')).toBeVisible();
      await expect(page.getByText('Conversion Rate')).toBeVisible();
    } else {
      await expect(noData).toBeVisible();
    }
  });

  test('displays analytics sections', async ({ page }) => {
    await page.goto('/');
    const kpi = page.getByText('Bundle Revenue');
    const noData = page.getByText('No data yet');
    await expect(kpi.or(noData)).toBeVisible({ timeout: 10000 });
    if (await kpi.isVisible()) {
      await expect(page.getByText('Dead Stock Summary')).toBeVisible();
      await expect(page.getByText('Top Bundles')).toBeVisible();
    } else {
      await expect(noData).toBeVisible();
    }
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
    const actions = page.getByText('Quick Actions');
    const noData = page.getByText('No data yet');
    await expect(actions.or(noData)).toBeVisible({ timeout: 10000 });
    if (await actions.isVisible()) {
      await page.getByRole('button', { name: 'View Products' }).click();
      await expect(page).toHaveURL('/products');
    } else {
      await expect(noData).toBeVisible();
    }
  });
});
