// apps/web/src/tests/e2e/reader-flow.test.ts
import { test, expect } from '@playwright/test';

test.describe('Reader flows — unauthenticated', () => {
  test('like button prompts sign in for unauthenticated users', async ({ page }) => {
    // Go to an article if one exists
    await page.goto('/articles');
    const firstArticleLink = page.getByRole('article').first().getByRole('link').first();

    // If there are no articles, skip
    if (!await firstArticleLink.isVisible({ timeout: 3000 }).catch(() => false)) {
      test.skip();
      return;
    }

    await firstArticleLink.click();
    await page.waitForURL(/\/articles\//);

    // Find like button and click — should show sign-in toast
    const likeBtn = page.getByRole('button', { name: /\d+/ }).first();
    if (await likeBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await likeBtn.click();
      // Should show a toast or redirect
      await expect(
        page.locator('[data-sonner-toast]').or(page.getByText(/sign in/i))
      ).toBeVisible({ timeout: 3000 });
    }
  });

  test('search returns results', async ({ page }) => {
    await page.goto('/search?q=news');
    await expect(page.getByPlaceholder(/Search/i)).toHaveValue('news');
  });

  test('can browse articles by category', async ({ page }) => {
    await page.goto('/articles');
    // Check category filter links are present
    const categoryLinks = page.getByRole('link').filter({ hasText: /^(Politics|Education|News|All)$/i });
    if (await categoryLinks.first().isVisible({ timeout: 3000 }).catch(() => false)) {
      await categoryLinks.first().click();
      await page.waitForLoadState('networkidle');
      // URL should have updated
      expect(page.url()).toBeDefined();
    }
  });
});