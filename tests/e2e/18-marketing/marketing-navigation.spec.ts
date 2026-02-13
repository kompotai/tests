/**
 * Marketing Module — Navigation Tests
 *
 * Tests sidebar navigation, page loading, URL routing.
 * All selectors use data-testid for stability.
 */

import { ownerTest, expect } from '@fixtures/auth.fixture';
import { MarketingPage } from '@pages/MarketingPage';
import { MarketingSelectors } from '@pages/selectors/marketing.selectors';
import { WORKSPACE_ID } from '@fixtures/users';

ownerTest.describe('Marketing — Navigation', () => {
  let marketing: MarketingPage;

  ownerTest.beforeEach(async ({ page }) => {
    marketing = new MarketingPage(page);
    await marketing.goto();
  });

  // ============================================
  // Page Load
  // ============================================

  ownerTest.describe('Page Load', () => {
    ownerTest('loads Email Campaigns page with heading', async ({ page }) => {
      await expect(page.locator(MarketingSelectors.campaigns.heading)).toBeVisible();
      await marketing.shouldBeOnCampaignsList();
    });

    ownerTest('shows sidebar with all marketing sections', async ({ page }) => {
      await expect(page.locator(MarketingSelectors.sidebar.emailCampaigns)).toBeVisible();
      await expect(page.locator(MarketingSelectors.sidebar.emailTemplates)).toBeVisible();
      await expect(page.locator(MarketingSelectors.sidebar.smsCampaigns)).toBeVisible();
      await expect(page.locator(MarketingSelectors.sidebar.voiceCampaigns)).toBeVisible();
    });

    ownerTest('shows "+ New Campaign" button', async ({ page }) => {
      await expect(page.locator(MarketingSelectors.campaigns.newCampaignBtn)).toBeVisible();
    });

    ownerTest('shows campaigns table', async ({ page }) => {
      await expect(page.locator(MarketingSelectors.campaigns.table)).toBeVisible();
    });
  });

  // ============================================
  // Sidebar Navigation
  // ============================================

  ownerTest.describe('Sidebar Navigation', () => {
    ownerTest('navigates to Email Templates', async ({ page }) => {
      await marketing.goToEmailTemplates();
      await marketing.shouldBeOnTemplates();
      await expect(page.locator(MarketingSelectors.templates.heading)).toBeVisible();
    });

    ownerTest('navigates back to Email Campaigns from Templates', async ({ page }) => {
      await marketing.goToEmailTemplates();
      await marketing.shouldBeOnTemplates();
      await marketing.goToEmailCampaigns();
      await marketing.shouldBeOnCampaignsList();
    });
  });

  // ============================================
  // Direct URL Access
  // ============================================

  ownerTest.describe('Direct URL Access', () => {
    ownerTest('campaigns URL loads correctly', async ({ page }) => {
      await page.goto(`/ws/${WORKSPACE_ID}/marketing/campaigns/email`);
      await page.waitForLoadState('domcontentloaded');
      await expect(page.locator(MarketingSelectors.campaigns.heading)).toBeVisible();
    });

    ownerTest('templates URL loads correctly', async ({ page }) => {
      await page.goto(`/ws/${WORKSPACE_ID}/marketing/templates`);
      await page.waitForLoadState('domcontentloaded');
      await expect(page.locator(MarketingSelectors.templates.heading)).toBeVisible();
    });

    ownerTest('SMS Campaigns URL shows "Coming Soon"', async ({ page }) => {
      await page.goto(`/ws/${WORKSPACE_ID}/marketing/campaigns/sms`);
      await page.waitForLoadState('domcontentloaded');
      await expect(page.getByText(/coming soon/i).first()).toBeVisible();
    });

    ownerTest('Voice Campaigns URL shows "Coming Soon"', async ({ page }) => {
      await page.goto(`/ws/${WORKSPACE_ID}/marketing/campaigns/voice`);
      await page.waitForLoadState('domcontentloaded');
      await expect(page.getByText(/coming soon/i).first()).toBeVisible();
    });
  });

  // ============================================
  // Page Refresh Persistence
  // ============================================

  ownerTest.describe('Page Refresh', () => {
    ownerTest('campaigns page persists after refresh', async ({ page }) => {
      await page.reload();
      await page.waitForLoadState('domcontentloaded');
      await expect(page.locator(MarketingSelectors.campaigns.heading)).toBeVisible();
    });

    ownerTest('templates page persists after refresh', async ({ page }) => {
      await marketing.goToEmailTemplates();
      await page.reload();
      await page.waitForLoadState('domcontentloaded');
      // Templates page may load slower — use longer timeout and check URL as fallback
      await marketing.shouldBeOnTemplates();
      await expect(page.locator(MarketingSelectors.templates.createTemplateBtn)).toBeVisible({ timeout: 10000 });
    });
  });
});
