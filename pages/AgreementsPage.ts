/**
 * Agreements Page Object
 *
 * Handles agreement creation, viewing, and management.
 */

import { Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';
import { Selectors } from './selectors';

export interface SignatoryData {
  roleId?: string;
  roleName?: string;
  contactName: string;
}

export interface AgreementData {
  templateName?: string;
  title?: string;
  type?: string;
  status?: string;
  signatories?: SignatoryData[];
  contactName?: string; // For single-signer fallback
}

export class AgreementsPage extends BasePage {
  readonly path = '/ws/agreements';

  private get selectors() {
    return Selectors.agreements;
  }

  // ============================================
  // Navigation
  // ============================================

  async waitForPageLoad(): Promise<void> {
    await super.waitForPageLoad();
    await this.page.locator('h1').first().waitFor({ state: 'visible', timeout: 10000 });
  }

  // ============================================
  // Agreement CRUD
  // ============================================

  async openCreateForm(): Promise<void> {
    await this.page.locator(this.selectors.createButton).click();
    // Wait for form to appear
    await this.page.locator('[data-testid="agreement-form"]').waitFor({ state: 'visible', timeout: 10000 });
    // Wait for templates to load (either loading indicator disappears or select appears)
    const loadingIndicator = this.page.locator('[data-testid="templates-loading"]');
    const templateSelect = this.page.locator(this.selectors.form.templateSelect);
    // Wait for loading to finish - either loading indicator is gone or template select is visible
    await Promise.race([
      loadingIndicator.waitFor({ state: 'hidden', timeout: 15000 }).catch(() => {}),
      templateSelect.waitFor({ state: 'visible', timeout: 15000 }),
    ]);
    await this.wait(500);
  }

  async create(data: AgreementData): Promise<string | null> {
    await this.openCreateForm();

    // Select template if provided
    if (data.templateName) {
      await this.selectTemplate(data.templateName);
    }

    // Fill title - either provided or ensure one exists
    const titleInput = this.page.locator('input[placeholder*="agreement title"], input[placeholder*="Enter agreement"]').first();
    if (data.title) {
      await titleInput.clear();
      await titleInput.fill(data.title);
    } else {
      // Check if title was populated from template
      const currentTitle = await titleInput.inputValue();
      if (!currentTitle || currentTitle.trim() === '') {
        // Fill default title if template didn't provide one
        const defaultTitle = `Agreement from ${data.templateName || 'scratch'} ${Date.now()}`;
        await titleInput.fill(defaultTitle);
        console.log(`[create] Filled default title: "${defaultTitle}"`);
      }
    }

    // Select type if provided
    if (data.type) {
      const typeSelect = this.page.locator(this.selectors.form.typeSelect).first();
      await typeSelect.selectOption(data.type);
    }

    // Select signatories (multi-signer)
    if (data.signatories && data.signatories.length > 0) {
      // Wait for form to fully stabilize after template selection
      await this.wait(2000);

      // Check if multi-signer form is visible (has signer-role elements)
      // Wait up to 5 seconds for the multi-signer form to appear
      console.log(`[create] Waiting for multi-signer form...`);
      await this.page.locator('[data-testid^="signer-role-"]').first().waitFor({ state: 'visible', timeout: 5000 }).catch(() => {
        console.log(`[create] Warning: signer-role elements not found after 5s`);
      });
      const multiSignerForm = await this.page.locator('[data-testid^="signer-role-"]').count();
      console.log(`[create] Multi-signer form detected: ${multiSignerForm > 0}, signers: ${data.signatories.length}`);

      if (multiSignerForm > 0) {
        // Use multi-signer contact selection with 1-indexed order
        for (let i = 0; i < data.signatories.length; i++) {
          const order = i + 1; // routingOrder is 1-indexed
          await this.selectMultiSignerContact(order, data.signatories[i].contactName);
        }
      } else {
        // No multi-signer form - fall back to single contact mode
        // Use first signatory's contact
        console.log(`[create] Multi-signer form not detected, using single contact mode with first signatory`);
        await this.searchAndSelectContact(data.signatories[0].contactName);
      }
    } else if (data.contactName) {
      // Single signer fallback
      await this.searchAndSelectContact(data.contactName);
    }

    // Submit and get agreement ID
    await this.submitForm();

    // Extract agreement ID from URL
    const url = this.page.url();
    const match = url.match(/\/agreements\/([a-f0-9]+)/);
    return match ? match[1] : null;
  }

  async selectTemplate(templateName: string): Promise<void> {
    // Wait for template select to appear (templates are loading)
    console.log(`[selectTemplate] Waiting for template select to appear...`);
    const templateSelect = this.page.locator(this.selectors.form.templateSelect);

    try {
      await templateSelect.waitFor({ state: 'visible', timeout: 15000 });
      console.log(`[selectTemplate] Template select visible`);
    } catch (e) {
      console.log(`[selectTemplate] Template select NOT visible! Taking screenshot...`);
      // Check if template section exists at all
      const templateSection = await this.page.locator('text=Use Template').count();
      console.log(`[selectTemplate] "Use Template" text found: ${templateSection}`);
      const allSelects = await this.page.locator('select').count();
      console.log(`[selectTemplate] Total select elements on page: ${allSelects}`);
      throw e;
    }

    // Wait a bit more for options to load
    await this.wait(2000);

    // Find option that contains the template name
    const options = await templateSelect.locator('option').allTextContents();
    console.log(`[selectTemplate] Looking for "${templateName}"`);
    console.log(`[selectTemplate] Total options: ${options.length}`);
    console.log(`[selectTemplate] All options:`, options);

    const matchingOption = options.find(opt => opt.toLowerCase().includes(templateName.toLowerCase()));
    if (matchingOption) {
      console.log(`[selectTemplate] Found match: "${matchingOption}"`);
      await templateSelect.selectOption({ label: matchingOption });
    } else {
      console.log(`[selectTemplate] No match found, trying exact: "${templateName}"`);
      await templateSelect.selectOption({ label: templateName });
    }

    // Wait for template to be loaded (API call to complete)
    // The form shows "Template applied" message when template is fully loaded
    console.log(`[selectTemplate] Waiting for template API call to complete...`);
    await this.page.locator('text=Template applied').waitFor({ state: 'visible', timeout: 10000 });
    console.log(`[selectTemplate] Template loaded successfully`);
    await this.wait(500);
  }

  async selectSignatoryContact(index: number, contactName: string): Promise<void> {
    // Wait for any overlay to disappear
    await this.page.locator('.fixed.inset-0.z-50').waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {});

    // Find the signatory contact input - could be multi-signer or single contact
    const signatoryInputs = this.page.locator('input[placeholder*="contact"], input[placeholder*="Search contact"]');
    const input = signatoryInputs.nth(index);
    console.log(`[selectSignatoryContact] Selecting contact "${contactName}" for signatory ${index}`);

    // Click to focus and open dropdown
    await input.click();
    await this.wait(300);

    // Type to search
    await input.fill('');
    await input.pressSequentially(contactName, { delay: 30 });
    console.log(`[selectSignatoryContact] Typed contact name, waiting for dropdown...`);

    // Wait for dropdown container with results
    const dropdown = this.page.locator('.absolute.z-10 button, div[class*="absolute"] button').filter({ hasText: contactName }).first();
    await dropdown.waitFor({ state: 'visible', timeout: 10000 });
    console.log(`[selectSignatoryContact] Dropdown option visible`);

    // Log dropdown structure for debugging
    const dropdownButtons = await this.page.locator('.absolute.z-10 button').allTextContents();
    console.log(`[selectSignatoryContact] Dropdown options:`, dropdownButtons.slice(0, 5));

    // Click directly without waiting - use page.click to handle event properly
    const buttonSelector = `.absolute.z-10 button:has-text("${contactName}")`;
    await this.page.click(buttonSelector, { timeout: 5000 });
    console.log(`[selectSignatoryContact] Clicked dropdown option`);
    await this.wait(500);

    // Verify contact was selected
    const searchInputVisible = await input.isVisible().catch(() => false);
    console.log(`[selectSignatoryContact] Search input still visible: ${searchInputVisible}`);
  }

  async searchAndSelectContact(contactName: string): Promise<void> {
    const searchInput = this.page.locator(this.selectors.form.contactSearch).first();

    // Click to focus
    await searchInput.click();
    await this.wait(300);

    // Type to search
    await searchInput.fill('');
    await searchInput.pressSequentially(contactName, { delay: 30 });
    console.log(`[searchAndSelectContact] Typed "${contactName}", waiting for dropdown...`);

    // Wait for dropdown container with results
    const dropdown = this.page.locator('.absolute.z-10 button').filter({ hasText: contactName }).first();
    await dropdown.waitFor({ state: 'visible', timeout: 10000 });
    console.log(`[searchAndSelectContact] Dropdown option visible`);

    // Click directly with page.click
    const buttonSelector = `.absolute.z-10 button:has-text("${contactName}")`;
    await this.page.click(buttonSelector, { timeout: 5000 });
    console.log(`[searchAndSelectContact] Clicked dropdown option`);
    await this.wait(500);
  }

  async submitForm(): Promise<void> {
    console.log('[submitForm] Starting form submission...');

    // Check for any validation errors before submitting
    const errorBanner = this.page.locator('.bg-red-50, [role="alert"]').first();
    const hasError = await errorBanner.isVisible({ timeout: 500 }).catch(() => false);
    if (hasError) {
      const errorText = await errorBanner.textContent();
      console.log(`[submitForm] Form has error: ${errorText}`);
    }

    // Find and click submit button
    const submitButton = this.page.locator(this.selectors.form.submit);
    await submitButton.scrollIntoViewIfNeeded();

    // Check if button is enabled
    const isDisabled = await submitButton.isDisabled();
    console.log(`[submitForm] Submit button disabled: ${isDisabled}`);

    await submitButton.click({ force: true });
    console.log('[submitForm] Clicked submit button');

    // Wait a moment for any error messages to appear
    await this.wait(1000);

    // Check for validation errors after submission
    const postSubmitError = await this.page.locator('.bg-red-50, [role="alert"]').first()
      .textContent({ timeout: 2000 })
      .catch(() => null);

    if (postSubmitError) {
      console.log(`[submitForm] Post-submit error: ${postSubmitError}`);
    }

    // Wait for redirect to agreement view page (longer timeout for parallel tests)
    console.log('[submitForm] Waiting for URL redirect...');
    await this.page.waitForURL(/\/agreements\/[a-f0-9]+/, { timeout: 45000 });
    console.log(`[submitForm] Redirected to: ${this.page.url()}`);
    await this.waitForPageLoad();
  }

  // ============================================
  // View Agreement
  // ============================================

  async openAgreement(identifier: string): Promise<void> {
    // If identifier looks like a MongoDB ObjectId, navigate directly
    if (/^[a-f0-9]{24}$/.test(identifier)) {
      await this.page.goto(`/ws/agreements/${identifier}`);
      await this.page.waitForURL(/\/agreements\/[a-f0-9]+/, { timeout: 10000 });
      await this.waitForPageLoad();
      return;
    }

    // Otherwise find in list by text (AGR-xxxx or title)
    const viewButton = this.page.locator(this.selectors.rowViewButton(identifier)).first();
    await viewButton.click();
    await this.page.waitForURL(/\/agreements\/[a-f0-9]+/, { timeout: 10000 });
    await this.waitForPageLoad();
  }

  async getAgreementNumber(): Promise<string> {
    const numberEl = this.page.locator(this.selectors.view.number).first();
    const text = await numberEl.textContent();
    return text?.trim() || '';
  }

  async getAgreementTitle(): Promise<string> {
    const titleEl = this.page.locator(this.selectors.view.title).first();
    const text = await titleEl.textContent();
    return text?.trim() || '';
  }

  // ============================================
  // Field Value Verification
  // ============================================

  async getFilledFieldValue(label: string): Promise<string> {
    // Look for the field label and get its value
    const fieldContainer = this.page.locator(this.selectors.view.filledField(label)).first();
    const text = await fieldContainer.textContent();
    return text?.trim() || '';
  }

  async shouldSeeFilledField(label: string, expectedValue: string): Promise<void> {
    // Find the container that has both the label and value
    const container = this.page.locator(`text=${label}`).first();
    await expect(container).toBeVisible({ timeout: 5000 });

    // Verify the value is present nearby
    const valueEl = this.page.locator(`text=${expectedValue}`).first();
    await expect(valueEl).toBeVisible({ timeout: 5000 });
  }

  async shouldSeeSignerWithFields(signerName: string, fields: { label: string; value: string }[]): Promise<void> {
    // Find the signer section
    const signerSection = this.page.locator(`:has-text("${signerName}")`).first();
    await expect(signerSection).toBeVisible({ timeout: 5000 });

    // Verify each field
    for (const field of fields) {
      await this.shouldSeeFilledField(field.label, field.value);
    }
  }

  // ============================================
  // Actions
  // ============================================

  async clickSendForSignature(): Promise<void> {
    const btn = this.page.locator(this.selectors.view.sendForSignature).first();
    await btn.click();
    await this.wait(500);
  }

  async clickRowEdit(identifier: string): Promise<void> {
    const editBtn = this.page.locator(this.selectors.rowEditButton(identifier)).first();
    await editBtn.click();
    await this.wait(1000);
  }

  async clickRowDelete(identifier: string): Promise<void> {
    const deleteBtn = this.page.locator(this.selectors.rowDeleteButton(identifier)).first();
    await deleteBtn.click();
    await this.wait(500);
  }

  async delete(identifier: string): Promise<void> {
    await this.clickRowDelete(identifier);
    if (await this.isConfirmDialogVisible()) {
      await this.confirmDialog();
    }
  }

  // ============================================
  // Assertions
  // ============================================

  async shouldSeeAgreement(identifier: string): Promise<void> {
    await expect(this.page.getByText(identifier).first()).toBeVisible({ timeout: 10000 });
  }

  async shouldNotSeeAgreement(identifier: string): Promise<void> {
    await expect(this.page.getByText(identifier).first()).not.toBeVisible({ timeout: 5000 });
  }

  async shouldSeeTable(): Promise<boolean> {
    return await this.page.locator(this.selectors.table).first()
      .isVisible({ timeout: 3000 })
      .catch(() => false);
  }

  async shouldSeeEmptyState(): Promise<void> {
    await expect(this.page.locator(this.selectors.emptyState)).toBeVisible({ timeout: 10000 });
  }

  async shouldSeeDocumentPreview(): Promise<boolean> {
    // Check if document preview container is visible
    const container = await this.page.locator(this.selectors.view.documentPreview).first()
      .isVisible({ timeout: 5000 })
      .catch(() => false);
    return container;
  }

  async isPdfRendered(): Promise<boolean> {
    // Check if PDF canvas has been rendered (has non-zero dimensions)
    try {
      const canvas = this.page.locator('[data-testid="document-preview"] canvas');
      await canvas.waitFor({ state: 'visible', timeout: 10000 });
      const box = await canvas.boundingBox();
      // PDF canvas should have reasonable size (at least 200x200)
      return box !== null && box.width > 200 && box.height > 200;
    } catch {
      return false;
    }
  }

  async getPdfError(): Promise<string | null> {
    // Check for PDF error message
    try {
      const errorText = await this.page.locator('text=/Error loading PDF/i').textContent({ timeout: 2000 });
      return errorText;
    } catch {
      return null;
    }
  }

  async waitForPdfToLoad(): Promise<boolean> {
    // Wait for PDF to fully load (canvas visible, no error)
    const maxAttempts = 5;
    const attemptDelay = 3000;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        console.log(`[waitForPdfToLoad] Attempt ${attempt}/${maxAttempts}`);

        // Check for error
        const error = await this.getPdfError();
        if (error) {
          console.log(`[waitForPdfToLoad] PDF error: ${error}`);
          return false;
        }

        // Check if still in loading state
        const loadingText = await this.page.locator('[data-testid="document-preview"]').locator('text=Loading').isVisible({ timeout: 1000 }).catch(() => false);
        if (loadingText) {
          console.log(`[waitForPdfToLoad] Still loading document, waiting...`);
          await this.wait(attemptDelay);
          continue;
        }

        // Check for PDF.js loading state
        const pdfLoadingText = await this.page.locator('text=Loading PDF').isVisible({ timeout: 1000 }).catch(() => false);
        if (pdfLoadingText) {
          console.log(`[waitForPdfToLoad] PDF.js loading, waiting...`);
          await this.wait(attemptDelay);
          continue;
        }

        // Wait for canvas with longer timeout - try multiple selectors
        // The canvas might be inside nested containers
        const canvasSelectors = [
          '[data-testid="document-preview"] canvas',
          '[data-testid="document-preview"] [data-page] canvas',
          '[data-testid="document-preview"] .shadow-lg canvas',
        ];

        let canvas = null;
        let canvasVisible = false;

        for (const selector of canvasSelectors) {
          const canvasElement = this.page.locator(selector).first();
          canvasVisible = await canvasElement.isVisible({ timeout: 2000 }).catch(() => false);
          if (canvasVisible) {
            canvas = canvasElement;
            console.log(`[waitForPdfToLoad] Found canvas with selector: ${selector}`);
            break;
          }
        }

        if (!canvasVisible) {
          console.log(`[waitForPdfToLoad] Canvas not visible yet`);
          // Check DOM structure for debugging
          const pageCount = await this.page.locator('[data-testid="document-preview"] [data-page]').count().catch(() => 0);
          const canvasCount = await this.page.locator('[data-testid="document-preview"] canvas').count().catch(() => 0);
          console.log(`[waitForPdfToLoad] Pages found: ${pageCount}, Canvases found: ${canvasCount}`);

          // Check first canvas dimensions and visibility state
          if (canvasCount > 0) {
            const firstCanvas = this.page.locator('[data-testid="document-preview"] canvas').first();
            const bbox = await firstCanvas.boundingBox().catch(() => null);
            const isAttached = await firstCanvas.isEnabled().catch(() => false);
            console.log(`[waitForPdfToLoad] First canvas - bbox: ${JSON.stringify(bbox)}, attached: ${isAttached}`);

            // Check if canvas might be visible with different method
            const canvasEvaluate = await this.page.evaluate(() => {
              const preview = document.querySelector('[data-testid="document-preview"]');
              const canvases = preview?.querySelectorAll('canvas');
              if (!canvases || canvases.length === 0) return { found: false };
              const first = canvases[0];
              const rect = first.getBoundingClientRect();
              const style = window.getComputedStyle(first);
              return {
                found: true,
                count: canvases.length,
                width: rect.width,
                height: rect.height,
                display: style.display,
                visibility: style.visibility,
                opacity: style.opacity,
                canvasWidth: first.width,
                canvasHeight: first.height,
              };
            }).catch(() => ({ found: false, error: 'evaluate failed' }));
            console.log(`[waitForPdfToLoad] Canvas evaluate: ${JSON.stringify(canvasEvaluate)}`);
          }

          const previewContent = await this.page.locator('[data-testid="document-preview"]').textContent({ timeout: 1000 }).catch(() => 'no content');
          console.log(`[waitForPdfToLoad] Preview content: ${previewContent?.substring(0, 100)}`);
          await this.wait(attemptDelay);
          continue;
        }

        // Canvas is visible, check if rendered with content
        if (canvas) {
          const box = await canvas.boundingBox();
          if (box && box.width > 200 && box.height > 200) {
            console.log(`[waitForPdfToLoad] PDF rendered successfully (${box.width}x${box.height})`);
            return true;
          }

          console.log(`[waitForPdfToLoad] Canvas too small: ${box?.width}x${box?.height}`);
        }
        await this.wait(attemptDelay);
      } catch (e) {
        console.log(`[waitForPdfToLoad] Attempt ${attempt} error: ${e}`);
        if (attempt < maxAttempts) {
          await this.wait(attemptDelay);
        }
      }
    }

    console.log(`[waitForPdfToLoad] Failed after ${maxAttempts} attempts`);
    return false;
  }

  async shouldSeeStatus(status: string): Promise<void> {
    await expect(this.page.getByText(status, { exact: false }).first()).toBeVisible({ timeout: 5000 });
  }

  // ============================================
  // Multi-Signer Contact Selection
  // ============================================

  async selectMultiSignerContact(order: number, contactName: string): Promise<void> {
    console.log(`[selectMultiSignerContact] Selecting "${contactName}" for signer order ${order}`);

    // Find the signer role section
    const signerRole = this.page.locator(this.selectors.form.signerRole(order));
    await signerRole.waitFor({ state: 'visible', timeout: 10000 });

    // Find the contact input within this role
    const contactInput = this.page.locator(this.selectors.form.signerContactInput(order));
    await contactInput.click();
    await this.wait(300);

    // Type to search
    await contactInput.fill('');
    await contactInput.pressSequentially(contactName, { delay: 30 });
    console.log(`[selectMultiSignerContact] Typed "${contactName}", waiting for dropdown...`);

    // Wait for dropdown and click option
    const dropdown = this.page.locator(this.selectors.form.signerContactDropdown(order));
    await dropdown.waitFor({ state: 'visible', timeout: 10000 });

    const option = dropdown.locator(`button:has-text("${contactName}")`).first();
    await option.click();
    console.log(`[selectMultiSignerContact] Selected contact`);
    await this.wait(500);
  }

  // ============================================
  // PDF Page Navigation (Agreement View)
  // Uses numbered page buttons (e.g., [1] [2] [3])
  // ============================================

  async getCurrentPdfPage(): Promise<number> {
    // The current page has bg-zinc-800 class (dark background)
    const activeButton = this.page.locator('button[data-testid^="pdf-page-"]').filter({
      has: this.page.locator('.bg-zinc-800'),
    }).or(this.page.locator('button.bg-zinc-800[data-testid^="pdf-page-"]'));

    // Try to find active button by class
    let activeText = '';
    const buttons = await this.page.locator('button[data-testid^="pdf-page-"]').all();
    for (const btn of buttons) {
      const className = await btn.getAttribute('class');
      if (className?.includes('bg-zinc-800')) {
        activeText = await btn.textContent() || '';
        break;
      }
    }
    return parseInt(activeText) || 1;
  }

  async getTotalPdfPages(): Promise<number> {
    const buttons = await this.page.locator('button[data-testid^="pdf-page-"]').count();
    return buttons;
  }

  async goToPdfPage(pageNumber: number): Promise<void> {
    const pageButton = this.page.locator(`[data-testid="pdf-page-${pageNumber}"]`);
    if (await pageButton.isVisible()) {
      await pageButton.click();
      await this.wait(1000); // Wait for PDF to render
    }
  }

  async goToNextPdfPage(): Promise<void> {
    const currentPage = await this.getCurrentPdfPage();
    const totalPages = await this.getTotalPdfPages();
    if (currentPage < totalPages) {
      await this.goToPdfPage(currentPage + 1);
    }
  }

  async goToPrevPdfPage(): Promise<void> {
    const currentPage = await this.getCurrentPdfPage();
    if (currentPage > 1) {
      await this.goToPdfPage(currentPage - 1);
    }
  }

  // ============================================
  // Field Overlay Verification
  // ============================================

  async getFieldOverlaysCount(): Promise<number> {
    const overlays = await this.page.locator('[data-testid^="field-overlay-"]').count();
    return overlays;
  }

  async getFieldOverlaysByType(fieldType: string): Promise<number> {
    const selector = this.selectors.view.fieldOverlay(fieldType);
    const count = await this.page.locator(selector).count();
    return count;
  }

  async getFieldOverlaysByPage(pageNumber: number): Promise<number> {
    const selector = this.selectors.view.fieldOverlayByPage(pageNumber);
    const count = await this.page.locator(selector).count();
    return count;
  }

  async shouldSeeFieldOverlay(fieldType: string): Promise<boolean> {
    const selector = this.selectors.view.fieldOverlay(fieldType);
    return await this.page.locator(selector).first().isVisible({ timeout: 5000 }).catch(() => false);
  }

  // ============================================
  // Signers Section Verification
  // ============================================

  async shouldSeeSignersSection(): Promise<boolean> {
    return await this.page.locator(this.selectors.view.signersSection).first()
      .isVisible({ timeout: 5000 })
      .catch(() => false);
  }

  async getSignersCount(): Promise<number> {
    const cards = await this.page.locator('[data-testid^="signer-card-"]').count();
    return cards;
  }

  async getSignerName(index: number): Promise<string> {
    const card = this.page.locator(this.selectors.view.signerCard(index));
    const nameEl = card.locator('.font-medium').first();
    const name = await nameEl.textContent();
    return name?.trim() || '';
  }

  // ============================================
  // Signing Link Management
  // ============================================

  async generateSigningLink(signerIndex: number): Promise<{ link: string; code: string }> {
    const getLinkBtn = this.page.locator(this.selectors.view.getSigningLink(signerIndex));
    await getLinkBtn.click();

    // Wait for link to be generated
    await this.wait(3000);

    const signerCard = this.page.locator(this.selectors.view.signerCard(signerIndex));

    // Get the signing URL
    const urlElement = signerCard.locator('.font-mono').first();
    await urlElement.waitFor({ state: 'visible', timeout: 10000 });
    const link = (await urlElement.textContent()) || '';

    // Get the verification code - look for "Verification code: XXXXXX" specifically
    const codeElement = signerCard.locator('text=/Verification code:\\s*\\d{6}/i');
    const codeText = await codeElement.textContent().catch(() => '');
    const code = codeText?.match(/\d{6}/)?.[0] || '';

    console.log(`[generateSigningLink] Generated link for signer ${signerIndex}: ${link.substring(0, 50)}...`);
    console.log(`[generateSigningLink] Verification code: ${code}`);

    return { link, code };
  }

  async regenerateSigningLink(signerIndex: number): Promise<{ link: string; code: string }> {
    const regenerateBtn = this.page.locator(this.selectors.view.regenerateSigningLink(signerIndex));
    await regenerateBtn.click();

    // Wait for new link to be generated
    await this.wait(3000);

    const signerCard = this.page.locator(this.selectors.view.signerCard(signerIndex));

    // Get the new signing URL
    const urlElement = signerCard.locator('.font-mono').first();
    const link = (await urlElement.textContent()) || '';

    // Get the new verification code - look for "Verification code: XXXXXX" specifically
    const codeElement = signerCard.locator('text=/Verification code:\\s*\\d{6}/i');
    const codeText = await codeElement.textContent().catch(() => '');
    const code = codeText?.match(/\d{6}/)?.[0] || '';

    console.log(`[regenerateSigningLink] Regenerated link for signer ${signerIndex}`);
    console.log(`[regenerateSigningLink] New verification code: ${code}`);

    return { link, code };
  }

  async getSigningLinkInfo(signerIndex: number): Promise<{ link: string; code: string } | null> {
    const signerCard = this.page.locator(this.selectors.view.signerCard(signerIndex));

    // Check if link is already generated
    const urlElement = signerCard.locator('.font-mono').first();
    const hasLink = await urlElement.isVisible({ timeout: 1000 }).catch(() => false);

    if (!hasLink) {
      return null;
    }

    const link = (await urlElement.textContent()) || '';

    // Get the verification code - look for "Verification code: XXXXXX" specifically
    const codeElement = signerCard.locator('text=/Verification code:\\s*\\d{6}/i');
    const codeText = await codeElement.textContent().catch(() => '');
    const code = codeText?.match(/\d{6}/)?.[0] || '';

    return { link, code };
  }

  async getSignerStatus(signerIndex: number): Promise<string> {
    const signerCard = this.page.locator(this.selectors.view.signerCard(signerIndex));
    const statusBadge = signerCard.locator('text=/Pending|Sent|Viewed|Signed|Declined|Awaiting/i').first();

    const status = await statusBadge.textContent({ timeout: 5000 }).catch(() => '');
    return status?.trim() || '';
  }

  // ============================================
  // Screenshot helpers
  // ============================================

  async takeScreenshot(name: string): Promise<void> {
    await this.page.screenshot({ path: `test-results/${name}.png`, fullPage: false });
  }
}
