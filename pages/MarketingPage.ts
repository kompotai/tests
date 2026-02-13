/**
 * Marketing Page Object
 *
 * Page object for Marketing module (/ws/{workspace}/marketing/...).
 * Covers Email Campaigns, Email Templates, Campaign Edit, Inbox, Compose.
 *
 * All selectors use data-testid attributes for stability.
 * Reference: marketing-data-testid-list.md
 */

import { Page, expect, Locator } from '@playwright/test';
import { BasePage } from './BasePage';
import { MarketingSelectors } from './selectors/marketing.selectors';
import { WORKSPACE_ID } from '@fixtures/users';

export class MarketingPage extends BasePage {
  get path() {
    return `/ws/${WORKSPACE_ID}/marketing/campaigns/email`;
  }

  private get sel() {
    return MarketingSelectors;
  }

  // ============================================
  // Navigation
  // ============================================

  async goToEmailCampaigns(): Promise<void> {
    await this.page.locator(this.sel.sidebar.emailCampaigns).click();
    await this.waitForPageLoad();
  }

  async goToEmailTemplates(): Promise<void> {
    await this.page.locator(this.sel.sidebar.emailTemplates).click();
    await this.waitForPageLoad();
  }

  async gotoTemplates(): Promise<void> {
    await this.page.goto(`/ws/${WORKSPACE_ID}/marketing/templates`);
    await this.waitForPageLoad();
  }

  async gotoNewCampaign(): Promise<void> {
    await this.page.goto(`/ws/${WORKSPACE_ID}/marketing/campaigns/email/new`);
    await this.waitForPageLoad();
  }

  // ============================================
  // Email Campaigns — List
  // ============================================

  async clickNewCampaign(): Promise<void> {
    await this.page.locator(this.sel.campaigns.newCampaignBtn).click();
    await this.waitForPageLoad();
  }

  async getCampaignCount(): Promise<number> {
    const rows = this.page.locator(this.sel.campaigns.allRows);
    return rows.count();
  }

  async shouldSeeCampaign(name: string): Promise<void> {
    await expect(this.page.getByText(name).first()).toBeVisible({ timeout: 10000 });
  }

  async shouldNotSeeCampaign(name: string): Promise<void> {
    await expect(this.page.getByText(name).first()).not.toBeVisible({ timeout: 5000 });
  }

  /** Find campaign row by name text and return its data-testid id */
  private async findCampaignId(name: string): Promise<string | null> {
    const row = this.page.locator(this.sel.campaigns.allRows).filter({ hasText: name }).first();
    await expect(row).toBeVisible({ timeout: 10000 });
    const testId = await row.getAttribute('data-testid').catch(() => null);
    if (!testId) return null;
    // Extract id from "marketing-campaign-row-{id}"
    return testId.replace('marketing-campaign-row-', '');
  }

  /** Get campaign status badge text using data-testid */
  async getCampaignStatus(name: string): Promise<string> {
    const id = await this.findCampaignId(name);
    if (id) {
      const badge = this.page.locator(this.sel.campaigns.statusBadge(id));
      return (await badge.textContent()) ?? '';
    }
    return '';
  }

  // ============================================
  // Email Campaign — Create Form
  // ============================================

  async fillCampaignName(name: string): Promise<void> {
    await this.page.locator(this.sel.campaignForm.campaignName).fill(name);
  }

  async fillEmailSubject(subject: string): Promise<void> {
    await this.page.locator(this.sel.campaignForm.emailSubject).fill(subject);
  }

  async fillPreviewText(text: string): Promise<void> {
    await this.page.locator(this.sel.campaignForm.previewText).fill(text);
  }

  async fillHtmlContent(html: string): Promise<void> {
    await this.page.locator(this.sel.campaignForm.htmlContent).fill(html);
  }

  async saveCampaign(): Promise<void> {
    await this.page.locator(this.sel.campaignForm.saveCampaignBtn).click();
    await this.waitForSpinner();
    // After save, app may redirect to edit mode — wait for any navigation
    await this.page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
  }

  /** Fill and save a campaign, then return to list */
  async createCampaign(data: {
    name: string;
    subject: string;
    html: string;
    previewText?: string;
  }): Promise<void> {
    await this.gotoNewCampaign();
    await this.fillCampaignName(data.name);
    await this.fillEmailSubject(data.subject);
    if (data.previewText) {
      await this.fillPreviewText(data.previewText);
    }
    await this.fillHtmlContent(data.html);
    await this.saveCampaign();
    await this.goto();
  }

