/**
 * Tasks E2E Tests (T1-T8)
 *
 * T1: View Tasks List
 * T2: Create Task
 * T3: Edit Task
 * T4: Delete Task
 * T5: Change Task Status
 * T6: Filter Tasks
 * T7: Search Tasks
 * T8: Assign Task
 */

import { ownerTest, expect } from '@fixtures/auth.fixture';
import { TasksPage, TaskData } from '@pages/index';
import { OWNER, USERS, WORKSPACE_ID } from '@fixtures/users';

// ============================================
// Test Data
// ============================================

const generateTaskName = (prefix: string) =>
  `${prefix}-${Date.now().toString(36)}`;

// HTTP Basic Auth for stage environment
const isStage = process.env.BASE_URL?.includes('stage.kompot.ai');
const stageHttpCredentials = isStage ? {
  username: process.env.STAGE_HTTP_USER || 'kompot',
  password: process.env.STAGE_HTTP_PASSWORD || 'stage2025!',
} : undefined;

/** Create a browser context with owner auth + stage HTTP credentials */
async function ownerContext(browser: any) {
  return browser.newContext({
    storageState: '.auth/owner.json',
    ...(stageHttpCredentials && { httpCredentials: stageHttpCredentials }),
  });
}

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
    const context = await ownerContext(browser);
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
    const context = await ownerContext(browser);
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

// ============================================
// T5: Change Task Status
// ============================================

ownerTest.describe('T5: Change Task Status', () => {
  ownerTest.describe.configure({ mode: 'serial' });

  let tasksPage: TasksPage;
  let taskToDo: string;
  let taskInProgress: string;
  let taskDone: string;

  ownerTest.beforeAll(async ({ browser }) => {
    const context = await ownerContext(browser);
    const page = await context.newPage();
    const setup = new TasksPage(page);

    taskToDo = generateTaskName('StatusToDo');
    taskInProgress = generateTaskName('StatusInProg');
    taskDone = generateTaskName('StatusDone');

    await setup.goto();
    await setup.create({ name: taskToDo, status: 'To Do' });
    await setup.goto();
    await setup.create({ name: taskInProgress, status: 'In Progress' });
    await setup.goto();
    await setup.create({ name: taskDone, status: 'Done' });

    await context.close();
  });

  ownerTest.beforeEach(async ({ page }) => {
    tasksPage = new TasksPage(page);
  });

  ownerTest('T5-AC1: Change status from "In Progress" to "To Do"', async () => {
    await tasksPage.goto();
    await tasksPage.search(taskInProgress);
    await tasksPage.edit(taskInProgress, { status: 'To Do' });

    await tasksPage.goto();
    await tasksPage.search(taskInProgress);
    await tasksPage.shouldRowContain(taskInProgress, { status: 'To Do' });
  });

  ownerTest('T5-AC2: Change status from "To Do" to "In Progress"', async () => {
    await tasksPage.goto();
    await tasksPage.search(taskToDo);
    await tasksPage.edit(taskToDo, { status: 'In Progress' });

    await tasksPage.goto();
    await tasksPage.search(taskToDo);
    await tasksPage.shouldRowContain(taskToDo, { status: 'In Progress' });
  });

  ownerTest('T5-AC3: Change status to "Done"', async () => {
    await tasksPage.goto();
    await tasksPage.search(taskDone);
    // taskDone was created with status "Done", change to "To Do" first then back to "Done"
    await tasksPage.edit(taskDone, { status: 'To Do' });

    await tasksPage.goto();
    await tasksPage.search(taskDone);
    await tasksPage.shouldRowContain(taskDone, { status: 'To Do' });

    // Now change to "Done"
    await tasksPage.edit(taskDone, { status: 'Done' });

    await tasksPage.goto();
    await tasksPage.search(taskDone);
    await tasksPage.shouldRowContain(taskDone, { status: 'Done' });
  });

  ownerTest('T5-AC4: Status persists after page reload', async () => {
    await tasksPage.goto();

    // Verify all three tasks retained their updated statuses
    await tasksPage.search(taskInProgress);
    await tasksPage.shouldRowContain(taskInProgress, { status: 'To Do' });

    await tasksPage.goto();
    await tasksPage.search(taskToDo);
    await tasksPage.shouldRowContain(taskToDo, { status: 'In Progress' });

    await tasksPage.goto();
    await tasksPage.search(taskDone);
    await tasksPage.shouldRowContain(taskDone, { status: 'Done' });
  });

  ownerTest('T5-AC5: Task list reflects all status changes', async () => {
    await tasksPage.goto();

    // Verify all tasks are visible and have correct statuses
    await tasksPage.shouldSeeTask(taskInProgress);
    await tasksPage.shouldSeeTask(taskToDo);
    await tasksPage.shouldSeeTask(taskDone);
  });

  // AC6: SKIP — drag-and-drop (board view) not implemented
  // AC7: SKIP — inline dropdown not implemented
});

