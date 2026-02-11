/**
 * Tasks Page Object
 */

import { expect } from '@playwright/test';
import { BasePage } from './BasePage';
import { Selectors } from './selectors';
import { WORKSPACE_ID } from '@fixtures/users';

export interface TaskData {
  name: string;
  description?: string;
  priority?: 'Low' | 'Medium' | 'High';
  status?: 'To Do' | 'In Progress' | 'Done';
  dueDate?: string;
  assignee?: string;
}

export class TasksPage extends BasePage {
  get path() { return `/ws/${WORKSPACE_ID}/tasks`; }

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
    await this.goto();
    const searchInput = this.page.locator(this.s.searchInput).first();

    if (await searchInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await searchInput.fill(query);
      await searchInput.press('Enter');
      await this.page.waitForLoadState('networkidle');
    } else {
      // Fallback to URL-based search if no search input
      await this.page.goto(`${this.path}?search=${encodeURIComponent(query)}`);
      await this.page.waitForLoadState('networkidle');
    }
  }

  async typeInSearch(query: string): Promise<void> {
    const searchInput = this.page.locator(this.s.searchInput).first();
    await searchInput.waitFor({ state: 'visible', timeout: 5000 });
    await searchInput.clear();
    await searchInput.pressSequentially(query, { delay: 50 });
    await this.page.waitForLoadState('networkidle').catch(() => {});
  }

  async clearSearch(): Promise<void> {
    const searchInput = this.page.locator(this.s.searchInput).first();
    if (await searchInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await searchInput.clear();
      await searchInput.press('Enter');
      await this.page.waitForLoadState('networkidle').catch(() => {});
    }
  }

  // ============================================
  // CRUD Operations
  // ============================================

  async openCreateForm(): Promise<void> {
    const createBtn = this.page.locator(this.s.createButton).first();
    await createBtn.click();
    // Wait for form to appear
    const formContainer = this.page.locator(this.s.form.container).first();
    await formContainer.waitFor({ state: 'visible', timeout: 5000 });
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
    // Find name input using the selector from selectors file
    const nameField = this.page.locator(this.s.form.name).first();
    await nameField.waitFor({ state: 'visible', timeout: 5000 });

    await nameField.click();
    await nameField.fill(data.name);

    if (data.description) {
      const descField = this.page.locator(this.s.form.description).first();
      if (await descField.isVisible({ timeout: 2000 }).catch(() => false)) {
        await descField.fill(data.description);
      }
    }

    if (data.priority) {
      await this.selectReactSelect(this.s.form.priorityPlaceholder, data.priority);
    }

    // Status only exists in Edit form — skip silently if not found
    if (data.status) {
      await this.selectReactSelect(this.s.form.statusPlaceholder, data.status);
    }

    if (data.dueDate) {
      const dateField = this.page.locator(this.s.form.dueDate).first();
      if (await dateField.isVisible({ timeout: 2000 }).catch(() => false)) {
        await dateField.fill(data.dueDate);
      }
    }

    if (data.assignee) {
      await this.selectReactSelect(this.s.form.assigneePlaceholder, data.assignee);
    }
  }

  /**
   * Click a react-select by its placeholder text and pick an option.
   * Works for both form selects and filter selects.
   */
  private async selectReactSelect(placeholder: string, value: string): Promise<void> {
    const control = this.page.getByText(placeholder).first();
    if (!await control.isVisible({ timeout: 2000 }).catch(() => false)) return;

    await control.click({ force: true });
    const option = this.page.locator('[role="option"]').filter({ hasText: value }).first();
    await option.waitFor({ state: 'visible', timeout: 3000 }).catch(() => {});
    if (await option.isVisible().catch(() => false)) {
      await option.click();
    }
  }

  async submitForm(): Promise<void> {
    // Dismiss cookie banner if visible (it can block clicks)
    const cookieAcceptBtn = this.page.locator('button:has-text("Accept All")');
    if (await cookieAcceptBtn.isVisible({ timeout: 500 }).catch(() => false)) {
      await cookieAcceptBtn.click();
    }

    const submitBtn = this.page.locator(this.s.form.submit).first();
    await submitBtn.scrollIntoViewIfNeeded();
    await submitBtn.waitFor({ state: 'visible', timeout: 5000 });
    await submitBtn.click({ force: true });

    // Wait for form to close (indicates successful submission)
    const formContainer = this.page.locator(this.s.form.container).first();
    await formContainer.waitFor({ state: 'hidden', timeout: 10000 }).catch(() => {});

    await this.waitForSpinner();
  }

  async edit(identifier: string, newData: Partial<TaskData>): Promise<void> {
    await this.clickRowEdit(identifier);

    if (newData.name) {
      const nameInput = this.page.locator(this.s.form.name).first();
      await nameInput.waitFor({ state: 'visible', timeout: 5000 });
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
      await this.selectReactSelect(this.s.form.priorityPlaceholder, newData.priority);
    }

    if (newData.status) {
      await this.selectReactSelect(this.s.form.statusPlaceholder, newData.status);
    }

    if (newData.dueDate) {
      const dateField = this.page.locator(this.s.form.dueDate).first();
      if (await dateField.isVisible({ timeout: 2000 }).catch(() => false)) {
        await dateField.clear();
        await dateField.fill(newData.dueDate);
      }
    }

    if (newData.assignee) {
      await this.selectReactSelect(this.s.form.assigneePlaceholder, newData.assignee);
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
    // Wait for form to appear
    const formContainer = this.page.locator(this.s.form.container).first();
    await formContainer.waitFor({ state: 'visible', timeout: 5000 });
  }

  async clickRowDelete(identifier: string): Promise<void> {
    const row = this.getRow(identifier);
    const deleteBtn = row.locator(this.s.rowDeleteButton).first();

    if (await deleteBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await deleteBtn.click();
      // Wait for potential confirm dialog
      await this.page.waitForTimeout(300); // Brief wait for dialog animation
    }
  }

  // ============================================
  // Filters
  // ============================================

  async isFilterAvailable(): Promise<boolean> {
    return await this.page.locator(this.s.filter.button).first()
      .isVisible({ timeout: 3000 })
      .catch(() => false);
  }

  async openFilters(): Promise<boolean> {
    const filterBtn = this.page.locator(this.s.filter.button).first();
    if (!await filterBtn.isVisible({ timeout: 3000 }).catch(() => false)) return false;

    await filterBtn.click();
    const heading = this.page.locator(this.s.filter.container).first();
    await heading.waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});
    return await heading.isVisible().catch(() => false);
  }

  async filterByStatus(status: string): Promise<void> {
    await this.selectReactSelectFilter(this.s.filter.statusPlaceholder, status);
  }

  async filterByPriority(priority: string): Promise<void> {
    await this.selectReactSelectFilter(this.s.filter.priorityPlaceholder, priority);
  }

  async filterByAssignee(assignee: string): Promise<void> {
    await this.selectReactSelectFilter(this.s.filter.assigneePlaceholder, assignee);
  }

  async filterByDueDate(option: string): Promise<void> {
    await this.selectReactSelectFilter(this.s.filter.dueDatePlaceholder, option);
  }

  async clearFilters(): Promise<void> {
    const clearBtn = this.page.locator(this.s.filter.clearButton).first();
    if (await clearBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await clearBtn.click();
      await this.page.waitForLoadState('networkidle').catch(() => {});
    }
  }

  private async selectReactSelectFilter(placeholder: string, value: string): Promise<void> {
    // Find the placeholder/current value text and click its react-select control
    const control = this.page.getByText(placeholder).first();
    await control.waitFor({ state: 'visible', timeout: 3000 });
    await control.click({ force: true });

    // Select the option from the dropdown
    const option = this.page.locator(`[role="option"]`).filter({ hasText: value }).first();
    await option.waitFor({ state: 'visible', timeout: 3000 });
    await option.click();
    await this.page.waitForLoadState('networkidle').catch(() => {});
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

  async shouldSeeNoResults(): Promise<void> {
    const noResults = this.page.locator(this.s.emptyState).first();
    const emptyTable = this.page.locator('table tbody tr').first();

    const hasNoResults = await noResults.isVisible({ timeout: 5000 }).catch(() => false);
    const hasRows = await emptyTable.isVisible({ timeout: 2000 }).catch(() => false);

    // Either "No tasks found" message or table has no rows
    expect(hasNoResults || !hasRows).toBe(true);
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

  async shouldRowContain(identifier: string, values: { status?: string; priority?: string; assignee?: string }): Promise<void> {
    const row = this.getRow(identifier);
    await row.waitFor({ state: 'visible', timeout: 10000 });
    for (const value of Object.values(values)) {
      if (value) {
        await expect(row.getByText(value, { exact: false }).first()).toBeVisible({ timeout: 5000 });
      }
    }
  }

  async shouldSeeValidationError(message?: string): Promise<void> {
    if (message) {
      await expect(this.page.getByText(message).first()).toBeVisible({ timeout: 5000 });
    } else {
      const errorSelector = '.text-red, [class*="error"]';
      await expect(this.page.locator(errorSelector).first()).toBeVisible({ timeout: 5000 });
    }
  }

  async getFormNameValue(): Promise<string> {
    return await this.page.locator(this.s.form.name).first()
      .inputValue()
      .catch(() => '');
  }
}
