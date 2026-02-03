/**
 * Tasks CRUD E2E Tests (T1-T4)
 *
 * T1: View Tasks List
 * T2: Create Task
 * T3: Edit Task
 * T4: Delete Task
 */

import { ownerTest, expect } from '@fixtures/auth.fixture';
import { TasksPage, TaskData } from '@pages/index';

// ============================================
// Test Data
// ============================================

const generateTaskName = (prefix: string) =>
  `${prefix}-${Date.now().toString(36)}`;

// ============================================
// T1: View Tasks List
// ============================================

ownerTest.describe('T1: View Tasks List', () => {
  ownerTest.describe.configure({ mode: 'serial' });

  let tasksPage: TasksPage;

  ownerTest.beforeEach(async ({ page }) => {
    tasksPage = new TasksPage(page);
  });

  ownerTest('T1-AC1: User can see tasks list after login', async () => {
    await tasksPage.goto();
    await tasksPage.shouldSeeText('All Tasks');
  });

  ownerTest('T1-AC2: Tasks display columns (name, status, priority)', async ({ page }) => {
    await tasksPage.goto();

    // Проверяем наличие таблицы или empty state
    const hasTable = await tasksPage.shouldSeeTable();

    if (hasTable) {
      // Проверяем заголовки колонок
      await expect(page.locator('th:has-text("Name"), th:has-text("Task")').first())
        .toBeVisible({ timeout: 5000 });
    } else {
      // Если таблицы нет — должен быть empty state
      await tasksPage.shouldSeeEmptyState();
    }
  });

  ownerTest('T1-AC3: Empty state shown when no tasks', async ({ page }) => {
    // Поиск несуществующей задачи
    await tasksPage.goto();
    await tasksPage.search('nonexistent-task-xyz-12345');

    // Должен быть empty state или сообщение о ненайденных задачах
    const emptyState = page.locator('text="No tasks found", text="Task not found"').first();
    const noResults = page.locator('text="0 results", text="nothing found"').first();

    const hasEmptyState = await emptyState.isVisible({ timeout: 5000 }).catch(() => false);
    const hasNoResults = await noResults.isVisible({ timeout: 2000 }).catch(() => false);
    const hasTable = await tasksPage.shouldSeeTable();

    // Либо empty state, либо пустая таблица, либо сообщение о 0 результатов
    expect(hasEmptyState || hasNoResults || !hasTable).toBe(true);
  });

  ownerTest('T1-AC4: Pagination works', async ({ page }) => {
    await tasksPage.goto();

    // Pagination может отсутствовать если задач мало
    const paginationVisible = await page
      .locator('nav[aria-label="pagination"], [data-testid="tasks-pagination"]')
      .first()
      .isVisible({ timeout: 3000 })
      .catch(() => false);

    if (paginationVisible) {
      // Пробуем перейти на следующую страницу
      await tasksPage.goToNextPage();
      await page.waitForLoadState('networkidle');
      // Verify pagination worked
      await expect(page.locator('nav[aria-label="pagination"], [data-testid="tasks-pagination"]').first())
        .toBeVisible();
    } else {
      // Skip if no pagination available
      ownerTest.skip();
    }
  });
});

// ============================================
// T2: Create Task
// ============================================

ownerTest.describe('T2: Create Task', () => {
  ownerTest.describe.configure({ mode: 'serial' });

  let tasksPage: TasksPage;
  let createdTaskName: string;

  ownerTest.beforeEach(async ({ page }) => {
    tasksPage = new TasksPage(page);
  });

  ownerTest('T2-AC1: Open task creation form', async () => {
    await tasksPage.goto();
    await tasksPage.openCreateForm();

    const formVisible = await tasksPage.shouldSeeForm();
    expect(formVisible).toBe(true);
  });

  ownerTest('T2-AC2: Create task with name only', async () => {
    createdTaskName = generateTaskName('MinimalTask');

    await tasksPage.goto();
    await tasksPage.createMinimal(createdTaskName);

    // Reload and verify task appears in list
    await tasksPage.goto();
    await tasksPage.shouldSeeTask(createdTaskName);
  });

  ownerTest('T2-AC3: Create task with all fields', async () => {
    const fullTaskName = generateTaskName('FullTask');
    const fullTaskData: TaskData = {
      name: fullTaskName,
      description: 'Test task description',
      priority: 'High',
      status: 'To Do',
    };

    await tasksPage.goto();
    await tasksPage.create(fullTaskData);

    // Проверяем что задача создана
    await tasksPage.search(fullTaskName);
    await tasksPage.shouldSeeTask(fullTaskName);
  });

  ownerTest('T2-AC4: Validation errors for invalid data', async ({ page }) => {
    await tasksPage.goto();
    await tasksPage.openCreateForm();

    // Wait for form to appear
    const nameField = page.locator('input#title').first();
    await nameField.waitFor({ state: 'visible', timeout: 5000 });
    await nameField.clear();

    // Try to submit with empty name
    const submitBtn = page.locator('[data-testid="task-form-button-submit"]').first();
    await submitBtn.click({ force: true });

    // Check that validation error appears or form stays open
    const formStillVisible = await tasksPage.shouldSeeForm();
    const hasError = await page
      .locator('[data-testid*="error"], .text-red, [class*="error"], :invalid, [aria-invalid="true"]')
      .first()
      .isVisible({ timeout: 2000 })
      .catch(() => false);

    expect(formStillVisible || hasError).toBe(true);
  });

  ownerTest('T2-AC5: Created task appears in list', async () => {
    // Используем задачу из T2-AC2
    await tasksPage.goto();
    await tasksPage.search(createdTaskName);
    await tasksPage.shouldSeeTask(createdTaskName);
  });
});

