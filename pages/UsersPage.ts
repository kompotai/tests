/**
 * Users Page Object
 *
 * Settings → Users & Access → Users
 * CRUD operations on workspace users.
 */

import { expect } from '@playwright/test';
import { BasePage } from './BasePage';
import { Selectors } from './selectors';
import { WORKSPACE_ID } from '@fixtures/users';

export interface UserData {
  name: string;
  jobTitle?: string;
  email: string;
  password?: string;
  roles?: string[];
  active?: boolean;
}

export class UsersPage extends BasePage {
  get path() { return `/ws/${WORKSPACE_ID}/settings/users`; }
  private get s() { return Selectors.users; }

  async waitForPageLoad(): Promise<void> {
    await this.page.locator(this.s.list).waitFor({ state: 'visible', timeout: 15000 });
  }

  // ============================================
  // FORM ACTIONS
  // ============================================

  async openCreateForm(): Promise<void> {
    await this.page.locator(this.s.createButton).click();
    await this.page.locator(this.s.form.container).waitFor({ state: 'visible', timeout: 5000 });
    await this.wait(500);
  }

  async create(data: UserData): Promise<void> {
    await this.openCreateForm();
    await this.fillForm(data);
    await this.submitForm();
  }

  async fillForm(data: UserData): Promise<void> {
    if (data.name) {
      const nameInput = this.page.locator(this.s.form.inputName);
      await nameInput.clear();
      await nameInput.fill(data.name);
    }

    if (data.jobTitle) {
      const jobInput = this.page.locator(this.s.form.inputJobTitle);
      await jobInput.clear();
      await jobInput.fill(data.jobTitle);
    }

    if (data.email) {
      const emailInput = this.page.locator(this.s.form.inputEmail);
      await emailInput.clear();
      await emailInput.fill(data.email);
    }

    if (data.password) {
      const passInput = this.page.locator(this.s.form.inputPassword);
      await passInput.clear();
      await passInput.fill(data.password);
    }

    if (data.roles) {
      await this.setRoles(data.roles);
    }

    if (data.active === false) {
      const checkbox = this.page.locator(this.s.form.activeCheckbox);
      if (await checkbox.isChecked()) {
        await checkbox.uncheck();
      }
    }
  }

  private async setRoles(roles: string[]): Promise<void> {
    const allRoles = ['Admin', 'Manager', 'Technician', 'Accountant'];
    for (const role of allRoles) {
      const checkbox = this.page.locator(this.s.form.roleCheckbox(role));
      const isChecked = await checkbox.isChecked();
      const shouldBeChecked = roles.includes(role);

      if (shouldBeChecked && !isChecked) {
        await checkbox.check();
      } else if (!shouldBeChecked && isChecked) {
        await checkbox.uncheck();
      }
    }
  }

  async submitForm(): Promise<void> {
    await this.dismissCookieBanner();
    const submitBtn = this.page.locator(this.s.form.submit);
    await submitBtn.scrollIntoViewIfNeeded();
    await submitBtn.click();
    await this.page.locator(this.s.form.container).waitFor({ state: 'hidden', timeout: 10000 });
    await this.wait(500);
  }

  async clickSubmitExpectingError(): Promise<void> {
    await this.dismissCookieBanner();
    const submitBtn = this.page.locator(this.s.form.submit);
    await submitBtn.scrollIntoViewIfNeeded();
    await submitBtn.click();
    await this.wait(500);
  }

  async cancelForm(): Promise<void> {
    await this.dismissCookieBanner();
    await this.page.locator(this.s.form.cancel).click();
    await this.page.locator(this.s.form.container).waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {});
    await this.wait(300);
  }

  async generatePassword(): Promise<string> {
    await this.page.locator(this.s.form.generatePassword).click();
    await this.wait(300);
    return await this.page.locator(this.s.form.inputPassword).inputValue();
  }

  // ============================================
  // ROW ACTIONS
  // ============================================

  private async getUserIdFromRow(identifier: string): Promise<string> {
    const row = this.page.locator(this.s.row(identifier));
    const testId = await row.getAttribute('data-testid');
    // data-testid="users-row-{id}" → extract id
    return testId?.replace('users-row-', '') || '';
  }

  async openEditForm(identifier: string): Promise<void> {
    const userId = await this.getUserIdFromRow(identifier);
    await this.page.locator(this.s.rowEdit(userId)).click();
    await this.page.locator(this.s.form.container).waitFor({ state: 'visible', timeout: 5000 });
    await this.wait(500);
  }

  async editUser(identifier: string, fields: Partial<UserData>): Promise<void> {
    await this.openEditForm(identifier);
    await this.fillForm(fields as UserData);
    await this.submitForm();
  }

  async deleteUser(identifier: string): Promise<void> {
    const userId = await this.getUserIdFromRow(identifier);
    await this.page.locator(this.s.rowDelete(userId)).click();
    await this.wait(300);
    await this.confirmDialog();
    await this.wait(500);
  }

  async toggleUserStatus(identifier: string): Promise<void> {
    const userId = await this.getUserIdFromRow(identifier);
    const toggle = this.page.locator(this.s.rowToggle(userId)).locator('input[type="checkbox"]');
    await toggle.click({ force: true });
    await this.wait(500);
  }

  async isUserActive(identifier: string): Promise<boolean> {
    const userId = await this.getUserIdFromRow(identifier);
    const toggle = this.page.locator(this.s.rowToggle(userId)).locator('input[type="checkbox"]');
    return await toggle.isChecked();
  }

  async clickUserName(name: string): Promise<void> {
    const row = this.page.locator(this.s.row(name));
    const link = row.locator(`a:has-text("${name}")`);
    await link.click();
    await this.page.waitForURL(/\/users\//, { timeout: 10000 });
    await this.page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});
    await this.wait(500);
  }

  // ============================================
  // ASSERTIONS
  // ============================================

  async shouldSeeUser(identifier: string): Promise<void> {
    const row = this.page.locator(this.s.row(identifier));
    await expect(row).toBeVisible({ timeout: 10000 });
  }

  async shouldNotSeeUser(identifier: string): Promise<void> {
    const row = this.page.locator(this.s.row(identifier));
    await expect(row).not.toBeVisible({ timeout: 5000 });
  }

  async isFormVisible(): Promise<boolean> {
    return this.page.locator(this.s.form.container).isVisible({ timeout: 3000 }).catch(() => false);
  }

  async getUserRowData(identifier: string): Promise<{
    name: string;
    email: string;
    roles: string;
  }> {
    const row = this.page.locator(this.s.row(identifier));
    const cells = row.locator('td');
    return {
      name: (await cells.nth(0).textContent())?.trim() || '',
      email: (await cells.nth(1).textContent())?.trim() || '',
      roles: (await cells.nth(2).textContent())?.trim() || '',
    };
  }

  async shouldBeOnDetailPage(): Promise<void> {
    await this.page.waitForURL(/\/users\/[a-f0-9]+/, { timeout: 10000 });
  }

  async goBackToList(): Promise<void> {
    await this.page.locator(this.s.detail.backToList).click();
    await this.page.locator(this.s.list).waitFor({ state: 'visible', timeout: 10000 });
  }

  // ============================================
  // PRIVATE
  // ============================================

  private async dismissCookieBanner(): Promise<void> {
    const cookieBtn = this.page.locator('[data-testid="cookie-accept-all"]');
    if (await cookieBtn.isVisible({ timeout: 500 }).catch(() => false)) {
      await cookieBtn.click();
      await this.wait(300);
    }
  }
}
