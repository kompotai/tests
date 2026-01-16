import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Home Page Object Model
 * Represents the main page after successful login
 */
export class HomePage extends BasePage {
  // Common navigation elements
  readonly userMenuButton: Locator;
  readonly logoutButton: Locator;

  constructor(page: Page) {
    super(page);

    // Initialize locators - these may need adjustment based on actual page structure
    this.userMenuButton = page.locator('[aria-label="User menu"]').or(page.getByRole('button', { name: /profile|account|user/i }));
    this.logoutButton = page.getByRole('button', { name: /logout|sign out/i });
  }

  /**
   * Check if user is logged in by looking for user menu or specific elements
   */
  async isLoggedIn(): Promise<boolean> {
    try {
      // Wait for navigation to complete and check URL doesn't contain login
      await this.waitForPageLoad();
      const url = this.getCurrentURL();
      return !url.includes('/account/login') && !url.includes('/account/register');
    } catch {
      return false;
    }
  }

  /**
   * Open user menu
   */
  async openUserMenu(): Promise<void> {
    if (await this.userMenuButton.isVisible()) {
      await this.userMenuButton.click();
    }
  }

  /**
   * Logout from the application
   */
  async logout(): Promise<void> {
    await this.openUserMenu();
    await this.logoutButton.click();
  }

  /**
   * Get the main heading or welcome message
   */
  async getWelcomeMessage(): Promise<string | null> {
    const heading = this.page.locator('h1').first();
    if (await heading.isVisible()) {
      return await heading.textContent();
    }
    return null;
  }

  /**
   * Wait for home page to load
   */
  async waitForHomePage(): Promise<void> {
    await this.page.waitForLoadState('networkidle');
  }
}
