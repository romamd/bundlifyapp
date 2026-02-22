import { test, expect } from '../fixtures/app-bridge-stub';

test.describe('Customize', () => {
  test('renders Customize heading', async ({ page }) => {
    await page.goto('/customize');
    await expect(page.getByRole('heading', { name: 'Customize', level: 1 })).toBeVisible();
  });

  test('has color picker sections', async ({ page }) => {
    await page.goto('/customize');
    await expect(page.getByText('Colors', { exact: true })).toBeVisible();
    await expect(page.getByText('Primary Color')).toBeVisible();
    await expect(page.getByText('Card Background', { exact: true })).toBeVisible();
  });

  test('has color pickers for theming', async ({ page }) => {
    await page.goto('/customize');
    // Wait for page to fully render
    await expect(page.getByText('Colors', { exact: true })).toBeVisible();
    const colorInputs = page.locator('input[type="color"]');
    // 28 main + 4 sticky bar (only shown when enabled) = at least 28
    const count = await colorInputs.count();
    expect(count).toBeGreaterThanOrEqual(28);
  });

  test('has layout selector', async ({ page }) => {
    await page.goto('/customize');
    await expect(page.getByText('Vertical')).toBeVisible();
    await expect(page.getByText('Horizontal')).toBeVisible();
    await expect(page.getByText('Compact')).toBeVisible();
    await expect(page.getByText('Grid')).toBeVisible();
  });

  test('has typography controls', async ({ page }) => {
    await page.goto('/customize');
    await expect(page.getByText('Typography', { exact: true })).toBeVisible();
    await expect(page.getByText('Per-Element Typography')).toBeVisible();
    await expect(page.getByText('Block Title', { exact: true })).toBeVisible();
    await expect(page.getByText('Item Title', { exact: true })).toBeVisible();
  });

  test('has live preview panel', async ({ page }) => {
    await page.goto('/customize');
    await expect(page.getByText('Live Preview')).toBeVisible();
    await expect(page.getByText('Complete Skincare Kit')).toBeVisible();
    await expect(page.getByText('Hydrating Face Serum')).toBeVisible();
  });

  test('has Save button', async ({ page }) => {
    await page.goto('/customize');
    await expect(page.getByRole('button', { name: 'Save' })).toBeVisible();
  });

  test('has custom CSS textarea', async ({ page }) => {
    await page.goto('/customize');
    await expect(page.getByRole('heading', { name: 'Custom CSS' })).toBeVisible();
    const textarea = page.locator('textarea');
    await expect(textarea).toBeVisible();
  });

  test('has sticky bar controls', async ({ page }) => {
    await page.goto('/customize');
    await expect(page.getByText('Sticky Add to Cart')).toBeVisible();
    await expect(page.getByText('Enable sticky bar')).toBeVisible();
  });
});
