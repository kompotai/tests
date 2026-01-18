import { test as base } from '@playwright/test';
import { LoginPage } from '@pages/LoginPage';
import { HomePage } from '@pages/HomePage';
import {ManageWorkspacesPage} from "@pages/ManageWorkspacesPage";

type AuthFixtures = {
  loginPage: LoginPage;
  homePage: HomePage;
  manageWorkspacesPage: ManageWorkspacesPage;
  authenticatedPage: void;
  authenticatedAdminPage: void; // Adding for admin login

};

/**
 * Extended test fixture with authentication helpers
 */
export const test = base.extend<AuthFixtures>({
  /**
   * Login page fixture
   */
  loginPage: async ({ page }, use) => {
    const loginPage = new LoginPage(page);
    await use(loginPage);
  },

  /**
   * Home page fixture
   */
  homePage: async ({ page }, use) => {
    const homePage = new HomePage(page);
    await use(homePage);
  },

  manageWorkspacesPage: async ({ page }, use) => {
    const manageWorkspacesPage = new ManageWorkspacesPage(page);
    await use(manageWorkspacesPage);
  },

  /**
   * Auto-authenticated page fixture
   * This fixture automatically logs in before each test
   */
  authenticatedPage: async ({ page }, use) => {
    const loginPage = new LoginPage(page);
    const homePage = new HomePage(page);

    // Get credentials from environment variables
    const workspaceId = process.env.WORKSPACE_ID;
    const email = process.env.TEST_USER_EMAIL;
    const password = process.env.TEST_USER_PASSWORD;

    if (!workspaceId || !email || !password) {
      throw new Error('Missing required environment variables: WORKSPACE_ID, TEST_USER_EMAIL, TEST_USER_PASSWORD');
    }

    // Perform login
    await loginPage.goto();
    await loginPage.login(workspaceId, email, password);
    await loginPage.waitForSuccessfulLogin();

    // Verify we're logged in
    const isLoggedIn = await homePage.isLoggedIn();
    if (!isLoggedIn) {
      throw new Error('Authentication failed - could not verify login state');
    }

    await use();

    // Cleanup: logout after test (optional)
    // await homePage.logout();
  },
  authenticatedAdminPage: async ({ page }, use) => {
    const homePage = new HomePage(page);

    const workspaceId = process.env.WORKSPACE_ID;
    const email = process.env.TEST_USER_EMAIL;
    const password = process.env.TEST_USER_PASSWORD;

    if (!workspaceId || !email || !password) {
      throw new Error('Missing credentials in .env');
    }

    // Perform Admin Login
    await page.goto('/account/admin-login');
    await page.getByPlaceholder('email@example.com').fill(email);
    await page.getByPlaceholder('At least 6 characters').fill(password);
    await page.getByRole('button', { name: 'Sign In' }).click();

    // Wait for navigation away from login
    await page.waitForURL(/^(?!.*\/account\/(login|admin-login)).*$/);

    const isLoggedIn = await homePage.isLoggedIn();
    if (!isLoggedIn) throw new Error('Admin Authentication failed');

    await use();
  },

});

export { expect } from '@playwright/test';
