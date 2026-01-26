/**
 * TestWorld Fixture
 *
 * Provides shared context for story-driven tests.
 * Extends Playwright with TestWorld instance.
 */

import 'dotenv/config';
import { test as base, Page, BrowserContext, APIRequestContext } from '@playwright/test';
import { TestCredentials, TestUrls } from '@utils/test-data';

export interface TestUser {
  workspaceId: string;
  email: string;
  password: string;
  role?: string;
}

export class TestWorld {
  page!: Page;
  context!: BrowserContext;
  request!: APIRequestContext;

  currentUser?: TestUser;
  lastError?: string;

  static readonly USERS: Record<string, TestUser> = {
    default: {
      workspaceId: TestCredentials.workspaceId,
      email: TestCredentials.email,
      password: TestCredentials.password,
      role: 'user',
    },
    admin: {
      workspaceId: TestCredentials.workspaceId,
      email: TestCredentials.adminEmail,
      password: TestCredentials.adminPassword,
      role: 'admin',
    },
  };

  async goto(path: string): Promise<void> {
    await this.page.goto(path);
    await this.page.waitForLoadState('networkidle');
  }

  async login(workspaceId: string, email: string, password: string): Promise<void> {
    await this.page.goto(TestUrls.login);

    // Wait for form to be ready
    await this.page.waitForSelector('form');

    await this.dismissOverlays();

    // Fill in the credentials
    await this.page.fill('[data-testid="login-input-wsid"]', workspaceId);
    await this.page.fill('[data-testid="login-input-email"]', email);
    await this.page.fill('[data-testid="login-input-password"]', password);

    // Submit the form
    await this.page.click('[data-testid="login-button-submit"]');

    // Wait for URL to change from /login
    await this.page.waitForURL(
      url => !url.pathname.includes('/login'),
      { timeout: 20000 }
    );

    // Wait for page to be fully loaded
    await this.page.waitForLoadState('domcontentloaded');
    await this.page.waitForLoadState('networkidle');
  }

  async loginAs(role: 'default' | 'admin' = 'default'): Promise<void> {
    const user = TestWorld.USERS[role];
    if (!user) throw new Error(`Unknown user role: ${role}`);
    await this.login(user.workspaceId, user.email, user.password);
    this.currentUser = user;
    await this.dismissOverlays();
  }

  async dismissOverlays(): Promise<void> {
    await this.page.waitForTimeout(300);
    const cookieBtn = this.page.getByRole('button', { name: /accept/i });
    if (await cookieBtn.isVisible({ timeout: 500 }).catch(() => false)) {
      await cookieBtn.click();
    }
    await this.page.keyboard.press('Escape').catch(() => {});
  }

  async logout(): Promise<void> {
    // Call NextAuth signOut endpoint
    await this.page.request.post('/api/auth/signout', {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      data: 'csrfToken=',
    }).catch(() => {});

    // Clear localStorage and cookies
    await this.page.evaluate(() => localStorage.clear()).catch(() => {});
    await this.page.context().clearCookies();

    // Navigate to login
    await this.page.goto('/login');
    await this.page.waitForLoadState('networkidle');
    this.currentUser = undefined;
  }

  async fillField(field: string, value: string): Promise<void> {
    const selectors = [
      `[data-testid="login-input-${field}"]`,
      `[data-testid="${field}-input"]`,
      `input[name="${field}"]`,
      `input#${field}`,
    ];
    for (const selector of selectors) {
      const input = this.page.locator(selector).first();
      if (await input.isVisible({ timeout: 500 }).catch(() => false)) {
        await input.fill(value);
        return;
      }
    }
    throw new Error(`Field not found: ${field}`);
  }

  async clickButton(text: string): Promise<void> {
    await this.page.locator(`button:has-text("${text}")`).first().click();
  }

  async shouldSee(text: string): Promise<boolean> {
    try {
      await this.page.getByText(text).first().waitFor({ state: 'visible', timeout: 5000 });
      return true;
    } catch {
      return false;
    }
  }

  async shouldBeOnPage(pattern: string | RegExp): Promise<void> {
    const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern;
    await this.page.waitForURL(regex, { timeout: 15000 });
  }

  async isLoggedIn(): Promise<boolean> {
    const url = this.page.url();
    return url.includes('/ws') || url.includes('/dashboard') || url.includes('/home');
  }

  async waitForLoading(): Promise<void> {
    const spinner = this.page.locator('.animate-spin, [class*="loading"]').first();
    if (await spinner.isVisible({ timeout: 500 }).catch(() => false)) {
      await spinner.waitFor({ state: 'hidden', timeout: 30000 });
    }
    await this.page.waitForLoadState('networkidle');
  }

  async cleanup(): Promise<void> {
    this.currentUser = undefined;
    this.lastError = undefined;
  }
}

export const test = base.extend<{ world: TestWorld }>({
  world: async ({ page, context, request }, use) => {
    const world = new TestWorld();
    world.page = page;
    world.context = context;
    world.request = request;
    await use(world);
    await world.cleanup();
  },
});

export { expect } from '@playwright/test';
