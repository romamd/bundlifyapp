import { test, expect } from '../fixtures/app-bridge-stub';

test.describe('Settings', () => {
  test('renders settings heading and all sections', async ({ page }) => {
    await page.goto('/settings');
    await expect(page.getByRole('heading', { name: 'Settings', level: 1 })).toBeVisible();
    await expect(page.getByText('Cost Defaults')).toBeVisible();
    await expect(page.getByText('Bundle Engine')).toBeVisible();
    await expect(page.getByText('Display Settings')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Cart Drawer' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Multi-Currency' })).toBeVisible();
    await expect(page.getByText('Widget Settings')).toBeVisible();
  });

  test('displays link to Customize page', async ({ page }) => {
    await page.goto('/settings');
    await expect(page.getByText('Widget Styling')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Go to Customize' })).toBeVisible();
  });

  test('displays $ prefix on cost fields', async ({ page }) => {
    await page.goto('/settings');
    const dollarSigns = page.getByText('$', { exact: true });
    await expect(dollarSigns.first()).toBeVisible();
  });

  test('displays % suffix on processing rate field', async ({ page }) => {
    await page.goto('/settings');
    const processingRow = page.locator('text=Payment Processing %').locator('..');
    await expect(processingRow.getByText('%')).toBeVisible();
  });

  test('Save Settings button is visible', async ({ page }) => {
    await page.goto('/settings');
    const saveButtons = page.getByRole('button', { name: 'Save Settings' });
    await expect(saveButtons.first()).toBeVisible();
  });

  test('currency dropdown is visible', async ({ page }) => {
    await page.goto('/settings');
    const currencySelect = page.locator('select').filter({ has: page.locator('option[value="USD"]') });
    await expect(currencySelect).toBeVisible();
  });
});
