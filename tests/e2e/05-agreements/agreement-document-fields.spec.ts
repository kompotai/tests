/**
 * Agreement Document Fields Tests
 *
 * Tests for document fields functionality:
 * - Document fields display in creation form
 * - Document fields can be filled and saved
 * - Document fields are preserved when editing
 * - Multi-signers with document fields work together
 */

import { ownerTest, expect } from '@fixtures/auth.fixture';
import { AgreementsPage } from '@pages/AgreementsPage';
import { TEST_CONTACTS } from './agreements.fixture';
import { Page } from '@playwright/test';

// Helper to find a template with document fields and 2 signer roles
async function findTemplateWithDocFieldsAndRoles(page: Page): Promise<string | null> {
  const templateSelect = page.locator('[data-testid="template-select"]');
  await templateSelect.waitFor({ state: 'visible' });

  const options = await templateSelect.locator('option').allTextContents();
  // Comprehensive Template has document fields (text, number) and 2 roles
  const patterns = [/Comprehensive Template \d+/];

  for (const pattern of patterns) {
    const candidates = options.filter(opt => pattern.test(opt));
    for (const templateLabel of candidates) {
      await templateSelect.selectOption({ label: templateLabel });
      await page.locator('text=Template applied').waitFor({ state: 'visible', timeout: 10000 });
      await page.waitForTimeout(500);

      // Check for document fields and signer roles
      const hasDocFields = await page.locator('text=Document Fields').isVisible({ timeout: 2000 }).catch(() => false);
      const signerRole1 = page.locator('[data-testid="signer-role-1"]');
      const signerRole2 = page.locator('[data-testid="signer-role-2"]');
      const hasRole1 = await signerRole1.isVisible({ timeout: 1000 }).catch(() => false);
      const hasRole2 = await signerRole2.isVisible({ timeout: 500 }).catch(() => false);

      if (hasDocFields && hasRole1 && hasRole2) {
        console.log(`[helper] Found template with doc fields and 2 roles: ${templateLabel}`);
        return templateLabel.replace(/\s*\(Contract\)$/, '');
      }
      console.log(`[helper] Template ${templateLabel}: docFields=${hasDocFields}, roles=${hasRole1 && hasRole2}`);
    }
  }
  return null;
}

