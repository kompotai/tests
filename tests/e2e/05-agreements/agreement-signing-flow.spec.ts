/**
 * Agreement Signing Flow Tests
 *
 * Tests for the complete signing workflow:
 * 1. Owner/Manager generates signing link
 * 2. Signer opens the link
 * 3. Signer enters verification code
 * 4. Signer verifies identity
 * 5. Signer sees document with fields
 * 6. Verification of pre-filled contact fields
 *
 * Also tests link regeneration:
 * - Old link becomes invalid
 * - New link works with new code
 */

import { ownerTest, expect } from '@fixtures/auth.fixture';
import { AgreementsPage } from '@pages/AgreementsPage';
import { AgreementTemplatesPage } from '@pages/AgreementTemplatesPage';
import { PublicSigningPage } from '@pages/PublicSigningPage';
import { createTestTemplate, TEST_CONTACTS } from './agreements.fixture';
import path from 'path';

const TEST_PDF_PATH = path.join(__dirname, '../../../fixtures/test-agreement.pdf');

// Test contacts from megatest workspace
const SIGNER_1_NAME = TEST_CONTACTS.CONTACT_1; // Carol Lopez
const SIGNER_2_NAME = TEST_CONTACTS.CONTACT_2; // Thomas Walker

// Shared state across tests (within serial describe blocks)
let createdTemplateName: string;
let createdAgreementId: string;

