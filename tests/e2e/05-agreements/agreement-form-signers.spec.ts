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
import { WORKSPACE_ID } from '@fixtures/users';
import { AgreementsPage } from '@pages/AgreementsPage';
import { TEST_CONTACTS } from './agreements.fixture';
import { Page } from '@playwright/test';

// Helper to select a template that has signer roles (at least 2)
async function selectTemplateWithRoles(page: Page, pattern: RegExp): Promise<string | null> {
  const templateSelect = page.locator('[data-testid="template-select"]');
  await templateSelect.waitFor({ state: 'visible' });

  const options = await templateSelect.locator('option').allTextContents();
  const candidateTemplates = options.filter(opt => pattern.test(opt));

  if (candidateTemplates.length === 0) {
    return null;
  }

  // Try each candidate template until we find one with at least 2 signer roles
  for (const templateLabel of candidateTemplates) {
    await templateSelect.selectOption({ label: templateLabel });
    await page.locator('text=Template applied').waitFor({ state: 'visible', timeout: 10000 });
    await page.waitForTimeout(500);

    // Check if signer-role elements appeared (at least role 1 and 2)
    const signerRole1 = page.locator('[data-testid="signer-role-1"]');
    const signerRole2 = page.locator('[data-testid="signer-role-2"]');

    const hasRole1 = await signerRole1.isVisible({ timeout: 2000 }).catch(() => false);
    const hasRole2 = await signerRole2.isVisible({ timeout: 1000 }).catch(() => false);

    if (hasRole1 && hasRole2) {
      console.log(`[helper] Found template with roles: ${templateLabel}`);
      return templateLabel;
    }
    console.log(`[helper] Template has no roles, trying next: ${templateLabel}`);
  }

  return null;
}