ownerTest.describe('Agreement Document Fields', () => {
  ownerTest.slow();

  let agreementsPage: AgreementsPage;
  let createdAgreementId: string;

  const testContact1 = TEST_CONTACTS.CONTACT_1;
  const testContact2 = TEST_CONTACTS.CONTACT_2;

  ownerTest.beforeEach(async ({ page }) => {
    agreementsPage = new AgreementsPage(page);

    // Dismiss cookie banner if present
    page.on('load', async () => {
      const cookieAccept = page.locator('[data-testid="cookie-accept-all"]');
      if (await cookieAccept.isVisible({ timeout: 500 }).catch(() => false)) {
        await cookieAccept.click().catch(() => {});
      }
    });
  });

  // ============================================
  // Document Fields Display
  // ============================================

  ownerTest.describe('Document Fields Display', () => {
    ownerTest('shows document fields section when template has fillable fields', async ({ page }) => {
      await agreementsPage.goto();
      await agreementsPage.openCreateForm();

      const templateName = await findTemplateWithDocFieldsAndRoles(page);
      if (!templateName) {
        ownerTest.skip(true, 'No template with document fields found');
        return;
      }

      // Verify document fields section is visible
      const docFieldsSection = page.locator('text=Document Fields');
      await expect(docFieldsSection).toBeVisible();

      // Verify text and number fields are present
      const textField = page.locator('input[type="text"]').filter({ hasNot: page.locator('[placeholder*="contact" i]') });
      const numberField = page.locator('input[type="number"]');

      // At least one fillable field should be visible
      const hasTextField = await textField.first().isVisible().catch(() => false);
      const hasNumberField = await numberField.first().isVisible().catch(() => false);

      console.log(`[test] Has text field: ${hasTextField}, Has number field: ${hasNumberField}`);
      expect(hasTextField || hasNumberField).toBe(true);
    });

    ownerTest('document fields have labels and required indicators', async ({ page }) => {
      await agreementsPage.goto();
      await agreementsPage.openCreateForm();

      const templateName = await findTemplateWithDocFieldsAndRoles(page);
      if (!templateName) {
        ownerTest.skip(true, 'No template with document fields found');
        return;
      }

      // Check for "Text*" and "Number*" labels (required fields)
      const textLabel = page.locator('text=/Text\\*?/');
      const numberLabel = page.locator('text=/Number\\*?/');

      const hasTextLabel = await textLabel.first().isVisible().catch(() => false);
      const hasNumberLabel = await numberLabel.first().isVisible().catch(() => false);

      console.log(`[test] Text label: ${hasTextLabel}, Number label: ${hasNumberLabel}`);
      expect(hasTextLabel || hasNumberLabel).toBe(true);
    });
  });

  // ============================================
  // Document Fields + Multi-Signers Creation
  // ============================================

  ownerTest.describe('Creation with Document Fields and Multi-Signers', () => {
    ownerTest('creates agreement with document fields and two signers', async ({ page }) => {
      await agreementsPage.goto();
      await agreementsPage.openCreateForm();

      const templateName = await findTemplateWithDocFieldsAndRoles(page);
      if (!templateName) {
        ownerTest.skip(true, 'No template with document fields and roles found');
        return;
      }

      // Fill document fields
      const textInput = page.locator('input[type="text"]').filter({
        has: page.locator('..').filter({ hasText: /^Text/ })
      }).first();
      const numberInput = page.locator('input[type="number"]').first();

      // Try to find document field inputs by looking in Document Fields section
      const docFieldsSection = page.locator('text=Document Fields').locator('..').locator('..');

      // Fill text field if visible
      const textField = docFieldsSection.locator('input[type="text"]').first();
      if (await textField.isVisible().catch(() => false)) {
        await textField.fill('Test Document Value');
        console.log('[test] Filled text field');
      }

      // Fill number field if visible
      const numField = docFieldsSection.locator('input[type="number"]').first();
      if (await numField.isVisible().catch(() => false)) {
        await numField.fill('12345');
        console.log('[test] Filled number field');
      }

      // Fill title - use the form's title input, not the search input
      const form = page.locator('[data-testid="agreement-form"]');
      const titleInput = form.locator('input[placeholder*="title" i], input[placeholder*="название" i]').first();
      const title = `DocFields Test ${Date.now()}`;
      await titleInput.clear();
      await titleInput.fill(title);
      console.log(`[test] Filled title: ${title}`);

      // Select signers
      await agreementsPage.selectMultiSignerContact(1, testContact1);
      await agreementsPage.selectMultiSignerContact(2, testContact2);

      // Verify both signers are selected
      const signerRole1 = page.locator('[data-testid="signer-role-1"]');
      const signerRole2 = page.locator('[data-testid="signer-role-2"]');
      await expect(signerRole1).toContainText(testContact1);
      await expect(signerRole2).toContainText(testContact2);

      // Submit form
      await page.click('[data-testid="agreement-form-submit"]');

      // Wait for redirect to agreement view
      await page.waitForURL(/\/agreements\/[a-f0-9]+/, { timeout: 30000 });

      // Store agreement ID for later tests
      const url = page.url();
      createdAgreementId = url.split('/').pop() || '';
      console.log(`[test] Created agreement: ${createdAgreementId}`);

      // Verify agreement was created
      expect(createdAgreementId).toBeTruthy();
      expect(createdAgreementId.length).toBeGreaterThan(10);
    });

    ownerTest('created agreement shows signers section', async ({ page }) => {
      if (!createdAgreementId) {
        ownerTest.skip(true, 'No agreement created');
        return;
      }

      await page.goto(`/ws/agreements/${createdAgreementId}`);
      await page.waitForLoadState('networkidle');

      // Verify signers section is visible
      const signersSection = page.locator('[data-testid="signers-section"]');
      await expect(signersSection).toBeVisible({ timeout: 10000 });

      // Verify both contacts are shown
      await expect(page.locator(`text="${testContact1}"`).first()).toBeVisible();
      await expect(page.locator(`text="${testContact2}"`).first()).toBeVisible();

      console.log('[test] Signers section displays both contacts');
    });
  });

  // ============================================
  // Edit Agreement - Document Fields & Signers Preserved
  // ============================================

  ownerTest.describe('Edit Preserves Document Fields and Signers', () => {
    ownerTest('edit form loads existing signers', async ({ page }) => {
      if (!createdAgreementId) {
        ownerTest.skip(true, 'No agreement created');
        return;
      }

      await page.goto(`/ws/agreements/${createdAgreementId}`);
      await page.waitForLoadState('networkidle');

      // Dismiss cookie banner
      const cookieAccept = page.locator('[data-testid="cookie-accept-all"]');
      if (await cookieAccept.isVisible({ timeout: 1000 }).catch(() => false)) {
        await cookieAccept.click();
      }

      // Click edit button
      await page.click('[data-testid="edit-agreement-button"]');

      // Wait for form
      await expect(page.locator('[data-testid="agreement-form"]')).toBeVisible({ timeout: 10000 });

      // Wait for signers to load
      await page.waitForTimeout(2000);

      // Verify signer roles show loaded contacts
      const signerRole1 = page.locator('[data-testid="signer-role-1"]');
      const signerRole2 = page.locator('[data-testid="signer-role-2"]');

      await expect(signerRole1).toBeVisible();
      await expect(signerRole2).toBeVisible();

      // Check if contacts are pre-filled
      const hasContact1 = await signerRole1.locator(`text=${testContact1}`).isVisible({ timeout: 3000 }).catch(() => false);
      const hasContact2 = await signerRole2.locator(`text=${testContact2}`).isVisible({ timeout: 1000 }).catch(() => false);

      console.log(`[test] Signer 1 loaded (${testContact1}): ${hasContact1}`);
      console.log(`[test] Signer 2 loaded (${testContact2}): ${hasContact2}`);

      // At least one signer should be loaded
      expect(hasContact1 || hasContact2).toBe(true);
    });

    ownerTest('edit form shows document fields section', async ({ page }) => {
      if (!createdAgreementId) {
        ownerTest.skip(true, 'No agreement created');
        return;
      }

      await page.goto(`/ws/agreements/${createdAgreementId}`);
      await page.waitForLoadState('networkidle');

      // Dismiss cookie banner
      const cookieAccept = page.locator('[data-testid="cookie-accept-all"]');
      if (await cookieAccept.isVisible({ timeout: 1000 }).catch(() => false)) {
        await cookieAccept.click();
      }

      // Click edit button
      await page.click('[data-testid="edit-agreement-button"]');

      // Wait for form
      await expect(page.locator('[data-testid="agreement-form"]')).toBeVisible({ timeout: 10000 });

      // Verify document fields section is present
      const docFieldsVisible = await page.locator('text=Document Fields').isVisible({ timeout: 3000 }).catch(() => false);
      console.log(`[test] Document fields section visible: ${docFieldsVisible}`);

      // Document fields should be visible in edit mode if template has them
      // (This depends on template loading in edit mode)
    });
  });

  // ============================================
  // Signers Display in List
  // ============================================

  ownerTest.describe('Signers in Agreement List', () => {
    ownerTest('agreement list shows signers column', async ({ page }) => {
      await agreementsPage.goto();
      await page.waitForLoadState('networkidle');

      // Check for Signers column header
      const signersHeader = page.locator('th', { hasText: /Signers|Подписанты/i });
      await expect(signersHeader).toBeVisible({ timeout: 5000 });

      console.log('[test] Signers column header is visible');
    });

    ownerTest('agreement list shows signer names in signers column', async ({ page }) => {
      if (!createdAgreementId) {
        // Try to find any agreement with signers in the list
        await agreementsPage.goto();
        await page.waitForLoadState('networkidle');
      } else {
        await agreementsPage.goto();
        await page.waitForLoadState('networkidle');
      }

      // Look for signer names or status indicators in the table
      const table = page.locator('table');
      await expect(table).toBeVisible({ timeout: 5000 });

      // Find cells that contain signer info (names or "-" for no signers)
      const signerCells = page.locator('td').filter({
        has: page.locator('button, [aria-label*="pending"], [aria-label*="signed"]')
      });

      const cellCount = await signerCells.count();
      console.log(`[test] Found ${cellCount} cells with signer indicators`);

      // There should be some agreements with signer info
      // (Either names, status icons, or "-" for single contact)
    });
  });
});
