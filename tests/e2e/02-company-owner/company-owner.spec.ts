/**
 * Company Owner - Registration + Workspace Creation + Platform Actions
 *
 * ╔══════════════════════════════════════════════════════════════════════════╗
 * ║  Flow:                                                                   ║
 * ║  1. Cleanup megatest data (DELETE from DB)                               ║
 * ║  2. Register owner via /account/register                                 ║
 * ║  3. Enter phone, create workspace                                        ║
 * ║  4. Enter workspace, save auth state                                     ║
 * ║                                                                          ║
 * ║  Verification (REG1-REG3):                                               ║
 * ║  - Owner created in Manager DB with company_owner role                   ║
 * ║  - Workspace created in Manager DB                                       ║
 * ║  - Owner created in Workspace DB with owner role                         ║
 * ║                                                                          ║
 * ║  Platform Actions (CO1-CO4):                                             ║
 * ║  - CO1: Owner can login via admin-login                                  ║
 * ║  - CO2: Owner can see workspace in manage list                           ║
 * ║  - CO3: Owner can generate new password and login with it                ║
 * ║  - CO4: Owner can enter workspace from manage dashboard                  ║
 * ╚══════════════════════════════════════════════════════════════════════════╝
 */

import { test, expect, chromium, Browser, BrowserContext, Page } from '@playwright/test';
import { OWNER } from '@fixtures/users';
import { MongoClient } from 'mongodb';
import * as path from 'path';
import * as fs from 'fs';

const AUTH_DIR = path.join(__dirname, '../../../.auth');
const WORKSPACE_ID = process.env.WS_MEGATEST_ID || 'megatest';

// Ensure auth directory exists
if (!fs.existsSync(AUTH_DIR)) {
  fs.mkdirSync(AUTH_DIR, { recursive: true });
}

// ============================================
// Helper Functions
// ============================================

async function dismissCookieConsent(page: Page) {
  const acceptBtn = page.locator('button:has-text("Accept All"), button:has-text("Accept")');
  if (await acceptBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
    await acceptBtn.click();
    await acceptBtn.waitFor({ state: 'hidden', timeout: 2000 }).catch(() => {});
  }
}

async function cleanupMegatestData() {
  const mongoUri = process.env.MONGODB_URI!;

  if (!mongoUri || !WORKSPACE_ID) {
    console.log('⚠️  Missing env vars, skipping cleanup');
    return;
  }

  const client = new MongoClient(mongoUri);

  try {
    await client.connect();
    const managerDb = client.db('manager');

    // Find workspace first to get owner ID
    const workspace = await managerDb.collection('workspaces').findOne({ wsid: WORKSPACE_ID });

    if (workspace) {
      // Delete owner by ID (from workspace.ownerId)
      if (workspace.ownerId) {
        const ownerResult = await managerDb.collection('users').deleteOne({
          _id: workspace.ownerId
        });
        if (ownerResult.deletedCount > 0) {
          console.log(`🗑️  Deleted owner by ID from manager DB`);
        }
      }

      // Delete workspace record
      await managerDb.collection('workspaces').deleteOne({ wsid: WORKSPACE_ID });
      console.log(`🗑️  Deleted workspace record "${WORKSPACE_ID}"`);

      // Drop workspace database
      const dbName = workspace.databaseName || `ws_${WORKSPACE_ID}`;
      await client.db(dbName).dropDatabase();
      console.log(`🗑️  Dropped database "${dbName}"`);
    }
  } finally {
    await client.close();
  }
}

async function registerOwnerAndCreateWorkspace(page: Page) {
  // Register owner
  await page.goto('/account/register');
  await page.waitForLoadState('networkidle');

  await page.fill('input#name', OWNER.name);
  await page.fill('input#register-email', OWNER.email);
  await page.fill('input#register-password', OWNER.password);

  const termsCheckbox = page.locator('input[type="checkbox"]');
  await termsCheckbox.check();
  await page.click('button[type="submit"]');

  // Enter phone number
  await page.waitForSelector('input[type="tel"]', { timeout: 10000 });
  await dismissCookieConsent(page);
  await page.fill('input[type="tel"]', '5551234567');
  await page.click('button:has-text("Continue")');

  // Create workspace
  await page.waitForURL('**/manage**', { timeout: 20000 });

  await page.fill('input#name', 'Megatest');
  await page.waitForTimeout(500);

  const wsidInput = page.locator('input#wsid');
  await wsidInput.clear();
  await wsidInput.fill(WORKSPACE_ID);

  const emailInput = page.locator('input#email');
  await emailInput.clear();
  await emailInput.fill(OWNER.email);

  // fill() automatically clears the field first
  await page.fill('input#password', OWNER.password);

  await page.click('button[type="submit"]');

  // Enter workspace
  await page.waitForSelector('text=Enter', { timeout: 15000 });
  await page.click('button:has-text("Enter")');
  await page.waitForURL('**/ws**', { timeout: 15000 });

  // Save owner auth state
  await page.context().storageState({ path: path.join(AUTH_DIR, 'owner.json') });
  console.log('✅ Owner registered and workspace created');
}

