/**
 * Company Owner Tests
 *
 * CI Mode:  Cleanup → Register → Create Contacts → DB Verification → UI Tests
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

// Test contacts required for agreements E2E tests
const TEST_CONTACTS = [
  { name: 'Carol Lopez', email: 'carol.lopez@megatest.kompot.ai' },
  { name: 'Thomas Walker', email: 'thomas.walker@megatest.kompot.ai' },
  { name: 'Nancy Moore', email: 'nancy.moore@megatest.kompot.ai' },
];

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

async function handlePhoneFormIfShown(page: Page) {
  const phoneSubmitButton = page.locator('[data-testid="phone-form-button-submit"]');
  const hasPhoneForm = await phoneSubmitButton.isVisible({ timeout: 3000 }).catch(() => false);
  if (hasPhoneForm) {
    console.log('[MANAGE] Phone form detected, filling phone number');
    await page.locator('input[type="tel"]').fill('5551234567');
    await phoneSubmitButton.click();
    await page.waitForLoadState('networkidle');
  }
}

async function adminLoginAndGoToManage(page: Page) {
  await page.goto('/account/admin-login');
  await page.waitForLoadState('domcontentloaded');

  await page.getByPlaceholder(/email/i).fill(OWNER.email);
  await page.getByPlaceholder(/password/i).fill(OWNER.password);
  await page.getByRole('button', { name: /sign in|log in|login/i }).click();

  await page.waitForURL(/\/manage/, { timeout: 20000 });
  await handlePhoneFormIfShown(page);
}

/**
 * Create test contacts in workspace database
 * Called AFTER workspace registration to ensure contacts aren't deleted by cleanup
 */
