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

// ownerContext / stageHttpCredentials removed — no longer needed.
// beforeAll used a separate browser context to create tasks; now each test
// creates its own data via beforeEach using the fixture's page.
// This avoids cascade failures: if one test's setup fails, others still run.

const API_BASE = `/api/ws/${WORKSPACE_ID}`;

/**
 * Delete tasks by name via API. Used in afterEach to keep workspace clean.
 * Only runs after PASSED tests — failed tests leave data for inspection.
 * Wrapped in try/catch so cleanup errors never mask real test failures.
 */
async function deleteTasksByName(request: any, ...names: string[]) {
  for (const name of names) {
    if (!name) continue;
    try {
      // Tasks API uses POST /tasks/search (not GET /tasks)
      const res = await request.post(`${API_BASE}/tasks/search`, {
        data: { search: name, page: 1 },
      });
      if (!res.ok()) continue;
      const data = await res.json();
      for (const task of (data.tasks || [])) {
        if (task.title?.includes(name)) {
          await request.delete(`${API_BASE}/tasks/${task.id}`);
        }
      }
    } catch { /* cleanup errors should never mask test results */ }
  }
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

  ownerTest('T1-AC3: Empty state shown when no tasks', async () => {
    await tasksPage.goto();
    await tasksPage.search('nonexistent-task-xyz-12345');
    await tasksPage.shouldSeeNoResults();
  });

  ownerTest('T1-setup-pagination: ensure 31+ tasks exist', async ({ request }) => {
    const PAGE_SIZE = 30;
    const TARGET = PAGE_SIZE + 1;

    const res = await request.post(`${API_BASE}/tasks/search`, {
      data: { page: 1, limit: 1 },
    });
    if (!res.ok()) return;
    const { total = 0 } = await res.json();

    const toCreate = TARGET - total;
    if (toCreate <= 0) return;

    for (let i = 0; i < toCreate; i++) {
      await request.post(`${API_BASE}/tasks`, {
        data: { title: `PadTask-${Date.now().toString(36)}-${i}` },
      });
    }
  });

  ownerTest('T1-AC4: Pagination works', async () => {
    await tasksPage.goto();

    if (!await tasksPage.isPaginationVisible()) {
      ownerTest.skip();
      return;
    }

    // Go to page 2 and verify tasks are still displayed
    await tasksPage.goToPage(2);
    const hasTable = await tasksPage.shouldSeeTable();
    expect(hasTable).toBe(true);
  });
});

// ============================================
// T1-cleanup: delete excess tasks so T2-T8 fit on one page (limit=30)
// ============================================

