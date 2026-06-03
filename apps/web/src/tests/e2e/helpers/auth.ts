// apps/web/src/tests/e2e/helpers/auth.ts
import { Page } from '@playwright/test';

export async function loginAs(page: Page, email: string, password: string) {
  await page.goto('/login');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: /sign in/i }).click();
  // Wait for redirect away from login page
  await page.waitForURL(url => !url.pathname.includes('/login'));
}

export async function registerUser(page: Page, name: string, email: string, password: string) {
  await page.goto('/register');
  await page.getByLabel('Full Name').fill(name);
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: /create account/i }).click();
  await page.waitForURL(url => !url.pathname.includes('/register'));
}

export async function logout(page: Page) {
  // Click user avatar dropdown then Sign Out
  await page.getByRole('button', { name: /sign out/i }).click();
  await page.waitForURL('/');
}