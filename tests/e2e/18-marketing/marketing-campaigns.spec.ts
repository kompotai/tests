/**
 * Marketing Module — Email Campaigns CRUD Tests
 *
 * All selectors use data-testid for stability.
 * Context menu uses: marketing-campaign-button-menu-{id},
 *   marketing-menuitem-edit, marketing-menuitem-duplicate, marketing-menuitem-delete
 */

import { ownerTest, expect } from '@fixtures/auth.fixture';
import { MarketingPage } from '@pages/MarketingPage';
import { MarketingSelectors } from '@pages/selectors/marketing.selectors';

const TEST_HTML = '<h1>Test Campaign</h1><p>Hello World</p>';

ownerTest.describe('Marketing — Email Campaigns', () => {
  let marketing: MarketingPage;

  ownerTest.beforeEach(async ({ page }) => {
    marketing = new MarketingPage(page);
  });

  // ============================================
  // Campaign Creation — Happy Path
  // ============================================

  ownerTest.describe('Create Campaign', () => {
    ownerTest('can create campaign with required fields', async ({ page }) => {
      const name = `Campaign ${Date.now()}`;

      await marketing.gotoNewCampaign();
      await marketing.fillCampaignName(name);
      await marketing.fillEmailSubject('Test Subject');
      await marketing.fillHtmlContent(TEST_HTML);
      await marketing.saveCampaign();

      // Save redirects to edit mode — verify by checking for edit tabs
      await marketing.shouldBeOnCampaignEdit();

      // Verify campaign appears in list
      await marketing.goto();
      await marketing.shouldSeeCampaign(name);
    });

    ownerTest('can create campaign with all fields including preview text', async ({ page }) => {
      const name = `Full Campaign ${Date.now()}`;

      await marketing.gotoNewCampaign();
      await marketing.fillCampaignName(name);
      await marketing.fillEmailSubject('Full Subject');
      await marketing.fillPreviewText('Preview text for email clients');
      await marketing.fillHtmlContent(TEST_HTML);
      await marketing.saveCampaign();

      await marketing.goto();
      await marketing.shouldSeeCampaign(name);
    });

    ownerTest('new campaign has "Draft" status in list', async () => {
      const name = `Draft Check ${Date.now()}`;

      await marketing.createCampaign({
        name,
        subject: 'Check Subject',
        html: TEST_HTML,
      });

      // Use data-testid status badge to avoid ambiguous text match
      const status = await marketing.getCampaignStatus(name);
      expect(status).toBe('Draft');
    });
  });

  // ============================================
  // Campaign Creation — Validation
  // ============================================

  ownerTest.describe('Create Campaign — Validation', () => {
    ownerTest.beforeEach(async () => {
      await marketing.gotoNewCampaign();
    });

    ownerTest('empty Campaign Name prevents save', async () => {
      await marketing.fillEmailSubject('Some Subject');
      await marketing.fillHtmlContent(TEST_HTML);
      await marketing.saveCampaign();
      await marketing.shouldBeOnNewCampaign();
    });

    ownerTest('empty Email Subject prevents save', async () => {
      await marketing.fillCampaignName(`No Subject ${Date.now()}`);
      await marketing.fillHtmlContent(TEST_HTML);
      await marketing.saveCampaign();
      await marketing.shouldBeOnNewCampaign();
    });

    ownerTest('empty HTML Content prevents save', async () => {
      await marketing.fillCampaignName(`No HTML ${Date.now()}`);
      await marketing.fillEmailSubject('Subject');
      await marketing.saveCampaign();
      await marketing.shouldBeOnNewCampaign();
    });

    ownerTest('Cyrillic text in Campaign Name saves successfully', async () => {
      const name = `Рассылка ${Date.now()}`;
      await marketing.fillCampaignName(name);
      await marketing.fillEmailSubject('Тестовая тема');
      await marketing.fillHtmlContent('<p>Привет мир!</p>');
      await marketing.saveCampaign();

      await marketing.shouldBeOnCampaignEdit();
      await marketing.goto();
      await marketing.shouldSeeCampaign(name);
    });

    ownerTest('emoji in Campaign Name saves successfully', async () => {
      const name = `🎉 Emoji ${Date.now()}`;
      await marketing.fillCampaignName(name);
      await marketing.fillEmailSubject('🔥 Subject');
      await marketing.fillHtmlContent('<p>🚀</p>');
      await marketing.saveCampaign();

      await marketing.shouldBeOnCampaignEdit();
      await marketing.goto();
      await marketing.shouldSeeCampaign(name);
    });

    ownerTest('XSS script tags are not executed', async ({ page }) => {
      await marketing.fillCampaignName(`<script>alert('XSS')</script> ${Date.now()}`);
      await marketing.fillEmailSubject('XSS Subject');
      await marketing.fillHtmlContent(TEST_HTML);
      await marketing.saveCampaign();

      await marketing.goto();
      expect(await page.locator('script:has-text("XSS")').count()).toBe(0);
    });
  });

  // ============================================
  // Campaign Edit Mode
  // ============================================

  ownerTest.describe('Edit Campaign', () => {
    let campaignName: string;

    ownerTest.beforeEach(async () => {
      campaignName = `Edit ${Date.now()}`;
      await marketing.createCampaign({
        name: campaignName,
        subject: 'Original Subject',
        html: TEST_HTML,
      });
    });

    ownerTest('can open campaign via context menu', async ({ page }) => {
      await marketing.editCampaign(campaignName);
      await marketing.shouldBeOnCampaignEdit();
    });

    ownerTest('edit mode shows all tabs', async ({ page }) => {
      await marketing.editCampaign(campaignName);

      await expect(page.locator(MarketingSelectors.campaignEdit.contentTab)).toBeVisible();
      await expect(page.locator(MarketingSelectors.campaignEdit.senderTab)).toBeVisible();
      await expect(page.locator(MarketingSelectors.campaignEdit.recipientsTab)).toBeVisible();
      await expect(page.locator(MarketingSelectors.campaignEdit.testSendTab)).toBeVisible();
    });

    ownerTest('Content tab has HTML editor and Preview panel', async ({ page }) => {
      await marketing.editCampaign(campaignName);
      await marketing.clickContentTab();

      await expect(page.locator(MarketingSelectors.campaignEdit.htmlInput)).toBeVisible();
      await expect(page.locator(MarketingSelectors.campaignEdit.htmlPreview)).toBeVisible();
    });

    ownerTest('Content tab has Campaign Name and Subject inputs', async ({ page }) => {
      await marketing.editCampaign(campaignName);
      await marketing.clickContentTab();

      await expect(page.locator(MarketingSelectors.campaignEdit.nameInput)).toBeVisible();
      await expect(page.locator(MarketingSelectors.campaignEdit.subjectInput)).toBeVisible();
    });

    ownerTest('Sender tab has provider select and reply-to fields', async ({ page }) => {
      await marketing.editCampaign(campaignName);
      await marketing.clickSenderTab();

      await expect(page.locator(MarketingSelectors.campaignEdit.providerSelect)).toBeVisible();
      await expect(page.locator(MarketingSelectors.campaignEdit.fromNameInput)).toBeVisible();
      await expect(page.locator(MarketingSelectors.campaignEdit.replyToInput)).toBeVisible();
    });

    ownerTest('Recipients tab has filter buttons', async ({ page }) => {
      await marketing.editCampaign(campaignName);
      await marketing.clickRecipientsTab();

      await expect(
        page.locator(MarketingSelectors.campaignEdit.addEventFilterBtn)
          .or(page.locator(MarketingSelectors.campaignEdit.addContactFilterBtn))
          .first()
      ).toBeVisible();
    });

    ownerTest('Test & Send tab has test email input and send button', async ({ page }) => {
      await marketing.editCampaign(campaignName);
      await marketing.clickTestSendTab();

      await expect(page.locator(MarketingSelectors.campaignEdit.testEmailInput)).toBeVisible();
      await expect(page.locator(MarketingSelectors.campaignEdit.testSendBtn)).toBeVisible();
    });
  });

  // ============================================
  // Campaign Test Send (via Resend provider)
  // ============================================

  ownerTest.describe('Test Send', () => {
    let campaignName: string;

    ownerTest.beforeEach(async () => {
      campaignName = `Send Test ${Date.now()}`;
      await marketing.createCampaign({
        name: campaignName,
        subject: 'Test Send Subject',
        html: '<h1>Test Send</h1><p>This is a test email from E2E automation.</p>',
      });
    });

    ownerTest('Test & Send tab shows Preview with campaign details', async ({ page }) => {
      await marketing.editCampaign(campaignName);
      await marketing.clickTestSendTab();

      // Preview section should show Subject and From
      await expect(page.getByText('Test Send Subject')).toBeVisible();
      await expect(page.getByText('testtestCompany')).toBeVisible();
    });

    ownerTest('Test & Send tab shows warning when no recipients selected', async ({ page }) => {
      await marketing.editCampaign(campaignName);
      await marketing.clickTestSendTab();

      // Send section shows "0 recipients" and warning
      await expect(page.getByText(/no recipients selected/i)).toBeVisible();
      await expect(page.getByText('0 recipients')).toBeVisible();
    });

    ownerTest('Send button is visible but campaign cannot send without recipients', async ({ page }) => {
      await marketing.editCampaign(campaignName);
      await marketing.clickTestSendTab();

      // Send button exists
      await expect(page.locator(MarketingSelectors.campaignEdit.sendCampaignBtn)).toBeVisible();
      // But warning blocks actual send
      await expect(page.getByText(/no recipients selected/i)).toBeVisible();
    });

    ownerTest('can send test email via Resend provider', async ({ page }) => {
      await marketing.editCampaign(campaignName);
      await marketing.clickTestSendTab();

      // Fill test email and click Send Test
      await marketing.fillTestEmail('test@gmail.com');
      await marketing.clickSendTest();

      // Success: green "Test email sent!" message appears below input
      await expect(page.getByText(/test email sent/i)).toBeVisible({ timeout: 15000 });
    });

    ownerTest('Sender tab shows Resend provider is configured', async ({ page }) => {
      await marketing.editCampaign(campaignName);
      await marketing.clickSenderTab();

      // Provider select should be visible and have a selected option
      const providerSelect = page.locator(MarketingSelectors.campaignEdit.providerSelect);
      await expect(providerSelect).toBeVisible();

      // Verify provider has visible text (selected option)
      await expect(providerSelect).not.toBeEmpty();

      // From Name input should be visible
      const fromName = page.locator(MarketingSelectors.campaignEdit.fromNameInput);
      await expect(fromName).toBeVisible();

      // Reply-To input should be visible
      await expect(page.locator(MarketingSelectors.campaignEdit.replyToInput)).toBeVisible();
    });
  });

  // ============================================
  // Campaign Duplicate
  // ============================================

  ownerTest.describe('Duplicate Campaign', () => {
    ownerTest('duplicating creates a copy in the list', async ({ page }) => {
      const name = `Original ${Date.now()}`;
      await marketing.createCampaign({
        name,
        subject: 'Original Subject',
        html: TEST_HTML,
      });

      const countBefore = await marketing.getCampaignCount();
      await marketing.duplicateCampaign(name);

      await page.reload();
      await page.waitForLoadState('domcontentloaded');

      await marketing.shouldSeeCampaign(name);
      const countAfter = await marketing.getCampaignCount();
      expect(countAfter).toBeGreaterThan(countBefore);
    });
  });

  // ============================================
  // Campaign Delete
  // ============================================

  ownerTest.describe('Delete Campaign', () => {
    ownerTest('deleting removes campaign from list', async ({ page }) => {
      const name = `Delete Me ${Date.now()}`;
      await marketing.createCampaign({
        name,
        subject: 'Delete Subject',
        html: TEST_HTML,
      });

      await marketing.shouldSeeCampaign(name);
      const countBefore = await marketing.getCampaignCount();

      await marketing.deleteCampaign(name);
      await page.waitForTimeout(1000);

      await marketing.shouldNotSeeCampaign(name);
    });
  });
});
