import { test as base } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { HomePage } from '../pages/HomePage';

type AuthFixtures = {
  loginPage: LoginPage;
  homePage: HomePage;
  authenticatedPage: void;
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
});

export { expect } from '@playwright/test';
