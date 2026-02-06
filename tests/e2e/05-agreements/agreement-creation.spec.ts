/**
 * Agreement Creation Tests
 *
 * Tests for creating agreements from templates and verifying
 * that fields are correctly populated with contact data.
 *
 * Uses templates created by comprehensive test suite.
 */

import { ownerTest, expect } from '@fixtures/auth.fixture';
import { AgreementsPage } from '@pages/AgreementsPage';
import { TEST_CONTACTS } from './agreements.fixture';
import { getSetupTemplateName } from './agreement-setup.utils';

ownerTest.describe('Agreement Creation', () => {
  // Set longer timeout for all tests in this suite
  ownerTest.slow();

  let agreementsPage: AgreementsPage;

  // Use contacts from the fixture (these exist in megatest workspace)
  const testContactName = TEST_CONTACTS.CONTACT_1;
  const secondContactName = TEST_CONTACTS.CONTACT_2;
  const thirdContactName = TEST_CONTACTS.CONTACT_3;

  // Use patterns to find templates - comprehensive test creates these
  // Comprehensive Template has exactly 2 signatories
  const MULTI_SIGNATORY_TEMPLATE_PATTERN = /Comprehensive Template \d+/;

  // Find multi-signatory template: setup template first, then regex fallback
  function findMultiSignatoryTemplate(options: string[]): string | undefined {
    const setupName = getSetupTemplateName();
    if (setupName) {
      const match = options.find(opt => opt === setupName || opt === `${setupName} (Contract)`);
      if (match) return match;
    }
    return findMultiSignatoryTemplate(options);
  }

  ownerTest.beforeEach(async ({ page }) => {
    agreementsPage = new AgreementsPage(page);
    await agreementsPage.goto();
  });

  // ============================================
  // Basic Agreement Creation
  // ============================================

  ownerTest.describe('Basic Creation', () => {
    ownerTest('creates agreement from comprehensive template', async () => {
      // Find the most recent comprehensive template
      await agreementsPage.openCreateForm();

      // Get all template options and find a comprehensive one
      const templateSelect = agreementsPage.page.locator('[data-testid="template-select"]');
      await templateSelect.waitFor({ state: 'visible' });

      const options = await templateSelect.locator('option').allTextContents();
      const comprehensiveTemplate = findMultiSignatoryTemplate(options);

      if (!comprehensiveTemplate) {
        ownerTest.skip(true, 'No multi-signatory template found - run comprehensive tests first');
        return;
      }

      // Extract template name (remove " (Contract)" suffix)
      const templateName = comprehensiveTemplate.replace(/\s*\(Contract\)$/, '');

      // Close form and create with full flow
      await agreementsPage.page.locator('button:has-text("Cancel")').click();
      await agreementsPage.page.waitForTimeout(500);

      const agreementId = await agreementsPage.create({
        templateName,
        signatories: [
          { contactName: testContactName },
          { contactName: secondContactName },
        ],
      });

      expect(agreementId).toBeTruthy();
    });

    ownerTest('creates agreement with custom title', async () => {
      const customTitle = `Custom Agreement ${Date.now()}`;

      // Find a comprehensive template
      await agreementsPage.openCreateForm();
      const templateSelect = agreementsPage.page.locator('[data-testid="template-select"]');
      await templateSelect.waitFor({ state: 'visible' });

      const options = await templateSelect.locator('option').allTextContents();
      const comprehensiveTemplate = findMultiSignatoryTemplate(options);

      if (!comprehensiveTemplate) {
        ownerTest.skip(true, 'No multi-signatory template found');
        return;
      }

      const templateName = comprehensiveTemplate.replace(/\s*\(Contract\)$/, '');
      await agreementsPage.page.locator('button:has-text("Cancel")').click();
      await agreementsPage.page.waitForTimeout(500);

      await agreementsPage.create({
        templateName,
        title: customTitle,
        signatories: [
          { contactName: testContactName },
          { contactName: secondContactName },
        ],
      });

      await agreementsPage.shouldSeeAgreement(customTitle);
    });
  });

  // ============================================
  // Field Population Verification
  // ============================================

  ownerTest.describe('Field Population', () => {
    ownerTest('populates creation date field', async ({ page }) => {
      // Find a comprehensive template
      await agreementsPage.openCreateForm();
      const templateSelect = page.locator('[data-testid="template-select"]');
      await templateSelect.waitFor({ state: 'visible' });

      const options = await templateSelect.locator('option').allTextContents();
      const comprehensiveTemplate = findMultiSignatoryTemplate(options);

      if (!comprehensiveTemplate) {
        ownerTest.skip(true, 'No multi-signatory template found');
        return;
      }

      const templateName = comprehensiveTemplate.replace(/\s*\(Contract\)$/, '');
      await page.locator('button:has-text("Cancel")').click();
      await page.waitForTimeout(500);

      const agreementId = await agreementsPage.create({
        templateName,
        signatories: [
          { contactName: testContactName },
          { contactName: secondContactName },
        ],
      });

      // Navigate to agreement view
      await agreementsPage.openAgreement(agreementId!);

      // Verify creation date is populated (format: DD.MM.YY HH:MM as shown in UI)
      // Note: Use flexible pattern to handle timezone differences (local vs UTC can differ by ±1 day)
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(today.getDate() - 1);
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);

      const formatDate = (d: Date) => {
        const dd = String(d.getDate()).padStart(2, '0');
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const yy = String(d.getFullYear()).slice(-2);
        return `${dd}\\.${mm}\\.${yy}`;
      };

      // Allow for today, yesterday, or tomorrow due to timezone differences
      const expectedDatePattern = new RegExp(
        `(${formatDate(yesterday)}|${formatDate(today)}|${formatDate(tomorrow)})`
      );

      // Look for the date on the page (in the "Created:" section)
      await expect(page.getByText(expectedDatePattern)).toBeVisible({ timeout: 10000 });
    });

    ownerTest('populates contact name field from signatory', async ({ page }) => {
      await agreementsPage.openCreateForm();
      const templateSelect = page.locator('[data-testid="template-select"]');
      await templateSelect.waitFor({ state: 'visible' });

      const options = await templateSelect.locator('option').allTextContents();
      const comprehensiveTemplate = findMultiSignatoryTemplate(options);

      if (!comprehensiveTemplate) {
        ownerTest.skip(true, 'No multi-signatory template found');
        return;
      }

      const templateName = comprehensiveTemplate.replace(/\s*\(Contract\)$/, '');
      await page.locator('button:has-text("Cancel")').click();
      await page.waitForTimeout(500);

      const agreementId = await agreementsPage.create({
        templateName,
        signatories: [
          { contactName: testContactName },
          { contactName: secondContactName },
        ],
      });

      await agreementsPage.openAgreement(agreementId!);

      // Verify contact name is visible (either in Contact section or as signer)
      // Use first() since contact name may appear multiple times
      await expect(page.getByText(testContactName).first()).toBeVisible({ timeout: 10000 });
    });

    ownerTest('shows contact section with signatory', async ({ page }) => {
      await agreementsPage.openCreateForm();
      const templateSelect = page.locator('[data-testid="template-select"]');
      await templateSelect.waitFor({ state: 'visible' });

      const options = await templateSelect.locator('option').allTextContents();
      const comprehensiveTemplate = findMultiSignatoryTemplate(options);

      if (!comprehensiveTemplate) {
        ownerTest.skip(true, 'No multi-signatory template found');
        return;
      }

      const templateName = comprehensiveTemplate.replace(/\s*\(Contract\)$/, '');
      await page.locator('button:has-text("Cancel")').click();
      await page.waitForTimeout(500);

      const agreementId = await agreementsPage.create({
        templateName,
        signatories: [
          { contactName: testContactName },
          { contactName: secondContactName },
        ],
      });

      await agreementsPage.openAgreement(agreementId!);

      // Verify Contact section heading and linked contact are visible
      await expect(page.getByRole('heading', { name: 'Contact' })).toBeVisible({ timeout: 10000 });
      // Use specific data-testid to avoid matching both Contact and Signers sections
      await expect(page.locator('[data-testid="agreement-contact"]').getByRole('link', { name: testContactName })).toBeVisible({ timeout: 5000 });
    });
  });

  // ============================================
  // Agreement List
  // ============================================

  ownerTest.describe('Agreement List', () => {
    ownerTest('shows created agreement in list', async () => {
      await agreementsPage.openCreateForm();
      const templateSelect = agreementsPage.page.locator('[data-testid="template-select"]');
      await templateSelect.waitFor({ state: 'visible' });

      const options = await templateSelect.locator('option').allTextContents();
      const comprehensiveTemplate = findMultiSignatoryTemplate(options);

      if (!comprehensiveTemplate) {
        ownerTest.skip(true, 'No multi-signatory template found');
        return;
      }

      const templateName = comprehensiveTemplate.replace(/\s*\(Contract\)$/, '');
      await agreementsPage.page.locator('button:has-text("Cancel")').click();
      await agreementsPage.page.waitForTimeout(500);

      const title = `List Test Agreement ${Date.now()}`;

      await agreementsPage.create({
        templateName,
        title,
        signatories: [
          { contactName: testContactName },
          { contactName: secondContactName },
        ],
      });

      // Go back to list
      await agreementsPage.goto();

      await agreementsPage.shouldSeeAgreement(title);
    });

    ownerTest('can open agreement from list', async ({ page }) => {
      agreementsPage = new AgreementsPage(page);
      await agreementsPage.goto();

      await agreementsPage.openCreateForm();
      const templateSelect = page.locator('[data-testid="template-select"]');
      await templateSelect.waitFor({ state: 'visible' });

      const options = await templateSelect.locator('option').allTextContents();
      const comprehensiveTemplate = findMultiSignatoryTemplate(options);

      if (!comprehensiveTemplate) {
        ownerTest.skip(true, 'No multi-signatory template found');
        return;
      }

      const templateName = comprehensiveTemplate.replace(/\s*\(Contract\)$/, '');
      await page.locator('button:has-text("Cancel")').click();
      await page.waitForTimeout(500);

      const title = `Open Test Agreement ${Date.now()}`;

      await agreementsPage.create({
        templateName,
        title,
        signatories: [
          { contactName: testContactName },
          { contactName: secondContactName },
        ],
      });

      // Go back to list
      await agreementsPage.goto();

      // Open the agreement
      await agreementsPage.openAgreement(title);

      // Should be on agreement view page
      await expect(page).toHaveURL(/\/agreements\/[a-f0-9]+/);
    });
  });

  // ============================================
  // Document Preview
  // ============================================

  ownerTest.describe('Document Preview', () => {
    ownerTest('shows document preview on agreement view', async () => {
      await agreementsPage.openCreateForm();
      const templateSelect = agreementsPage.page.locator('[data-testid="template-select"]');
      await templateSelect.waitFor({ state: 'visible' });

      const options = await templateSelect.locator('option').allTextContents();
      const comprehensiveTemplate = findMultiSignatoryTemplate(options);

      if (!comprehensiveTemplate) {
        ownerTest.skip(true, 'No multi-signatory template found');
        return;
      }

      const templateName = comprehensiveTemplate.replace(/\s*\(Contract\)$/, '');
      await agreementsPage.page.locator('button:has-text("Cancel")').click();
      await agreementsPage.page.waitForTimeout(500);

      const agreementId = await agreementsPage.create({
        templateName,
        signatories: [
          { contactName: testContactName },
          { contactName: secondContactName },
        ],
      });

      await agreementsPage.openAgreement(agreementId!);

      const previewVisible = await agreementsPage.shouldSeeDocumentPreview();
      expect(previewVisible).toBe(true);
    });
  });
});
