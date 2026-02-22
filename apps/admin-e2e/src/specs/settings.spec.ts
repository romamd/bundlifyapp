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
    const currencySelect = page.locator('select').filter({ has: page.locator('option[value="USD"]') });
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
    await expect(colorInputs).toHaveCount(32);
    const layoutSelect = page.locator('select').filter({ has: page.locator('option[value="horizontal"]') });
    await expect(layoutSelect).toBeVisible();
  });

  test('Widget Theming has per-element typography controls', async ({ page }) => {
    await page.goto('/settings');
    await expect(page.getByText('Per-Element Typography')).toBeVisible();
    // 10 element groups: Block Title, Item Title, Subtitle, Price, Badge, Button, Label, Free Gift, Upsell, Unit Label
    await expect(page.getByText('Block Title', { exact: true })).toBeVisible();
    await expect(page.getByText('Item Title', { exact: true })).toBeVisible();
    await expect(page.getByText('Subtitle', { exact: true })).toBeVisible();
    await expect(page.getByText('Price', { exact: true })).toBeVisible();
    await expect(page.getByText('Badge', { exact: true })).toBeVisible();
    await expect(page.getByText('Label', { exact: true })).toBeVisible();
    await expect(page.getByText('Free Gift', { exact: true })).toBeVisible();
    await expect(page.getByText('Upsell', { exact: true })).toBeVisible();
    await expect(page.getByText('Unit Label', { exact: true })).toBeVisible();
    // 10 per-element + 1 border radius + 1 base font size + 1 spacing
    // + 4 sticky bar (title font, button font, button padding, button border radius) = 17 range inputs
    const rangeInputs = page.locator('input[type="range"]');
    await expect(rangeInputs).toHaveCount(17);
  });

  test('Widget Theming has custom CSS textarea', async ({ page }) => {
    await page.goto('/settings');
    const textarea = page.locator('textarea');
    await expect(textarea).toBeVisible();
    await expect(textarea).toHaveAttribute('maxlength', '5000');
  });

  test('Widget Theming border radius slider updates display value', async ({ page }) => {
    await page.goto('/settings');
    const slider = page.locator('input[type="range"]').first();
    await expect(slider).toBeVisible();
    await slider.fill('16');
    await expect(page.getByText('16px')).toBeVisible();
  });
});