// ============================================
// Setup
// ============================================

test.describe.serial('Company Owner', () => {
  let browser: Browser;
  let context: BrowserContext;
  let page: Page;

  test.beforeAll(async () => {
    console.log('\n' + '='.repeat(60));
    console.log('  COMPANY OWNER: Registration + Workspace Setup');
    console.log('='.repeat(60) + '\n');

    // 1. Cleanup
    console.log('Step 1: Cleanup megatest data...');
    await cleanupMegatestData();

    // 2. Launch browser
    browser = await chromium.launch({ headless: true });
    context = await browser.newContext({ baseURL: process.env.BASE_URL });
    page = await context.newPage();

    // 3. Register owner and create workspace
    console.log('\nStep 2: Register owner and create workspace...');
    await registerOwnerAndCreateWorkspace(page);

    // Cleanup browser
    await page.close();
    await context.close();
    await browser.close();

    console.log('\n' + '='.repeat(60));
    console.log('  SETUP COMPLETE');
    console.log('='.repeat(60) + '\n');
  });

  // ============================================
  // Registration Verification - Company Owner created correctly
  // ============================================

  test('REG1: owner was created in Manager DB with company_owner role', async () => {
    const mongoUri = process.env.MONGODB_URI!;
    const client = new MongoClient(mongoUri);

    try {
      await client.connect();
      const managerDb = client.db('manager');

      // Find owner in Manager DB
      const owner = await managerDb.collection('users').findOne({ email: OWNER.email });
      expect(owner).not.toBeNull();
      expect(owner!.name).toBe(OWNER.name);
      expect(owner!.roles).toContain('company_owner');
      expect(owner!.isActive).toBe(true);

      console.log('✅ Owner exists in Manager DB with company_owner role');
    } finally {
      await client.close();
    }
  });

  test('REG2: workspace was created in Manager DB', async () => {
    const mongoUri = process.env.MONGODB_URI!;
    const client = new MongoClient(mongoUri);

    try {
      await client.connect();
      const managerDb = client.db('manager');

      // Find workspace
      const workspace = await managerDb.collection('workspaces').findOne({ wsid: WORKSPACE_ID });
      expect(workspace).not.toBeNull();
      expect(workspace!.name).toBe('Megatest');
      expect(workspace!.status).toBe('active');
      expect(workspace!.ownerEmail).toBe(OWNER.email);

      console.log('✅ Workspace exists in Manager DB');
    } finally {
      await client.close();
    }
  });

  test('REG3: owner exists in Workspace DB with owner role', async () => {
    const mongoUri = process.env.MONGODB_URI!;
    const client = new MongoClient(mongoUri);

    try {
      await client.connect();
      const workspaceDb = client.db(`ws_${WORKSPACE_ID}`);

      // Find owner in Workspace DB
      const owner = await workspaceDb.collection('users').findOne({ email: OWNER.email });
      expect(owner).not.toBeNull();
      expect(owner!.name).toBe(OWNER.name);
      expect(owner!.roles).toContain('owner');  // roles is an array

      console.log('✅ Owner exists in Workspace DB with owner role');
    } finally {
      await client.close();
    }
  });

  // ============================================
  // Login Verification
  // ============================================

  test('owner can login to workspace', async ({ page }) => {
    await page.goto('/account/login');
    await page.fill('[data-testid="login-input-wsid"]', WORKSPACE_ID);
    await page.fill('[data-testid="login-input-email"]', OWNER.email);
    await page.fill('[data-testid="login-input-password"]', OWNER.password);
    await page.click('[data-testid="login-button-submit"]');

    await page.waitForURL(/\/ws|\/dashboard|\/home/, { timeout: 20000 });
    expect(page.url()).toMatch(/\/ws|\/dashboard|\/home/);
  });

  test('owner auth state file was created', async () => {
    expect(fs.existsSync(path.join(AUTH_DIR, 'owner.json'))).toBe(true);
  });

  // ============================================
  // Platform Access - Owner can access /manage/
  // ============================================

  test('CO1: owner can login via admin-login and see manage dashboard', async ({ page }) => {
    // Navigate to admin login (same as super admin uses)
    await page.goto('/account/admin-login');
    await page.waitForSelector('[data-testid="login-input-email"]', { timeout: 15000 });

    // Fill login form with owner credentials
    await page.fill('[data-testid="login-input-email"]', OWNER.email);
    await page.fill('[data-testid="login-input-password"]', OWNER.password);
    await page.click('button[type="submit"]');

    // Wait for redirect to manage dashboard
    await page.waitForURL(/\/manage/, { timeout: 20000 });
    expect(page.url()).toContain('/manage');
    console.log('✅ Owner logged in via admin-login');
  });

  test('CO2: owner can see their workspace in manage workspaces list', async ({ page }) => {
    // Login via admin-login first
    await page.goto('/account/admin-login');
    await page.waitForSelector('[data-testid="login-input-email"]', { timeout: 15000 });
    await page.fill('[data-testid="login-input-email"]', OWNER.email);
    await page.fill('[data-testid="login-input-password"]', OWNER.password);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/manage/, { timeout: 20000 });

    // Navigate to workspaces page
    await page.goto('/manage/workspaces');
    await page.waitForLoadState('networkidle');

    // Verify the workspace is visible
    const workspaceRow = page.locator(`[data-testid="manage-workspaces-row-${WORKSPACE_ID}"]`);
    await expect(workspaceRow).toBeVisible({ timeout: 10000 });
    await expect(workspaceRow).toContainText(WORKSPACE_ID);
    console.log('✅ Owner can see their workspace in manage list');
  });

  test('CO3: owner can generate new password and login with it', async ({ browser }) => {
    // Create fresh context for this test
    const context = await browser.newContext();
    const page = await context.newPage();

    // Login via admin-login first
    await page.goto('/account/admin-login');
    await page.waitForSelector('[data-testid="login-input-email"]', { timeout: 15000 });
    await page.fill('[data-testid="login-input-email"]', OWNER.email);
    await page.fill('[data-testid="login-input-password"]', OWNER.password);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/manage/, { timeout: 20000 });

    // Navigate to workspaces page
    await page.goto('/manage/workspaces');
    await page.waitForLoadState('networkidle');

    // Click on change password button (key icon)
    const changePasswordBtn = page.locator(`[data-testid="manage-workspaces-button-reset-password-${WORKSPACE_ID}"]`);
    await expect(changePasswordBtn).toBeVisible({ timeout: 10000 });
    await changePasswordBtn.click();

    // Verify credentials modal appears with new password
    const credentialsModal = page.locator('[data-testid="workspace-credentials-modal"]');
    await expect(credentialsModal).toBeVisible({ timeout: 10000 });

    // Extract new password from modal
    const passwordField = page.locator('[data-testid="workspace-credentials-password"]');
    await expect(passwordField).toBeVisible();
    const passwordText = await passwordField.textContent();
    expect(passwordText).toBeTruthy();

    // Extract just the password value (format: "Password: xxxxx")
    const newPassword = passwordText!.replace('Password:', '').trim();
    expect(newPassword.length).toBeGreaterThan(0);

    // Close modal
    await page.click('[data-testid="workspace-credentials-button-done"]');
    await expect(credentialsModal).not.toBeVisible({ timeout: 5000 });
    await context.close();

    // Now verify login with new password works
    const loginContext = await browser.newContext({
      storageState: { cookies: [], origins: [] },  // Fresh session
    });
    const loginPage = await loginContext.newPage();

    await loginPage.goto('/account/login');
    await loginPage.waitForSelector('[data-testid="login-input-wsid"]', { timeout: 15000 });
    await loginPage.fill('[data-testid="login-input-wsid"]', WORKSPACE_ID);
    await loginPage.fill('[data-testid="login-input-email"]', OWNER.email);
    await loginPage.fill('[data-testid="login-input-password"]', newPassword);
    await loginPage.click('[data-testid="login-button-submit"]');

    // Should successfully login to workspace
    await loginPage.waitForURL(/\/ws/, { timeout: 20000 });
    expect(loginPage.url()).toContain('/ws');

    // Update owner auth state with new password session
    await loginContext.storageState({ path: path.join(AUTH_DIR, 'owner.json') });
    await loginContext.close();

    console.log('✅ Owner can generate new password and login with it');
  });

  test('CO4: owner can enter workspace from manage dashboard', async ({ page }) => {
    // Login via admin-login first
    await page.goto('/account/admin-login');
    await page.waitForSelector('[data-testid="login-input-email"]', { timeout: 15000 });
    await page.fill('[data-testid="login-input-email"]', OWNER.email);
    await page.fill('[data-testid="login-input-password"]', OWNER.password);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/manage/, { timeout: 20000 });

    // Navigate to workspaces page
    await page.goto('/manage/workspaces');
    await page.waitForLoadState('networkidle');

    // Click on enter workspace button (arrow icon)
    const enterWorkspaceBtn = page.locator(`[data-testid="manage-workspaces-button-enter-${WORKSPACE_ID}"]`);
    await expect(enterWorkspaceBtn).toBeVisible({ timeout: 10000 });
    await enterWorkspaceBtn.click();

    // Should navigate to workspace
    await page.waitForURL(/\/ws/, { timeout: 20000 });
    expect(page.url()).toContain('/ws');

    console.log('✅ Owner can enter workspace from manage dashboard');
  });

  // Note: CO5 (same password for both logins) was removed because:
  // After CO3 generates new workspace password, the passwords are different:
  // - Manager DB (admin-login): original registration password
  // - Workspace DB (regular login): newly generated password
  // CO3 already verifies that the new workspace password works.
});