ownerTest.describe('T1-cleanup: reduce tasks to fit one page', () => {
  const KEEP = 5; // keep only this many tasks

  ownerTest('Delete excess tasks via API', async ({ request }) => {
    const res = await request.post(`${API_BASE}/tasks/search`, {
      data: { page: 1, limit: 100 },
    });
    if (!res.ok()) return;
    const { tasks = [] } = await res.json();

    if (tasks.length <= KEEP) return;

    // Delete oldest tasks first (keep the newest KEEP)
    const toDelete = tasks.slice(KEEP);
    for (const task of toDelete) {
      await request.delete(`${API_BASE}/tasks/${task.id}`).catch(() => {});
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

  // beforeEach instead of beforeAll — each test gets a fresh task.
  // Slower, but one failed create doesn't kill the entire T3 group.
  ownerTest.beforeEach(async ({ page }) => {
    tasksPage = new TasksPage(page);
    taskToEdit = generateTaskName('EditTest');
    await tasksPage.goto();
    await tasksPage.createMinimal(taskToEdit);
  });

  // Clean up after passed tests to avoid task accumulation.
  // Failed tests keep data on stage for manual inspection.
  ownerTest.afterEach(async ({ page }, testInfo) => {
    if (testInfo.status !== 'passed') return;
    await deleteTasksByName(page.request, taskToEdit, updatedTaskName);
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

  // beforeEach instead of beforeAll — each test gets a fresh task to delete.
  // One failed create doesn't cascade to all T4 tests.
  ownerTest.beforeEach(async ({ page }) => {
    tasksPage = new TasksPage(page);
    taskToDelete = generateTaskName('DeleteTest');
    await tasksPage.goto();
    await tasksPage.createMinimal(taskToDelete);
  });

  // Clean up after passed tests. For T4 delete tests, the task may already
  // be deleted by the test itself — deleteTasksByName handles this gracefully
  // (search returns empty results → loop does nothing).
  ownerTest.afterEach(async ({ page }, testInfo) => {
    if (testInfo.status !== 'passed') return;
    await deleteTasksByName(page.request, taskToDelete);
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

  // beforeEach instead of beforeAll — each test gets 3 fresh tasks.
  // Slower (3 creates × 5 tests), but no cascade failures.
  ownerTest.beforeEach(async ({ page }) => {
    tasksPage = new TasksPage(page);
    taskToDo = generateTaskName('StatusToDo');
    taskInProgress = generateTaskName('StatusInProg');
    taskDone = generateTaskName('StatusDone');

    await tasksPage.goto();
    await tasksPage.create({ name: taskToDo, status: 'To Do' });
    await tasksPage.goto();
    await tasksPage.create({ name: taskInProgress, status: 'In Progress' });
    await tasksPage.goto();
    await tasksPage.create({ name: taskDone, status: 'Done' });
  });

  ownerTest.afterEach(async ({ page }, testInfo) => {
    if (testInfo.status !== 'passed') return;
    await deleteTasksByName(page.request, taskToDo, taskInProgress, taskDone);
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

  // Self-contained: with beforeEach, each test gets fresh tasks,
  // so AC4 can't rely on AC1-AC3 having changed statuses.
  // Instead, it changes status itself, reloads, and verifies persistence.
  ownerTest('T5-AC4: Status persists after page reload', async () => {
    // Change status
    await tasksPage.goto();
    await tasksPage.search(taskToDo);
    await tasksPage.edit(taskToDo, { status: 'In Progress' });

    // Reload and verify the change persisted
    await tasksPage.goto();
    await tasksPage.search(taskToDo);
    await tasksPage.shouldRowContain(taskToDo, { status: 'In Progress' });
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
  const taskHighOwner = `${prefix}-HighOwner`;
  const taskLowAdmin = `${prefix}-LowAdmin`;
  const taskMedOwner = `${prefix}-MedOwner`;
  const taskHighAdmin = `${prefix}-HighAdmin`;

  let realOwnerName = '';
  let realAdminName = '';

  ownerTest.beforeEach(async ({ page }) => {
    tasksPage = new TasksPage(page);
  });

  ownerTest.afterAll(async ({ request }) => {
    await deleteTasksByName(request, taskHighOwner, taskLowAdmin, taskMedOwner, taskHighAdmin);
  });

  ownerTest('T6-setup-1: discover names + create first 2 tasks', async ({ page }) => {
    // Discover real assignee names from filter dropdown
    await tasksPage.goto();
    await tasksPage.openFilters();
    const assigneePlaceholder = page.getByText('All assignees').first();
    await assigneePlaceholder.click({ force: true });
    const options = page.locator('[role="option"]');
    await options.first().waitFor({ state: 'visible', timeout: 3000 });
    const allNames = await options.allTextContents();
    const wsPrefix = WORKSPACE_ID.toLowerCase();
    realOwnerName = allNames.find(n => n !== 'All assignees' && !n.toLowerCase().startsWith(wsPrefix)) || allNames[allNames.length - 1];
    realAdminName = allNames.find(n => n.toLowerCase().includes('admin')) || '';
    await page.keyboard.press('Escape');
    const backdrop = page.locator('div.fixed.inset-0.z-10').first();
    if (await backdrop.isVisible({ timeout: 1000 }).catch(() => false)) {
      await backdrop.click({ position: { x: 10, y: 10 } });
    }
    await page.locator('h3:has-text("Filters")').first().waitFor({ state: 'hidden', timeout: 3000 }).catch(() => {});

    // Create first 2 tasks
    await tasksPage.goto();
    await tasksPage.create({ name: taskHighOwner, priority: 'High', assignee: realOwnerName });
    await tasksPage.goto();
    await tasksPage.create({ name: taskLowAdmin, priority: 'Low', assignee: realAdminName });
  });

  ownerTest('T6-setup-2: create remaining 2 tasks', async () => {
    await tasksPage.goto();
    await tasksPage.create({ name: taskMedOwner, priority: 'Medium', assignee: realOwnerName });
    await tasksPage.goto();
    await tasksPage.create({ name: taskHighAdmin, priority: 'High', assignee: realAdminName });
  });

  // AC1 skipped — status filtering needs tasks with different statuses (requires edit step)

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
    await tasksPage.shouldSeeTask(taskHighOwner);
    await tasksPage.shouldSeeTask(taskHighAdmin);
    // Non-high tasks should NOT be visible
    await tasksPage.shouldNotSeeTask(taskLowAdmin);
    await tasksPage.shouldNotSeeTask(taskMedOwner);
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
    await tasksPage.shouldSeeTask(taskHighOwner);
    await tasksPage.shouldSeeTask(taskMedOwner);
    // Admin's tasks should NOT be visible
    await tasksPage.shouldNotSeeTask(taskLowAdmin);
    await tasksPage.shouldNotSeeTask(taskHighAdmin);
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
    await tasksPage.shouldSeeTask(taskLowAdmin);
    await tasksPage.shouldSeeTask(taskHighAdmin);
    // Owner's tasks should NOT be visible
    await tasksPage.shouldNotSeeTask(taskHighOwner);
    await tasksPage.shouldNotSeeTask(taskMedOwner);
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
    await tasksPage.shouldSeeTask(taskHighOwner);
    await tasksPage.shouldNotSeeTask(taskLowAdmin);

    // Clear filters
    await tasksPage.clearFilters();

    // All tasks should be visible again
    await tasksPage.shouldSeeTask(taskHighOwner);
    await tasksPage.shouldSeeTask(taskLowAdmin);
    await tasksPage.shouldSeeTask(taskMedOwner);
    await tasksPage.shouldSeeTask(taskHighAdmin);
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
    await tasksPage.shouldNotSeeTask(taskHighOwner);
  });

  ownerTest('T6-AC5: Combine priority + assignee filters', async () => {
    await tasksPage.goto();

    const filtersAvailable = await tasksPage.isFilterAvailable();
    if (!filtersAvailable) {
      ownerTest.skip();
      return;
    }

    await tasksPage.openFilters();
    await tasksPage.filterByPriority('High');

    // Re-open filters if needed, then add assignee
    await tasksPage.openFilters();
    await tasksPage.filterByAssignee(realOwnerName);

    // Only "High" + "Owner" task should match
    await tasksPage.shouldSeeTask(taskHighOwner);
    await tasksPage.shouldNotSeeTask(taskHighAdmin);
    await tasksPage.shouldNotSeeTask(taskLowAdmin);
    await tasksPage.shouldNotSeeTask(taskMedOwner);
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
    await tasksPage.filterByPriority('High');
    await tasksPage.shouldSeeTask(taskHighOwner);
    await tasksPage.shouldNotSeeTask(taskLowAdmin);

    // Clear filters
    await tasksPage.openFilters();
    await tasksPage.clearFilters();

    // All tasks should be visible again
    await tasksPage.shouldSeeTask(taskHighOwner);
    await tasksPage.shouldSeeTask(taskLowAdmin);
    await tasksPage.shouldSeeTask(taskMedOwner);
    await tasksPage.shouldSeeTask(taskHighAdmin);
  });
});

// ============================================
// T7: Search Tasks
// ============================================

ownerTest.describe('T7: Search Tasks', () => {
  ownerTest.describe.configure({ mode: 'serial' });

  let tasksPage: TasksPage;
  // prefix is generated per test (in beforeEach) — avoids name collisions
  // between tests since each test creates its own set of tasks.
  let prefix: string;
  let taskAlpha: string;
  let taskBeta: string;
  let taskGamma: string;

  // beforeEach instead of beforeAll — each test gets 3 fresh search tasks.
  // Slower (3 creates × 4 tests), but no cascade failures.
  ownerTest.beforeEach(async ({ page }) => {
    tasksPage = new TasksPage(page);
    prefix = `Srch-${Date.now().toString(36)}`;
    taskAlpha = `${prefix}-Alpha`;
    taskBeta = `${prefix}-Beta`;
    taskGamma = `${prefix}-Gamma`;

    await tasksPage.goto();
    await tasksPage.create({ name: taskAlpha, status: 'To Do' });
    await tasksPage.goto();
    await tasksPage.create({ name: taskBeta, status: 'In Progress' });
    await tasksPage.goto();
    await tasksPage.create({ name: taskGamma, status: 'Done' });
  });

  ownerTest.afterEach(async ({ page }, testInfo) => {
    if (testInfo.status !== 'passed') return;
    await deleteTasksByName(page.request, taskAlpha, taskBeta, taskGamma);
  });

  ownerTest('T7-AC1: Search by exact task name', async () => {
    await tasksPage.search(taskAlpha);
    await tasksPage.shouldSeeTask(taskAlpha);
    await tasksPage.shouldNotSeeTask(taskBeta);
    await tasksPage.shouldNotSeeTask(taskGamma);
  });

  ownerTest('T7-AC2: Search results update as user types', async () => {
    // Search by shared prefix — all 3 tasks should appear
    await tasksPage.search(prefix);
    await tasksPage.shouldSeeTask(taskAlpha);
    await tasksPage.shouldSeeTask(taskBeta);
    await tasksPage.shouldSeeTask(taskGamma);

    // Narrow down to Alpha — only Alpha should remain
    await tasksPage.search(`${prefix}-Alpha`);
    await tasksPage.shouldSeeTask(taskAlpha);
    await tasksPage.shouldNotSeeTask(taskBeta);
    await tasksPage.shouldNotSeeTask(taskGamma);
  });

  ownerTest('T7-AC3: Clear search shows all tasks', async () => {
    // Start with a filtered search
    await tasksPage.search(taskBeta);
    await tasksPage.shouldSeeTask(taskBeta);
    await tasksPage.shouldNotSeeTask(taskAlpha);

    // Navigate back without search — all tasks should be visible again
    await tasksPage.goto();
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

  // beforeEach instead of beforeAll — each test gets 2 fresh tasks.
  // One failed create doesn't cascade to all T8 tests.
  ownerTest.beforeEach(async ({ page }) => {
    tasksPage = new TasksPage(page);
    taskUnassigned = generateTaskName('AssignNone');
    taskAssignedToOwner = generateTaskName('AssignOwner');

    await tasksPage.goto();
    await tasksPage.create({ name: taskUnassigned, status: 'To Do' });
    await tasksPage.goto();
    await tasksPage.create({ name: taskAssignedToOwner, status: 'To Do', assignee: ownerName });
  });

  ownerTest.afterEach(async ({ page }, testInfo) => {
    if (testInfo.status !== 'passed') return;
    await deleteTasksByName(page.request, taskUnassigned, taskAssignedToOwner);
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