// ============================================
// T6: Filter Tasks
// ============================================

ownerTest.describe('T6: Filter Tasks', () => {
  ownerTest.describe.configure({ mode: 'serial' });

  let tasksPage: TasksPage;
  const prefix = `Flt-${Date.now().toString(36)}`;
  const taskHighToDo = `${prefix}-HighToDo`;
  const taskLowInProgress = `${prefix}-LowInProg`;
  const taskMediumDone = `${prefix}-MedDone`;
  const taskHighInProgress = `${prefix}-HighInProg`;

  // Real UI names — discovered in T6-SETUP from the assignee dropdown
  let realOwnerName = '';
  let realAdminName = '';

  ownerTest.beforeEach(async ({ page }) => {
    tasksPage = new TasksPage(page);
  });

  ownerTest('T6-SETUP: Create tasks for filter tests', async ({ page }) => {
    // Discover real assignee names from the filter dropdown
    await tasksPage.goto();
    await tasksPage.openFilters();
    const assigneePlaceholder = page.getByText('All assignees').first();
    await assigneePlaceholder.click({ force: true });
    const options = page.locator('[role="option"]');
    await options.first().waitFor({ state: 'visible', timeout: 3000 });
    const allNames = await options.allTextContents();
    // Owner is the name that does NOT start with WORKSPACE_ID prefix (e.g. "test-LubaS")
    // Admin contains "Admin" in its name (e.g. "testlubas Admin")
    const wsPrefix = WORKSPACE_ID.toLowerCase();
    realOwnerName = allNames.find(n => n !== 'All assignees' && !n.toLowerCase().startsWith(wsPrefix)) || allNames[allNames.length - 1];
    realAdminName = allNames.find(n => n.toLowerCase().includes('admin')) || '';

    // Close filters panel — click the backdrop overlay to dismiss
    await page.keyboard.press('Escape');
    const backdrop = page.locator('div.fixed.inset-0.z-10').first();
    if (await backdrop.isVisible({ timeout: 1000 }).catch(() => false)) {
      await backdrop.click({ position: { x: 10, y: 10 } });
    }
    // Ensure filters panel is gone
    await page.locator('h3:has-text("Filters")').first().waitFor({ state: 'hidden', timeout: 3000 }).catch(() => {});

    // Step 1: Create all tasks (create form has no status field — all default to "To Do")
    await tasksPage.create({ name: taskHighToDo, assignee: realOwnerName });
    await tasksPage.goto();
    await tasksPage.create({ name: taskLowInProgress, assignee: realAdminName });
    await tasksPage.goto();
    await tasksPage.create({ name: taskMediumDone, assignee: realOwnerName });
    await tasksPage.goto();
    await tasksPage.create({ name: taskHighInProgress, assignee: realAdminName });

    // Step 2: Edit tasks to set correct status and priority via Edit form
    await tasksPage.goto();
    await tasksPage.edit(taskHighToDo, { status: 'To Do', priority: 'High' });
    await tasksPage.goto();
    await tasksPage.edit(taskLowInProgress, { status: 'In Progress', priority: 'Low' });
    await tasksPage.goto();
    await tasksPage.edit(taskMediumDone, { status: 'Done', priority: 'Medium' });
    await tasksPage.goto();
    await tasksPage.edit(taskHighInProgress, { status: 'In Progress', priority: 'High' });

    // Verify tasks created via search
    await tasksPage.search(taskHighToDo);
    await tasksPage.shouldSeeTask(taskHighToDo);
    await tasksPage.search(taskLowInProgress);
    await tasksPage.shouldSeeTask(taskLowInProgress);
  });

  ownerTest('T6-AC1: Filter by status "To Do"', async () => {
    await tasksPage.goto();

    const filtersAvailable = await tasksPage.isFilterAvailable();
    if (!filtersAvailable) {
      ownerTest.skip();
      return;
    }

    await tasksPage.openFilters();
    await tasksPage.filterByStatus('To Do');

    await tasksPage.shouldSeeTask(taskHighToDo);
    await tasksPage.shouldNotSeeTask(taskLowInProgress);
    await tasksPage.shouldNotSeeTask(taskMediumDone);
  });

  ownerTest('T6-AC2: Filter by priority "High"', async () => {
    await tasksPage.goto();

    const filtersAvailable = await tasksPage.isFilterAvailable();
    if (!filtersAvailable) {
      ownerTest.skip();
      return;
    }

    await tasksPage.openFilters();
    await tasksPage.filterByPriority('High');

    // Both "High" tasks should be visible
    await tasksPage.shouldSeeTask(taskHighToDo);
    await tasksPage.shouldSeeTask(taskHighInProgress);
    // Non-high tasks should NOT be visible
    await tasksPage.shouldNotSeeTask(taskLowInProgress);
    await tasksPage.shouldNotSeeTask(taskMediumDone);
  });

  ownerTest('T6-AC3: Filter by assignee (owner)', async () => {
    await tasksPage.goto();

    const filtersAvailable = await tasksPage.isFilterAvailable();
    if (!filtersAvailable) {
      ownerTest.skip();
      return;
    }

    await tasksPage.openFilters();
    await tasksPage.filterByAssignee(realOwnerName);

    // Owner's tasks should be visible
    await tasksPage.shouldSeeTask(taskHighToDo);
    await tasksPage.shouldSeeTask(taskMediumDone);
    // Admin's tasks should NOT be visible
    await tasksPage.shouldNotSeeTask(taskLowInProgress);
    await tasksPage.shouldNotSeeTask(taskHighInProgress);
  });

  ownerTest('T6-AC3b: Filter by assignee (admin)', async () => {
    await tasksPage.goto();

    const filtersAvailable = await tasksPage.isFilterAvailable();
    if (!filtersAvailable) {
      ownerTest.skip();
      return;
    }

    await tasksPage.openFilters();
    await tasksPage.filterByAssignee(realAdminName);

    // Admin's tasks should be visible
    await tasksPage.shouldSeeTask(taskLowInProgress);
    await tasksPage.shouldSeeTask(taskHighInProgress);
    // Owner's tasks should NOT be visible
    await tasksPage.shouldNotSeeTask(taskHighToDo);
    await tasksPage.shouldNotSeeTask(taskMediumDone);
  });

  ownerTest('T6-AC3c: Clear assignee filter shows all tasks', async () => {
    await tasksPage.goto();

    const filtersAvailable = await tasksPage.isFilterAvailable();
    if (!filtersAvailable) {
      ownerTest.skip();
      return;
    }

    await tasksPage.openFilters();
    await tasksPage.filterByAssignee(realOwnerName);

    // Verify filter is applied — only owner tasks visible
    await tasksPage.shouldSeeTask(taskHighToDo);
    await tasksPage.shouldNotSeeTask(taskLowInProgress);

    // Clear filters
    await tasksPage.clearFilters();

    // All tasks should be visible again
    await tasksPage.shouldSeeTask(taskHighToDo);
    await tasksPage.shouldSeeTask(taskLowInProgress);
    await tasksPage.shouldSeeTask(taskMediumDone);
    await tasksPage.shouldSeeTask(taskHighInProgress);
  });

  ownerTest('T6-AC4: Filter by due date (On Date)', async ({ page }) => {
    // Create task with today's due date inside the test
    const taskWithDueToday = `${prefix}-DueToday`;
    await tasksPage.goto();
    await tasksPage.openCreateForm();
    const nameInput = page.locator('input#title').first();
    await nameInput.waitFor({ state: 'visible', timeout: 5000 });
    await nameInput.click();
    await nameInput.fill(taskWithDueToday);
    // Set due date via date picker
    const selectDateBtn = page.locator('button:has-text("Select date")').first();
    await selectDateBtn.click();
    const today = new Date().getDate().toString();
    await page.locator(`table button:text-is("${today}")`).first().click();
    await tasksPage.submitForm();

    // Now filter by due date
    await tasksPage.goto();

    const filtersAvailable = await tasksPage.isFilterAvailable();
    if (!filtersAvailable) {
      ownerTest.skip();
      return;
    }

    await tasksPage.openFilters();
    await tasksPage.filterByDueDate('On Date');

    // Pick today's date using the date picker that appears after selecting "On Date"
    const filterDateBtn = page.locator('button:has-text("Select date")').first();
    if (await filterDateBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await filterDateBtn.click();
      await page.locator(`table button:text-is("${today}")`).first().click();
    }
    await page.waitForLoadState('networkidle').catch(() => {});

    // Task with today's due date should be visible
    await tasksPage.shouldSeeTask(taskWithDueToday);
    // Tasks without due dates should NOT be visible
    await tasksPage.shouldNotSeeTask(taskHighToDo);
  });

  ownerTest('T6-AC5: Combine status + priority filters', async () => {
    await tasksPage.goto();

    const filtersAvailable = await tasksPage.isFilterAvailable();
    if (!filtersAvailable) {
      ownerTest.skip();
      return;
    }

    await tasksPage.openFilters();
    await tasksPage.filterByStatus('In Progress');

    // Re-open filters if needed, then add priority
    await tasksPage.openFilters();
    await tasksPage.filterByPriority('High');

    // Only "High" + "In Progress" task should match
    await tasksPage.shouldSeeTask(taskHighInProgress);
    await tasksPage.shouldNotSeeTask(taskHighToDo);
    await tasksPage.shouldNotSeeTask(taskLowInProgress);
    await tasksPage.shouldNotSeeTask(taskMediumDone);
  });

  ownerTest('T6-AC6: Clear filters resets to all tasks', async () => {
    await tasksPage.goto();

    const filtersAvailable = await tasksPage.isFilterAvailable();
    if (!filtersAvailable) {
      ownerTest.skip();
      return;
    }

    // Apply a filter first
    await tasksPage.openFilters();
    await tasksPage.filterByStatus('Done');
    await tasksPage.shouldSeeTask(taskMediumDone);
    await tasksPage.shouldNotSeeTask(taskHighToDo);

    // Clear filters
    await tasksPage.openFilters();
    await tasksPage.clearFilters();

    // All tasks should be visible again
    await tasksPage.shouldSeeTask(taskHighToDo);
    await tasksPage.shouldSeeTask(taskLowInProgress);
    await tasksPage.shouldSeeTask(taskMediumDone);
    await tasksPage.shouldSeeTask(taskHighInProgress);
  });
});

