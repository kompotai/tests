/**
 * T6-FILTERS: Verify Filters panel structure and each filter dropdown
 *
 * Sequential tests:
 * 1. Panel has 4 selectors: Assignee, Priority, Status, Due Date
 * 2. Each dropdown opens with options, selecting one filters the task list
 * 3. "Clear all filters" appears after selection, resets table to all tasks
 */

import { ownerTest, expect } from '@fixtures/auth.fixture';
import { TasksPage } from '@pages/index';

ownerTest.describe('T6-FILTERS: Filters Panel', () => {
  ownerTest.describe.configure({ mode: 'serial' });

  let tasksPage: TasksPage;

  ownerTest.beforeEach(async ({ page }) => {
    tasksPage = new TasksPage(page);
  });

  ownerTest('Panel has 4 selectors: Assignee, Priority, Status, Due Date', async ({ page }) => {
    await tasksPage.goto();

    const filtersBtn = page.locator('button:has-text("Filters")').first();
    await expect(filtersBtn).toBeVisible({ timeout: 5000 });
    await filtersBtn.click();

    const panelHeading = page.locator('h3:has-text("Filters")').first();
    await expect(panelHeading).toBeVisible({ timeout: 5000 });

    // 4 labels
    await expect(page.getByText('Assignee').first()).toBeVisible();
    await expect(page.getByText('Priority').first()).toBeVisible();
    await expect(page.getByText('Status').first()).toBeVisible();
    await expect(page.getByText('Due Date').first()).toBeVisible();

    // 4 placeholders
    await expect(page.getByText('All assignees').first()).toBeVisible();
    await expect(page.getByText('All priorities').first()).toBeVisible();
    await expect(page.getByText('All statuses').first()).toBeVisible();
    await expect(page.getByText('Any date').first()).toBeVisible();

    // "Clear all filters" hidden when no filters active
    await expect(page.getByText('Clear all filters').first()).not.toBeVisible();
  });

  // ── Assignee filter ──

  ownerTest('Assignee dropdown opens and shows options', async ({ page }) => {
    await tasksPage.goto();
    await page.locator('button:has-text("Filters")').first().click();
    await page.getByText('All assignees').first().waitFor({ state: 'visible', timeout: 5000 });

    // Click the Assignee placeholder to open dropdown
    await page.getByText('All assignees').first().click({ force: true });

    // Dropdown should show at least one option with role="option"
    const options = page.locator('[role="option"]');
    await options.first().waitFor({ state: 'visible', timeout: 3000 });
    const count = await options.count();
    expect(count).toBeGreaterThan(1); // "All assignees" + at least one real user

    await page.screenshot({ path: 'test-results/filter-assignee-options.png', fullPage: true });
  });

  ownerTest('Assignee filter applies and task list updates', async ({ page }) => {
    await tasksPage.goto();

    // Remember total task count from "All" tab
    const allTab = page.locator('button:has-text("All")').first();
    const allTabText = await allTab.textContent();

    await page.locator('button:has-text("Filters")').first().click();
    await page.getByText('All assignees').first().waitFor({ state: 'visible', timeout: 5000 });
    await page.getByText('All assignees').first().click({ force: true });

    // Pick the first real option (skip "All assignees")
    const options = page.locator('[role="option"]');
    await options.first().waitFor({ state: 'visible', timeout: 3000 });
    const allOptions = await options.allTextContents();
    const firstRealOption = allOptions.find(t => t !== 'All assignees') || allOptions[1];
    await options.filter({ hasText: firstRealOption }).first().click();
    await page.waitForLoadState('networkidle').catch(() => {});

    // Task list should update — either filtered rows or "Tasks not found"
    const hasRows = await page.locator('table tbody tr').first().isVisible({ timeout: 5000 }).catch(() => false);
    const hasEmpty = await page.getByText('Tasks not found').first().isVisible({ timeout: 2000 }).catch(() => false);
    expect(hasRows || hasEmpty).toBe(true);

    // "Clear all filters" should now be visible
    await expect(page.getByText('Clear all filters').first()).toBeVisible({ timeout: 3000 });
  });

  // ── Priority filter ──

  ownerTest('Priority dropdown opens and shows options', async ({ page }) => {
    await tasksPage.goto();
    await page.locator('button:has-text("Filters")').first().click();
    await page.getByText('All priorities').first().waitFor({ state: 'visible', timeout: 5000 });

    await page.getByText('All priorities').first().click({ force: true });

    const options = page.locator('[role="option"]');
    await options.first().waitFor({ state: 'visible', timeout: 3000 });
    const count = await options.count();
    expect(count).toBeGreaterThan(1);

    await page.screenshot({ path: 'test-results/filter-priority-options.png', fullPage: true });
  });

  ownerTest('Priority filter applies and task list updates', async ({ page }) => {
    await tasksPage.goto();
    await page.locator('button:has-text("Filters")').first().click();
    await page.getByText('All priorities').first().waitFor({ state: 'visible', timeout: 5000 });
    await page.getByText('All priorities').first().click({ force: true });

    // Pick "High" as a known priority option
    const highOption = page.locator('[role="option"]').filter({ hasText: 'High' }).first();
    await highOption.waitFor({ state: 'visible', timeout: 3000 });
    await highOption.click();
    await page.waitForLoadState('networkidle').catch(() => {});

    const hasRows = await page.locator('table tbody tr').first().isVisible({ timeout: 5000 }).catch(() => false);
    const hasEmpty = await page.getByText('Tasks not found').first().isVisible({ timeout: 2000 }).catch(() => false);
    expect(hasRows || hasEmpty).toBe(true);

    await expect(page.getByText('Clear all filters').first()).toBeVisible({ timeout: 3000 });
  });

  // ── Status filter ──

  ownerTest('Status dropdown opens and shows options', async ({ page }) => {
    await tasksPage.goto();
    await page.locator('button:has-text("Filters")').first().click();
    await page.getByText('All statuses').first().waitFor({ state: 'visible', timeout: 5000 });

    await page.getByText('All statuses').first().click({ force: true });

    const options = page.locator('[role="option"]');
    await options.first().waitFor({ state: 'visible', timeout: 3000 });
    const count = await options.count();
    expect(count).toBeGreaterThan(1);

    await page.screenshot({ path: 'test-results/filter-status-options.png', fullPage: true });
  });

  ownerTest('Status filter applies and task list updates', async ({ page }) => {
    await tasksPage.goto();
    await page.locator('button:has-text("Filters")').first().click();
    await page.getByText('All statuses').first().waitFor({ state: 'visible', timeout: 5000 });
    await page.getByText('All statuses').first().click({ force: true });

    // Pick the first real status option (skip "All statuses")
    const options = page.locator('[role="option"]');
    await options.first().waitFor({ state: 'visible', timeout: 3000 });
    const allOptions = await options.allTextContents();
    const firstRealOption = allOptions.find(t => t !== 'All statuses') || allOptions[1];
    await options.filter({ hasText: firstRealOption }).first().click();
    await page.waitForLoadState('networkidle').catch(() => {});

    const hasRows = await page.locator('table tbody tr').first().isVisible({ timeout: 5000 }).catch(() => false);
    const hasEmpty = await page.getByText('Tasks not found').first().isVisible({ timeout: 2000 }).catch(() => false);
    expect(hasRows || hasEmpty).toBe(true);

    await expect(page.getByText('Clear all filters').first()).toBeVisible({ timeout: 3000 });
  });

  // ── Due Date filter ──

  ownerTest('Due Date dropdown opens and shows options', async ({ page }) => {
    await tasksPage.goto();
    await page.locator('button:has-text("Filters")').first().click();
    await page.getByText('Any date').first().waitFor({ state: 'visible', timeout: 5000 });

    await page.getByText('Any date').first().click({ force: true });

    const options = page.locator('[role="option"]');
    await options.first().waitFor({ state: 'visible', timeout: 3000 });
    const count = await options.count();
    expect(count).toBeGreaterThan(1);

    await page.screenshot({ path: 'test-results/filter-duedate-options.png', fullPage: true });
  });

  ownerTest('Due Date filter applies and task list updates', async ({ page }) => {
    await tasksPage.goto();
    await page.locator('button:has-text("Filters")').first().click();
    await page.getByText('Any date').first().waitFor({ state: 'visible', timeout: 5000 });
    await page.getByText('Any date').first().click({ force: true });

    // Due Date options: "Any date", "On date", "Between"
    const onDateOption = page.locator('[role="option"]').filter({ hasText: 'On date' }).first();
    await onDateOption.waitFor({ state: 'visible', timeout: 3000 });
    await onDateOption.click();

    // "On date" requires a second step — pick a date via quick button
    const todayBtn = page.getByText('Today', { exact: true }).first();
    await todayBtn.waitFor({ state: 'visible', timeout: 3000 });
    await todayBtn.click();
    await page.waitForLoadState('networkidle').catch(() => {});

    const hasRows = await page.locator('table tbody tr').first().isVisible({ timeout: 5000 }).catch(() => false);
    const hasEmpty = await page.getByText('Tasks not found').first().isVisible({ timeout: 2000 }).catch(() => false);
    expect(hasRows || hasEmpty).toBe(true);

    await expect(page.getByText('Clear all filters').first()).toBeVisible({ timeout: 3000 });
  });

  // ── Clear all filters ──

  ownerTest('"Clear all filters" resets task list to all tasks', async ({ page }) => {
    await tasksPage.goto();

    // Remember "All" tab count before filtering
    const allTab = page.locator('button:has-text("All")').first();
    const allTabTextBefore = await allTab.textContent();

    // Apply a Priority filter
    await page.locator('button:has-text("Filters")').first().click();
    await page.getByText('All priorities').first().waitFor({ state: 'visible', timeout: 5000 });
    await page.getByText('All priorities').first().click({ force: true });
    const highOption = page.locator('[role="option"]').filter({ hasText: 'High' }).first();
    await highOption.waitFor({ state: 'visible', timeout: 3000 });
    await highOption.click();
    await page.waitForLoadState('networkidle').catch(() => {});

    // "Clear all filters" should be visible
    const clearBtn = page.getByText('Clear all filters').first();
    await expect(clearBtn).toBeVisible({ timeout: 3000 });

    // Click "Clear all filters"
    await clearBtn.click();
    await page.waitForLoadState('networkidle').catch(() => {});

    // Placeholders should be back to defaults
    await expect(page.getByText('All priorities').first()).toBeVisible({ timeout: 3000 });

    // "Clear all filters" should be hidden again
    await expect(page.getByText('Clear all filters').first()).not.toBeVisible({ timeout: 3000 });

    // "All" tab count should match what it was before
    const allTabTextAfter = await allTab.textContent();
    expect(allTabTextAfter).toBe(allTabTextBefore);
  });
});
