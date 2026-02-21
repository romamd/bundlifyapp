import { test, expect } from '../fixtures/app-bridge-stub';

test.describe('Bundles', () => {
  test('renders bundles heading and list', async ({ page }) => {
    await page.goto('/bundles');
    await expect(page.getByRole('heading', { name: 'Bundles', level: 1 })).toBeVisible();
  });

  test('Create Bundle button opens wizard', async ({ page }) => {
    await page.goto('/bundles');
    const headerButtons = page.locator('div').filter({ has: page.getByRole('heading', { name: 'Bundles', level: 1 }) }).getByRole('button', { name: 'Create Bundle' });
    await headerButtons.click();

    // Wizard modal should appear with bundle type options
    await expect(page.getByText('Fixed Bundle')).toBeVisible();
    await expect(page.getByText('Cross-Sell')).toBeVisible();
    await expect(page.getByText('Dead Stock Clearance')).toBeVisible();
    await expect(page.getByText('Buy X Get Y')).toBeVisible();
    await expect(page.getByText('Collection Bundle')).toBeVisible();
    await expect(page.getByText('Mix & Match')).toBeVisible();
  });

  test('Create wizard navigates through steps', async ({ page }) => {
    await page.goto('/bundles');
    const headerButtons = page.locator('div').filter({ has: page.getByRole('heading', { name: 'Bundles', level: 1 }) }).getByRole('button', { name: 'Create Bundle' });
    await headerButtons.click();

    // Step 0: Bundle type is pre-selected (Fixed Bundle), click Next
    await page.getByRole('button', { name: 'Next' }).click();
    await expect(page.getByText('Select at least 2 products')).toBeVisible();
  });

  test('Create wizard shows live preview panel', async ({ page }) => {
    await page.goto('/bundles');
    const headerButtons = page.locator('div').filter({ has: page.getByRole('heading', { name: 'Bundles', level: 1 }) }).getByRole('button', { name: 'Create Bundle' });
    await headerButtons.click();
    await expect(page.getByText('Preview')).toBeVisible();
  });

  test('Generate Bundles button is visible', async ({ page }) => {
    await page.goto('/bundles');
    await expect(page.getByRole('button', { name: 'Generate Bundles' })).toBeVisible();
  });
});
