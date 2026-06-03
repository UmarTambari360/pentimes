// apps/web/src/tests/e2e/auth-flow.test.ts
import { test, expect } from '@playwright/test';
import { loginAs, registerUser } from './helpers/auth.js';

const timestamp = Date.now();
const testEmail = `e2e_user_${timestamp}@test.com`;
const testPassword = 'Password123';
const testName = 'E2E Test User';

test.describe('Authentication flows', () => {
  test('user can register and land on dashboard', async ({ page }) => {
    await registerUser(page, testName, testEmail, testPassword);
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.getByText(/Welcome/i)).toBeVisible();
  });

  test('user can log in with valid credentials', async ({ page }) => {
    // First register
    await registerUser(page, `Login User ${timestamp}`, `login_${timestamp}@test.com`, testPassword);

    // Log out (go home)
    await page.goto('/');

    // Log back in
    await loginAs(page, `login_${timestamp}@test.com`, testPassword);
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('login shows error for wrong password', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email').fill('nonexistent@test.com');
    await page.getByLabel('Password').fill('WrongPass1');
    await page.getByRole('button', { name: /sign in/i }).click();
    // Should stay on login or show error
    await expect(page.getByRole('status').or(page.locator('[data-sonner-toast]'))).toBeVisible({ timeout: 5000 });
  });

  test('dashboard redirects unauthenticated users to login', async ({ page }) => {
    // Clear cookies
    await page.context().clearCookies();
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/login/);
  });

  test('admin panel redirects non-admin to dashboard', async ({ page }) => {
    // Register a regular user and try to access admin
    await registerUser(page, `Regular ${timestamp}`, `regular_${timestamp}@test.com`, testPassword);
    await page.goto('/admin');
    // Should redirect away from admin
    await expect(page).not.toHaveURL(/\/admin/);
  });
});