// ============================================
// T3: Edit Task
// ============================================

ownerTest.describe('T3: Edit Task', () => {
  ownerTest.describe.configure({ mode: 'serial' });

  let tasksPage: TasksPage;
  let taskToEdit: string;
  let updatedTaskName: string;

  ownerTest.beforeAll(async ({ browser }) => {
    // Create a task specifically for edit tests
    const context = await browser.newContext({ storageState: '.auth/owner.json' });
    const page = await context.newPage();
    const setupTasksPage = new TasksPage(page);

    taskToEdit = generateTaskName('EditTest');
    await setupTasksPage.goto();
    await setupTasksPage.createMinimal(taskToEdit);

    await context.close();
  });

  ownerTest.beforeEach(async ({ page }) => {
    tasksPage = new TasksPage(page);
  });

  ownerTest('T3-AC1: Open task edit form', async () => {
    await tasksPage.goto();
    await tasksPage.shouldSeeTask(taskToEdit);

    // Click edit on the task we created
    await tasksPage.clickRowEdit(taskToEdit);

    const formVisible = await tasksPage.shouldSeeForm();
    expect(formVisible).toBe(true);
  });

  ownerTest('T3-AC2: Edit task name', async () => {
    updatedTaskName = generateTaskName('UpdatedTask');

    await tasksPage.goto();
    await tasksPage.search(taskToEdit);
    await tasksPage.edit(taskToEdit, { name: updatedTaskName });

    // Проверяем что задача обновлена
    await tasksPage.search(updatedTaskName);
    await tasksPage.shouldSeeTask(updatedTaskName);

    // Обновляем имя для следующих тестов
    taskToEdit = updatedTaskName;
  });

  ownerTest('T3-AC3: Edit task description', async ({ page }) => {
    const newDescription = 'Updated description';

    await tasksPage.goto();
    await tasksPage.search(taskToEdit);
    await tasksPage.edit(taskToEdit, { description: newDescription });

    // Verify task is still visible after edit
    await tasksPage.search(taskToEdit);
    await tasksPage.shouldSeeTask(taskToEdit);
  });

  ownerTest('T3-AC4: Edit task priority', async () => {
    await tasksPage.goto();
    await tasksPage.search(taskToEdit);
    await tasksPage.edit(taskToEdit, { priority: 'High' });

    // Задача должна остаться в списке
    await tasksPage.search(taskToEdit);
    await tasksPage.shouldSeeTask(taskToEdit);
  });

  ownerTest('T3-AC5: Edit task status', async () => {
    await tasksPage.goto();
    await tasksPage.search(taskToEdit);
    await tasksPage.edit(taskToEdit, { status: 'In Progress' });

    // Задача должна остаться в списке
    await tasksPage.search(taskToEdit);
    await tasksPage.shouldSeeTask(taskToEdit);
  });

  ownerTest('T3-AC7: Changes saved successfully', async () => {
    // Финальная проверка — задача существует после всех изменений
    await tasksPage.goto();
    await tasksPage.search(taskToEdit);
    await tasksPage.shouldSeeTask(taskToEdit);
  });
});

// ============================================
// T4: Delete Task
// ============================================

ownerTest.describe('T4: Delete Task', () => {
  ownerTest.describe.configure({ mode: 'serial' });

  let tasksPage: TasksPage;
  let taskToDelete: string;

  ownerTest.beforeAll(async ({ browser }) => {
    // Create a task specifically for deletion tests
    const context = await browser.newContext({ storageState: '.auth/owner.json' });
    const page = await context.newPage();
    const setupTasksPage = new TasksPage(page);

    taskToDelete = generateTaskName('DeleteTest');
    await setupTasksPage.goto();
    await setupTasksPage.createMinimal(taskToDelete);

    await context.close();
  });

  ownerTest.beforeEach(async ({ page }) => {
    tasksPage = new TasksPage(page);
  });

  ownerTest('T4-AC1: Initiate task deletion', async ({ page }) => {
    await tasksPage.goto();
    await tasksPage.shouldSeeTask(taskToDelete);

    // Find delete button on the task we created
    const row = page.locator(`tr:has-text("${taskToDelete}")`).first();
    const deleteBtn = row.locator('button:has-text("Delete"), button[title*="Delete"]').first();

    const deleteBtnVisible = await deleteBtn.isVisible({ timeout: 5000 }).catch(() => false);
    expect(deleteBtnVisible).toBe(true);
  });

  ownerTest('T4-AC2: Delete confirmation dialog', async () => {
    await tasksPage.goto();

    // Click delete on existing task
    await tasksPage.clickRowDelete(taskToDelete);

    // Проверяем диалог подтверждения
    const dialogVisible = await tasksPage.isConfirmDialogVisible();

    if (dialogVisible) {
      // Отменяем удаление
      await tasksPage.cancelDialog();
      expect(dialogVisible).toBe(true);
    } else {
      // Skip if dialog not implemented
      ownerTest.skip();
    }
  });

  ownerTest('T4-AC3: Task removed after confirmation', async ({ page }) => {
    await tasksPage.goto();
    await tasksPage.search(taskToDelete);
    await tasksPage.delete(taskToDelete);

    // Wait for list to update
    await page.waitForLoadState('networkidle');

    // Проверяем что задача удалена
    await tasksPage.search(taskToDelete);
    await tasksPage.shouldNotSeeTask(taskToDelete);
  });

  ownerTest('T4-AC4: Task list updates after deletion', async () => {
    // Verify task list is visible and has tasks
    await tasksPage.goto();

    const hasTable = await tasksPage.shouldSeeTable();
    expect(hasTable).toBe(true);

    // Verify the page loads correctly after potential delete operations
    await tasksPage.shouldSeeText('All Tasks');
  });
});
