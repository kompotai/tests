/**
 * Agreement Edit Tests
 *
 * Tests for editing agreements, including:
 * - Changing signatory contacts
 * - Updating agreement details
 */

import { ownerTest, expect } from '@fixtures/auth.fixture';
import { AgreementsPage } from '@pages/AgreementsPage';
import { TEST_CONTACTS } from './agreements.fixture';

// Pattern to match our comprehensive template with multi-signatories
const MULTI_SIGNATORY_TEMPLATE_PATTERN = /Comprehensive Template \d+/;

ownerTest.describe('Agreement Edit', () => {
  ownerTest.describe.configure({ mode: 'serial' });

  let agreementsPage: AgreementsPage;

  // Use existing contacts from megatest workspace
  const originalContact1 = TEST_CONTACTS.CONTACT_1; // Carol Lopez
  const originalContact2 = TEST_CONTACTS.CONTACT_2; // Thomas Walker
  const newContact = TEST_CONTACTS.CONTACT_3; // Nancy Moore

  // Store created agreement ID
  let createdAgreementId: string;

  ownerTest.beforeEach(async ({ page }) => {
    agreementsPage = new AgreementsPage(page);
  });

  ownerTest('creates agreement with two signatories', async ({ page }) => {
    const timestamp = Date.now();
    const title = `Edit Test Agreement ${timestamp}`;

    // Navigate to agreements page first
    await agreementsPage.goto();

    // Create agreement using page object
    const agreementId = await agreementsPage.create({
      templateName: 'Comprehensive Template',
      title,
      signatories: [
        { contactName: originalContact1 },
        { contactName: originalContact2 },
      ],
    });

    expect(agreementId).toBeTruthy();
    createdAgreementId = agreementId!;
    console.log(`[test] Created agreement: ${createdAgreementId}`);

    // Verify signers section shows both contacts
    await expect(page.locator('[data-testid="signers-section"]')).toBeVisible();

    // Verify first contact name appears
    const signerCard0 = page.locator('[data-testid="signer-card-0"]');
    await expect(signerCard0).toContainText(originalContact1);

    // Verify second contact name appears
    const signerCard1 = page.locator('[data-testid="signer-card-1"]');
    await expect(signerCard1).toContainText(originalContact2);
  });

  ownerTest('clicks edit button and navigates to edit page', async ({ page }) => {
    expect(createdAgreementId).toBeTruthy();

    // Navigate to agreement view
    await page.goto(`/ws/agreements/${createdAgreementId}`);
    await page.waitForLoadState('networkidle');

    // Click edit button
    await page.click('[data-testid="edit-agreement-button"]');

    // Wait for edit page
    await page.waitForURL(/\/ws\/agreements\/[a-f0-9]+\/edit/);

    // Verify we're on edit page with form
    await expect(page.locator('form, [data-testid="agreement-form"]')).toBeVisible();

    console.log('[test] Edit page loaded successfully');
  });

  ownerTest('edits agreement title and saves', async ({ page }) => {
    expect(createdAgreementId).toBeTruthy();

    // Navigate to edit page
    await page.goto(`/ws/agreements/${createdAgreementId}/edit`);
    await page.waitForLoadState('networkidle');

    // Wait for form to load
    await expect(page.locator('form')).toBeVisible();

    // Change title
    const updatedTitle = `Updated Agreement ${Date.now()}`;
    const titleInput = page.locator('input').filter({ hasText: '' }).first();

    // Find title input by looking for text input that's not contact search
    const allInputs = page.locator('input[type="text"], input:not([type])');
    const count = await allInputs.count();

    for (let i = 0; i < count; i++) {
      const input = allInputs.nth(i);
      const placeholder = await input.getAttribute('placeholder');
      if (placeholder?.toLowerCase().includes('title') || placeholder?.toLowerCase().includes('agreement')) {
        await input.clear();
        await input.fill(updatedTitle);
        console.log(`[test] Changed title to: ${updatedTitle}`);
        break;
      }
    }

    // Submit form
    await page.click('[data-testid="agreement-form-submit"]');

    // Wait for redirect back to view
    await page.waitForURL(/\/ws\/agreements\/[a-f0-9]+$/);

    // Verify title was updated
    await expect(page.locator('[data-testid="agreement-title"]')).toContainText('Updated Agreement');

    console.log('[test] Agreement title updated successfully');
  });

  ownerTest('verifies signatories are unchanged after edit', async ({ page }) => {
    expect(createdAgreementId).toBeTruthy();

    // Navigate to agreement view
    await page.goto(`/ws/agreements/${createdAgreementId}`);
    await page.waitForLoadState('networkidle');

    // Verify page loaded
    await expect(page.locator('[data-testid="agreement-number"]')).toBeVisible();

    // Check signers section still shows original contacts
    const signersSection = page.locator('[data-testid="signers-section"]');
    await expect(signersSection).toBeVisible();

    // Verify first contact
    const signerCard0 = page.locator('[data-testid="signer-card-0"]');
    await expect(signerCard0).toContainText(originalContact1);

    // Verify second contact
    const signerCard1 = page.locator('[data-testid="signer-card-1"]');
    await expect(signerCard1).toContainText(originalContact2);

    console.log('[test] Signatories unchanged after edit - verified');
  });
});
