import { test, expect } from '../../fixtures/auth.fixture';

test.describe('Login Page', () => {
  test.beforeEach(async ({ loginPage }) => {
    await loginPage.goto();
  });

  test('should display login form correctly', async ({ loginPage }) => {
    // Verify all form elements are visible
    await expect(loginPage.workspaceIdInput).toBeVisible();
    await expect(loginPage.emailInput).toBeVisible();
    await expect(loginPage.passwordInput).toBeVisible();
    await expect(loginPage.signInButton).toBeVisible();
    await expect(loginPage.continueWithGoogleButton).toBeVisible();
  });

  test('should display correct placeholders', async ({ loginPage }) => {
    // Check placeholders
    await expect(loginPage.workspaceIdInput).toHaveAttribute('placeholder', 'myworkspace');
    await expect(loginPage.emailInput).toHaveAttribute('placeholder', 'email@example.com');
    await expect(loginPage.passwordInput).toHaveAttribute('placeholder', 'At least 6 characters');
  });

  test('should have correct links', async ({ loginPage }) => {
    // Verify navigation links
    await expect(loginPage.forgotPasswordLink).toBeVisible();
    await expect(loginPage.createCompanyLink).toBeVisible();
    await expect(loginPage.adminLoginLink).toBeVisible();

    // Verify link URLs
    await expect(loginPage.forgotPasswordLink).toHaveAttribute('href', '/account/forgot-password');
    await expect(loginPage.createCompanyLink).toHaveAttribute('href', '/account/register');
    await expect(loginPage.adminLoginLink).toHaveAttribute('href', '/account/admin-login');
  });

  test('should successfully login with valid credentials', async ({ loginPage, homePage }) => {
    const workspaceId = process.env.WORKSPACE_ID!;
    const email = process.env.TEST_USER_EMAIL!;
    const password = process.env.TEST_USER_PASSWORD!;

    // Perform login
    await loginPage.login(workspaceId, email, password);

    // Wait for navigation after successful login
    await loginPage.waitForSuccessfulLogin();

    // Verify we're logged in
    const isLoggedIn = await homePage.isLoggedIn();
    expect(isLoggedIn).toBeTruthy();

    // Verify URL changed from login page
    const currentUrl = homePage.getCurrentURL();
    expect(currentUrl).not.toContain('/account/login');
  });

  test('should show error for invalid credentials', async ({ loginPage }) => {
    // Try to login with invalid credentials
    await loginPage.login('invalid-workspace', 'invalid@email.com', 'wrongpassword');

    // Wait a bit for error message
    await loginPage.page.waitForTimeout(2000);

    // Verify we're still on login page (login failed)
    const currentUrl = loginPage.getCurrentURL();
    expect(currentUrl).toContain('/account/login');
  });

  test('should show error for empty fields', async ({ loginPage }) => {
    // Click sign in without filling any fields
    await loginPage.clickSignIn();

    // Verify we're still on login page
    const currentUrl = loginPage.getCurrentURL();
    expect(currentUrl).toContain('/account/login');
  });

  test('should navigate to forgot password page', async ({ loginPage, page }) => {
    await loginPage.clickForgotPassword();

    // Wait for navigation
    await page.waitForURL(/forgot-password/);

    // Verify URL
    const currentUrl = page.url();
    expect(currentUrl).toContain('/account/forgot-password');
  });

  test('should navigate to registration page', async ({ loginPage, page }) => {
    await loginPage.clickCreateCompany();

    // Wait for navigation
    await page.waitForURL(/register/);

    // Verify URL
    const currentUrl = page.url();
    expect(currentUrl).toContain('/account/register');
  });

  test('should navigate to admin login page', async ({ loginPage, page }) => {
    await loginPage.clickAdminLogin();

    // Wait for navigation
    await page.waitForURL(/admin-login/);

    // Verify URL
    const currentUrl = page.url();
    expect(currentUrl).toContain('/account/admin-login');
  });

  test('should display page title correctly', async ({ loginPage }) => {
    const title = await loginPage.getTitle();
    expect(title).toBe('Kompot');
  });
});

test.describe('Authenticated User', () => {
  test('should maintain session after page reload', async ({ authenticatedPage, homePage, page }) => {
    // Verify we're logged in
    let isLoggedIn = await homePage.isLoggedIn();
    expect(isLoggedIn).toBeTruthy();

    // Reload the page
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Verify we're still logged in
    isLoggedIn = await homePage.isLoggedIn();
    expect(isLoggedIn).toBeTruthy();
  });
});