  // ============================================
  // Email Campaign — Context Menu Actions
  // ============================================

  async openCampaignMenu(name: string): Promise<void> {
    // Wait for the campaign row to appear first
    const row = this.page.locator(this.sel.campaigns.allRows).filter({ hasText: name }).first();
    await expect(row).toBeVisible({ timeout: 10000 });

    const id = await this.findCampaignId(name);
    if (id) {
      await this.page.locator(this.sel.campaigns.menuBtn(id)).click();
    } else {
      // Fallback: click "..." button (last button in the row)
      await row.locator('button').last().click();
    }
    // Wait for context menu to appear
    await this.page.waitForTimeout(500);
  }

  async editCampaign(name: string): Promise<void> {
    await this.openCampaignMenu(name);
    await this.page.locator(this.sel.campaigns.menuEdit).click();
    await this.waitForPageLoad();
  }

  async duplicateCampaign(name: string): Promise<void> {
    await this.openCampaignMenu(name);
    await this.page.locator(this.sel.campaigns.menuDuplicate).click();
    await this.waitForSpinner();
  }

  async deleteCampaign(name: string): Promise<void> {
    // Set up native dialog handler BEFORE triggering the delete
    this.page.once('dialog', async (dialog) => {
      await dialog.accept();
    });

    await this.openCampaignMenu(name);
    await this.page.locator(this.sel.campaigns.menuDelete).click();

    // Also handle custom confirm dialog as fallback
    const confirmBtn = this.page.locator('[data-testid="confirm-dialog-button-confirm"]');
    if (await confirmBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await confirmBtn.click();
    }
    await this.waitForSpinner();
    // Wait for list to update after deletion
    await this.page.waitForTimeout(1000);
  }

  // ============================================
  // Email Campaign — Edit Mode Tabs
  // ============================================

  async clickContentTab(): Promise<void> {
    await this.page.locator(this.sel.campaignEdit.contentTab).click();
  }

  async clickSenderTab(): Promise<void> {
    await this.page.locator(this.sel.campaignEdit.senderTab).click();
  }

  async clickRecipientsTab(): Promise<void> {
    await this.page.locator(this.sel.campaignEdit.recipientsTab).click();
  }

  async clickTestSendTab(): Promise<void> {
    await this.page.locator(this.sel.campaignEdit.testSendTab).click();
  }

  async clickDeliveryTab(): Promise<void> {
    await this.page.locator(this.sel.campaignEdit.deliveryTab).click();
  }

  // ============================================
  // Email Campaign — Edit Mode Fields
  // ============================================

  async fillEditCampaignName(name: string): Promise<void> {
    await this.page.locator(this.sel.campaignEdit.nameInput).fill(name);
  }

  async fillEditEmailSubject(subject: string): Promise<void> {
    await this.page.locator(this.sel.campaignEdit.subjectInput).fill(subject);
  }

  async saveContentTab(): Promise<void> {
    await this.page.locator(this.sel.campaignEdit.saveContentBtn).click();
    await this.waitForSpinner();
  }

  async saveSenderTab(): Promise<void> {
    await this.page.locator(this.sel.campaignEdit.saveSenderBtn).click();
    await this.waitForSpinner();
  }

  // ============================================
  // Email Campaign — Test & Send
  // ============================================

  async fillTestEmail(email: string): Promise<void> {
    await this.page.locator(this.sel.campaignEdit.testEmailInput).fill(email);
  }

  async clickSendTest(): Promise<void> {
    await this.page.locator(this.sel.campaignEdit.testSendBtn).click();
    await this.waitForSpinner();
  }

  async clickSendCampaign(): Promise<void> {
    await this.page.locator(this.sel.campaignEdit.sendCampaignBtn).click();
  }

  async confirmSend(): Promise<void> {
    await this.page.locator(this.sel.campaignEdit.sendConfirmBtn).click();
    await this.waitForSpinner();
  }

  // ============================================
  // Email Templates — List
  // ============================================

  async clickCreateTemplate(): Promise<void> {
    await this.page.locator(this.sel.templates.createTemplateBtn).click();
    await expect(this.page.locator(this.sel.templateModal.dialog))
      .toBeVisible({ timeout: 10000 });
  }

  async getTemplateCount(): Promise<number> {
    const cards = this.page.locator(this.sel.templates.allCards);
    return cards.count();
  }

