/**
 * Tasks Page Object
 */

import { Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';
import { Selectors } from './selectors';

export interface TaskData {
  name: string;
  description?: string;
  priority?: 'Low' | 'Medium' | 'High';
  status?: 'To Do' | 'In Progress' | 'Done';
  dueDate?: string;
  assignee?: string;
}

export class TasksPage extends BasePage {
  readonly path = `/ws/${process.env.WS_ID || 'testlubas'}/tasks`;

  private get s() {
    return Selectors.tasks;
  }

  // ============================================
  // Navigation & View
  // ============================================

  async waitForPageLoad(): Promise<void> {
    await super.waitForPageLoad();
    // Check for "All Tasks" heading or "Create task" button
    const heading = this.page.locator('h1:has-text("All Tasks"), h1:has-text("Tasks")').first();
    const createBtn = this.page.locator('button:has-text("Create task")').first();
    await Promise.race([
      heading.waitFor({ state: 'visible', timeout: 10000 }),
      createBtn.waitFor({ state: 'visible', timeout: 10000 }),
    ]);
  }

  async search(query: string): Promise<void> {
    await this.page.goto(`${this.path}?search=${encodeURIComponent(query)}`);
    await this.page.waitForLoadState('networkidle');
    await this.wait(500);
  }

  // ============================================
  // CRUD Operations
  // ============================================

  async openCreateForm(): Promise<void> {
    await this.page.locator(this.s.createButton).click();
    await this.wait(500);
  }

  async create(data: TaskData): Promise<void> {
    await this.openCreateForm();
    await this.fillForm(data);
    await this.submitForm();
  }

  async createMinimal(name: string): Promise<void> {
    await this.create({ name });
  }

  async fillForm(data: TaskData): Promise<void> {
    // Wait for form container to be visible (dialog or form wrapper)
    const formContainer = this.page.locator(this.s.form.container).first();
    await formContainer.waitFor({ state: 'visible', timeout: 5000 });
    await this.wait(500); // Extra wait for form to fully render

    // Find name input using the selector from selectors file
    const nameField = this.page.locator(this.s.form.name).first();
    await nameField.waitFor({ state: 'visible', timeout: 5000 });

    // Focus and fill using pressSequentially for better React compatibility
    await nameField.click();
    await this.wait(200);
    await nameField.clear();
    await this.wait(100);
    await nameField.pressSequentially(data.name, { delay: 30 });
    await this.wait(500);

    if (data.description) {
      const descField = this.page.locator(this.s.form.description).first();
      if (await descField.isVisible({ timeout: 2000 }).catch(() => false)) {
        await descField.fill(data.description);
      }
    }

    if (data.priority) {
      await this.selectOption(this.s.form.priority, data.priority);
    }

    if (data.status) {
      await this.selectOption(this.s.form.status, data.status);
    }

    if (data.dueDate) {
      const dateField = this.page.locator(this.s.form.dueDate).first();
      if (await dateField.isVisible({ timeout: 2000 }).catch(() => false)) {
        await dateField.fill(data.dueDate);
      }
    }

    if (data.assignee) {
      await this.selectAssignee(data.assignee);
    }
  }

  private async selectOption(selector: string, value: string): Promise<void> {
    const field = this.page.locator(selector).first();
    if (!await field.isVisible({ timeout: 2000 }).catch(() => false)) return;

    const tagName = await field.evaluate(el => el.tagName.toLowerCase());
    if (tagName === 'select') {
      await field.selectOption({ label: value });
    } else {
      await field.click();
      await this.wait(300);
      const option = this.page.locator(`[role="option"]:has-text("${value}")`).first();
      if (await option.isVisible({ timeout: 2000 }).catch(() => false)) {
        await option.click();
      }
    }
  }

  private async selectAssignee(assignee: string): Promise<void> {
    const field = this.page.locator(this.s.form.assignee).first();
    if (!await field.isVisible({ timeout: 2000 }).catch(() => false)) return;

    await field.click();
    await field.fill(assignee);
    await this.wait(500);

    const option = this.page.locator(Selectors.common.selectOption).first();
    if (await option.isVisible({ timeout: 3000 }).catch(() => false)) {
      await option.click();
    }
  }

  async submitForm(): Promise<void> {
    // Wait for any toasts to auto-dismiss
    await this.wait(500);

    // Dismiss cookie banner if visible (it can block clicks)
    const cookieAcceptBtn = this.page.locator('button:has-text("Accept All")');
    if (await cookieAcceptBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
      await cookieAcceptBtn.click();
      await this.wait(300);
    }

    // Find and click submit button using data-testid
    const submitBtn = this.page.locator('[data-testid="task-form-button-submit"]').first();
    await submitBtn.scrollIntoViewIfNeeded();
    await submitBtn.waitFor({ state: 'visible', timeout: 5000 });
    await submitBtn.click({ force: true }); // Force click to bypass any remaining overlays

    // Wait for form to close (indicates successful submission)
    await this.wait(1000);
    const formContainer = this.page.locator(this.s.form.container).first();
    await formContainer.waitFor({ state: 'hidden', timeout: 10000 }).catch(() => {});

    await this.waitForSpinner();
    await this.wait(1000);
  }

  async edit(identifier: string, newData: Partial<TaskData>): Promise<void> {
    await this.clickRowEdit(identifier);

    if (newData.name) {
      const nameInput = this.page.locator(this.s.form.name).first();
      await nameInput.clear();
      await nameInput.fill(newData.name);
    }

    if (newData.description) {
      const descField = this.page.locator(this.s.form.description).first();
      if (await descField.isVisible({ timeout: 2000 }).catch(() => false)) {
        await descField.clear();
        await descField.fill(newData.description);
      }
    }

    if (newData.priority) {
      await this.selectOption(this.s.form.priority, newData.priority);
    }

    if (newData.status) {
      await this.selectOption(this.s.form.status, newData.status);
    }

    if (newData.dueDate) {
      const dateField = this.page.locator(this.s.form.dueDate).first();
      if (await dateField.isVisible({ timeout: 2000 }).catch(() => false)) {
        await dateField.clear();
        await dateField.fill(newData.dueDate);
      }
    }

    if (newData.assignee) {
      await this.selectAssignee(newData.assignee);
    }

    await this.submitForm();
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
    return this.page.locator(this.s.row(identifier)).first();
  }

  async clickRowEdit(identifier: string): Promise<void> {
    const row = this.getRow(identifier);
    await row.locator(this.s.rowEditButton).click();
    await this.wait(1000);
  }

  async clickRowDelete(identifier: string): Promise<void> {
    const row = this.getRow(identifier);
    const deleteBtn = row.locator(this.s.rowDeleteButton).first();

    if (await deleteBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await deleteBtn.click();
      await this.wait(500);
    }
  }

  // ============================================
  // Pagination
  // ============================================

  async goToNextPage(): Promise<void> {
    const nextBtn = this.page.locator(this.s.pagination.nextButton).first();
    if (await nextBtn.isEnabled({ timeout: 2000 }).catch(() => false)) {
      await nextBtn.click();
      await this.waitForSpinner();
    }
  }

  async goToPrevPage(): Promise<void> {
    const prevBtn = this.page.locator(this.s.pagination.prevButton).first();
    if (await prevBtn.isEnabled({ timeout: 2000 }).catch(() => false)) {
      await prevBtn.click();
      await this.waitForSpinner();
    }
  }

  // ============================================
  // Assertions
  // ============================================

  async shouldSeeTask(name: string): Promise<void> {
    await expect(this.page.getByText(name).first()).toBeVisible({ timeout: 10000 });
  }

  async shouldNotSeeTask(name: string): Promise<void> {
    await expect(this.page.getByText(name).first()).not.toBeVisible({ timeout: 5000 });
  }

  async shouldSeeEmptyState(): Promise<void> {
    await expect(this.page.locator(this.s.emptyState)).toBeVisible({ timeout: 10000 });
  }

  async shouldSeeTable(): Promise<boolean> {
    return await this.page.locator(this.s.table).first()
      .isVisible({ timeout: 3000 })
      .catch(() => false);
  }

  async shouldSeeForm(): Promise<boolean> {
    return await this.page.locator(this.s.form.container).first()
      .isVisible({ timeout: 3000 })
      .catch(() => false);
  }

  async shouldSeeValidationError(message?: string): Promise<void> {
    if (message) {
      await expect(this.page.getByText(message).first()).toBeVisible({ timeout: 5000 });
    } else {
      const errorSelector = '[data-testid*="error"], .text-red, [class*="error"]';
      await expect(this.page.locator(errorSelector).first()).toBeVisible({ timeout: 5000 });
    }
  }

  async getFormNameValue(): Promise<string> {
    return await this.page.locator(this.s.form.name).first()
      .inputValue()
      .catch(() => '');
  }
}
