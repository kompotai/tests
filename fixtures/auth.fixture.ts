/**
 * Auth Fixtures for Role-Based Testing
 *
 * Usage:
 *
 * 1. Static (whole file uses one user):
 *    import { useUser } from '@fixtures/users';
 *    test.use({ storageState: useUser('admin') });
 *
 * 2. Pre-configured test instances:
 *    import { adminTest } from '@fixtures/auth.fixture';
 *    adminTest('can manage users', async ({ page }) => {
 *      // page is pre-authenticated as admin
 *    });
 *
 * 3. Dynamic (switch users within test):
 *    import { test } from '@fixtures/auth.fixture';
 *    test('admin and manager interaction', async ({ loginAs }) => {
 *      const adminPage = await loginAs('admin');
 *      const managerPage = await loginAs('manager');
 *      // ... test interaction between users
 *    });
 */

import { test as base, Page, BrowserContext } from '@playwright/test';
import { UserKey, OWNER, getAuthFile, useUser } from './users';

interface AuthFixtures {
  /**
   * Login as a specific user and return a new page
   * Creates isolated browser context with user's auth state
   */
  loginAs: (userKey: UserKey) => Promise<Page>;
}

/**
 * Extended test with loginAs fixture
 */
export const test = base.extend<AuthFixtures>({
  loginAs: async ({ browser }, use) => {
    const contexts: BrowserContext[] = [];

    const loginAs = async (userKey: UserKey): Promise<Page> => {
      const context = await browser.newContext({
        storageState: getAuthFile(userKey),
      });
      const page = await context.newPage();
      contexts.push(context);
      return page;
    };

    await use(loginAs);

    // Cleanup: close all contexts (pages close automatically)
    for (const context of contexts) {
      await context.close().catch(() => {});
    }
  },
});

/**
 * Pre-configured test instances for each role
 */
export const superAdminTest = base.extend({
  storageState: useUser('super-admin'),
});

export const ownerTest = base.extend({
  storageState: useUser('owner'),
});

export const adminTest = base.extend({
  storageState: useUser('admin'),
});

export const managerTest = base.extend({
  storageState: useUser('manager'),
});

export const technicianTest = base.extend({
  storageState: useUser('technician'),
});

export const accountantTest = base.extend({
  storageState: useUser('accountant'),
});

// Re-export for convenience
export { expect } from '@playwright/test';
export { SUPER_ADMIN, OWNER, USERS, getUser, getAuthFile, useUser, UserKey } from './users';
