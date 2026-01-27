/**
 * Login Page Object
 */

import { Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';
import { Selectors } from './selectors';

export class LoginPage extends BasePage {
  readonly path = '/login';

  private get selectors() {
    return Selectors.login;
  }

  async login(workspaceId: string, email: string, password: string): Promise<void> {
    await this.goto();
    await this.page.waitForSelector('form');

    await this.page.fill(this.selectors.wsidInput, workspaceId);
    await this.page.fill(this.selectors.emailInput, email);
    await this.page.fill(this.selectors.passwordInput, password);
    await this.page.click(this.selectors.submitButton);

    await this.page.waitForFunction(
      () => !window.location.pathname.includes('/login'),
      { timeout: 20000 }
    );

    await this.waitForPageLoad();
    await this.dismissOverlays();
  }

  async fillWorkspaceId(value: string): Promise<void> {
    await this.page.fill(this.selectors.wsidInput, value);
  }

  async fillEmail(value: string): Promise<void> {
    await this.page.fill(this.selectors.emailInput, value);
  }

  async fillPassword(value: string): Promise<void> {
    await this.page.fill(this.selectors.passwordInput, value);
  }

  async submit(): Promise<void> {
    await this.page.click(this.selectors.submitButton);
    await this.waitForSpinner();
  }

  async shouldSeeError(): Promise<void> {
    await expect(this.page.locator(this.selectors.errorMessage).first())
      .toBeVisible({ timeout: 5000 });
  }

  async isOnLoginPage(): Promise<boolean> {
    return this.page.url().includes('/login');
  }
}