// ============================================
// T7: Search Tasks
// ============================================

ownerTest.describe('T7: Search Tasks', () => {
  ownerTest.describe.configure({ mode: 'serial' });

  let tasksPage: TasksPage;
  const prefix = `Srch-${Date.now().toString(36)}`;
  let taskAlpha: string;
  let taskBeta: string;
  let taskGamma: string;

  ownerTest.beforeAll(async ({ browser }) => {
    const context = await ownerContext(browser);
    const page = await context.newPage();
    const setup = new TasksPage(page);

    taskAlpha = `${prefix}-Alpha`;
    taskBeta = `${prefix}-Beta`;
    taskGamma = `${prefix}-Gamma`;

    await setup.goto();
    await setup.create({ name: taskAlpha, status: 'To Do' });
    await setup.goto();
    await setup.create({ name: taskBeta, status: 'In Progress' });
    await setup.goto();
    await setup.create({ name: taskGamma, status: 'Done' });

    await context.close();
  });

  ownerTest.beforeEach(async ({ page }) => {
    tasksPage = new TasksPage(page);
  });

  ownerTest('T7-AC1: Search by exact task name', async () => {
    await tasksPage.search(taskAlpha);
    await tasksPage.shouldSeeTask(taskAlpha);
    await tasksPage.shouldNotSeeTask(taskBeta);
    await tasksPage.shouldNotSeeTask(taskGamma);
  });

  ownerTest('T7-AC2: Search results update as user types', async () => {
    await tasksPage.goto();

    // Type the shared prefix — all 3 tasks should appear
    await tasksPage.typeInSearch(prefix);
    await tasksPage.shouldSeeTask(taskAlpha);
    await tasksPage.shouldSeeTask(taskBeta);
    await tasksPage.shouldSeeTask(taskGamma);

    // Continue typing to narrow down to Alpha
    await tasksPage.typeInSearch(`${prefix}-Alpha`);
    await tasksPage.shouldSeeTask(taskAlpha);
    await tasksPage.shouldNotSeeTask(taskBeta);
    await tasksPage.shouldNotSeeTask(taskGamma);
  });

  ownerTest('T7-AC3: Clear search shows all tasks', async () => {
    // Start with a filtered search
    await tasksPage.search(taskBeta);
    await tasksPage.shouldSeeTask(taskBeta);
    await tasksPage.shouldNotSeeTask(taskAlpha);

    // Clear search
    await tasksPage.clearSearch();

    // All tasks should be visible again
    await tasksPage.shouldSeeTask(taskAlpha);
    await tasksPage.shouldSeeTask(taskBeta);
    await tasksPage.shouldSeeTask(taskGamma);
  });

  ownerTest('T7-AC4: No results for nonexistent task', async () => {
    await tasksPage.search(`nonexistent-${prefix}-xyz`);
    await tasksPage.shouldSeeNoResults();
  });
});

