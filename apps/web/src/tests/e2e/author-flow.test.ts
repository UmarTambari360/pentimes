// apps/web/src/tests/e2e/author-flow.test.ts
import { test, expect } from '@playwright/test';

/**
 * NOTE: These tests require a pre-seeded author account.
 * Set E2E_AUTHOR_EMAIL and E2E_AUTHOR_PASSWORD env vars,
 * or the tests skip gracefully.
 */

const AUTHOR_EMAIL = process.env['E2E_AUTHOR_EMAIL'] ?? '';
const AUTHOR_PASSWORD = process.env['E2E_AUTHOR_PASSWORD'] ?? '';

test.describe('Author flows', () => {
  test.skip(!AUTHOR_EMAIL, 'E2E_AUTHOR_EMAIL not set — skipping author tests');

  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email').fill(AUTHOR_EMAIL);
    await page.getByLabel('Password').fill(AUTHOR_PASSWORD);
    await page.getByRole('button', { name: /sign in/i }).click();
    await page.waitForURL(/\/dashboard/);
  });

  test('dashboard overview shows stats cards', async ({ page }) => {
    await expect(page.getByText(/Published/i)).toBeVisible();
    await expect(page.getByText(/Drafts/i)).toBeVisible();
  });

  test('can navigate to create article page', async ({ page }) => {
    await page.getByRole('link', { name: /new article|write article/i }).first().click();
    await expect(page).toHaveURL(/articles\/new/);
    await expect(page.getByText(/Write New Article/i)).toBeVisible();
  });

  test('article editor shows required fields', async ({ page }) => {
    await page.goto('/dashboard/articles/new');
    await expect(page.getByLabel(/Article Title/i)).toBeVisible();
    await expect(page.getByText(/Categories/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /Save Article/i })).toBeVisible();
  });

  test('can view my articles list', async ({ page }) => {
    await page.goto('/dashboard/articles');
    await expect(page.getByText(/My Articles/i)).toBeVisible();
  });

  test('bookmarks page loads', async ({ page }) => {
    await page.goto('/dashboard/bookmarks');
    await expect(page.getByText(/Bookmarks/i)).toBeVisible();
  });

  test('profile page shows form fields', async ({ page }) => {
    await page.goto('/dashboard/profile');
    await expect(page.getByText(/Profile Settings/i)).toBeVisible();
    await expect(page.getByLabel(/Display Name/i)).toBeVisible();
  });
});