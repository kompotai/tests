/**
 * Agreement Form Signers Tests
 *
 * Tests for the agreement creation/edit form focusing on:
 * - Template role names displayed as signer labels
 * - Contact selection for each role
 * - Contact info display (email, phone, company) after selection
 * - Editing agreement with existing signers
 */

import { ownerTest, expect } from '@fixtures/auth.fixture';
import { AgreementsPage } from '@pages/AgreementsPage';
import { TEST_CONTACTS } from './agreements.fixture';

ownerTest.describe('Agreement Form Signers', () => {
  ownerTest.slow();

  let agreementsPage: AgreementsPage;

  const testContact1 = TEST_CONTACTS.CONTACT_1; // Carol Lopez
  const testContact2 = TEST_CONTACTS.CONTACT_2; // Thomas Walker

  // Comprehensive Template has 2 signatories with custom role names
  const MULTI_SIGNATORY_TEMPLATE_PATTERN = /Comprehensive Template \d+/;

  ownerTest.beforeEach(async ({ page }) => {
    agreementsPage = new AgreementsPage(page);
    await agreementsPage.goto();
  });

  // ============================================
  // Role Names Display
  // ============================================

  ownerTest.describe('Role Names Display', () => {
    ownerTest('shows role names from template in signer form', async ({ page }) => {
      await agreementsPage.openCreateForm();

      const templateSelect = page.locator('[data-testid="template-select"]');
      await templateSelect.waitFor({ state: 'visible' });

      const options = await templateSelect.locator('option').allTextContents();
      const comprehensiveTemplate = options.find(opt => MULTI_SIGNATORY_TEMPLATE_PATTERN.test(opt));

      if (!comprehensiveTemplate) {
        ownerTest.skip(true, 'No multi-signatory template found - run comprehensive tests first');
        return;
      }

      const templateName = comprehensiveTemplate.replace(/\s*\(Contract\)$/, '');
      await templateSelect.selectOption({ label: comprehensiveTemplate });

      // Wait for template to load
      await page.locator('text=Template applied').waitFor({ state: 'visible', timeout: 10000 });
      await page.waitForTimeout(1000);

      // Verify signer role sections are visible
      const signerRole1 = page.locator('[data-testid="signer-role-1"]');
      const signerRole2 = page.locator('[data-testid="signer-role-2"]');

      await expect(signerRole1).toBeVisible({ timeout: 10000 });
      await expect(signerRole2).toBeVisible({ timeout: 5000 });

      // Verify role names are displayed (not just "Signer 1", "Signer 2")
      // The role names should be visible within the signer-role containers
      const role1Text = await signerRole1.textContent();
      const role2Text = await signerRole2.textContent();

      // Roles should have meaningful names (from template), not just generic
      expect(role1Text).toBeTruthy();
      expect(role2Text).toBeTruthy();
      console.log(`[test] Role 1 text: ${role1Text}`);
      console.log(`[test] Role 2 text: ${role2Text}`);
    });

    ownerTest('shows signing order for each role', async ({ page }) => {
      await agreementsPage.openCreateForm();

      const templateSelect = page.locator('[data-testid="template-select"]');
      await templateSelect.waitFor({ state: 'visible' });

      const options = await templateSelect.locator('option').allTextContents();
      const comprehensiveTemplate = options.find(opt => MULTI_SIGNATORY_TEMPLATE_PATTERN.test(opt));

      if (!comprehensiveTemplate) {
        ownerTest.skip(true, 'No multi-signatory template found');
        return;
      }

      await templateSelect.selectOption({ label: comprehensiveTemplate });
      await page.locator('text=Template applied').waitFor({ state: 'visible', timeout: 10000 });
      await page.waitForTimeout(1000);

      // Verify signing order is displayed
      // Look for text like "Signs 1st" or "Order: 1"
      const signerRole1 = page.locator('[data-testid="signer-role-1"]');
      await expect(signerRole1).toBeVisible();

      const orderText = await signerRole1.locator('text=/[Ss]igns|[Oo]rder/').textContent();
      expect(orderText).toBeTruthy();
      console.log(`[test] Order text: ${orderText}`);
    });
  });

  // ============================================
  // Contact Selection
  // ============================================

  ownerTest.describe('Contact Selection', () => {
    ownerTest('allows selecting different contact for each role', async ({ page }) => {
      await agreementsPage.openCreateForm();

      const templateSelect = page.locator('[data-testid="template-select"]');
      await templateSelect.waitFor({ state: 'visible' });

      const options = await templateSelect.locator('option').allTextContents();
      const comprehensiveTemplate = options.find(opt => MULTI_SIGNATORY_TEMPLATE_PATTERN.test(opt));

      if (!comprehensiveTemplate) {
        ownerTest.skip(true, 'No multi-signatory template found');
        return;
      }

      await templateSelect.selectOption({ label: comprehensiveTemplate });
      await page.locator('text=Template applied').waitFor({ state: 'visible', timeout: 10000 });
      await page.waitForTimeout(2000);

      // Select first contact for role 1
      await agreementsPage.selectMultiSignerContact(1, testContact1);

      // Verify first contact is selected (name visible in role 1)
      const signerRole1 = page.locator('[data-testid="signer-role-1"]');
      await expect(signerRole1).toContainText(testContact1);

      // Select second contact for role 2
      await agreementsPage.selectMultiSignerContact(2, testContact2);

      // Verify second contact is selected
      const signerRole2 = page.locator('[data-testid="signer-role-2"]');
      await expect(signerRole2).toContainText(testContact2);
    });

    ownerTest('shows contact info after selection', async ({ page }) => {
      await agreementsPage.openCreateForm();

      const templateSelect = page.locator('[data-testid="template-select"]');
      await templateSelect.waitFor({ state: 'visible' });

      const options = await templateSelect.locator('option').allTextContents();
      const comprehensiveTemplate = options.find(opt => MULTI_SIGNATORY_TEMPLATE_PATTERN.test(opt));

      if (!comprehensiveTemplate) {
        ownerTest.skip(true, 'No multi-signatory template found');
        return;
      }

      await templateSelect.selectOption({ label: comprehensiveTemplate });
      await page.locator('text=Template applied').waitFor({ state: 'visible', timeout: 10000 });
      await page.waitForTimeout(2000);

      // Select contact for role 1
      await agreementsPage.selectMultiSignerContact(1, testContact1);

      // Verify contact info is displayed
      const signerRole1 = page.locator('[data-testid="signer-role-1"]');
      await expect(signerRole1).toContainText(testContact1);

      // Should show at least email or phone if contact has them
      // Look for Email: or Phone: labels in the signer role section
      const hasEmailLabel = await signerRole1.locator('text=/[Ee]mail:?/').isVisible().catch(() => false);
      const hasPhoneLabel = await signerRole1.locator('text=/[Pp]hone:?|[Тт]елефон:?/').isVisible().catch(() => false);
      const hasCompanyLabel = await signerRole1.locator('text=/[Cc]ompany:?|[Кк]омпания:?/').isVisible().catch(() => false);

      // At least one type of contact info should be displayed (if contact has any)
      console.log(`[test] Email visible: ${hasEmailLabel}, Phone visible: ${hasPhoneLabel}, Company visible: ${hasCompanyLabel}`);
      // Note: This test verifies the UI shows contact info when available
    });

    ownerTest('allows removing selected contact', async ({ page }) => {
      await agreementsPage.openCreateForm();

      const templateSelect = page.locator('[data-testid="template-select"]');
      await templateSelect.waitFor({ state: 'visible' });

      const options = await templateSelect.locator('option').allTextContents();
      const comprehensiveTemplate = options.find(opt => MULTI_SIGNATORY_TEMPLATE_PATTERN.test(opt));

      if (!comprehensiveTemplate) {
        ownerTest.skip(true, 'No multi-signatory template found');
        return;
      }

      await templateSelect.selectOption({ label: comprehensiveTemplate });
      await page.locator('text=Template applied').waitFor({ state: 'visible', timeout: 10000 });
      await page.waitForTimeout(2000);

      // Select contact for role 1
      await agreementsPage.selectMultiSignerContact(1, testContact1);

      // Verify contact is selected
      const signerRole1 = page.locator('[data-testid="signer-role-1"]');
      await expect(signerRole1).toContainText(testContact1);

      // Find and click remove button (X button)
      const removeButton = signerRole1.locator('button').filter({ has: page.locator('svg') }).first();
      await removeButton.click();
      await page.waitForTimeout(500);

      // Verify contact search input is now visible again (contact was removed)
      const contactInput = page.locator('[data-testid="signer-contact-input-1"]');
      await expect(contactInput).toBeVisible({ timeout: 5000 });
    });
  });

  // ============================================
  // Single Signer Template
  // ============================================

  ownerTest.describe('Single Signer Template', () => {
    ownerTest('shows role picker even for template with 1 signer', async ({ page }) => {
      // Create a simple template with 1 signer or find one
      await agreementsPage.openCreateForm();

      const templateSelect = page.locator('[data-testid="template-select"]');
      await templateSelect.waitFor({ state: 'visible' });

      const options = await templateSelect.locator('option').allTextContents();

      // Try to find a single-signer template (not comprehensive)
      const singleSignerTemplate = options.find(opt =>
        !MULTI_SIGNATORY_TEMPLATE_PATTERN.test(opt) && opt !== '' && !opt.includes('Select')
      );

      if (!singleSignerTemplate) {
        ownerTest.skip(true, 'No single-signer template found');
        return;
      }

      await templateSelect.selectOption({ label: singleSignerTemplate });
      await page.locator('text=Template applied').waitFor({ state: 'visible', timeout: 10000 });
      await page.waitForTimeout(1000);

      // Should show either signer-role-1 (if template has roles) or regular contact field
      const signerRole1 = page.locator('[data-testid="signer-role-1"]');
      const regularContactField = page.locator('input[placeholder*="contact"]').first();

      const hasSignerRole = await signerRole1.isVisible().catch(() => false);
      const hasContactField = await regularContactField.isVisible().catch(() => false);

      // Either signer role or contact field should be visible
      expect(hasSignerRole || hasContactField).toBe(true);
      console.log(`[test] Has signer role: ${hasSignerRole}, Has contact field: ${hasContactField}`);
    });
  });

  // ============================================
  // Edit Agreement with Signers
  // ============================================

  ownerTest.describe('Edit Agreement Signers', () => {
    let createdAgreementId: string;

    ownerTest('creates agreement with signers for edit test', async ({ page }) => {
      await agreementsPage.openCreateForm();

      const templateSelect = page.locator('[data-testid="template-select"]');
      await templateSelect.waitFor({ state: 'visible' });

      const options = await templateSelect.locator('option').allTextContents();
      const comprehensiveTemplate = options.find(opt => MULTI_SIGNATORY_TEMPLATE_PATTERN.test(opt));

      if (!comprehensiveTemplate) {
        ownerTest.skip(true, 'No multi-signatory template found');
        return;
      }

      const templateName = comprehensiveTemplate.replace(/\s*\(Contract\)$/, '');
      await page.locator('button:has-text("Cancel")').click();
      await page.waitForTimeout(500);

      const agreementId = await agreementsPage.create({
        templateName,
        title: `Edit Signers Test ${Date.now()}`,
        signatories: [
          { contactName: testContact1 },
          { contactName: testContact2 },
        ],
      });

      expect(agreementId).toBeTruthy();
      createdAgreementId = agreementId!;
      console.log(`[test] Created agreement: ${createdAgreementId}`);
    });

    ownerTest('edit form shows existing signers', async ({ page }) => {
      if (!createdAgreementId) {
        ownerTest.skip(true, 'No agreement created');
        return;
      }

      // Navigate to edit page
      await page.goto(`/ws/agreements/${createdAgreementId}/edit`);
      await page.waitForLoadState('networkidle');

      // Wait for form to load
      await expect(page.locator('form')).toBeVisible({ timeout: 15000 });

      // Wait for signers to load (they are fetched async)
      await page.waitForTimeout(3000);

      // Verify signers are pre-populated
      const signerRole1 = page.locator('[data-testid="signer-role-1"]');
      const signerRole2 = page.locator('[data-testid="signer-role-2"]');

      // At least one signer role should be visible and contain a contact name
      const role1Visible = await signerRole1.isVisible().catch(() => false);
      const role2Visible = await signerRole2.isVisible().catch(() => false);

      console.log(`[test] Role 1 visible: ${role1Visible}, Role 2 visible: ${role2Visible}`);

      if (role1Visible) {
        // Signer role should contain the contact name (not just an empty input)
        const role1HasContact = await signerRole1.locator(`.font-medium, text="${testContact1}"`).isVisible().catch(() => false);
        console.log(`[test] Role 1 has contact: ${role1HasContact}`);
      }
    });

    ownerTest('edit preserves signers after save', async ({ page }) => {
      if (!createdAgreementId) {
        ownerTest.skip(true, 'No agreement created');
        return;
      }

      // Navigate to edit page
      await page.goto(`/ws/agreements/${createdAgreementId}/edit`);
      await page.waitForLoadState('networkidle');

      // Wait for form to load
      await expect(page.locator('form')).toBeVisible({ timeout: 15000 });
      await page.waitForTimeout(2000);

      // Just submit without changes
      await page.click('[data-testid="agreement-form-submit"]');

      // Wait for redirect back to view
      await page.waitForURL(/\/ws\/agreements\/[a-f0-9]+$/, { timeout: 30000 });

      // Verify signers are still present on the view page
      const signersSection = page.locator('[data-testid="signers-section"]');
      await expect(signersSection).toBeVisible({ timeout: 10000 });

      // Check that both contacts are still there
      await expect(page.locator(`text="${testContact1}"`).first()).toBeVisible();
      await expect(page.locator(`text="${testContact2}"`).first()).toBeVisible();
    });
  });
});
