import { Page, Locator } from '@playwright/test';

/**
 * Base Page class with common methods for all page objects
 */
export class BasePage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  /**
   * Navigate to a specific path
   * @param path - relative path to navigate to
   */
  async goto(path: string = ''): Promise<void> {
    await this.page.goto(path);
  }

  /**
   * Wait for page to be loaded
   */
  async waitForPageLoad(): Promise<void> {
    await this.page.waitForLoadState('domcontentloaded');
  }

  /**
   * Get element by test id
   */
  getByTestId(testId: string): Locator {
    return this.page.getByTestId(testId);
  }

  /**
   * Get element by role
   */
  getByRole(role: 'button' | 'link' | 'textbox' | 'heading' | 'alert', options?: any): Locator {
    return this.page.getByRole(role, options);
  }

  /**
   * Get element by text
   */
  getByText(text: string | RegExp): Locator {
    return this.page.getByText(text);
  }

  /**
   * Get element by placeholder
   */
  getByPlaceholder(placeholder: string | RegExp): Locator {
    return this.page.getByPlaceholder(placeholder);
  }

  /**
   * Get element by label
   */
  getByLabel(label: string | RegExp): Locator {
    return this.page.getByLabel(label);
  }

  /**
   * Wait for URL to contain specific text
   */
  async waitForURL(url: string | RegExp): Promise<void> {
    await this.page.waitForURL(url);
  }

  /**
   * Get current URL
   */
  getCurrentURL(): string {
    return this.page.url();
  }

  /**
   * Get page title
   */
  async getTitle(): Promise<string> {
    return await this.page.title();
  }

  /**
   * Take a screenshot
   */
  async takeScreenshot(name: string): Promise<void> {
    await this.page.screenshot({ path: `screenshots/${name}.png`, fullPage: true });
  }

  /**
   * Wait for element to be visible
   */
  async waitForElement(locator: Locator): Promise<void> {
    await locator.waitFor({ state: 'visible' });
  }

  /**
   * Reload the page
   */
  async reload(): Promise<void> {
    await this.page.reload();
  }
}
