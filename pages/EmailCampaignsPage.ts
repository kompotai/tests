/**
 * Email Campaigns Page Object
 *
 * Page object for email campaigns settings page.
 * Covers email providers, templates, and campaigns management.
 */

import { Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';
import { WORKSPACE_ID } from '@fixtures/users';

export class EmailCampaignsPage extends BasePage {
  get path() { return `/ws/${WORKSPACE_ID}/settings/email/campaigns`; }

  // ============================================
  // Tab Navigation
  // ============================================

  async goToProviderTab(): Promise<void> {
    await this.page.getByRole('button', { name: /email campaigns/i }).click();
    await this.waitForPageLoad();
  }

  async goToTemplatesTab(): Promise<void> {
    await this.page.getByRole('button', { name: /email templates/i }).click();
    await this.waitForPageLoad();
  }

  async goToCampaignsTab(): Promise<void> {
    await this.page.getByRole('button', { name: /campaigns/i }).click();
    await this.waitForPageLoad();
  }

  // ============================================
  // Provider Setup
  // ============================================

  async clickSetupResend(): Promise<void> {
    await this.page.getByText('Resend').click();
  }

  async fillResendSetup(config: {
    apiKey: string;
    fromEmail: string;
    fromName?: string;
  }): Promise<void> {
    await this.page.getByLabel(/api key/i).fill(config.apiKey);
    await this.page.getByLabel(/from email/i).fill(config.fromEmail);
    if (config.fromName) {
      await this.page.getByLabel(/from name/i).fill(config.fromName);
    }
  }

  async submitResendSetup(): Promise<void> {
    await this.page.getByRole('button', { name: /connect/i }).click();
    await this.waitForSpinner();
  }

  async isProviderConfigured(): Promise<boolean> {
    return this.page.locator('text=Resend Connected').isVisible({ timeout: 3000 }).catch(() => false);
  }

  // ============================================
  // Templates Management
  // ============================================

  async clickCreateTemplate(): Promise<void> {
    await this.page.getByRole('button', { name: /create template/i }).click();
  }

  async fillTemplateForm(template: {
    name: string;
    subject: string;
    bodyHtml: string;
    category?: string;
    description?: string;
  }): Promise<void> {
    await this.page.getByLabel(/template name/i).fill(template.name);
    await this.page.getByLabel(/subject/i).fill(template.subject);

    if (template.description) {
      await this.page.getByLabel(/description/i).fill(template.description);
    }

    if (template.category) {
      await this.page.getByRole('combobox').selectOption(template.category);
    }

    // Fill HTML body
    await this.page.locator('textarea').fill(template.bodyHtml);
  }

  async saveTemplate(): Promise<void> {
    await this.page.getByRole('button', { name: /save template/i }).click();
    await this.waitForSpinner();
  }

  async shouldSeeTemplate(name: string): Promise<void> {
    await expect(this.page.getByText(name).first()).toBeVisible({ timeout: 5000 });
  }

  async openTemplateMenu(name: string): Promise<void> {
    const templateCard = this.page.locator(`text="${name}"`).locator('..').locator('..');
    await templateCard.getByRole('button').last().click();
  }

  async editTemplate(name: string): Promise<void> {
    await this.openTemplateMenu(name);
    await this.page.getByRole('button', { name: /edit/i }).click();
  }

  async deleteTemplate(name: string): Promise<void> {
    await this.openTemplateMenu(name);
    await this.page.getByRole('button', { name: /delete/i }).click();
    // Confirm dialog
    this.page.once('dialog', dialog => dialog.accept());
  }

  async duplicateTemplate(name: string): Promise<void> {
    await this.openTemplateMenu(name);
    await this.page.getByRole('button', { name: /duplicate/i }).click();
    await this.waitForSpinner();
  }

  // ============================================
  // Campaigns Management
  // ============================================

  async clickCreateCampaign(): Promise<void> {
    await this.page.getByRole('button', { name: /create campaign/i }).click();
  }

  async fillCampaignForm(campaign: {
    name: string;
    templateName: string;
    recipients: Array<{ email: string; name?: string }>;
  }): Promise<void> {
    await this.page.getByLabel(/campaign name/i).fill(campaign.name);

    // Select template by finding option that contains the template name
    const selectBox = this.page.getByRole('combobox').first();
    const options = await selectBox.locator('option').allTextContents();
    const matchingOption = options.find(opt => opt.includes(campaign.templateName));
    if (matchingOption) {
      await selectBox.selectOption({ label: matchingOption });
    }

    // Add recipients
    for (let i = 0; i < campaign.recipients.length; i++) {
      const recipient = campaign.recipients[i];

      if (i > 0) {
        await this.page.getByRole('button', { name: /add recipients/i }).click();
      }

      const emailInputs = this.page.locator('input[type="email"]');
      await emailInputs.nth(i).fill(recipient.email);

      if (recipient.name) {
        const nameInputs = this.page.locator('input[placeholder*="Name"]');
        await nameInputs.nth(i).fill(recipient.name);
      }
    }
  }

  async saveCampaignDraft(): Promise<void> {
    await this.page.getByRole('button', { name: /save draft/i }).click();
    await this.waitForSpinner();
  }

  async shouldSeeCampaign(name: string): Promise<void> {
    await expect(this.page.getByText(name).first()).toBeVisible({ timeout: 5000 });
  }

  async getCampaignStatus(name: string): Promise<string> {
    const campaignRow = this.page.locator(`text="${name}"`).locator('..').locator('..');
    const statusBadge = campaignRow.locator('[class*="rounded-full"]').first();
    const text = await statusBadge.textContent();
    return text || '';
  }

  async sendCampaign(name: string): Promise<void> {
    const campaignRow = this.page.locator(`text="${name}"`).locator('..').locator('..');
    await campaignRow.getByRole('button', { name: /send now/i }).click();
    // Confirm dialog
    this.page.once('dialog', dialog => dialog.accept());
    await this.waitForSpinner();
  }

  async openCampaignMenu(name: string): Promise<void> {
    const campaignRow = this.page.locator(`text="${name}"`).locator('..').locator('..');
    await campaignRow.locator('button').last().click();
  }

  async deleteCampaign(name: string): Promise<void> {
    await this.openCampaignMenu(name);
    await this.page.getByRole('button', { name: /delete/i }).click();
    // Confirm dialog
    this.page.once('dialog', dialog => dialog.accept());
    await this.waitForSpinner();
  }

  // ============================================
  // Assertions
  // ============================================

  async shouldHaveTemplateCount(count: number): Promise<void> {
    const text = count === 1 ? '1 template' : `${count} templates`;
    await expect(this.page.getByText(text)).toBeVisible({ timeout: 5000 });
  }

  async shouldHaveCampaignCount(count: number): Promise<void> {
    const text = count === 1 ? '1 campaign' : `${count} campaigns`;
    await expect(this.page.getByText(text)).toBeVisible({ timeout: 5000 });
  }

  async shouldSeeEmptyTemplatesState(): Promise<void> {
    await expect(this.page.getByText(/no templates yet/i)).toBeVisible({ timeout: 5000 });
  }

  async shouldSeeEmptyCampaignsState(): Promise<void> {
    await expect(this.page.getByText(/no campaigns yet/i)).toBeVisible({ timeout: 5000 });
  }
}
