// apps/web/src/tests/e2e/public-browsing.test.ts
import { test, expect } from '@playwright/test';

test.describe('Public browsing', () => {
  test('homepage loads and shows navigation', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Pen Times/i);
    // Navbar visible
    await expect(page.getByText(/Pen Times/i).first()).toBeVisible();
  });

  test('can navigate to articles listing', async ({ page }) => {
    await page.goto('/articles');
    await expect(page).toHaveURL('/articles');
    await expect(page.getByText(/All Stories/i)).toBeVisible();
  });

  test('search page renders search form', async ({ page }) => {
    await page.goto('/search');
    await expect(page.getByPlaceholder(/Search articles/i)).toBeVisible();
  });

  test('programs page shows scheduled programs section', async ({ page }) => {
    await page.goto('/programs');
    await expect(page.getByText(/Scheduled Programs/i)).toBeVisible();
  });

  test('404 page shows not found message', async ({ page }) => {
    await page.goto('/this-page-does-not-exist-xyz');
    await expect(page.getByText(/Page Not Found/i)).toBeVisible();
  });

  test('category filter on articles page updates URL', async ({ page }) => {
    await page.goto('/articles');
    const allLink = page.getByRole('link', { name: /^all$/i });
    if (await allLink.isVisible()) {
      await allLink.click();
      await expect(page).toHaveURL('/articles');
    }
  });
});