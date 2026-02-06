/**
 * Email Services Page Object
 *
 * Page object for email services settings page.
 * New structure:
 * - /settings/email/services - Provider list
 * - /settings/email/services/resend - Resend setup (3-step wizard)
 */

import { Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';
import { WORKSPACE_ID } from '@fixtures/users';

export class EmailServicesPage extends BasePage {
  get path() { return `/ws/${WORKSPACE_ID}/settings/email/services`; }

  // ============================================
  // Provider List
  // ============================================

  async clickResendRow(): Promise<void> {
    // Click on the Resend row (it's a div, not a button)
    await this.page.locator('div').filter({ hasText: /^Resend/ }).first().click();
    // Wait for navigation to resend page
    await this.page.waitForURL(/\/services\/resend/);
  }

  async isResendConfigured(): Promise<boolean> {
    // Check for "Connected" badge on Resend row
    const connected = await this.page
      .locator('div')
      .filter({ hasText: 'Resend' })
      .locator('text=Connected')
      .isVisible({ timeout: 3000 })
      .catch(() => false);
    return connected;
  }

  async getResendStatus(): Promise<string> {
    // Get the status badge text for Resend
    const resendRow = this.page.locator('div').filter({ hasText: /^Resend/ }).first();
    const badge = resendRow.locator('span').filter({ hasText: /(Connected|Needs Setup|Coming Soon)/i });
    const text = await badge.textContent().catch(() => '');
    return text || '';
  }

  // ============================================
  // Resend Setup Page (3-step wizard)
  // ============================================

  async gotoResendSetup(): Promise<void> {
    await this.page.goto(`/ws/${WORKSPACE_ID}/settings/email/services/resend`);
    await this.waitForPageLoad();
    // Wait for loading spinner to disappear and content to be ready
    // The page shows "Resend" heading when loaded
    await this.page.getByRole('heading', { name: 'Resend' }).waitFor({ state: 'visible', timeout: 10000 });
  }

  // Step 1: API Key
  async fillApiKey(apiKey: string): Promise<void> {
    const apiKeyInput = this.page.getByTestId('resend-input-api-key');
    await apiKeyInput.fill(apiKey);
  }

  async saveApiKey(): Promise<void> {
    await this.page.getByTestId('resend-button-save-api-key').click();
  }

  async isApiKeyStepComplete(): Promise<boolean> {
    // Check if step 1 shows green checkmark
    const step = this.page.getByTestId('resend-step-apiKey');
    const hasCheck = await step.locator('.bg-green-500').isVisible().catch(() => false);
    return hasCheck;
  }

  // Step 2: Domain
  async clickDomainStep(): Promise<void> {
    await this.page.getByTestId('resend-step-domain').click();
  }

  async refreshDomains(): Promise<void> {
    await this.page.getByRole('button', { name: /refresh/i }).click();
    await this.waitForSpinner();
  }

  async hasVerifiedDomain(): Promise<boolean> {
    // Look for verified badge on any domain
    return this.page.locator('.bg-green-100').filter({ hasText: 'verified' }).isVisible({ timeout: 3000 }).catch(() => false);
  }

  async clickContinueFromDomain(): Promise<void> {
    await this.page.getByRole('button', { name: /continue/i }).click();
  }

  // Step 3: Sender Settings
  async clickSettingsStep(): Promise<void> {
    await this.page.getByTestId('resend-step-settings').click();
  }

  async fillSenderSettings(options: {
    fromUsername: string;
    fromName?: string;
    replyToEmail?: string;
  }): Promise<void> {
    await this.page.getByTestId('resend-input-from-username').fill(options.fromUsername);

    if (options.fromName) {
      await this.page.getByTestId('resend-input-from-name').fill(options.fromName);
    }

    if (options.replyToEmail) {
      await this.page.getByTestId('resend-input-reply-to').fill(options.replyToEmail);
    }
  }

  async saveSenderSettings(): Promise<void> {
    await this.page.getByTestId('resend-button-save-settings').click();
    await this.waitForSpinner();
  }

  // Test Email
  async sendTestEmail(email: string): Promise<void> {
    await this.page.getByTestId('resend-input-test-email').fill(email);
    await this.page.getByTestId('resend-button-send-test').click();
    await this.waitForSpinner();
  }

  // Status
  async isFullyConfigured(): Promise<boolean> {
    // Check for "Connected" status on the page
    return this.page.getByText(/^Connected$/).isVisible({ timeout: 3000 }).catch(() => false);
  }

  // ============================================
  // Full Setup Flow Helper
  // ============================================

  /**
   * Complete 3-step flow to setup Resend.
   * Note: Requires a valid API key and verified domain in Resend account.
   */
  async setupResend(options: {
    apiKey: string;
    fromUsername: string;
    fromName?: string;
    replyToEmail?: string;
  }): Promise<void> {
    // Navigate to Resend setup page
    await this.clickResendRow();

    // Step 1: API Key
    await this.fillApiKey(options.apiKey);
    await this.saveApiKey();

    // Wait for API key validation
    await expect(this.page.getByText(/api key validated|saved/i)).toBeVisible({ timeout: 15000 });

    // Step 2: Domain (if has verified domain, continue)
    await this.clickDomainStep();
    await this.page.waitForTimeout(1000); // Wait for domains to load

    if (await this.hasVerifiedDomain()) {
      await this.clickContinueFromDomain();
    } else {
      throw new Error('No verified domain found. Please verify a domain in Resend first.');
    }

    // Step 3: Sender Settings
    await this.fillSenderSettings({
      fromUsername: options.fromUsername,
      fromName: options.fromName,
      replyToEmail: options.replyToEmail,
    });
    await this.saveSenderSettings();

    // Wait for success
    await expect(this.page.getByText(/success|connected/i).first()).toBeVisible({ timeout: 10000 });
  }
}
