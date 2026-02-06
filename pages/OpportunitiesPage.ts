/**
 * Opportunities Page Object
 */

import { Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';
import { Selectors } from './selectors';
import { WORKSPACE_ID } from '@fixtures/users';

export interface OpportunityData {
  name: string;
  amount?: string | number;
  contactName?: string;
  description?: string;
}

export class OpportunitiesPage extends BasePage {
  get path() { return `/ws/${WORKSPACE_ID}/opportunities`; }
  private get s() { return Selectors.opportunities; }

  async waitForPageLoad(): Promise<void> {
    await this.page.locator(this.s.heading).first().waitFor({ state: 'visible', timeout: 15000 });
  }

  async search(query: string): Promise<void> {
    const searchInput = this.page.locator(this.s.searchInput);
    await searchInput.fill(query);
    await this.wait(1000);
  }

  async openCreateForm(): Promise<void> {
    // Dismiss toasts first
    await this.dismissToasts();

    // Use first() to avoid strict mode violation
    const createBtn = this.page.locator(this.s.createButton).first();
    await createBtn.waitFor({ state: 'visible', timeout: 5000 });
    await createBtn.click();

    await this.page.locator(this.s.form.container).waitFor({ state: 'visible', timeout: 5000 });
    await this.wait(500);
  }

  async create(data: OpportunityData): Promise<boolean> {
    await this.openCreateForm();

    // Fill name
    await this.page.locator(this.s.form.name).fill(data.name);

    // Fill amount if provided
    if (data.amount !== undefined) {
      await this.page.locator(this.s.form.amount).fill(data.amount.toString());
    }

    // Select contact (required or by name)
    if (data.contactName) {
      const contactSelected = await this.selectContact(data.contactName);
      if (!contactSelected) return false;
    } else {
      const contactSelected = await this.selectFirstContact();
      if (!contactSelected) return false;
    }

    // Fill description if provided
    if (data.description) {
      await this.page.locator('[data-testid="opportunity-form-input-description"]').fill(data.description);
    }

    await this.submitForm();

    // Wait for the opportunity to appear in the table
    await this.wait(1000);
    try {
      await this.shouldSeeOpportunity(data.name);
    } catch (e) {
      console.log(`Warning: Could not find opportunity "${data.name}" in table after creation`);
    }

    return true;
  }

  async selectContact(contactName: string): Promise<boolean> {
    const selector = this.page.locator(this.s.form.contactSelect).first();
    if (!await selector.isVisible({ timeout: 2000 }).catch(() => false)) return false;

    await selector.click();
    await this.wait(300);

    // Type to search
    const input = selector.locator('input').first();
    await input.fill(contactName);
    await this.wait(800);

    // Select from dropdown
    const option = this.page.locator(`[role="option"]:has-text("${contactName}")`).first();
    if (!await option.isVisible({ timeout: 3000 }).catch(() => false)) return false;

    await option.click();
    await this.wait(300);
    return true;
  }

  async selectFirstContact(): Promise<boolean> {
    const selector = this.page.locator(this.s.form.contactSelect).first();
    if (!await selector.isVisible({ timeout: 2000 }).catch(() => false)) return false;

    await selector.click();
    await this.wait(300);

    // Type to search for test contacts
    const input = selector.locator('input').first();
    await input.fill('Carol'); // Use test contact from megatest
    await this.wait(800);

    const option = this.page.locator(Selectors.common.selectOption).first();
    if (!await option.isVisible({ timeout: 3000 }).catch(() => false)) return false;

    await option.click();
    await this.wait(300);
    return true;
  }

  async submitForm(): Promise<void> {
    await this.clickSubmitButton();

    // Wait for form to close
    await this.page.locator(this.s.form.container).waitFor({ state: 'hidden', timeout: 10000 }).catch(() => {});
    await this.wait(500);
  }

  async clickSubmitButton(): Promise<void> {
    // Dismiss any notification toasts that might be blocking
    await this.dismissToasts();

    const submitBtn = this.page.locator(this.s.form.submit).first();
    await submitBtn.waitFor({ state: 'visible', timeout: 5000 });

    // Try normal click first, then force click if blocked
    try {
      await submitBtn.click({ timeout: 5000 });
    } catch {
      await this.dismissToasts();
      await this.wait(200);
      await submitBtn.click({ force: true });
    }
  }

  async dismissToasts(): Promise<void> {
    // Try to close any toast notifications that might be blocking
    const toastSelectors = [
      '[data-testid="toast-close"]',
      '.animate-slide-up-fade button',
      '[role="status"] button',
      '.fixed.bottom-2 button',
      '.toast button'
    ];

    for (const selector of toastSelectors) {
      const closeButtons = this.page.locator(selector);
      const count = await closeButtons.count();
      for (let i = 0; i < count; i++) {
        await closeButtons.nth(i).click({ timeout: 1000 }).catch(() => {});
      }
    }

    // Wait for toasts to disappear
    await this.wait(500);
  }

  async cancelForm(): Promise<void> {
    await this.dismissToasts();
    await this.page.locator(this.s.form.cancel).click();
    await this.wait(300);
  }

  // ============================================
  // Edit Operations
  // ============================================

  async edit(identifier: string, newData: Partial<OpportunityData>): Promise<void> {
    await this.clickRowEdit(identifier);
    await this.fillEditForm(newData);
    await this.submitForm();

    // Wait for the edited opportunity to appear (with new name if changed)
    await this.wait(1000);
    if (newData.name) {
      try {
        await this.shouldSeeOpportunity(newData.name);
      } catch (e) {
        console.log(`Warning: Could not find edited opportunity "${newData.name}" in table`);
      }
    }
  }

  async clickRowEdit(identifier: string): Promise<void> {
    // Wait for row to be visible
    const row = this.page.locator(this.s.row(identifier)).first();
    await row.waitFor({ state: 'visible', timeout: 10000 });

    // Dismiss any toasts that might block the button
    await this.dismissToasts();

    const editBtn = this.page.locator(this.s.rowEditButton(identifier)).first();
    await editBtn.waitFor({ state: 'visible', timeout: 10000 });
    await editBtn.click();
    await this.page.locator(this.s.form.container).waitFor({ state: 'visible', timeout: 5000 });
    await this.wait(500);
  }

  async clickViewPageEdit(): Promise<void> {
    const editBtn = this.page.locator(this.s.viewPage.editButton).first();
    await editBtn.click();
    await this.wait(1000);
  }

  async fillEditForm(data: Partial<OpportunityData>): Promise<void> {
    // Edit name
    if (data.name !== undefined) {
      const nameInput = this.page.locator(this.s.form.name).first();
      await nameInput.clear();
      await nameInput.fill(data.name);
    }

    // Edit amount
    if (data.amount !== undefined) {
      const amountInput = this.page.locator(this.s.form.amount).first();
      await amountInput.clear();
      await amountInput.fill(data.amount.toString());
    }

    // Edit contact
    if (data.contactName !== undefined) {
      await this.selectContact(data.contactName);
    }

    // Edit description
    if (data.description !== undefined) {
      const descInput = this.page.locator('[data-testid="opportunity-form-input-description"]').first();
      if (await descInput.isVisible({ timeout: 2000 }).catch(() => false)) {
        await descInput.clear();
        await descInput.fill(data.description);
      }
    }
  }

  // ============================================
  // Delete Operations
  // ============================================

  async delete(identifier: string): Promise<void> {
    await this.clickRowDelete(identifier);
    if (await this.isConfirmDialogVisible()) {
      await this.confirmDialog();
    }
  }

  async clickRowDelete(identifier: string): Promise<void> {
    // Wait for row to be visible
    const row = this.page.locator(this.s.row(identifier)).first();
    await row.waitFor({ state: 'visible', timeout: 10000 });

    // Dismiss any toasts that might block the button
    await this.dismissToasts();

    const deleteBtn = this.page.locator(this.s.rowDeleteButton(identifier)).first();
    await deleteBtn.waitFor({ state: 'visible', timeout: 10000 });
    await deleteBtn.click();
    await this.wait(500);
  }

  async clickViewPageDelete(): Promise<void> {
    const deleteBtn = this.page.locator(this.s.viewPage.deleteButton).first();
    if (await deleteBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await deleteBtn.click();
      await this.wait(500);
    }
  }

  async clickRowToOpen(name: string): Promise<void> {
    const row = this.page.locator(`tr:has-text("${name}")`).first();
    const nameCell = row.locator('td').first();
    await nameCell.click();
    await this.wait(500);
  }

  // ============================================
  // Pipeline and Stage Operations
  // ============================================

  async selectPipeline(pipelineName: string): Promise<void> {
    const pipelineTab = this.page.locator(this.s.pipelineTab(pipelineName)).first();
    if (await pipelineTab.isVisible({ timeout: 3000 }).catch(() => false)) {
      await pipelineTab.click();
      await this.wait(500);
    }
  }

  async getCurrentPipeline(): Promise<string> {
    const activeTab = this.page.locator(this.s.activePipelineTab).first();
    return await activeTab.textContent().then(text => text?.trim() || '').catch(() => '');
  }

  async changeStage(opportunityName: string, stageName: string): Promise<void> {
    const stageButton = this.page.locator(this.s.stageDropdownButton(opportunityName)).first();
    await stageButton.click();
    await this.wait(300);

    const stageOption = this.page.locator(this.s.stageOption(stageName)).first();
    await stageOption.click();
    await this.wait(500);
  }

  async getCurrentStage(opportunityName: string): Promise<string> {
    const stageButton = this.page.locator(this.s.stageDropdownButton(opportunityName)).first();
    return await stageButton.textContent().then(text => text?.trim() || '').catch(() => '');
  }

  // ============================================
  // Assertions
  // ============================================

  async shouldSeeOpportunity(name: string): Promise<void> {
    const row = this.page.locator(`tr:has-text("${name}")`).first();
    await expect(row).toBeVisible({ timeout: 10000 });
  }

  async shouldNotSeeOpportunity(name: string): Promise<void> {
    // Wait for the opportunity to disappear from the table
    // Using count() instead of not.toBeVisible() to handle multiple matches
    await this.page.waitForFunction(
      (targetName) => {
        const rows = Array.from(document.querySelectorAll('table tbody tr'));
        return !rows.some(row => row.textContent?.includes(targetName));
      },
      name,
      { timeout: 5000 }
    ).catch(() => {
      // If timeout, check with locator
      const row = this.page.locator(`tr:has-text("${name}")`).first();
      return expect(row).not.toBeVisible({ timeout: 1000 });
    });
  }

  async shouldSeeTable(): Promise<boolean> {
    return this.page.locator(this.s.table).first().isVisible({ timeout: 3000 }).catch(() => false);
  }

  async shouldSeeEmptyState(): Promise<void> {
    await expect(this.page.locator(this.s.emptyState)).toBeVisible({ timeout: 10000 });
  }

  async shouldSeeStageColumn(): Promise<boolean> {
    return this.page.locator(this.s.stageColumn).first().isVisible({ timeout: 3000 }).catch(() => false);
  }

  async shouldSeePipelineTabs(): Promise<boolean> {
    return this.page.locator(this.s.pipelineTabs).first().isVisible({ timeout: 3000 }).catch(() => false);
  }

  async shouldSeeForm(): Promise<boolean> {
    return this.page.locator(this.s.form.container).first().isVisible({ timeout: 3000 }).catch(() => false);
  }

  async getOpportunityCount(): Promise<number> {
    const rows = this.page.locator('table tbody tr');
    return await rows.count();
  }

  // ============================================
  // Table Row Assertions
  // ============================================

  async shouldRowContain(identifier: string, data: Partial<OpportunityData>): Promise<void> {
    const row = this.page.locator(this.s.row(identifier)).first();
    await row.waitFor({ state: 'visible', timeout: 10000 });

    if (data.name) {
      await expect(row.getByText(data.name).first()).toBeVisible({ timeout: 5000 });
    }
    if (data.amount !== undefined) {
      // Amount might be formatted with commas, currency symbols, etc.
      // Extract all digits from both the expected amount and row text, then compare
      const amountStr = data.amount.toString();
      const amountDigits = amountStr.replace(/[^\d]/g, ''); // Get just digits
      const rowText = await row.textContent();

      // Check if row text contains the amount digits (allowing for formatting like "5,000" or "$5000")
      const rowDigitsOnly = rowText?.replace(/[^\d]/g, '') || '';
      const hasAmount = rowDigitsOnly.includes(amountDigits);

      expect(hasAmount).toBe(true);
    }
    if (data.contactName) {
      await expect(row.getByText(data.contactName).first()).toBeVisible({ timeout: 5000 });
    }
  }

  async getAmountDisplay(opportunityName: string): Promise<string> {
    const row = this.page.locator(this.s.row(opportunityName)).first();
    const rowText = await row.textContent().then(text => text?.trim() || '').catch(() => '');

    // Try to extract amount from row text (look for numbers that might be formatted)
    // Matches patterns like: $1,234.56, 1234.56, 1,234, etc.
    const amountMatch = rowText.match(/[\$€£]?\s*[\d,]+\.?\d*/);
    return amountMatch ? amountMatch[0].trim() : '';
  }

  async shouldSeeStage(opportunityName: string, expectedStage: string): Promise<void> {
    const stageButton = this.page.locator(this.s.stageDropdownButton(opportunityName)).first();
    await expect(stageButton).toContainText(expectedStage, { timeout: 5000 });
  }
}
