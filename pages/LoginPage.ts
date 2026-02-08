/**
 * Login Page Object
 *
 * Supports two login flows:
 * - Employee login: requires Workspace ID + Email + Password
 * - Company Owner login: requires Email + Password only
 */

import { Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export type LoginTab = 'employee' | 'owner';

export class LoginPage extends BasePage {
  readonly path = '/account/login';

  // ============================================
  // User-facing Locators
  // ============================================

  private get employeeTab() {
    return this.page.getByRole('tab', { name: /employee/i });
  }

  private get ownerTab() {
    return this.page.getByRole('tab', { name: /company owner|owner/i });
  }

  private get workspaceIdInput() {
    return this.page.getByTestId('login-input-wsid');
  }

  private get emailInput() {
    return this.page.getByTestId('login-input-email');
  }

  private get passwordInput() {
    return this.page.getByTestId('login-input-password');
  }

  private get submitButton() {
    return this.page.getByTestId('login-button-submit');
  }

  private get errorMessage() {
    return this.page.getByRole('alert');
  }

  // ============================================
  // Tab Selection
  // ============================================

  async selectTab(tab: LoginTab): Promise<void> {
    const tabLocator = tab === 'employee' ? this.employeeTab : this.ownerTab;

    // Only click if tab exists and is not already selected
    if (await tabLocator.isVisible({ timeout: 2000 }).catch(() => false)) {
      const isSelected = await tabLocator.getAttribute('aria-selected') === 'true'
        || await tabLocator.getAttribute('data-state') === 'active';

      if (!isSelected) {
        await tabLocator.click();
        await this.page.waitForTimeout(300); // Allow tab content to switch
      }
    }
  }

  async hasWorkspaceIdField(): Promise<boolean> {
    return await this.workspaceIdInput.isVisible({ timeout: 2000 }).catch(() => false);
  }

  // ============================================
  // Login Methods
  // ============================================

  /**
   * Login as employee (requires workspace ID)
   */
  async loginAsEmployee(workspaceId: string, email: string, password: string): Promise<void> {
    await this.goto();
    await this.page.waitForLoadState('domcontentloaded');

    // Select employee tab if tabs are present
    await this.selectTab('employee');

    // Fill workspace ID if field is present
    if (await this.hasWorkspaceIdField()) {
      await this.workspaceIdInput.fill(workspaceId);
    }

    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();

    await this.waitForLoginComplete();
  }

  /**
   * Login as company owner (no workspace ID needed)
   */
  async loginAsOwner(email: string, password: string): Promise<void> {
    await this.goto();
    await this.page.waitForLoadState('domcontentloaded');

    // Select owner tab if tabs are present
    await this.selectTab('owner');

    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();

    await this.waitForLoginComplete();
  }

  /**
   * Generic login - auto-detects form type
   * If workspace ID field is present, fills it
   */
  async login(workspaceId: string, email: string, password: string): Promise<void> {
    await this.goto();
    await this.page.waitForLoadState('domcontentloaded');

    // Select employee tab by default (most common case)
    await this.selectTab('employee');

    // Fill workspace ID if the field is present
    if (await this.hasWorkspaceIdField()) {
      await this.workspaceIdInput.fill(workspaceId);
    }

    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();

    await this.waitForLoginComplete();
  }

  private async waitForLoginComplete(): Promise<void> {
    await this.page.waitForURL(url => !url.pathname.includes('/login'), {
      timeout: 20000,
    });

    await this.waitForPageLoad();
    await this.dismissOverlays();
  }

  // ============================================
  // Field Helpers
  // ============================================

  async fillWorkspaceId(value: string): Promise<void> {
    await this.workspaceIdInput.fill(value);
  }

  async fillEmail(value: string): Promise<void> {
    await this.emailInput.fill(value);
  }

  async fillPassword(value: string): Promise<void> {
    await this.passwordInput.fill(value);
  }

  async submit(): Promise<void> {
    await this.submitButton.click();
    await this.waitForSpinner();
  }

  // ============================================
  // Assertions
  // ============================================

  async shouldSeeError(): Promise<void> {
    await expect(this.errorMessage.first()).toBeVisible({ timeout: 5000 });
  }

  async shouldSeeErrorWithText(text: string | RegExp): Promise<void> {
    await expect(this.page.getByText(text).first()).toBeVisible({ timeout: 5000 });
  }

  async isOnLoginPage(): Promise<boolean> {
    return this.page.url().includes('/login');
  }
}
