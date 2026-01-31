/**
 * Email Campaigns Tests
 *
 * Tests for email campaigns functionality:
 * - Email provider setup (Resend)
 * - Email templates CRUD
 * - Email campaigns CRUD
 *
 * Note: Actual email sending is NOT tested (requires real API key).
 * These tests focus on UI functionality and API interactions.
 */

import { ownerTest, expect } from '@fixtures/auth.fixture';
import { EmailCampaignsPage } from '@pages/EmailCampaignsPage';

ownerTest.describe('Email Campaigns', () => {
  let campaignsPage: EmailCampaignsPage;

  ownerTest.beforeEach(async ({ page }) => {
    campaignsPage = new EmailCampaignsPage(page);
    await campaignsPage.goto();
  });

  // ============================================
  // Tab Navigation
  // ============================================

  ownerTest.describe('Tab Navigation', () => {
    ownerTest('shows provider tab by default', async ({ page }) => {
      await expect(page.getByText(/email campaigns/i).first()).toBeVisible();
      await expect(page.getByText(/connect email marketing providers/i)).toBeVisible();
    });

    ownerTest('can navigate to templates tab', async () => {
      await campaignsPage.goToTemplatesTab();
      await campaignsPage.shouldSeeEmptyTemplatesState();
    });

    ownerTest('can navigate to campaigns tab', async () => {
      await campaignsPage.goToCampaignsTab();
      await campaignsPage.shouldSeeEmptyCampaignsState();
    });
  });

  // ============================================
  // Email Templates
  // ============================================

  ownerTest.describe('Email Templates', () => {
    ownerTest.beforeEach(async () => {
      await campaignsPage.goToTemplatesTab();
    });

    ownerTest('shows empty state when no templates', async () => {
      await campaignsPage.shouldSeeEmptyTemplatesState();
    });

    ownerTest('can create a simple template', async () => {
      const templateName = `Test Template ${Date.now()}`;

      await campaignsPage.clickCreateTemplate();

      await campaignsPage.fillTemplateForm({
        name: templateName,
        subject: 'Welcome {{firstName}}!',
        bodyHtml: '<h1>Hello {{firstName}}</h1><p>Welcome to our platform!</p>',
        category: 'marketing',
      });

      await campaignsPage.saveTemplate();

      await campaignsPage.shouldSeeTemplate(templateName);
    });

    ownerTest('can edit an existing template', async () => {
      // First create a template
      const originalName = `Original Template ${Date.now()}`;
      const updatedName = `Updated Template ${Date.now()}`;

      await campaignsPage.clickCreateTemplate();
      await campaignsPage.fillTemplateForm({
        name: originalName,
        subject: 'Test Subject',
        bodyHtml: '<p>Test content</p>',
      });
      await campaignsPage.saveTemplate();

      // Now edit it
      await campaignsPage.editTemplate(originalName);

      await campaignsPage.page.getByLabel(/template name/i).fill(updatedName);
      await campaignsPage.saveTemplate();

      await campaignsPage.shouldSeeTemplate(updatedName);
    });

    ownerTest('can duplicate a template', async () => {
      const templateName = `Duplicate Test ${Date.now()}`;

      await campaignsPage.clickCreateTemplate();
      await campaignsPage.fillTemplateForm({
        name: templateName,
        subject: 'Test Subject',
        bodyHtml: '<p>Test content</p>',
      });
      await campaignsPage.saveTemplate();

      await campaignsPage.duplicateTemplate(templateName);

      // Should see copy
      await campaignsPage.shouldSeeTemplate(`${templateName} (copy)`);
    });

    ownerTest('can delete a template', async () => {
      const templateName = `Delete Test ${Date.now()}`;

      await campaignsPage.clickCreateTemplate();
      await campaignsPage.fillTemplateForm({
        name: templateName,
        subject: 'Test Subject',
        bodyHtml: '<p>Test content</p>',
      });
      await campaignsPage.saveTemplate();

      await campaignsPage.shouldSeeTemplate(templateName);

      await campaignsPage.deleteTemplate(templateName);

      // Wait for deletion
      await campaignsPage.page.waitForTimeout(1000);

      // Should not see template anymore
      await expect(campaignsPage.page.getByText(templateName).first()).not.toBeVisible({ timeout: 3000 });
    });

    ownerTest('shows template with variables help text', async () => {
      await campaignsPage.clickCreateTemplate();

      await expect(campaignsPage.page.getByText(/use \{\{variableName\}\} syntax/i)).toBeVisible();
    });

    ownerTest('can switch between edit and preview modes', async ({ page }) => {
      await campaignsPage.clickCreateTemplate();

      await campaignsPage.fillTemplateForm({
        name: 'Preview Test',
        subject: 'Test Subject',
        bodyHtml: '<h1>Hello World</h1>',
      });

      // Click preview button
      await page.getByRole('button', { name: /preview/i }).click();

      // Should see rendered content
      await expect(page.locator('text=Hello World')).toBeVisible();

      // Click edit button to go back
      await page.getByRole('button', { name: /edit/i }).click();

      // Should see textarea again
      await expect(page.locator('textarea')).toBeVisible();
    });
  });

  // ============================================
  // Email Campaigns
  // ============================================

  ownerTest.describe('Email Campaigns', () => {
    const templateName = `Campaign Template ${Date.now()}`;

    ownerTest.beforeEach(async () => {
      // Create a template first (needed for campaigns)
      await campaignsPage.goToTemplatesTab();
      await campaignsPage.clickCreateTemplate();
      await campaignsPage.fillTemplateForm({
        name: templateName,
        subject: 'Campaign Test Subject',
        bodyHtml: '<p>Campaign content</p>',
      });
      await campaignsPage.saveTemplate();

      // Go to campaigns tab
      await campaignsPage.goToCampaignsTab();
    });

    ownerTest('shows empty state when no campaigns', async () => {
      await campaignsPage.shouldSeeEmptyCampaignsState();
    });

    ownerTest('requires template and recipients to create campaign', async ({ page }) => {
      await campaignsPage.clickCreateCampaign();

      // Save button should be disabled initially
      const saveBtn = page.getByRole('button', { name: /save draft/i });
      await expect(saveBtn).toBeDisabled();

      // Fill name only
      await page.getByLabel(/campaign name/i).fill('Test Campaign');

      // Still disabled (no template selected, no recipients)
      await expect(saveBtn).toBeDisabled();
    });

    ownerTest('can create a draft campaign', async () => {
      const campaignName = `Test Campaign ${Date.now()}`;

      await campaignsPage.clickCreateCampaign();

      await campaignsPage.fillCampaignForm({
        name: campaignName,
        templateName: templateName,
        recipients: [
          { email: 'test1@example.com', name: 'Test User 1' },
          { email: 'test2@example.com', name: 'Test User 2' },
        ],
      });

      await campaignsPage.saveCampaignDraft();

      await campaignsPage.shouldSeeCampaign(campaignName);

      // Should show draft status
      const status = await campaignsPage.getCampaignStatus(campaignName);
      expect(status.toLowerCase()).toContain('draft');
    });

    ownerTest('shows recipient count in campaign form', async ({ page }) => {
      await campaignsPage.clickCreateCampaign();

      // Add first recipient
      await page.locator('input[type="email"]').first().fill('user1@example.com');

      // Should show 1 valid
      await expect(page.getByText(/1 valid/i)).toBeVisible();

      // Add second recipient
      await page.getByRole('button', { name: /add recipients/i }).click();
      await page.locator('input[type="email"]').nth(1).fill('user2@example.com');

      // Should show 2 valid
      await expect(page.getByText(/2 valid/i)).toBeVisible();
    });

    ownerTest('can delete a draft campaign', async () => {
      const campaignName = `Delete Campaign ${Date.now()}`;

      await campaignsPage.clickCreateCampaign();
      await campaignsPage.fillCampaignForm({
        name: campaignName,
        templateName: templateName,
        recipients: [{ email: 'delete-test@example.com' }],
      });
      await campaignsPage.saveCampaignDraft();

      await campaignsPage.shouldSeeCampaign(campaignName);

      await campaignsPage.deleteCampaign(campaignName);

      // Wait for deletion
      await campaignsPage.page.waitForTimeout(1000);

      // Should not see campaign anymore
      await expect(campaignsPage.page.getByText(campaignName).first()).not.toBeVisible({ timeout: 3000 });
    });
  });

  // ============================================
  // Provider Setup (UI only, no actual API calls)
  // ============================================

  ownerTest.describe('Provider Setup UI', () => {
    ownerTest('shows Resend as available option', async ({ page }) => {
      await expect(page.getByText('Resend')).toBeVisible();
      await expect(page.getByText(/modern email api/i)).toBeVisible();
      await expect(page.getByText(/free up to 3,000 emails/i)).toBeVisible();
    });

    ownerTest('shows SendGrid as coming soon', async ({ page }) => {
      await expect(page.getByText('SendGrid')).toBeVisible();
      await expect(page.getByText(/coming soon/i).first()).toBeVisible();
    });

    ownerTest('opens Resend setup dialog on click', async ({ page }) => {
      await campaignsPage.clickSetupResend();

      // Should see dialog
      await expect(page.getByText(/connect resend/i)).toBeVisible();
      await expect(page.getByLabel(/api key/i)).toBeVisible();
      await expect(page.getByLabel(/from email/i)).toBeVisible();
    });

    ownerTest('validates required fields in Resend setup', async ({ page }) => {
      await campaignsPage.clickSetupResend();

      // Try to submit without filling fields
      const connectBtn = page.getByRole('button', { name: /connect/i });

      // Connect button should require fields (HTML5 validation)
      await expect(page.getByLabel(/api key/i)).toHaveAttribute('required');
      await expect(page.getByLabel(/from email/i)).toHaveAttribute('required');
    });
  });
});