async function createTestContacts(): Promise<void> {
  if (!hasMongoDBAccess()) {
    console.log('⏭️  Test contacts creation пропущен (Tester Mode)');
    return;
  }

  const { MongoClient, ObjectId } = await import('mongodb');
  const client = new MongoClient(process.env.MONGODB_URI!);

  try {
    await client.connect();
    const db = client.db(`ws_${WORKSPACE_ID}`);
    const contacts = db.collection('contacts');

    console.log('📋 Создание тестовых контактов:');
    for (const contact of TEST_CONTACTS) {
      const existing = await contacts.findOne({ name: contact.name });

      if (!existing) {
        await contacts.insertOne({
          _id: new ObjectId(),
          name: contact.name,
          emails: [{ address: contact.email, isVerified: true, isSubscribed: true }],
          phones: [],
          addresses: [],
          ownerId: new ObjectId(),
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        console.log(`    ✅ Created test contact: ${contact.name}`);
      } else {
        console.log(`    ✓  Test contact exists: ${contact.name}`);
      }
    }
  } finally {
    await client.close();
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

    // 1. Удаляем owner по email (на случай orphan)
    const ownerDeleted = await db.collection('users').deleteOne({ email: OWNER.email });
    if (ownerDeleted.deletedCount > 0) {
      console.log('🗑️  Owner удалён из manager DB (по email)');
    }

    // 2. Удаляем workspace и его базу
    const ws = await db.collection('workspaces').findOne({ wsid: WORKSPACE_ID });
    if (ws) {
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

  // Fill personal info
  await page.fill('input#name', OWNER.name);
  await page.fill('input#register-email', OWNER.email);
  await page.fill('input#register-password', OWNER.password);

  // Fill company info (workspace created in one step)
  await page.fill('input#company-name', `${WORKSPACE_ID} Workspace`);
  await page.waitForTimeout(300); // Wait for wsid auto-generation

  // Override auto-generated wsid with our test workspace ID
  await page.locator('input#wsid').clear();
  await page.locator('input#wsid').fill(WORKSPACE_ID);

  // Accept terms
  await page.locator('input[type="checkbox"]').check();
  await page.click('button[type="submit"]');

  // After registration, redirects directly to /ws/{wsid}
  await page.waitForURL('**/ws**', { timeout: 30000 });

  await page.context().storageState({ path: path.join(AUTH_DIR, 'owner.json') });
  console.log('✅ Owner зарегистрирован, workspace создан');
}

async function loginOwner(page: Page) {
  await page.goto('/account/login');
  await page.waitForLoadState('domcontentloaded');

  // Select employee tab if present (owner logs in as employee with workspace ID)
  const employeeTab = page.getByRole('tab', { name: /employee/i });
  if (await employeeTab.isVisible({ timeout: 2000 }).catch(() => false)) {
    await employeeTab.click();
    await page.waitForTimeout(300);
  }

  // Fill login form
  const wsidInput = page.getByTestId('login-input-wsid');
  if (await wsidInput.isVisible({ timeout: 2000 }).catch(() => false)) {
    await wsidInput.fill(WORKSPACE_ID);
  }
  await page.getByTestId('login-input-email').fill(OWNER.email);
  await page.getByTestId('login-input-password').fill(OWNER.password);
  await page.getByTestId('login-button-submit').click();

  await page.waitForURL(/\/ws/, { timeout: 20000 });
  await page.context().storageState({ path: path.join(AUTH_DIR, 'owner.json') });
  console.log('✅ Owner вошёл в существующий workspace');
}

async function tryAuthStateOrLogin(browser: Browser): Promise<{ context: BrowserContext; page: Page }> {
  const authFile = path.join(AUTH_DIR, 'owner.json');

  // Try saved auth state first
  if (fs.existsSync(authFile)) {
    console.log('📂 Auth state файл найден, пробуем использовать...');
    try {
      const context = await browser.newContext({
        baseURL: process.env.BASE_URL,
        storageState: authFile,
      });
      const page = await context.newPage();

      // Check if session is still valid
      await page.goto(`/ws/${WORKSPACE_ID}`);
      await page.waitForURL(/\/ws/, { timeout: 10000 });

      // If we got here, auth state is valid
      console.log('✅ Auth state валиден, сессия активна');
      return { context, page };
    } catch {
      console.log('⚠️ Auth state невалиден, пробуем password login...');
    }
  }

  // Fall back to password login
  const context = await browser.newContext({ baseURL: process.env.BASE_URL });
  const page = await context.newPage();
  await loginOwner(page);
  return { context, page };
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

    // Проверяем, нужен ли принудительный setup (cleanup + register)
    const forceSetup = process.env.FORCE_SETUP === 'true';

    if (forceSetup && IS_CI_MODE) {
      console.log('\n📋 FORCE_SETUP: Cleanup → Register → Create Contacts\n');
      context = await browser.newContext({ baseURL: process.env.BASE_URL });
      page = await context.newPage();
      await cleanupWorkspace();
      await registerOwner(page);
      await createTestContacts(); // Create contacts AFTER workspace exists
    } else {
      // Обычный режим - пробуем auth state, затем password login
      console.log('\n📋 Login в существующий workspace\n');
      const result = await tryAuthStateOrLogin(browser);
      context = result.context;
      page = result.page;
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
      // Accept either company_owner or super_admin (super admin can also be workspace owner)
      const hasValidRole = owner!.roles.includes('company_owner') || owner!.roles.includes('super_admin');
      expect(hasValidRole).toBe(true);
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
    // This test uses workspace password which may have been changed by CO3
    // Only run in FORCE_SETUP mode when password is fresh
    const forceSetup = process.env.FORCE_SETUP === 'true';
    test.skip(!forceSetup, 'SKIP: пароль workspace мог быть изменён (запустите с FORCE_SETUP=true)');

    await page.goto('/account/login');
    await page.waitForLoadState('domcontentloaded');

    // Select employee tab if present
    const employeeTab = page.getByRole('tab', { name: /employee/i });
    if (await employeeTab.isVisible({ timeout: 2000 }).catch(() => false)) {
      await employeeTab.click();
      await page.waitForTimeout(300);
    }

    // Fill login form
    const wsidInput = page.getByTestId('login-input-wsid');
    if (await wsidInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await wsidInput.fill(WORKSPACE_ID);
    }
    await page.getByTestId('login-input-email').fill(OWNER.email);
    await page.getByTestId('login-input-password').fill(OWNER.password);
    await page.getByTestId('login-button-submit').click();

    await page.waitForURL(/\/ws/, { timeout: 20000 });
    expect(page.url()).toContain('/ws');
  });

  test('Owner auth state файл создан', async () => {
    expect(fs.existsSync(path.join(AUTH_DIR, 'owner.json'))).toBe(true);
  });

  test('CO1: Owner может войти через admin-login', async ({ page }) => {
    await adminLoginAndGoToManage(page);
    expect(page.url()).toContain('/manage');
  });

  test('CO2: Owner видит свой workspace в manage', async ({ page }) => {
    await adminLoginAndGoToManage(page);

    await page.goto('/manage/workspaces');
    await page.waitForLoadState('networkidle');

    const row = page.locator(`[data-testid="manage-workspaces-row-${WORKSPACE_ID}"]`);
    await expect(row).toBeVisible({ timeout: 10000 });
  });

  test.skip('CO3: Owner может сгенерировать новый пароль', async ({ browser }) => {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();

    // Login via admin-login
    await page.goto('/account/admin-login');
    await page.waitForLoadState('domcontentloaded');
    await page.getByPlaceholder(/email/i).fill(OWNER.email);
    await page.getByPlaceholder(/password/i).fill(OWNER.password);
    await page.getByRole('button', { name: /sign in|log in|login/i }).click();
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
    await loginPage.waitForLoadState('domcontentloaded');

    // Select employee tab if present
    const employeeTab = loginPage.getByRole('tab', { name: /employee/i });
    if (await employeeTab.isVisible({ timeout: 2000 }).catch(() => false)) {
      await employeeTab.click();
      await loginPage.waitForTimeout(300);
    }

    // Fill login form
    const wsidInput = loginPage.getByTestId('login-input-wsid');
    if (await wsidInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await wsidInput.fill(WORKSPACE_ID);
    }
    await loginPage.getByTestId('login-input-email').fill(OWNER.email);
    await loginPage.getByTestId('login-input-password').fill(newPassword);
    await loginPage.getByTestId('login-button-submit').click();

    await loginPage.waitForURL(/\/ws/, { timeout: 20000 });
    await loginCtx.storageState({ path: path.join(AUTH_DIR, 'owner.json') });
    await loginCtx.close();

    console.log('✅ Новый пароль работает');
  });

  test('CO4: Owner может войти в workspace из manage', async ({ page }) => {
    await adminLoginAndGoToManage(page);

    await page.goto('/manage/workspaces');
    await page.waitForLoadState('networkidle');

    const btn = page.locator(`[data-testid="manage-workspaces-button-enter-${WORKSPACE_ID}"]`);
    await expect(btn).toBeVisible({ timeout: 10000 });
    await btn.click();

    await page.waitForURL(/\/ws/, { timeout: 20000 });
    expect(page.url()).toContain('/ws');
  });
});
