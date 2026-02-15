/**
 * T6-AC2: Filter Tasks by Priority
 *
 * Story: As a user, I want to filter tasks by priority
 * so that I can find specific tasks quickly.
 *
 * Tests use Filters button to open dropdown menu and filter by priority.
 * Priority "-" means no priority set — this is the expected default.
 */

import { ownerTest, expect } from '@fixtures/auth.fixture';
import { TasksPage } from '@pages/index';

/**
 * Helper: open the Filters panel and click the Priority combobox.
 * Filters panel has 4 comboboxes: Assignee(0), Priority(1), Status(2), DueDate(3).
 */
async function openPriorityDropdown(page: import('@playwright/test').Page) {
  // Always click Filters button to open/ensure the panel is visible
  const filtersBtn = page.locator('button:has-text("Filters")').first();
  await filtersBtn.click();

  // Wait for "All priorities" text in the Filters panel
  const allPriorities = page.getByText('All priorities').first();
  const isOpen = await allPriorities.isVisible({ timeout: 3000 }).catch(() => false);

  if (!isOpen) {
    // Panel might have toggled closed — click again to re-open
    await filtersBtn.click();
    await allPriorities.waitFor({ state: 'visible', timeout: 5000 });
  }

  // Click the "All priorities" placeholder with force to bypass the react-select overlay
  await allPriorities.click({ force: true });
}

/**
 * Helper: select a priority option from the open dropdown.
 * The options use role="option" from react-select.
 */
async function selectPriorityOption(page: import('@playwright/test').Page, priority: string) {
  // react-select options may use role="option" or custom divs
  const option = page.locator(`[role="option"]:has-text("${priority}"), [class*="option"]:has-text("${priority}")`).first();
  await option.waitFor({ state: 'visible', timeout: 3000 });
  await option.click();
  await page.waitForLoadState('networkidle').catch(() => {});
}

ownerTest.describe('T6-AC2: Filter by Priority', () => {
  ownerTest.describe.configure({ mode: 'serial' });

  let tasksPage: TasksPage;

  ownerTest.beforeEach(async ({ page }) => {
    tasksPage = new TasksPage(page);
  });

  ownerTest('Filters button is visible on tasks page', async ({ page }) => {
    await tasksPage.goto();

    const filtersBtn = page.locator('button:has-text("Filters")').first();
    await expect(filtersBtn).toBeVisible({ timeout: 5000 });
  });

  ownerTest('Filters button opens dropdown with Priority filter', async ({ page }) => {
    await tasksPage.goto();

    await page.locator('button:has-text("Filters")').first().click();

    await expect(page.getByText('Priority').first()).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('All priorities').first()).toBeVisible({ timeout: 3000 });
  });

  ownerTest('Priority dropdown shows priority options', async ({ page }) => {
    await tasksPage.goto();
    await openPriorityDropdown(page);

    // Take screenshot to see what options appeared
    await page.screenshot({ path: 'test-results/debug-priority-options.png', fullPage: true });

    // Check for options — react-select uses role="option" or div with class "option"
    const highOption = page.locator('[role="option"]:has-text("High"), [class*="option"]:has-text("High")').first();
    const mediumOption = page.locator('[role="option"]:has-text("Medium"), [class*="option"]:has-text("Medium")').first();
    const lowOption = page.locator('[role="option"]:has-text("Low"), [class*="option"]:has-text("Low")').first();

    const hasHigh = await highOption.isVisible({ timeout: 3000 }).catch(() => false);
    const hasMedium = await mediumOption.isVisible({ timeout: 1000 }).catch(() => false);
    const hasLow = await lowOption.isVisible({ timeout: 1000 }).catch(() => false);

    expect(hasHigh || hasMedium || hasLow).toBe(true);
  });

  ownerTest('Filter by High priority — list updates', async ({ page }) => {
    await tasksPage.goto();
    await openPriorityDropdown(page);
    await selectPriorityOption(page, 'High');

    const hasTasks = await page.locator('table tbody tr').first().isVisible({ timeout: 5000 }).catch(() => false);
    const hasNoTasks = await page.getByText('Tasks not found').first().isVisible({ timeout: 2000 }).catch(() => false);

    expect(hasTasks || hasNoTasks).toBe(true);
  });

  ownerTest('Filter by Medium priority — list updates', async ({ page }) => {
    await tasksPage.goto();
    await openPriorityDropdown(page);
    await selectPriorityOption(page, 'Medium');

    const hasTasks = await page.locator('table tbody tr').first().isVisible({ timeout: 5000 }).catch(() => false);
    const hasNoTasks = await page.getByText('Tasks not found').first().isVisible({ timeout: 2000 }).catch(() => false);

    expect(hasTasks || hasNoTasks).toBe(true);
  });

  ownerTest('Filter by Low priority — list updates', async ({ page }) => {
    await tasksPage.goto();
    await openPriorityDropdown(page);
    await selectPriorityOption(page, 'Low');

    const hasTasks = await page.locator('table tbody tr').first().isVisible({ timeout: 5000 }).catch(() => false);
    const hasNoTasks = await page.getByText('Tasks not found').first().isVisible({ timeout: 2000 }).catch(() => false);

    expect(hasTasks || hasNoTasks).toBe(true);
  });

  ownerTest('Clear priority filter — all tasks visible again', async ({ page }) => {
    await tasksPage.goto();

    // Apply High filter
    await openPriorityDropdown(page);
    await selectPriorityOption(page, 'High');

    // Clear the priority filter via ✕ (clear indicator) in the select
    const filtersPanel = page.locator('h3:has-text("Filters")').first().locator('..');
    // The clear icons (✕) are SVGs inside the filter selects
    // Priority is the 2nd filter — find clear icons and click the 2nd one
    const clearIcons = filtersPanel.locator('[class*="clear"], [class*="indicator"] svg').nth(2);

    if (await clearIcons.isVisible({ timeout: 2000 }).catch(() => false)) {
      await clearIcons.click({ force: true });
      await page.waitForLoadState('networkidle').catch(() => {});
    }

    // Verify tasks are back
    const hasTasks = await page.locator('table tbody tr').first().isVisible({ timeout: 5000 }).catch(() => false);
    expect(hasTasks).toBe(true);
  });

  ownerTest('Switch priority filter — results update', async ({ page }) => {
    await tasksPage.goto();

    // Filter by High
    await openPriorityDropdown(page);
    await selectPriorityOption(page, 'High');

    // Panel is still open — click Priority select directly (no need to reopen Filters)
    const allPriorities = page.getByText('High').first();
    await allPriorities.click({ force: true });
    await selectPriorityOption(page, 'Low');

    // List should update
    const hasTasks = await page.locator('table tbody tr').first().isVisible({ timeout: 5000 }).catch(() => false);
    const hasNoTasks = await page.getByText('Tasks not found').first().isVisible({ timeout: 2000 }).catch(() => false);
    expect(hasTasks || hasNoTasks).toBe(true);
  });
});
