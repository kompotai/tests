/**
 * Super Admin Tests
 *
 * Тесты платформенного super admin.
 * Пропускаются если SUPER_ADMIN_EMAIL/PASSWORD не заданы.
 */

import { test, expect } from '@playwright/test';
import { SUPER_ADMIN } from '@fixtures/users';
import * as fs from 'fs';
import * as path from 'path';

const AUTH_DIR = path.join(__dirname, '../../../.auth');

// Создаём директорию для auth state
if (!fs.existsSync(AUTH_DIR)) {
  fs.mkdirSync(AUTH_DIR, { recursive: true });
}

test.describe('Super Admin', () => {
  // Пропускаем все тесты если нет credentials
  test.skip(!SUPER_ADMIN.isAvailable, 'SKIP: SUPER_ADMIN credentials не заданы');

  test('SA1: Super admin может войти и увидеть manage dashboard', async ({ page, context }) => {
    // Log credentials (masked) for debugging
    console.log(`[SA1] Using email: ${SUPER_ADMIN.email}`);
    console.log(`[SA1] Password length: ${SUPER_ADMIN.password.length}`);

    await page.goto('/account/admin-login');
    await page.waitForSelector('[data-testid="login-input-email"]', { timeout: 15000 });

    // Fill email and verify
    const emailInput = page.locator('[data-testid="login-input-email"]');
    await emailInput.fill(SUPER_ADMIN.email);
    await page.waitForTimeout(100); // Small delay for React state update

    // Fill password and verify
    const passwordInput = page.locator('[data-testid="login-input-password"]');
    await passwordInput.fill(SUPER_ADMIN.password);
    await page.waitForTimeout(100); // Small delay for React state update

    // Verify inputs are filled correctly
    const filledEmail = await emailInput.inputValue();
    const filledPassword = await passwordInput.inputValue();
    console.log(`[SA1] Filled email: ${filledEmail}`);
    console.log(`[SA1] Filled password length: ${filledPassword.length}`);

    if (filledEmail !== SUPER_ADMIN.email || filledPassword !== SUPER_ADMIN.password) {
      console.error(`[SA1] Input mismatch! Expected email: ${SUPER_ADMIN.email}, got: ${filledEmail}`);
      console.error(`[SA1] Expected password length: ${SUPER_ADMIN.password.length}, got: ${filledPassword.length}`);
    }

    // Click submit and wait
    await page.click('button[type="submit"]');

    // Wait for navigation with better error handling
    try {
      await page.waitForURL(/\/manage/, { timeout: 30000 });
    } catch (error) {
      // Capture current state for debugging
      const currentUrl = page.url();
      const errorElement = page.locator('.bg-red-50, [class*="error"], [role="alert"]').first();
      const errorText = await errorElement.textContent().catch(() => null);

      console.error(`[SA1] Login failed after submit. Current URL: ${currentUrl}`);
      console.error(`[SA1] Error message on page: ${errorText || 'none found'}`);

      // Take screenshot for debugging
      await page.screenshot({ path: 'test-results/sa1-debug-screenshot.png' });

      // Check if still on login page
      if (currentUrl.includes('/login')) {
        throw new Error(`Login failed - still on login page. Error: "${errorText}". URL: ${currentUrl}`);
      }
      throw error;
    }

    expect(page.url()).toContain('/manage');

    // Сохраняем auth state
    await context.storageState({ path: path.join(AUTH_DIR, 'super-admin.json') });
    console.log('✅ Super admin auth state сохранён');
  });

  test('SA2: Auth state файл создан', async () => {
    const authFile = path.join(AUTH_DIR, 'super-admin.json');
    expect(fs.existsSync(authFile)).toBe(true);
  });
});
