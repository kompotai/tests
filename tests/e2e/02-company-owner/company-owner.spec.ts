/**
 * Company Owner Tests
 *
 * CI Mode:  Cleanup → Register → DB Verification → UI Tests
 * Tester Mode: Login → UI Tests (cleanup и DB тесты пропускаются)
 */

import { test, expect, chromium, Browser, BrowserContext, Page } from '@playwright/test';
import { OWNER, WORKSPACE_ID, IS_CI_MODE, hasMongoDBAccess, logTestConfig } from '@fixtures/users';
import * as path from 'path';
import * as fs from 'fs';

const AUTH_DIR = path.join(__dirname, '../../../.auth');

if (!fs.existsSync(AUTH_DIR)) {
  fs.mkdirSync(AUTH_DIR, { recursive: true });
}

// ============================================
// Helpers
// ============================================

async function dismissCookieConsent(page: Page) {
  const btn = page.locator('button:has-text("Accept All"), button:has-text("Accept")');
  if (await btn.isVisible({ timeout: 1000 }).catch(() => false)) {
    await btn.click();
    await btn.waitFor({ state: 'hidden', timeout: 2000 }).catch(() => {});
  }
}

async function cleanupWorkspace() {
  if (!hasMongoDBAccess()) {
    console.log('⏭️  Cleanup пропущен (Tester Mode)');
    return;
  }

  const { MongoClient } = await import('mongodb');
  const client = new MongoClient(process.env.MONGODB_URI!);

  try {
    await client.connect();
    const db = client.db('manager');
    const ws = await db.collection('workspaces').findOne({ wsid: WORKSPACE_ID });

    if (ws) {
      if (ws.ownerId) {
        await db.collection('users').deleteOne({ _id: ws.ownerId });
        console.log('🗑️  Owner удалён из manager DB');
      }
      await db.collection('workspaces').deleteOne({ wsid: WORKSPACE_ID });
      console.log(`🗑️  Workspace "${WORKSPACE_ID}" удалён`);

      const dbName = ws.databaseName || `ws_${WORKSPACE_ID}`;
      await client.db(dbName).dropDatabase();
      console.log(`🗑️  Database "${dbName}" удалена`);
    }
  } finally {
    await client.close();
  }
}

async function registerOwner(page: Page) {
  await page.goto('/account/register');
  await page.waitForLoadState('networkidle');

  await page.fill('input#name', OWNER.name);
  await page.fill('input#register-email', OWNER.email);
  await page.fill('input#register-password', OWNER.password);

  await page.locator('input[type="checkbox"]').check();
  await page.click('button[type="submit"]');

  // Phone
  await page.waitForSelector('input[type="tel"]', { timeout: 10000 });
  await dismissCookieConsent(page);
  await page.fill('input[type="tel"]', '5551234567');
  await page.click('button:has-text("Continue")');

  // Create workspace
  await page.waitForURL('**/manage**', { timeout: 20000 });
  await page.fill('input#name', `${WORKSPACE_ID} Workspace`);
  await page.waitForTimeout(500);

  await page.locator('input#wsid').clear();
  await page.locator('input#wsid').fill(WORKSPACE_ID);
  await page.locator('input#email').clear();
  await page.locator('input#email').fill(OWNER.email);
  await page.fill('input#password', OWNER.password);
  await page.click('button[type="submit"]');

  // Enter workspace
  await page.waitForSelector('text=Enter', { timeout: 15000 });
  await page.click('button:has-text("Enter")');
  await page.waitForURL('**/ws**', { timeout: 15000 });

  await page.context().storageState({ path: path.join(AUTH_DIR, 'owner.json') });
  console.log('✅ Owner зарегистрирован, workspace создан');
}