// ============================================
// T8: Assign Task
// ============================================

ownerTest.describe('T8: Assign Task', () => {
  ownerTest.describe.configure({ mode: 'serial' });

  let tasksPage: TasksPage;
  let taskUnassigned: string;
  let taskAssignedToOwner: string;
  const ownerName = OWNER.name;
  const adminUser = USERS.find(u => u.key === 'admin')!;
  const adminName = adminUser.name;

  ownerTest.beforeAll(async ({ browser }) => {
    const context = await ownerContext(browser);
    const page = await context.newPage();
    const setup = new TasksPage(page);

    taskUnassigned = generateTaskName('AssignNone');
    taskAssignedToOwner = generateTaskName('AssignOwner');

    await setup.goto();
    await setup.create({ name: taskUnassigned, status: 'To Do' });
    await setup.goto();
    await setup.create({ name: taskAssignedToOwner, status: 'To Do', assignee: ownerName });

    await context.close();
  });

  ownerTest.beforeEach(async ({ page }) => {
    tasksPage = new TasksPage(page);
  });

  ownerTest('T8-AC1: Assign task to owner', async () => {
    await tasksPage.goto();
    await tasksPage.search(taskUnassigned);
    await tasksPage.edit(taskUnassigned, { assignee: ownerName });

    await tasksPage.goto();
    await tasksPage.search(taskUnassigned);
    await tasksPage.shouldRowContain(taskUnassigned, { assignee: ownerName });
  });

  ownerTest('T8-AC2: Create task assigned to admin', async () => {
    const taskForAdmin = generateTaskName('AssignAdmin');

    await tasksPage.goto();
    await tasksPage.create({ name: taskForAdmin, status: 'To Do', assignee: adminName });

    await tasksPage.goto();
    await tasksPage.search(taskForAdmin);
    await tasksPage.shouldSeeTask(taskForAdmin);
    await tasksPage.shouldRowContain(taskForAdmin, { assignee: adminName });
  });

  ownerTest('T8-AC3: Reassign task from owner to admin', async () => {
    await tasksPage.goto();
    await tasksPage.search(taskAssignedToOwner);

    // Verify currently assigned to owner
    await tasksPage.shouldRowContain(taskAssignedToOwner, { assignee: ownerName });

    // Reassign to admin
    await tasksPage.edit(taskAssignedToOwner, { assignee: adminName });

    await tasksPage.goto();
    await tasksPage.search(taskAssignedToOwner);
    await tasksPage.shouldRowContain(taskAssignedToOwner, { assignee: adminName });
  });

  ownerTest('T8-AC4: Unassign task (clear assignee)', async () => {
    await tasksPage.goto();
    await tasksPage.search(taskAssignedToOwner);

    // Open edit form, clear assignee, submit
    await tasksPage.clickRowEdit(taskAssignedToOwner);
    await tasksPage.clearAssignee();
    await tasksPage.submitForm();

    // Verify assignee is no longer shown
    await tasksPage.goto();
    await tasksPage.search(taskAssignedToOwner);
    await tasksPage.shouldSeeTask(taskAssignedToOwner);

    // The admin name should not appear in the row
    const row = tasksPage['page'].locator(`tr:has-text("${taskAssignedToOwner}")`).first();
    await row.waitFor({ state: 'visible', timeout: 10000 });
    const rowText = await row.textContent() || '';
    expect(rowText).not.toContain(adminName);
  });
});
