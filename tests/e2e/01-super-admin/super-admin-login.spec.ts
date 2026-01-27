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
    await page.goto('/account/admin-login');
    await page.waitForSelector('[data-testid="login-input-email"]', { timeout: 15000 });

    await page.fill('[data-testid="login-input-email"]', SUPER_ADMIN.email);
    await page.fill('[data-testid="login-input-password"]', SUPER_ADMIN.password);
    await page.click('button[type="submit"]');

    await page.waitForURL(/\/manage/, { timeout: 20000 });
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