  async getTemplateCountFromHeading(): Promise<number> {
    const text = await this.page.locator(this.sel.templates.heading).textContent().catch(() => '');
    const match = text?.match(/(\d+)/);
    return match ? parseInt(match[1]) : 0;
  }

  async shouldSeeTemplate(name: string): Promise<void> {
    await expect(this.page.getByText(name).first()).toBeVisible({ timeout: 5000 });
  }

  /** Find template card by name and return its data-testid id */
  private async findTemplateId(name: string): Promise<string | null> {
    const card = this.page.locator(this.sel.templates.allCards).filter({ hasText: name }).first();
    const testId = await card.getAttribute('data-testid').catch(() => null);
    if (!testId) return null;
    return testId.replace('marketing-template-card-', '');
  }

  // ============================================
  // Email Template — Create/Edit Modal
  // ============================================

  async fillTemplateName(name: string): Promise<void> {
    await this.page.locator(this.sel.templateModal.templateName).fill(name);
  }

  async fillTemplateSubject(subject: string): Promise<void> {
    await this.page.locator(this.sel.templateModal.subjectLine).fill(subject);
  }

  async fillTemplateHtml(html: string): Promise<void> {
    await this.page.locator(this.sel.templateModal.htmlContent).fill(html);
  }

  async clickTemplatePreview(): Promise<void> {
    await this.page.locator(this.sel.templateModal.previewTab).click();
  }

  async clickTemplateEdit(): Promise<void> {
    await this.page.locator(this.sel.templateModal.editTab).click();
  }

  async saveTemplate(): Promise<void> {
    const saveBtn = this.page.locator(this.sel.templateModal.saveBtn);
    await expect(saveBtn).toBeEnabled({ timeout: 5000 });
    await saveBtn.click();
    await this.waitForSpinner();
  }

  async isSaveTemplateDisabled(): Promise<boolean> {
    return this.page.locator(this.sel.templateModal.saveBtn).isDisabled();
  }

  async cancelTemplate(): Promise<void> {
    await this.page.locator(this.sel.templateModal.cancelBtn).click();
  }

  async createTemplate(data: {
    name: string;
    subject: string;
    html: string;
  }): Promise<void> {
    await this.clickCreateTemplate();
    await this.fillTemplateName(data.name);
    await this.fillTemplateSubject(data.subject);
    await this.fillTemplateHtml(data.html);
    await this.saveTemplate();
  }

  // ============================================
  // Email Template — Context Menu Actions
  // ============================================

  async openTemplateMenu(name: string): Promise<void> {
    const id = await this.findTemplateId(name);
    if (id) {
      await this.page.locator(this.sel.templates.menuBtn(id)).click();
    } else {
      // Fallback
      const card = this.page.locator(this.sel.templates.allCards).filter({ hasText: name }).first();
      await card.locator('button').first().click();
    }
  }

  async editTemplate(name: string): Promise<void> {
    await this.openTemplateMenu(name);
    await this.page.locator(this.sel.templates.menuEdit).click();
  }

  async duplicateTemplate(name: string): Promise<void> {
    await this.openTemplateMenu(name);
    await this.page.locator(this.sel.templates.menuDuplicate).click();
    await this.waitForSpinner();
  }

  async deleteTemplate(name: string): Promise<void> {
    // Set up native dialog handler BEFORE triggering the delete
    // Browser shows native confirm(): "Are you sure you want to delete this template?"
    this.page.once('dialog', async (dialog) => {
      await dialog.accept();
    });

    await this.openTemplateMenu(name);
    await this.page.locator(this.sel.templates.menuDelete).click();

    // Wait for deletion to complete
    await this.waitForSpinner();
    await this.page.waitForTimeout(1000);
  }

  // ============================================
  // Assertions
  // ============================================

  async shouldBeOnCampaignsList(): Promise<void> {
    await this.shouldBeOnPage(/\/marketing\/campaigns\/email/);
  }

  async shouldBeOnNewCampaign(): Promise<void> {
    await this.shouldBeOnPage(/\/marketing\/campaigns\/email\/new/);
  }

  async shouldBeOnCampaignEdit(): Promise<void> {
    // Check for edit mode tabs instead of URL pattern (more reliable)
    await expect(this.page.locator(this.sel.campaignEdit.contentTab))
      .toBeVisible({ timeout: 10000 });
  }

  async shouldBeOnTemplates(): Promise<void> {
    await this.shouldBeOnPage(/\/marketing\/templates/);
  }
}
