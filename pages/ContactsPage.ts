/**
 * Contacts Page Object
 */

import { Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';
import { Selectors } from './selectors';

export interface ContactAddress {
  line1?: string;
  line2?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
}

export interface ContactData {
  name: string;
  // Arrays (can have multiple)
  emails?: string[];
  phones?: string[];
  telegrams?: string[];
  addresses?: ContactAddress[];
  // Simple fields
  company?: string;
  position?: string;
  notes?: string;
  // Select fields (by visible text or value)
  contactType?: string;
  source?: string;
  owner?: string;
}

export class ContactsPage extends BasePage {
  readonly path = '/ws/contacts';

  private get selectors() {
    return Selectors.contacts;
  }

  // ============================================
  // Navigation & View
  // ============================================

  async waitForPageLoad(): Promise<void> {
    await super.waitForPageLoad();
    // Wait for page-specific element (h1 heading or create button)
    await this.page.locator('h1:has-text("Contacts"), [data-testid="contacts-heading"]').first()
      .waitFor({ state: 'visible', timeout: 10000 });
  }

  async search(query: string): Promise<void> {
    const url = `${this.path}?search=${encodeURIComponent(query)}`;
    await this.page.goto(url);
    await this.page.waitForLoadState('networkidle');
    await this.wait(500);
  }

  // ============================================
  // CRUD Operations
  // ============================================

  async openCreateForm(): Promise<void> {
    await this.page.locator(this.selectors.createButton).click();
    await this.wait(500);
  }

  async create(data: ContactData): Promise<void> {
    await this.openCreateForm();
    await this.fillForm(data);
    await this.submitForm();
  }

  async fillForm(data: ContactData): Promise<void> {
    // Required field: name
    await this.page.locator(this.selectors.form.name).fill(data.name);

    // Emails (array)
    if (data.emails && data.emails.length > 0) {
      for (let i = 0; i < data.emails.length; i++) {
        if (i > 0) {
          // Add new email field
          await this.page.locator(this.selectors.form.addEmail).click();
          await this.wait(300);
        }
        const emailField = this.page.locator(this.selectors.form.email(i)).first();
        if (await emailField.isVisible({ timeout: 2000 }).catch(() => false)) {
          await emailField.fill(data.emails[i]);
        }
      }
    }

    // Phones (array)
    if (data.phones && data.phones.length > 0) {
      for (let i = 0; i < data.phones.length; i++) {
        if (i > 0) {
          // Add new phone field
          await this.page.locator(this.selectors.form.addPhone).click();
          await this.wait(300);
        }
        const phoneField = this.page.locator(this.selectors.form.phone(i)).first();
        if (await phoneField.isVisible({ timeout: 2000 }).catch(() => false)) {
          await phoneField.fill(data.phones[i]);
        }
      }
    }

    // Company
    if (data.company) {
      const companyField = this.page.locator(this.selectors.form.company).first();
      if (await companyField.isVisible({ timeout: 2000 }).catch(() => false)) {
        await companyField.fill(data.company);
      }
    }

    // Position
    if (data.position) {
      const positionField = this.page.locator(this.selectors.form.position).first();
      if (await positionField.isVisible({ timeout: 2000 }).catch(() => false)) {
        await positionField.fill(data.position);
      }
    }

    // Notes
    if (data.notes) {
      const notesField = this.page.locator(this.selectors.form.notes).first();
      if (await notesField.isVisible({ timeout: 2000 }).catch(() => false)) {
        await notesField.fill(data.notes);
      }
    }

    // Addresses (array)
    if (data.addresses && data.addresses.length > 0) {
      for (let i = 0; i < data.addresses.length; i++) {
        // Add address block
        await this.page.locator(this.selectors.form.addAddress).click();
        await this.wait(300);

        const addr = data.addresses[i];
        if (addr.line1) {
          await this.page.locator(this.selectors.form.addressLine1(i)).fill(addr.line1);
        }
        if (addr.line2) {
          await this.page.locator(this.selectors.form.addressLine2(i)).fill(addr.line2);
        }
        if (addr.city) {
          await this.page.locator(this.selectors.form.addressCity(i)).fill(addr.city);
        }
        if (addr.state) {
          await this.page.locator(this.selectors.form.addressState(i)).fill(addr.state);
        }
        if (addr.zip) {
          await this.page.locator(this.selectors.form.addressZip(i)).fill(addr.zip);
        }
        if (addr.country) {
          await this.page.locator(this.selectors.form.addressCountry(i)).selectOption(addr.country);
        }
      }
    }

    // Telegrams (array)
    if (data.telegrams && data.telegrams.length > 0) {
      for (let i = 0; i < data.telegrams.length; i++) {
        // Add telegram field
        await this.page.locator(this.selectors.form.addTelegram).click();
        await this.wait(300);
        await this.page.locator(this.selectors.form.telegram(i)).fill(data.telegrams[i]);
      }
    }

    // Contact Type (ColorSelect)
    if (data.contactType) {
      await this.selectColorOption(this.selectors.form.contactType, data.contactType);
    }

    // Source (ColorSelect)
    if (data.source) {
      await this.selectColorOption(this.selectors.form.source, data.source);
    }

    // Owner (ColorSelect)
    if (data.owner) {
      await this.selectColorOption(this.selectors.form.ownerId, data.owner);
    }
  }

  /**
   * Select an option in ColorSelect component by visible text
   */
  private async selectColorOption(selector: string, optionText: string): Promise<void> {
    const selectButton = this.page.locator(selector).first();
    if (await selectButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await selectButton.click();
      await this.wait(200);
      // Click on option with matching text
      await this.page.locator(`[role="option"]:has-text("${optionText}")`).first().click();
      await this.wait(200);
    }
  }

  async submitForm(): Promise<void> {
    await this.page.locator(this.selectors.form.submit).click();
    await this.waitForSpinner();
    await this.wait(1000);
  }

  async edit(identifier: string, newData: Partial<ContactData>): Promise<void> {
    await this.clickRowEdit(identifier);

    if (newData.name) {
      const nameInput = this.page.locator(this.selectors.form.name).first();
      await nameInput.clear();
      await nameInput.fill(newData.name);
    }

    await this.submitForm();

    // Wait for table to refresh - old name should disappear if name was changed
    if (newData.name) {
      await this.page.locator(`text="${identifier}"`).first()
        .waitFor({ state: 'hidden', timeout: 10000 })
        .catch(() => {
          // If element doesn't disappear, wait a bit more for API refresh
          console.log('[edit] Old name still visible, waiting for table refresh...');
        });
      // Additional wait for table to fully update
      await this.wait(500);
    }
  }

  async delete(identifier: string): Promise<void> {
    await this.clickRowDelete(identifier);
    if (await this.isConfirmDialogVisible()) {
      await this.confirmDialog();
    }
  }

  // ============================================
  // Row Actions
  // ============================================

  private getRow(identifier: string) {
    return this.page.locator(this.selectors.row(identifier)).first();
  }

  /**
   * Click on contact name in table to open quick view (side panel)
   */
  async openQuickView(identifier: string): Promise<void> {
    const nameLink = this.page.locator(this.selectors.rowNameLink(identifier)).first();
    await nameLink.click();
    await this.wait(500);
    // Wait for panel to appear
    await this.page.locator(this.selectors.quickViewPanel).first()
      .waitFor({ state: 'visible', timeout: 5000 });
  }

  /**
   * Click eye icon to navigate to full page view
   */
  async openFullPageView(identifier: string): Promise<void> {
    const viewButton = this.page.locator(this.selectors.rowViewButton(identifier)).first();
    await viewButton.click();
    await this.page.waitForURL(/\/contacts\/[a-f0-9]+/, { timeout: 10000 });
    await this.page.waitForLoadState('networkidle');
  }

  async clickRowEdit(identifier: string): Promise<void> {
    const editBtn = this.page.locator(this.selectors.rowEditButton(identifier)).first();
    await editBtn.click();
    await this.wait(1000);
  }

  async clickRowDelete(identifier: string): Promise<void> {
    const deleteBtn = this.page.locator(this.selectors.rowDeleteButton(identifier)).first();

    if (await deleteBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await deleteBtn.click();
      await this.wait(500);
    }
  }

  // ============================================
  // Badge Editing
  // ============================================

  /**
   * Click on type badge in table row and select a new value
   */
  async editTypeBadge(identifier: string, newType: string): Promise<void> {
    // Find badge in row - look for the 4th cell (Type column)
    const row = this.getRow(identifier);
    const typeBadge = row.locator('button').filter({ hasText: /type|тип|no type|нет типа/i }).first();
    await typeBadge.click();
    await this.wait(300);

    // Select option from popover
    const option = this.page.locator(this.selectors.badgeOption(newType)).first();
    await option.click();
    await this.wait(500);
  }

  /**
   * Click on source badge in table row and select a new value
   */
  async editSourceBadge(identifier: string, newSource: string): Promise<void> {
    const row = this.getRow(identifier);
    const sourceBadge = row.locator('button').filter({ hasText: /source|источник|no source|нет источника/i }).first();
    await sourceBadge.click();
    await this.wait(300);

    // Select option from popover
    const option = this.page.locator(this.selectors.badgeOption(newSource)).first();
    await option.click();
    await this.wait(500);
  }

  /**
   * Clear badge value
   */
  async clearBadge(identifier: string, badgeType: 'type' | 'source'): Promise<void> {
    const row = this.getRow(identifier);
    const badge = badgeType === 'type'
      ? row.locator('button').filter({ hasText: /type|тип/i }).first()
      : row.locator('button').filter({ hasText: /source|источник/i }).first();

    await badge.click();
    await this.wait(300);

    const clearBtn = this.page.locator(this.selectors.badgeClear).first();
    if (await clearBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await clearBtn.click();
      await this.wait(500);
    }
  }

  // ============================================
  // Quick View Panel
  // ============================================

  async closeQuickView(): Promise<void> {
    // Click backdrop or press Escape
    await this.page.keyboard.press('Escape');
    await this.wait(300);
  }

  async isQuickViewVisible(): Promise<boolean> {
    return await this.page.locator(this.selectors.quickViewPanel).first()
      .isVisible({ timeout: 2000 })
      .catch(() => false);
  }

  // ============================================
  // Detail Page
  // ============================================

  async getDetailName(): Promise<string> {
    return await this.page.locator(this.selectors.detailName).first()
      .textContent()
      .then(text => text?.trim() || '')
      .catch(() => '');
  }

  async clickDetailEdit(): Promise<void> {
    await this.page.locator(this.selectors.detailEditButton).first().click();
    await this.wait(500);
  }

  // ============================================
  // Assertions
  // ============================================

  async shouldSeeContact(name: string): Promise<void> {
    await expect(this.page.getByText(name).first()).toBeVisible({ timeout: 10000 });
  }

  async shouldNotSeeContact(name: string): Promise<void> {
    await expect(this.page.getByText(name).first()).not.toBeVisible({ timeout: 5000 });
  }

  async shouldSeeEmptyState(): Promise<void> {
    await expect(this.page.locator(this.selectors.emptyState)).toBeVisible({ timeout: 10000 });
  }

  async shouldSeeTable(): Promise<boolean> {
    return await this.page.locator(this.selectors.table).first()
      .isVisible({ timeout: 3000 })
      .catch(() => false);
  }

  async shouldSeeForm(): Promise<boolean> {
    return await this.page.locator(this.selectors.form.container).first()
      .isVisible({ timeout: 3000 })
      .catch(() => false);
  }

  async getFormNameValue(): Promise<string> {
    return await this.page.locator(this.selectors.form.name).first()
      .inputValue()
      .catch(() => '');
  }

  // ============================================
  // Table Row Assertions
  // ============================================

  /**
   * Check that a row contains specific text values
   */
  async shouldRowContain(identifier: string, expectedValues: {
    email?: string;
    phone?: string;
    company?: string;
    type?: string;
    source?: string;
  }): Promise<void> {
    const row = this.getRow(identifier);

    if (expectedValues.email) {
      await expect(row.getByText(expectedValues.email).first()).toBeVisible({ timeout: 5000 });
    }
    if (expectedValues.phone) {
      await expect(row.getByText(expectedValues.phone).first()).toBeVisible({ timeout: 5000 });
    }
    if (expectedValues.company) {
      await expect(row.getByText(expectedValues.company).first()).toBeVisible({ timeout: 5000 });
    }
    if (expectedValues.type) {
      await expect(row.getByText(expectedValues.type).first()).toBeVisible({ timeout: 5000 });
    }
    if (expectedValues.source) {
      await expect(row.getByText(expectedValues.source).first()).toBeVisible({ timeout: 5000 });
    }
  }

  /**
   * Check badge value in row
   */
  async shouldBadgeHaveValue(identifier: string, badgeType: 'type' | 'source', expectedValue: string): Promise<void> {
    const row = this.getRow(identifier);
    const badge = badgeType === 'type'
      ? row.locator('button').filter({ hasText: new RegExp(expectedValue, 'i') }).first()
      : row.locator('button').filter({ hasText: new RegExp(expectedValue, 'i') }).first();

    await expect(badge).toBeVisible({ timeout: 5000 });
  }

  // ============================================
  // Quick View / Detail Page Assertions
  // ============================================

  async shouldQuickViewContain(expectedValues: {
    name?: string;
    email?: string;
    phone?: string;
    company?: string;
  }): Promise<void> {
    const panel = this.page.locator(this.selectors.quickViewPanel).first();

    if (expectedValues.name) {
      await expect(panel.getByText(expectedValues.name).first()).toBeVisible({ timeout: 5000 });
    }
    if (expectedValues.email) {
      await expect(panel.getByText(expectedValues.email).first()).toBeVisible({ timeout: 5000 });
    }
    if (expectedValues.phone) {
      await expect(panel.getByText(expectedValues.phone).first()).toBeVisible({ timeout: 5000 });
    }
    if (expectedValues.company) {
      await expect(panel.getByText(expectedValues.company).first()).toBeVisible({ timeout: 5000 });
    }
  }

  async shouldDetailPageContain(expectedValues: {
    name?: string;
    email?: string;
    phone?: string;
    company?: string;
  }): Promise<void> {
    if (expectedValues.name) {
      await expect(this.page.getByText(expectedValues.name).first()).toBeVisible({ timeout: 5000 });
    }
    if (expectedValues.email) {
      await expect(this.page.getByText(expectedValues.email).first()).toBeVisible({ timeout: 5000 });
    }
    if (expectedValues.phone) {
      await expect(this.page.getByText(expectedValues.phone).first()).toBeVisible({ timeout: 5000 });
    }
    if (expectedValues.company) {
      await expect(this.page.getByText(expectedValues.company).first()).toBeVisible({ timeout: 5000 });
    }
  }
}