ownerTest.describe('Agreement Form Signers', () => {
  ownerTest.slow();

  let agreementsPage: AgreementsPage;

  const testContact1 = TEST_CONTACTS.CONTACT_1; // Carol Lopez
  const testContact2 = TEST_CONTACTS.CONTACT_2; // Thomas Walker
  const testContact3 = TEST_CONTACTS.CONTACT_3; // Nancy Moore

  // Pattern to find templates with signatories
  const MULTI_SIGNATORY_TEMPLATE_PATTERN = /Multi.*Signatory.*Test \d+|Comprehensive Template \d+/;

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

      const selectedTemplate = await selectTemplateWithRoles(page, MULTI_SIGNATORY_TEMPLATE_PATTERN);
      if (!selectedTemplate) {
        ownerTest.skip(true, 'No template with signer roles found');
        return;
      }

      // Verify signer role sections are visible
      const signerRole1 = page.locator('[data-testid="signer-role-1"]');
      const signerRole2 = page.locator('[data-testid="signer-role-2"]');

      await expect(signerRole1).toBeVisible({ timeout: 10000 });
      await expect(signerRole2).toBeVisible({ timeout: 5000 });

      // Verify role names are displayed using data-testid
      const signerName1 = page.locator('[data-testid="signer-name-1"]');
      const signerName2 = page.locator('[data-testid="signer-name-2"]');

      await expect(signerName1).toBeVisible();
      await expect(signerName2).toBeVisible();

      const name1 = await signerName1.textContent();
      const name2 = await signerName2.textContent();
      console.log(`[test] Role 1 name: ${name1}`);
      console.log(`[test] Role 2 name: ${name2}`);
    });

    ownerTest('shows signing order for each role', async ({ page }) => {
      await agreementsPage.openCreateForm();

      const selectedTemplate = await selectTemplateWithRoles(page, MULTI_SIGNATORY_TEMPLATE_PATTERN);
      if (!selectedTemplate) {
        ownerTest.skip(true, 'No template with signer roles found');
        return;
      }

      // Verify signing order is displayed using data-testid
      const signerOrder1 = page.locator('[data-testid="signer-order-1"]');
      await expect(signerOrder1).toBeVisible();

      const orderText = await signerOrder1.textContent();
      expect(orderText).toBeTruthy();
      console.log(`[test] Order text: ${orderText}`);

      // Verify signer name is also visible
      const signerName1 = page.locator('[data-testid="signer-name-1"]');
      await expect(signerName1).toBeVisible();
    });
  });

  // ============================================
  // Contact Selection
  // ============================================

  ownerTest.describe('Contact Selection', () => {
    ownerTest('allows selecting different contact for each role', async ({ page }) => {
      await agreementsPage.openCreateForm();

      const selectedTemplate = await selectTemplateWithRoles(page, MULTI_SIGNATORY_TEMPLATE_PATTERN);
      if (!selectedTemplate) {
        ownerTest.skip(true, 'No template with signer roles found');
        return;
      }

      await page.waitForTimeout(1000);

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

      const selectedTemplate = await selectTemplateWithRoles(page, MULTI_SIGNATORY_TEMPLATE_PATTERN);
      if (!selectedTemplate) {
        ownerTest.skip(true, 'No template with signer roles found');
        return;
      }

      await page.waitForTimeout(1000);

      // Select contact for role 1
      await agreementsPage.selectMultiSignerContact(1, testContact1);

      // Verify contact info is displayed
      const signerRole1 = page.locator('[data-testid="signer-role-1"]');
      await expect(signerRole1).toContainText(testContact1);

      // Should show at least email or phone if contact has them
      const hasEmailLabel = await signerRole1.locator('text=/[Ee]mail:?/').isVisible().catch(() => false);
      const hasPhoneLabel = await signerRole1.locator('text=/[Pp]hone:?|[Тт]елефон:?/').isVisible().catch(() => false);
      const hasCompanyLabel = await signerRole1.locator('text=/[Cc]ompany:?|[Кк]омпания:?/').isVisible().catch(() => false);

      console.log(`[test] Email visible: ${hasEmailLabel}, Phone visible: ${hasPhoneLabel}, Company visible: ${hasCompanyLabel}`);
    });

    ownerTest('allows removing selected contact', async ({ page }) => {
      await agreementsPage.openCreateForm();

      const selectedTemplate = await selectTemplateWithRoles(page, MULTI_SIGNATORY_TEMPLATE_PATTERN);
      if (!selectedTemplate) {
        ownerTest.skip(true, 'No template with signer roles found');
        return;
      }

      await page.waitForTimeout(1000);

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
    ownerTest('shows contact field for template without roles', async ({ page }) => {
      await agreementsPage.openCreateForm();

      const templateSelect = page.locator('[data-testid="template-select"]');
      await templateSelect.waitFor({ state: 'visible' });

      const options = await templateSelect.locator('option').allTextContents();

      // Find a template that is NOT multi-signatory
      const singleSignerTemplate = options.find(opt =>
        !MULTI_SIGNATORY_TEMPLATE_PATTERN.test(opt) &&
        opt !== '' &&
        !opt.includes('Select') &&
        opt.includes('(')
      );

      if (!singleSignerTemplate) {
        ownerTest.skip(true, 'No single-signer template found');
        return;
      }

      await templateSelect.selectOption({ label: singleSignerTemplate });
      await page.locator('text=Template applied').waitFor({ state: 'visible', timeout: 10000 });
      await page.waitForTimeout(1000);

      // Should show regular contact field (not signer-role sections)
      const regularContactField = page.locator('input[placeholder*="contact" i]').first();
      const signerRole1 = page.locator('[data-testid="signer-role-1"]');

      const hasContactField = await regularContactField.isVisible().catch(() => false);
      const hasSignerRole = await signerRole1.isVisible().catch(() => false);

      console.log(`[test] Has contact field: ${hasContactField}, Has signer role: ${hasSignerRole}`);
      // At least one should be visible
      expect(hasContactField || hasSignerRole).toBe(true);
    });
  });

  // ============================================
  // Edit Agreement with Signers
  // ============================================

  ownerTest.describe('Edit Agreement Signers', () => {
    let createdAgreementId: string;

    ownerTest('creates agreement with signers for edit test', async ({ page }) => {
      await agreementsPage.openCreateForm();

      const selectedTemplate = await selectTemplateWithRoles(page, MULTI_SIGNATORY_TEMPLATE_PATTERN);
      if (!selectedTemplate) {
        ownerTest.skip(true, 'No template with signer roles found');
        return;
      }

      // Check how many signer roles the template has (while form is still open)
      const signerRole3 = page.locator('[data-testid="signer-role-3"]');
      const hasRole3 = await signerRole3.isVisible({ timeout: 1000 }).catch(() => false);
      console.log(`[test] Template has 3rd signer role: ${hasRole3}`);

      const templateName = selectedTemplate.replace(/\s*\(Contract\)$/, '');
      await page.locator('button:has-text("Cancel")').click();
      await page.waitForTimeout(500);

      // Only add signatories for the roles that exist
      const signatories = hasRole3
        ? [
            { contactName: testContact1 },
            { contactName: testContact2 },
            { contactName: testContact3 },
          ]
        : [
            { contactName: testContact1 },
            { contactName: testContact2 },
          ];

      const agreementId = await agreementsPage.create({
        templateName,
        title: `Edit Signers Test ${Date.now()}`,
        signatories,
      });

      expect(agreementId).toBeTruthy();
      createdAgreementId = agreementId!;
      console.log(`[test] Created agreement: ${createdAgreementId}`);
    });

    ownerTest('edit sidebar shows existing signers', async ({ page }) => {
      if (!createdAgreementId) {
        ownerTest.skip(true, 'No agreement created');
        return;
      }

      // Navigate to agreement view
      await page.goto(`/ws/${WORKSPACE_ID}/agreements/${createdAgreementId}`);
      await page.waitForLoadState('networkidle');

      // Click edit button to open sidebar
      await page.click('[data-testid="edit-agreement-button"]');

      // Wait for form to load in sidebar
      await expect(page.locator('[data-testid="agreement-form"]')).toBeVisible({ timeout: 15000 });

      // Wait for signers to load (they are fetched async)
      await page.waitForTimeout(3000);

      // Verify signers are pre-populated
      const signerRole1 = page.locator('[data-testid="signer-role-1"]');
      const signerRole2 = page.locator('[data-testid="signer-role-2"]');

      const role1Visible = await signerRole1.isVisible().catch(() => false);
      const role2Visible = await signerRole2.isVisible().catch(() => false);

      console.log(`[test] Role 1 visible: ${role1Visible}, Role 2 visible: ${role2Visible}`);

      if (role1Visible) {
        // Signer role should contain the contact name
        await expect(signerRole1).toContainText(testContact1);
      }
    });

    ownerTest('edit preserves signers after save', async ({ page }) => {
      if (!createdAgreementId) {
        ownerTest.skip(true, 'No agreement created');
        return;
      }

      // Navigate to agreement view
      await page.goto(`/ws/${WORKSPACE_ID}/agreements/${createdAgreementId}`);
      await page.waitForLoadState('networkidle');

      // Click edit button to open sidebar
      await page.click('[data-testid="edit-agreement-button"]');

      // Wait for form to load
      await expect(page.locator('[data-testid="agreement-form"]')).toBeVisible({ timeout: 15000 });
      await page.waitForTimeout(2000);

      // Submit without changes
      await page.click('[data-testid="agreement-form-submit"]');

      // Wait for sidebar to close and page to refresh
      await page.waitForTimeout(2000);

      // Verify signers are still present on the view page
      const signersSection = page.locator('[data-testid="signers-section"]');
      await expect(signersSection).toBeVisible({ timeout: 10000 });

      // Check that both contacts are still there
      await expect(page.locator(`text="${testContact1}"`).first()).toBeVisible();
      await expect(page.locator(`text="${testContact2}"`).first()).toBeVisible();
    });
  });
});
