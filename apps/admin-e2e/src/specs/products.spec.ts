import { test, expect } from '../fixtures/app-bridge-stub';

test.describe('Products', () => {
  test('renders products heading', async ({ page }) => {
    await page.goto('/products');
    await expect(page.getByRole('heading', { name: 'Products', level: 1 })).toBeVisible();
  });

  test('search input is visible', async ({ page }) => {
    await page.goto('/products');
    await expect(page.getByPlaceholder('Search products...')).toBeVisible();
  });

  test('Import COGS button toggles import panel', async ({ page }) => {
    await page.goto('/products');
    const importBtn = page.getByRole('button', { name: 'Import COGS' });
    await expect(importBtn).toBeVisible();
    await importBtn.click();
    await expect(page.getByRole('button', { name: 'Close Import' })).toBeVisible();
  });

  test('filter checkboxes are visible', async ({ page }) => {
    await page.goto('/products');
    await expect(page.getByText('Dead stock only')).toBeVisible();
    await expect(page.getByText('Missing COGS only')).toBeVisible();
  });

  test('sort dropdown is visible', async ({ page }) => {
    await page.goto('/products');
    const select = page.locator('select');
    await expect(select).toBeVisible();
  });
});