async function loginOwner(page: Page) {
  await page.goto('/account/login');
  await page.waitForSelector('[data-testid="login-input-wsid"]', { timeout: 15000 });

  await page.fill('[data-testid="login-input-wsid"]', WORKSPACE_ID);
  await page.fill('[data-testid="login-input-email"]', OWNER.email);
  await page.fill('[data-testid="login-input-password"]', OWNER.password);
  await page.click('[data-testid="login-button-submit"]');

  await page.waitForURL(/\/ws/, { timeout: 20000 });
  await page.context().storageState({ path: path.join(AUTH_DIR, 'owner.json') });
  console.log('✅ Owner вошёл в существующий workspace');
}

// ============================================
// Tests
// ============================================

test.describe.serial('Company Owner', () => {
  let browser: Browser;
  let context: BrowserContext;
  let page: Page;

  test.beforeAll(async () => {
    logTestConfig();

    browser = await chromium.launch({ headless: true });
    context = await browser.newContext({ baseURL: process.env.BASE_URL });
    page = await context.newPage();

    if (IS_CI_MODE) {
      console.log('\n📋 CI Mode: Cleanup → Register\n');
      await cleanupWorkspace();
      await registerOwner(page);
    } else {
      console.log('\n📋 Tester Mode: Login в существующий workspace\n');
      await loginOwner(page);
    }

    await page.close();
    await context.close();
    await browser.close();
  });

  // ============================================
  // DB Verification — только CI Mode
  // ============================================

  test('REG1: Owner создан в Manager DB с ролью company_owner', async () => {
    test.skip(!hasMongoDBAccess(), 'SKIP: нет доступа к MongoDB');

    const { MongoClient } = await import('mongodb');
    const client = new MongoClient(process.env.MONGODB_URI!);

    try {
      await client.connect();
      const owner = await client.db('manager').collection('users').findOne({ email: OWNER.email });

      expect(owner).not.toBeNull();
      expect(owner!.roles).toContain('company_owner');
      console.log('✅ Owner есть в Manager DB');
    } finally {
      await client.close();
    }
  });

  test('REG2: Workspace создан в Manager DB', async () => {
    test.skip(!hasMongoDBAccess(), 'SKIP: нет доступа к MongoDB');

    const { MongoClient } = await import('mongodb');
    const client = new MongoClient(process.env.MONGODB_URI!);

    try {
      await client.connect();
      const ws = await client.db('manager').collection('workspaces').findOne({ wsid: WORKSPACE_ID });

      expect(ws).not.toBeNull();
      expect(ws!.status).toBe('active');
      console.log('✅ Workspace есть в Manager DB');
    } finally {
      await client.close();
    }
  });

  test('REG3: Owner создан в Workspace DB с ролью owner', async () => {
    test.skip(!hasMongoDBAccess(), 'SKIP: нет доступа к MongoDB');

    const { MongoClient } = await import('mongodb');
    const client = new MongoClient(process.env.MONGODB_URI!);

    try {
      await client.connect();
      const owner = await client.db(`ws_${WORKSPACE_ID}`).collection('users').findOne({ email: OWNER.email });

      expect(owner).not.toBeNull();
      expect(owner!.roles).toContain('owner');
      console.log('✅ Owner есть в Workspace DB');
    } finally {
      await client.close();
    }
  });

  // ============================================
  // UI Tests — оба режима
  // ============================================

  test('Owner может войти в workspace', async ({ page }) => {
    await page.goto('/account/login');
    await page.fill('[data-testid="login-input-wsid"]', WORKSPACE_ID);
    await page.fill('[data-testid="login-input-email"]', OWNER.email);
    await page.fill('[data-testid="login-input-password"]', OWNER.password);
    await page.click('[data-testid="login-button-submit"]');

    await page.waitForURL(/\/ws/, { timeout: 20000 });
    expect(page.url()).toContain('/ws');
  });

  test('Owner auth state файл создан', async () => {
    expect(fs.existsSync(path.join(AUTH_DIR, 'owner.json'))).toBe(true);
  });

  test('CO1: Owner может войти через admin-login', async ({ page }) => {
    await page.goto('/account/admin-login');
    await page.waitForSelector('[data-testid="login-input-email"]', { timeout: 15000 });

    await page.fill('[data-testid="login-input-email"]', OWNER.email);
    await page.fill('[data-testid="login-input-password"]', OWNER.password);
    await page.click('button[type="submit"]');

    await page.waitForURL(/\/manage/, { timeout: 20000 });
    expect(page.url()).toContain('/manage');
  });

  test('CO2: Owner видит свой workspace в manage', async ({ page }) => {
    await page.goto('/account/admin-login');
    await page.waitForSelector('[data-testid="login-input-email"]', { timeout: 15000 });
    await page.fill('[data-testid="login-input-email"]', OWNER.email);
    await page.fill('[data-testid="login-input-password"]', OWNER.password);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/manage/, { timeout: 20000 });

    await page.goto('/manage/workspaces');
    await page.waitForLoadState('networkidle');

    const row = page.locator(`[data-testid="manage-workspaces-row-${WORKSPACE_ID}"]`);
    await expect(row).toBeVisible({ timeout: 10000 });
  });

  test('CO3: Owner может сгенерировать новый пароль', async ({ browser }) => {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();

    // Login
    await page.goto('/account/admin-login');
    await page.waitForSelector('[data-testid="login-input-email"]', { timeout: 15000 });
    await page.fill('[data-testid="login-input-email"]', OWNER.email);
    await page.fill('[data-testid="login-input-password"]', OWNER.password);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/manage/, { timeout: 20000 });

    // Generate new password
    await page.goto('/manage/workspaces');
    await page.waitForLoadState('networkidle');

    const btn = page.locator(`[data-testid="manage-workspaces-button-reset-password-${WORKSPACE_ID}"]`);
    await expect(btn).toBeVisible({ timeout: 10000 });
    await btn.click();

    const modal = page.locator('[data-testid="workspace-credentials-modal"]');
    await expect(modal).toBeVisible({ timeout: 10000 });

    const pwdField = page.locator('[data-testid="workspace-credentials-password"]');
    const pwdText = await pwdField.textContent();
    const newPassword = pwdText!.replace('Password:', '').trim();
    expect(newPassword.length).toBeGreaterThan(0);

    await page.click('[data-testid="workspace-credentials-button-done"]');
    await ctx.close();

    // Verify new password works
    const loginCtx = await browser.newContext({ storageState: { cookies: [], origins: [] } });
    const loginPage = await loginCtx.newPage();

    await loginPage.goto('/account/login');
    await loginPage.fill('[data-testid="login-input-wsid"]', WORKSPACE_ID);
    await loginPage.fill('[data-testid="login-input-email"]', OWNER.email);
    await loginPage.fill('[data-testid="login-input-password"]', newPassword);
    await loginPage.click('[data-testid="login-button-submit"]');

    await loginPage.waitForURL(/\/ws/, { timeout: 20000 });
    await loginCtx.storageState({ path: path.join(AUTH_DIR, 'owner.json') });
    await loginCtx.close();

    console.log('✅ Новый пароль работает');
  });

  test('CO4: Owner может войти в workspace из manage', async ({ page }) => {
    await page.goto('/account/admin-login');
    await page.waitForSelector('[data-testid="login-input-email"]', { timeout: 15000 });
    await page.fill('[data-testid="login-input-email"]', OWNER.email);
    await page.fill('[data-testid="login-input-password"]', OWNER.password);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/manage/, { timeout: 20000 });

    await page.goto('/manage/workspaces');
    await page.waitForLoadState('networkidle');

    const btn = page.locator(`[data-testid="manage-workspaces-button-enter-${WORKSPACE_ID}"]`);
    await expect(btn).toBeVisible({ timeout: 10000 });
    await btn.click();

    await page.waitForURL(/\/ws/, { timeout: 20000 });
    expect(page.url()).toContain('/ws');
  });
});
