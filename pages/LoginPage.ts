import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Login Page Object Model
 */
export class LoginPage extends BasePage {
  // Locators
  readonly workspaceIdInput: Locator;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly signInButton: Locator;
  readonly continueWithGoogleButton: Locator;
  readonly forgotPasswordLink: Locator;
  readonly createCompanyLink: Locator;
  readonly adminLoginLink: Locator;
  readonly userTab: Locator;
  readonly adminTab: Locator;

  constructor(page: Page) {
    super(page);

    // Initialize locators
    this.workspaceIdInput = page.getByPlaceholder('myworkspace');
    this.emailInput = page.getByPlaceholder('email@example.com');
    this.passwordInput = page.getByPlaceholder('At least 6 characters');
    this.signInButton = page.getByRole('button', { name: 'Sign In' });
    this.continueWithGoogleButton = page.getByRole('button', { name: 'Continue with Google' });
    this.forgotPasswordLink = page.getByRole('link', { name: 'Forgot Password?' });
    this.createCompanyLink = page.getByRole('link', { name: 'Create Company' });
    this.adminLoginLink = page.getByRole('link', { name: 'Admin' });
    this.userTab = page.getByText('User');
  }

  /**
   * Navigate to login page
   */
  async goto(): Promise<void> {
    await super.goto('/account/login');
    await this.waitForPageLoad();
  }

  /**
   * Fill workspace ID
   */
  async fillWorkspaceId(workspaceId: string): Promise<void> {
    await this.workspaceIdInput.fill(workspaceId);
  }

  /**
   * Fill email
   */
  async fillEmail(email: string): Promise<void> {
    await this.emailInput.fill(email);
  }

  /**
   * Fill password
   */
  async fillPassword(password: string): Promise<void> {
    await this.passwordInput.fill(password);
  }

  /**
   * Click Sign In button
   */
  async clickSignIn(): Promise<void> {
    await this.signInButton.click();
  }

  /**
   * Perform full login flow
   */
  async login(workspaceId: string, email: string, password: string): Promise<void> {
    await this.fillWorkspaceId(workspaceId);
    await this.fillEmail(email);
    await this.fillPassword(password);
    await this.clickSignIn();
  }

  /**
   * Click Continue with Google button
   */
  async clickContinueWithGoogle(): Promise<void> {
    await this.continueWithGoogleButton.click();
  }

  /**
   * Click Forgot Password link
   */
  async clickForgotPassword(): Promise<void> {
    await this.forgotPasswordLink.click();
  }

  /**
   * Click Create Company link
   */
  async clickCreateCompany(): Promise<void> {
    await this.createCompanyLink.click();
  }

  /**
   * Click Admin login link
   */
  async clickAdminLogin(): Promise<void> {
    await this.adminLoginLink.click();
  }

  /**
   * Check if login form is visible
   */
  async isLoginFormVisible(): Promise<boolean> {
    return await this.signInButton.isVisible();
  }

  /**
   * Get validation error message
   */
  async getErrorMessage(): Promise<string | null> {
    const alert = this.page.locator('[role="alert"]').first();
    if (await alert.isVisible()) {
      return await alert.textContent();
    }
    return null;
  }

  /**
   * Wait for successful login (navigation away from login page)
   */
  async waitForSuccessfulLogin(): Promise<void> {
    await this.page.waitForURL(/^(?!.*\/account\/login).*$/);
  }
}
