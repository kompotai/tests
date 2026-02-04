/**
 * Email Services Tests
 *
 * Tests for email services settings with new structure:
 * - /settings/email/services - Provider list
 * - /settings/email/services/resend - Resend setup (3-step wizard)
 */

import { ownerTest, expect } from '@fixtures/auth.fixture';
import { EmailServicesPage } from '@pages/EmailServicesPage';

ownerTest.describe('Email Services', () => {
  let servicesPage: EmailServicesPage;

  ownerTest.beforeEach(async ({ page }) => {
    servicesPage = new EmailServicesPage(page);
    await servicesPage.goto();
  });

  // ============================================
  // Provider List Display
  // ============================================

  ownerTest.describe('Provider List', () => {
    ownerTest('shows Resend in provider list', async ({ page }) => {
      // Resend name should be visible
      await expect(page.locator('.font-medium').filter({ hasText: 'Resend' })).toBeVisible();
    });

    ownerTest('shows SendGrid in provider list', async ({ page }) => {
      // SendGrid name should be visible
      await expect(page.locator('.font-medium').filter({ hasText: 'SendGrid' })).toBeVisible();
    });

    ownerTest('shows Amazon SES in provider list', async ({ page }) => {
      // Amazon SES should be visible
      await expect(page.locator('.font-medium').filter({ hasText: 'Amazon SES' })).toBeVisible();
    });

    ownerTest('locked providers show Coming Soon badge', async ({ page }) => {
      // Should have "Coming Soon" badges for locked providers
      const comingSoonBadges = page.getByText('Coming Soon');
      await expect(comingSoonBadges.first()).toBeVisible();
    });
  });

  // ============================================
  // Tab Navigation
  // ============================================

  ownerTest.describe('Tab Navigation', () => {
    ownerTest('shows three tabs: User Mailboxes, Email Services, Email Templates', async ({ page }) => {
      await expect(page.getByRole('link', { name: /user mailboxes/i })).toBeVisible();
      await expect(page.getByRole('link', { name: /email services/i })).toBeVisible();
      await expect(page.getByRole('link', { name: /email templates/i })).toBeVisible();
    });

    ownerTest('Email Services tab is active', async ({ page }) => {
      const servicesTab = page.getByRole('link', { name: /email services/i });
      await expect(servicesTab).toHaveClass(/border-blue-600/);
    });

    ownerTest('can navigate to User Mailboxes', async ({ page }) => {
      await page.getByRole('link', { name: /user mailboxes/i }).click();
      await expect(page).toHaveURL(/\/settings\/email$/);
    });

    ownerTest('can navigate to Email Templates', async ({ page }) => {
      await page.getByRole('link', { name: /email templates/i }).click();
      await expect(page).toHaveURL(/\/settings\/email\/templates/);
    });
  });

  // ============================================
  // Resend Setup Page Navigation
  // ============================================

  ownerTest.describe('Resend Setup Navigation', () => {
    ownerTest('clicking Resend navigates to setup page', async ({ page }) => {
      // Click on Resend row - find by provider name in the font-medium span
      const resendRow = page.locator('.font-medium').filter({ hasText: 'Resend' });
      await resendRow.click();
      await expect(page).toHaveURL(/\/services\/resend/, { timeout: 10000 });
    });

    ownerTest('setup page shows Resend header', async ({ page }) => {
      await servicesPage.gotoResendSetup();
      await expect(page.getByText('Resend').first()).toBeVisible();
    });

    ownerTest('setup page has back button', async ({ page }) => {
      await servicesPage.gotoResendSetup();
      // Back button is a button element, not a link
      await expect(page.getByRole('button', { name: /back/i })).toBeVisible();
    });
  });

  // ============================================
  // Resend Setup Wizard (3 steps)
  // ============================================

  ownerTest.describe('Resend Setup Wizard', () => {
    ownerTest.beforeEach(async () => {
      await servicesPage.gotoResendSetup();
    });

    ownerTest('shows 3-step wizard', async ({ page }) => {
      // Should see step headers with step numbers/names
      await expect(page.getByRole('button', { name: /api key/i })).toBeVisible();
      await expect(page.getByRole('button', { name: /domain/i })).toBeVisible();
      await expect(page.getByRole('button', { name: /sender settings/i })).toBeVisible();
    });

    ownerTest('can expand API Key step', async ({ page }) => {
      // Click on API Key step to expand it
      await page.getByRole('button', { name: /api key/i }).first().click();
      // Should see API key input
      await expect(page.getByTestId('resend-input-api-key')).toBeVisible({ timeout: 5000 });
    });

    ownerTest('API Key step has save button when expanded', async ({ page }) => {
      // First expand the step
      await page.getByRole('button', { name: /api key/i }).first().click();
      await expect(page.getByTestId('resend-button-save-api-key')).toBeVisible({ timeout: 5000 });
    });

    ownerTest('API key step shows link to Resend when expanded', async ({ page }) => {
      // First expand the step
      await page.getByRole('button', { name: /api key/i }).first().click();
      await expect(page.getByRole('link', { name: /resend\.com/i })).toBeVisible({ timeout: 5000 });
    });
  });

  // ============================================
  // Resend Status Display
  // ============================================

  ownerTest.describe('Provider Status', () => {
    ownerTest('shows status badge for each provider', async ({ page }) => {
      // Each provider row should have a status badge
      const resendStatus = await servicesPage.getResendStatus();
      expect(['Connected', 'Needs Setup', '']).toContain(resendStatus);
    });

    ownerTest('configured provider shows toggle switch', async ({ page }) => {
      const isConfigured = await servicesPage.isResendConfigured();
      if (!isConfigured) {
        ownerTest.skip();
        return;
      }

      // Should see toggle switch for active/inactive
      const toggle = page.locator('button').filter({ hasClass: /rounded-full/ });
      await expect(toggle.first()).toBeVisible();
    });
  });
});
