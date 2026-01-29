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
    const submitButton = this.page.locator(this.selectors.form.submit);
    await submitButton.scrollIntoViewIfNeeded();
    await submitButton.click({ force: true });
    // Wait for redirect to agreement view page (longer timeout for parallel tests)
    await this.page.waitForURL(/\/agreements\/[a-f0-9]+/, { timeout: 45000 });
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
    try {
      // First check for error
      const error = await this.getPdfError();
      if (error) {
        console.log(`[waitForPdfToLoad] PDF error: ${error}`);
        return false;
      }

      // Wait for canvas
      const canvas = this.page.locator('[data-testid="document-preview"] canvas');
      await canvas.waitFor({ state: 'visible', timeout: 15000 });

      // Verify canvas has content
      const rendered = await this.isPdfRendered();
      console.log(`[waitForPdfToLoad] PDF rendered: ${rendered}`);
      return rendered;
    } catch (e) {
      console.log(`[waitForPdfToLoad] Failed: ${e}`);
      return false;
    }
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
  // Screenshot helpers
  // ============================================

  async takeScreenshot(name: string): Promise<void> {
    await this.page.screenshot({ path: `test-results/${name}.png`, fullPage: false });
  }
}
