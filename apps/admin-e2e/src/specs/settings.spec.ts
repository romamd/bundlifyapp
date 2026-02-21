import { test, expect } from '../fixtures/app-bridge-stub';

test.describe('Settings', () => {
  test('renders settings heading and all sections', async ({ page }) => {
    await page.goto('/settings');
    await expect(page.getByRole('heading', { name: 'Settings', level: 1 })).toBeVisible();
    await expect(page.getByText('Cost Defaults')).toBeVisible();
    await expect(page.getByText('Bundle Engine')).toBeVisible();
    await expect(page.getByText('Display Settings')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Widget Theming' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Cart Drawer' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Multi-Currency' })).toBeVisible();
    await expect(page.getByText('Widget Settings')).toBeVisible();
  });

  test('displays $ prefix on cost fields', async ({ page }) => {
    await page.goto('/settings');
    // The $ prefix appears in input groups for shipping cost and flat fee
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
    const currencySelect = page.locator('select');
    await expect(currencySelect).toBeVisible();
  });

  test('Widget Theming section is visible with all controls', async ({ page }) => {
    await page.goto('/settings');
    await expect(page.getByRole('heading', { name: 'Widget Theming' })).toBeVisible();
    await expect(page.getByText('Primary Color')).toBeVisible();
    await expect(page.getByText('Border Radius')).toBeVisible();
    await expect(page.getByText('Button Text')).toBeVisible();
  });

  test('Widget Theming has color pickers and layout dropdown', async ({ page }) => {
    await page.goto('/settings');
    const colorInputs = page.locator('input[type="color"]');
    await expect(colorInputs).toHaveCount(6);
    const layoutSelect = page.locator('select').filter({ has: page.locator('option[value="horizontal"]') });
    await expect(layoutSelect).toBeVisible();
  });

  test('Widget Theming border radius slider updates display value', async ({ page }) => {
    await page.goto('/settings');
    const slider = page.locator('input[type="range"]');
    await expect(slider).toBeVisible();
    await slider.fill('16');
    await expect(page.getByText('16px')).toBeVisible();
  });
});