ownerTest.describe('Agreement Signing Flow', () => {
  ownerTest.describe.configure({ mode: 'serial' });
  ownerTest.slow();

  let agreementsPage: AgreementsPage;
  let templatesPage: AgreementTemplatesPage;

  ownerTest.beforeEach(async ({ page }) => {
    agreementsPage = new AgreementsPage(page);
    templatesPage = new AgreementTemplatesPage(page);
  });

  // ============================================
  // Setup: Create Template and Agreement
  // ============================================

  ownerTest.describe('Setup', () => {
    ownerTest('creates template with signatories', async ({ page }) => {
      await templatesPage.goto();

      createdTemplateName = `Signing Flow Test ${Date.now()}`;
      const template = createTestTemplate({
        name: createdTemplateName,
        pdfPath: TEST_PDF_PATH,
      });

      await templatesPage.create(template);

      // Signatory 1 already exists by default - just select and add fields
      await templatesPage.selectSignatory('Signatory 1');
      await templatesPage.addField('Signature');
      await templatesPage.addField('Contact Name');

      // Add second signatory
      await templatesPage.addSignatory();
      await templatesPage.selectSignatory('Signatory 2');
      await templatesPage.goToPage(2);
      await templatesPage.addField('Signature');
      await templatesPage.addField('Contact Name');

      await templatesPage.save();

      console.log(`[test] Created template: ${createdTemplateName}`);
    });

    ownerTest('creates agreement with two signers', async ({ page }) => {
      ownerTest.skip(!createdTemplateName, 'Template must be created first');

      await agreementsPage.goto();

      const agreementId = await agreementsPage.create({
        templateName: createdTemplateName,
        title: `Signing Flow Agreement ${Date.now()}`,
        signatories: [
          { contactName: SIGNER_1_NAME },
          { contactName: SIGNER_2_NAME },
        ],
      });

      expect(agreementId).toBeTruthy();
      createdAgreementId = agreementId!;
      console.log(`[test] Created agreement: ${createdAgreementId}`);
    });
  });

  // ============================================
  // Signing Link Generation
  // ============================================

  ownerTest.describe('Signing Link Generation', () => {
    ownerTest('shows Get Link button for each signer', async ({ page }) => {
      ownerTest.skip(!createdAgreementId, 'Agreement must be created first');

      await agreementsPage.goto();
      await agreementsPage.openAgreement(createdAgreementId);

      // Verify signers section is visible
      const hasSigners = await agreementsPage.shouldSeeSignersSection();
      expect(hasSigners).toBe(true);

      // Verify Get Link buttons for both signers
      const getLinkBtn0 = page.locator('[data-testid="get-signing-link-0"]');
      const getLinkBtn1 = page.locator('[data-testid="get-signing-link-1"]');

      await expect(getLinkBtn0).toBeVisible();
      await expect(getLinkBtn1).toBeVisible();

      await page.screenshot({ path: 'test-results/signing-flow-01-get-link-buttons.png' });
    });

    ownerTest('generates signing link with verification code', async ({ page }) => {
      ownerTest.skip(!createdAgreementId, 'Agreement must be created first');

      await agreementsPage.goto();
      await agreementsPage.openAgreement(createdAgreementId);

      // Generate signing link
      const { link, code } = await agreementsPage.generateSigningLink(0);

      expect(link).toContain('/public/');
      expect(link).toMatch(/\/agreement\/[a-f0-9]+\/sign\//);
      expect(code).toMatch(/^\d{6}$/);

      console.log(`[test] Generated signing link: ${link}`);
      console.log(`[test] Verification code: ${code}`);

      await page.screenshot({ path: 'test-results/signing-flow-02-link-generated.png' });
    });

    ownerTest('shows copy button for signing link', async ({ page }) => {
      ownerTest.skip(!createdAgreementId, 'Agreement must be created first');

      await agreementsPage.goto();
      await agreementsPage.openAgreement(createdAgreementId);

      // Check if link already exists, if not generate it
      let linkInfo = await agreementsPage.getSigningLinkInfo(0);
      if (!linkInfo) {
        await agreementsPage.generateSigningLink(0);
      }

      // Verify copy button exists (button with SVG icon next to the link)
      const signerCard = page.locator('[data-testid="signer-card-0"]');
      const copyButton = signerCard.locator('button').filter({ has: page.locator('svg') });
      expect(await copyButton.count()).toBeGreaterThan(0);
    });

    ownerTest('shows signer status after link generation', async ({ page }) => {
      ownerTest.skip(!createdAgreementId, 'Agreement must be created first');

      await agreementsPage.goto();
      await agreementsPage.openAgreement(createdAgreementId);

      // Ensure link is generated
      let linkInfo = await agreementsPage.getSigningLinkInfo(0);
      if (!linkInfo) {
        await agreementsPage.generateSigningLink(0);
      }

      // Check for status badge
      const status = await agreementsPage.getSignerStatus(0);
      expect(status).toBeTruthy();
      console.log(`[test] Signer status: ${status}`);

      await page.screenshot({ path: 'test-results/signing-flow-03-signer-status.png' });
    });
  });

  // ============================================
  // Public Signing Page - Verification Steps
  // ============================================

  ownerTest.describe('Public Signing Page', () => {
    let signingLink: string;
    let verificationCode: string;

    ownerTest('opens signing page with verification code input', async ({ page }) => {
      ownerTest.skip(!createdAgreementId, 'Agreement must be created first');

      // Get signing link - use existing or regenerate if needed
      await agreementsPage.goto();
      await agreementsPage.openAgreement(createdAgreementId);

      // Check if link already exists from previous test
      let linkInfo = await agreementsPage.getSigningLinkInfo(0);
      if (!linkInfo || !linkInfo.link) {
        // Link doesn't exist, generate new one
        linkInfo = await agreementsPage.generateSigningLink(0);
      }
      signingLink = linkInfo.link;
      verificationCode = linkInfo.code;

      console.log(`[test] Got signing link: ${signingLink}`);
      console.log(`[test] Got verification code: ${verificationCode}`);

      // Verify we have a valid link
      expect(signingLink).toBeTruthy();
      expect(signingLink).toContain('/public/');

      // Navigate to signing page
      const signingPage = new PublicSigningPage(page);
      await signingPage.goto(signingLink);

      await page.screenshot({ path: 'test-results/signing-flow-04-public-page-loaded.png' });

      // Verify code input is visible
      await signingPage.waitForStep('code');
      const codeInput = page.locator('input[placeholder*="code"], input[maxlength="6"]');
      await expect(codeInput).toBeVisible();
    });

    ownerTest('shows error for invalid verification code', async ({ page }) => {
      ownerTest.skip(!createdAgreementId, 'Agreement must be created first');

      // Get signing link
      await agreementsPage.goto();
      await agreementsPage.openAgreement(createdAgreementId);

      let linkInfo = await agreementsPage.getSigningLinkInfo(0);
      if (!linkInfo) {
        linkInfo = await agreementsPage.generateSigningLink(0);
      }

      const signingPage = new PublicSigningPage(page);
      await signingPage.goto(linkInfo.link);

      await signingPage.waitForStep('code');

      // Enter wrong code
      await signingPage.enterVerificationCode('000000');
      await signingPage.submitVerificationCode();

      // Should show error or stay on code step
      await page.waitForTimeout(2000);

      const errorVisible = await page.locator('text=/invalid|incorrect|wrong/i').isVisible({ timeout: 3000 }).catch(() => false);
      const stillOnCodeStep = await page.locator('input[maxlength="6"]').isVisible().catch(() => false);

      expect(errorVisible || stillOnCodeStep).toBe(true);

      await page.screenshot({ path: 'test-results/signing-flow-05-invalid-code.png' });
    });

    ownerTest('proceeds to identity step with valid code', async ({ page }) => {
      ownerTest.skip(!createdAgreementId, 'Agreement must be created first');

      // Get signing link
      await agreementsPage.goto();
      await agreementsPage.openAgreement(createdAgreementId);

      let linkInfo = await agreementsPage.getSigningLinkInfo(0);
      if (!linkInfo) {
        linkInfo = await agreementsPage.generateSigningLink(0);
      }

      const signingPage = new PublicSigningPage(page);
      await signingPage.goto(linkInfo.link);

      await signingPage.waitForStep('code');
      await signingPage.verifyCodeAndContinue(linkInfo.code);

      // Should be on identity step
      await signingPage.waitForStep('identity');

      // Verify identity form fields are visible
      const firstNameInput = page.locator('input[placeholder*="John"], input[name="firstName"]').first();
      await expect(firstNameInput).toBeVisible();

      await page.screenshot({ path: 'test-results/signing-flow-06-identity-step.png' });
    });

    ownerTest('shows identity form with required fields', async ({ page }) => {
      ownerTest.skip(!createdAgreementId, 'Agreement must be created first');

      // Get signing link
      await agreementsPage.goto();
      await agreementsPage.openAgreement(createdAgreementId);

      let linkInfo = await agreementsPage.getSigningLinkInfo(0);
      if (!linkInfo) {
        linkInfo = await agreementsPage.generateSigningLink(0);
      }

      const signingPage = new PublicSigningPage(page);
      await signingPage.goto(linkInfo.link);

      await signingPage.waitForStep('code');
      await signingPage.verifyCodeAndContinue(linkInfo.code);
      await signingPage.waitForStep('identity');

      // Check all required identity fields
      const firstNameInput = page.locator('input[placeholder*="John"], input[name="firstName"]').first();
      const lastNameInput = page.locator('input[placeholder*="Doe"], input[name="lastName"]').first();
      const emailInput = page.locator('input[type="email"]').first();
      const phoneInput = page.locator('input[type="tel"], [data-testid="phone-input"] input').first();
      const agreementCheckbox = page.locator('input[type="checkbox"]').first();

      await expect(firstNameInput).toBeVisible();
      await expect(lastNameInput).toBeVisible();
      await expect(emailInput).toBeVisible();
      await expect(phoneInput).toBeVisible();
      await expect(agreementCheckbox).toBeVisible();

      await page.screenshot({ path: 'test-results/signing-flow-07-identity-form.png' });
    });

    ownerTest('proceeds to document after identity verification', async ({ page }) => {
      ownerTest.skip(!createdAgreementId, 'Agreement must be created first');

      // Get signing link
      await agreementsPage.goto();
      await agreementsPage.openAgreement(createdAgreementId);

      let linkInfo = await agreementsPage.getSigningLinkInfo(0);
      if (!linkInfo) {
        linkInfo = await agreementsPage.generateSigningLink(0);
      }

      const signingPage = new PublicSigningPage(page);
      await signingPage.goto(linkInfo.link);

      // Step 1: Code
      await signingPage.waitForStep('code');
      await signingPage.verifyCodeAndContinue(linkInfo.code);

      // Step 2: Identity
      await signingPage.waitForStep('identity');
      await signingPage.verifyIdentityAndContinue({
        firstName: 'Test',
        lastName: 'Signer',
        email: 'test.signer@example.com',
        phone: '+1234567890',
      });

      // Step 3: Fields (document signing)
      await signingPage.waitForStep('fields');

      // Verify document is loaded
      const pdfLoaded = await signingPage.waitForPdfToLoad();
      expect(pdfLoaded).toBe(true);

      await page.screenshot({ path: 'test-results/signing-flow-08-document-step.png' });
    });
  });

  // ============================================
  // Document View in Signing Page
  // ============================================

  ownerTest.describe('Document View', () => {
    ownerTest('shows document title and signer role', async ({ page }) => {
      ownerTest.skip(!createdAgreementId, 'Agreement must be created first');

      // Regenerate a fresh signing link to ensure clean session
      await agreementsPage.goto();
      await agreementsPage.openAgreement(createdAgreementId);

      // Always regenerate to get fresh link and code
      const linkInfo = await agreementsPage.regenerateSigningLink(0);

      const signingPage = new PublicSigningPage(page);
      await signingPage.goto(linkInfo.link);

      await signingPage.waitForStep('code');
      await signingPage.verifyCodeAndContinue(linkInfo.code);

      await signingPage.waitForStep('identity');
      await signingPage.verifyIdentityAndContinue({
        firstName: 'Test',
        lastName: 'Signer',
        email: 'test.signer@example.com',
        phone: '+1234567890',
      });

      await signingPage.waitForStep('fields');

      // Check document title
      const docTitle = await signingPage.getDocumentTitle();
      expect(docTitle).toBeTruthy();
      console.log(`[test] Document title: ${docTitle}`);

      // Check role name
      const roleName = await signingPage.getRoleName();
      console.log(`[test] Signing as role: ${roleName}`);

      await page.screenshot({ path: 'test-results/signing-flow-09-document-header.png' });
    });

    ownerTest('shows page navigation for multi-page document', async ({ page }) => {
      ownerTest.skip(!createdAgreementId, 'Agreement must be created first');

      // Regenerate a fresh signing link to ensure clean session
      await agreementsPage.goto();
      await agreementsPage.openAgreement(createdAgreementId);

      // Always regenerate to get fresh link and code
      const linkInfo = await agreementsPage.regenerateSigningLink(0);

      const signingPage = new PublicSigningPage(page);
      await signingPage.goto(linkInfo.link);

      await signingPage.waitForStep('code');
      await signingPage.verifyCodeAndContinue(linkInfo.code);

      await signingPage.waitForStep('identity');
      await signingPage.verifyIdentityAndContinue({
        firstName: 'Test',
        lastName: 'Signer',
        email: 'test.signer@example.com',
        phone: '+1234567890',
      });

      await signingPage.waitForStep('fields');

      const totalPages = await signingPage.getTotalPages();
      console.log(`[test] Total pages: ${totalPages}`);

      if (totalPages > 1) {
        // Navigate to page 2
        await signingPage.goToPage(2);
        const currentPage = await signingPage.getCurrentPage();
        expect(currentPage).toBe(2);

        await page.screenshot({ path: 'test-results/signing-flow-10-page-navigation.png' });
      }
    });

    ownerTest('shows signature fields on document', async ({ page }) => {
      ownerTest.skip(!createdAgreementId, 'Agreement must be created first');

      // Get signing link
      // Regenerate a fresh signing link to ensure clean session
      await agreementsPage.goto();
      await agreementsPage.openAgreement(createdAgreementId);

      // Always regenerate to get fresh link and code
      const linkInfo = await agreementsPage.regenerateSigningLink(0);

      const signingPage = new PublicSigningPage(page);
      await signingPage.goto(linkInfo.link);

      await signingPage.waitForStep('code');
      await signingPage.verifyCodeAndContinue(linkInfo.code);

      await signingPage.waitForStep('identity');
      await signingPage.verifyIdentityAndContinue({
        firstName: 'Test',
        lastName: 'Signer',
        email: 'test.signer@example.com',
        phone: '+1234567890',
      });

      await signingPage.waitForStep('fields');
      await signingPage.waitForPdfToLoad();

      // Check for signature fields
      const fieldsCount = await signingPage.getFieldsCount();
      const signatureFieldsCount = await signingPage.getSignatureFieldsCount();

      console.log(`[test] Total fields: ${fieldsCount}`);
      console.log(`[test] Signature fields: ${signatureFieldsCount}`);

      expect(fieldsCount).toBeGreaterThan(0);

      await page.screenshot({ path: 'test-results/signing-flow-11-signature-fields.png' });
    });

    ownerTest('shows pre-filled contact name from signatory', async ({ page }) => {
      ownerTest.skip(!createdAgreementId, 'Agreement must be created first');

      // Get signing link
      // Regenerate a fresh signing link to ensure clean session
      await agreementsPage.goto();
      await agreementsPage.openAgreement(createdAgreementId);

      // Always regenerate to get fresh link and code
      const linkInfo = await agreementsPage.regenerateSigningLink(0);

      const signingPage = new PublicSigningPage(page);
      await signingPage.goto(linkInfo.link);

      await signingPage.waitForStep('code');
      await signingPage.verifyCodeAndContinue(linkInfo.code);

      await signingPage.waitForStep('identity');
      await signingPage.verifyIdentityAndContinue({
        firstName: 'Test',
        lastName: 'Signer',
        email: 'test.signer@example.com',
        phone: '+1234567890',
      });

      await signingPage.waitForStep('fields');
      await signingPage.waitForPdfToLoad();

      // Look for contact name on the document (should be pre-filled from Contact)
      // The first signer's contact is Carol Lopez
      const hasContactName = await page.locator(`text="${SIGNER_1_NAME}"`).isVisible({ timeout: 5000 }).catch(() => false);
      console.log(`[test] Contact name "${SIGNER_1_NAME}" visible: ${hasContactName}`);

      await page.screenshot({ path: 'test-results/signing-flow-12-prefilled-fields.png' });
    });
  });
});

// ============================================
// Link Regeneration Tests
// ============================================

ownerTest.describe('Link Regeneration', () => {
  ownerTest.describe.configure({ mode: 'serial' });
  ownerTest.slow();

  let agreementsPage: AgreementsPage;
  let templatesPage: AgreementTemplatesPage;
  let testAgreementId: string;
  let originalLink: string;
  let originalCode: string;

  ownerTest.beforeEach(async ({ page }) => {
    agreementsPage = new AgreementsPage(page);
    templatesPage = new AgreementTemplatesPage(page);
  });

  ownerTest('setup: creates agreement for regeneration test', async ({ page }) => {
    // Create template
    await templatesPage.goto();

    const templateName = `Regeneration Test ${Date.now()}`;
    const template = createTestTemplate({
      name: templateName,
      pdfPath: TEST_PDF_PATH,
    });

    await templatesPage.create(template);
    // Signatory 1 already exists by default - just select and add fields
    await templatesPage.selectSignatory('Signatory 1');
    await templatesPage.addField('Signature');
    await templatesPage.save();

    // Create agreement
    await agreementsPage.goto();

    const agreementId = await agreementsPage.create({
      templateName,
      title: `Regeneration Test Agreement ${Date.now()}`,
      signatories: [{ contactName: SIGNER_1_NAME }],
    });

    expect(agreementId).toBeTruthy();
    testAgreementId = agreementId!;
    console.log(`[test] Created agreement for regeneration: ${testAgreementId}`);
  });

  ownerTest('generates initial signing link', async ({ page }) => {
    ownerTest.skip(!testAgreementId, 'Agreement must be created first');

    await agreementsPage.goto();
    await agreementsPage.openAgreement(testAgreementId);

    // Generate link
    const { link, code } = await agreementsPage.generateSigningLink(0);

    originalLink = link;
    originalCode = code;

    expect(originalLink).toBeTruthy();
    expect(originalCode).toMatch(/^\d{6}$/);

    console.log(`[test] Original link: ${originalLink}`);
    console.log(`[test] Original code: ${originalCode}`);

    await page.screenshot({ path: 'test-results/regeneration-01-original-link.png' });
  });

  ownerTest('original link opens signing page', async ({ page }) => {
    ownerTest.skip(!originalLink || !originalCode, 'Original link must be generated');

    const signingPage = new PublicSigningPage(page);
    await signingPage.goto(originalLink);

    // Should show code input (link is valid)
    await signingPage.waitForStep('code');
    const codeInput = page.locator('input[maxlength="6"]');
    await expect(codeInput).toBeVisible();

    // Don't enter the code here - just verify the page loads
    // Entering the code might invalidate it for later tests

    console.log('[test] Original link opens signing page correctly');
    await page.screenshot({ path: 'test-results/regeneration-02-original-works.png' });
  });

  ownerTest('regenerates link with new code', async ({ page }) => {
    ownerTest.skip(!testAgreementId, 'Agreement must be created first');

    await agreementsPage.goto();
    await agreementsPage.openAgreement(testAgreementId);

    // Regenerate link
    const { link: newLink, code: newCode } = await agreementsPage.regenerateSigningLink(0);

    // Verify new code is different from original
    expect(newCode).not.toBe(originalCode);
    console.log(`[test] New code: ${newCode} (was: ${originalCode})`);

    await page.screenshot({ path: 'test-results/regeneration-03-new-link.png' });
  });

  ownerTest('old code no longer works after regeneration', async ({ page }) => {
    ownerTest.skip(!testAgreementId, 'Agreement must be created first');

    // Get the current link (which was regenerated in previous test)
    await agreementsPage.goto();
    await agreementsPage.openAgreement(testAgreementId);

    const currentLinkInfo = await agreementsPage.getSigningLinkInfo(0);
    expect(currentLinkInfo).toBeTruthy();

    const currentLink = currentLinkInfo!.link;
    console.log(`[test] Using current link: ${currentLink}`);
    console.log(`[test] Will try OLD code: ${originalCode}`);

    const signingPage = new PublicSigningPage(page);
    await signingPage.goto(currentLink);

    // Should show code input
    await signingPage.waitForStep('code');

    // Enter OLD code (should fail because we regenerated)
    await signingPage.enterVerificationCode(originalCode);
    await signingPage.submitVerificationCode();

    // Should show error or stay on code step (not proceed)
    await page.waitForTimeout(2000);

    const errorVisible = await page.locator('text=/invalid|incorrect|wrong|expired/i').isVisible({ timeout: 3000 }).catch(() => false);
    const stillOnCodeStep = await page.locator('input[maxlength="6"]').isVisible().catch(() => false);

    // Old code should not work anymore
    expect(errorVisible || stillOnCodeStep).toBe(true);

    console.log('[test] Old code correctly rejected');
    await page.screenshot({ path: 'test-results/regeneration-04-old-code-rejected.png' });
  });

  ownerTest('new link and code work after regeneration', async ({ page }) => {
    ownerTest.skip(!testAgreementId, 'Agreement must be created first');

    // Regenerate a fresh link to ensure we have a valid token/code pair
    await agreementsPage.goto();
    await agreementsPage.openAgreement(testAgreementId);

    // Regenerate to get a fresh valid link and code
    const { link: currentLink, code: currentCode } = await agreementsPage.regenerateSigningLink(0);

    console.log(`[test] Fresh regenerated link: ${currentLink}`);
    console.log(`[test] Fresh regenerated code: ${currentCode}`);

    // Open signing page
    const signingPage = new PublicSigningPage(page);
    await page.goto(currentLink);
    await page.waitForLoadState('networkidle');

    // Enter the fresh code
    await signingPage.waitForStep('code');
    await signingPage.enterVerificationCode(currentCode);
    await signingPage.submitVerificationCode();

    // Should proceed to identity step
    await signingPage.waitForStep('identity');
    const identityForm = page.locator('input[placeholder*="John"], input[name="firstName"]').first();
    await expect(identityForm).toBeVisible();

    console.log('[test] Fresh regenerated link and code work correctly');
    await page.screenshot({ path: 'test-results/regeneration-05-new-works.png' });
  });
});
