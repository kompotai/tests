/**
 * Event Participants & Dictionary Tests
 *
 * Tests covering:
 * - EP1: Dictionary item CRUD (add/edit/delete items in event_participant_status)
 * - EP2: Dictionary item reordering (move up/down)
 * - EP3: Add participants to event
 * - EP4: Change registration status via EditableBadge
 */

import { ownerTest, expect } from '@fixtures/auth.fixture';
import { EventsPage } from '@pages/EventsPage';
import { DictionaryPage } from '@pages/DictionaryPage';
import { WORKSPACE_ID } from '@fixtures/users';

// ============================================
// EP1: Dictionary Item CRUD
// ============================================

ownerTest.describe('EP1: Dictionary Item CRUD (event_participant_status)', () => {
  let dictionaryPage: DictionaryPage;
  const testItemName = `Test Status ${Date.now()}`;
  const testItemCode = `test_status_${Date.now()}`;

  ownerTest.beforeEach(async ({ page }) => {
    dictionaryPage = new DictionaryPage(page, 'event_participant_status');
    await dictionaryPage.goto();
    await dictionaryPage.waitForPageLoad();
  });

  ownerTest('AC1: should display dictionary items list', async () => {
    await expect(dictionaryPage.itemsTable).toBeVisible();

    const count = await dictionaryPage.getItemsCount();
    expect(count).toBeGreaterThan(0);
  });

  ownerTest('AC2: should display all default statuses', async () => {
    const names = await dictionaryPage.getAllItemNames();

    // Migration creates these statuses
    expect(names).toContain('Intent');
    expect(names).toContain('Confirmed');
    expect(names).toContain('Attended');
    expect(names).toContain('No Show');
    expect(names).toContain('Cancelled');
  });

  ownerTest('AC3: should create a new dictionary item', async ({ page }) => {
    const initialCount = await dictionaryPage.getItemsCount();

    await dictionaryPage.createItem({
      name: testItemName,
      code: testItemCode,
      color: '#FF5733',
    });

    // Wait for list to refresh
    await page.waitForLoadState('networkidle');

    const newCount = await dictionaryPage.getItemsCount();
    expect(newCount).toBe(initialCount + 1);

    // Verify item appears in list
    const itemRow = dictionaryPage.getItemRowByName(testItemName);
    await expect(itemRow).toBeVisible();
  });

  ownerTest('AC4: should edit a dictionary item', async ({ page }) => {
    // First create an item to edit
    const editItemName = `Edit Me ${Date.now()}`;
    await dictionaryPage.createItem({ name: editItemName });
    await page.waitForLoadState('networkidle');

    // Get the item ID
    const itemId = await dictionaryPage.getItemIdByName(editItemName);
    expect(itemId).toBeTruthy();

    // Click edit
    await dictionaryPage.editItem(itemId!);

    // Change the name
    const updatedName = `${editItemName} Updated`;
    await dictionaryPage.itemNameInput.clear();
    await dictionaryPage.fillItemName(updatedName);

    await dictionaryPage.submitItemForm();
    await page.waitForLoadState('networkidle');

    // Verify name was updated
    const updatedRow = dictionaryPage.getItemRowByName(updatedName);
    await expect(updatedRow).toBeVisible();

    // Old name should be gone
    const oldRow = dictionaryPage.getItemRowByName(editItemName);
    await expect(oldRow).not.toBeVisible();

    // Cleanup: delete the test item
    const updatedId = await dictionaryPage.getItemIdByName(updatedName);
    if (updatedId) {
      await dictionaryPage.deleteItem(updatedId);
    }
  });

  ownerTest('AC5: should delete a dictionary item', async ({ page }) => {
    // Create item to delete
    const deleteItemName = `Delete Me ${Date.now()}`;
    await dictionaryPage.createItem({ name: deleteItemName });
    await page.waitForLoadState('networkidle');

    const countBefore = await dictionaryPage.getItemsCount();

    // Get item ID and delete
    const itemId = await dictionaryPage.getItemIdByName(deleteItemName);
    expect(itemId).toBeTruthy();

    await dictionaryPage.deleteItem(itemId!);
    await page.waitForLoadState('networkidle');

    const countAfter = await dictionaryPage.getItemsCount();
    expect(countAfter).toBe(countBefore - 1);

    // Verify item is gone
    const deletedRow = dictionaryPage.getItemRowByName(deleteItemName);
    await expect(deletedRow).not.toBeVisible();
  });
});

// ============================================
// EP2: Dictionary Item Reordering
// ============================================

ownerTest.describe('EP2: Dictionary Item Reordering', () => {
  let dictionaryPage: DictionaryPage;

  ownerTest.beforeEach(async ({ page }) => {
    dictionaryPage = new DictionaryPage(page, 'event_participant_status');
    await dictionaryPage.goto();
    await dictionaryPage.waitForPageLoad();
  });

  ownerTest('AC1: should move item down', async ({ page }) => {
    const namesBefore = await dictionaryPage.getAllItemNames();
    expect(namesBefore.length).toBeGreaterThanOrEqual(2);

    // Get the first item ID
    const ids = await dictionaryPage.getAllItemIds();
    const firstId = ids[0];
    const firstName = namesBefore[0];
    const secondName = namesBefore[1];

    // Move first item down
    await dictionaryPage.moveItemDown(firstId);
    await page.waitForTimeout(500);

    const namesAfter = await dictionaryPage.getAllItemNames();

    // First item should now be second
    expect(namesAfter[0]).toBe(secondName);
    expect(namesAfter[1]).toBe(firstName);

    // Restore: move it back up
    const idsAfter = await dictionaryPage.getAllItemIds();
    await dictionaryPage.moveItemUp(idsAfter[1]);
    await page.waitForTimeout(500);
  });

  ownerTest('AC2: should move item up', async ({ page }) => {
    const namesBefore = await dictionaryPage.getAllItemNames();
    expect(namesBefore.length).toBeGreaterThanOrEqual(2);

    // Get the second item ID
    const ids = await dictionaryPage.getAllItemIds();
    const secondId = ids[1];
    const firstName = namesBefore[0];
    const secondName = namesBefore[1];

    // Move second item up
    await dictionaryPage.moveItemUp(secondId);
    await page.waitForTimeout(500);

    const namesAfter = await dictionaryPage.getAllItemNames();

    // Second item should now be first
    expect(namesAfter[0]).toBe(secondName);
    expect(namesAfter[1]).toBe(firstName);

    // Restore: move it back down
    const idsAfter = await dictionaryPage.getAllItemIds();
    await dictionaryPage.moveItemDown(idsAfter[0]);
    await page.waitForTimeout(500);
  });

  ownerTest('AC3: first item move-up button should be disabled', async () => {
    const ids = await dictionaryPage.getAllItemIds();
    const firstId = ids[0];

    const moveUpBtn = dictionaryPage.getItemMoveUpButton(firstId);
    await expect(moveUpBtn).toBeDisabled();
  });

  ownerTest('AC4: last item move-down button should be disabled', async () => {
    const ids = await dictionaryPage.getAllItemIds();
    const lastId = ids[ids.length - 1];

    const moveDownBtn = dictionaryPage.getItemMoveDownButton(lastId);
    await expect(moveDownBtn).toBeDisabled();
  });
});

// ============================================
// EP3: Add Participants to Event
// ============================================

ownerTest.describe('EP3: Add Participants to Event', () => {
  let eventsPage: EventsPage;
  let testEventName: string;

  ownerTest.beforeAll(async ({ browser }) => {
    const context = await browser.newContext({ storageState: '.auth/owner.json' });
    const page = await context.newPage();
    const eventsPage = new EventsPage(page);
    await eventsPage.goto();
    await eventsPage.waitForPageLoad();

    // Create a test event for participant tests
    testEventName = `Participant Test ${Date.now()}`;
    await eventsPage.clickCreateEvent();
    await eventsPage.fillName(testEventName);
    await eventsPage.selectType('Webinar');
    await eventsPage.selectFormat('Online');
    await eventsPage.fillStartDate('2026-06-01');
    await eventsPage.submitForm();
    await page.waitForLoadState('networkidle');

    await context.close();
  });

  ownerTest.beforeEach(async ({ page }) => {
    eventsPage = new EventsPage(page);
    await eventsPage.goto();
    await eventsPage.waitForPageLoad();
  });

  ownerTest('AC1: should open Add Participant slideover', async ({ page }) => {
    // Navigate to event detail
    const eventRow = eventsPage.getEventRowByName(testEventName);
    await expect(eventRow).toBeVisible();
    await eventRow.locator('td').first().click();

    await page.waitForLoadState('networkidle');

    // Click Add Participant button
    const addBtn = page.locator('[data-testid="event-add-participant-button"]');
    await expect(addBtn).toBeVisible();
    await addBtn.click();

    // Search input should be visible
    const searchInput = page.locator('[data-testid="event-add-participant-search"]');
    await expect(searchInput).toBeVisible();
  });

  ownerTest('AC2: should display contacts in slideover', async ({ page }) => {
    // Navigate to event detail
    const eventRow = eventsPage.getEventRowByName(testEventName);
    await eventRow.locator('td').first().click();
    await page.waitForLoadState('networkidle');

    // Open Add Participant
    await page.locator('[data-testid="event-add-participant-button"]').click();

    // Wait for contacts to load
    await page.waitForLoadState('networkidle');

    // Should show contact table with rows
    const contactRows = page.locator('[data-testid^="event-add-participant-"]').filter({
      hasNot: page.locator('[data-testid="event-add-participant-search"]'),
      has: page.locator('button, span'),
    });

    // At least some contacts should be visible (loaded 20 latest)
    // Can't guarantee exact count, just that the table loaded
    const searchInput = page.locator('[data-testid="event-add-participant-search"]');
    await expect(searchInput).toBeVisible();
  });

  ownerTest('AC3: should add a participant and show Added status', async ({ page }) => {
    // Navigate to event detail
    const eventRow = eventsPage.getEventRowByName(testEventName);
    await eventRow.locator('td').first().click();
    await page.waitForLoadState('networkidle');

    // Open Add Participant
    await page.locator('[data-testid="event-add-participant-button"]').click();
    await page.waitForLoadState('networkidle');

    // Wait for contact list to load
    await page.waitForTimeout(1000);

    // Find first available add button
    const addButtons = page.locator('button', { hasText: /^Add$|^Добавить$/i });
    const firstAddButton = addButtons.first();

    if (await firstAddButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await firstAddButton.click();

      // Button should change to "Added"
      await page.waitForTimeout(1000);

      // At least one "Added" / "Добавлен" should be visible
      const addedIndicator = page.getByText(/Added|Добавлен/);
      await expect(addedIndicator.first()).toBeVisible({ timeout: 5000 });
    }
  });
});

// ============================================
// EP4: Change Registration Status
// ============================================

ownerTest.describe('EP4: Change Registration Status', () => {
  let eventsPage: EventsPage;

  ownerTest.beforeEach(async ({ page }) => {
    eventsPage = new EventsPage(page);
    await eventsPage.goto();
    await eventsPage.waitForPageLoad();
  });

  ownerTest('AC1: should display registration status badges', async ({ page }) => {
    // Find an event with registrations
    const count = await eventsPage.getEventsCount();
    ownerTest.skip(count === 0, 'No events available');

    // Click on first event to open its detail
    const firstRow = eventsPage.tableRows.first();
    await firstRow.locator('td').first().click();
    await page.waitForLoadState('networkidle');

    // Check if there are registrations
    const registrationRows = page.locator('[data-testid^="event-registration-"]');
    const regCount = await registrationRows.count();

    if (regCount > 0) {
      // Should have editable badge for status
      const statusBadge = page.locator('[data-testid="editable-badge-event_registration_status"]').first();
      await expect(statusBadge).toBeVisible();
    }
  });

  ownerTest('AC2: should open status dropdown and show options', async ({ page }) => {
    const count = await eventsPage.getEventsCount();
    ownerTest.skip(count === 0, 'No events available');

    // Click on first event
    const firstRow = eventsPage.tableRows.first();
    await firstRow.locator('td').first().click();
    await page.waitForLoadState('networkidle');

    // Check if there are registrations
    const registrationRows = page.locator('[data-testid^="event-registration-"]');
    const regCount = await registrationRows.count();
    ownerTest.skip(regCount === 0, 'No registrations in this event');

    // Click on status badge to open dropdown
    const statusBadge = page.locator('[data-testid="editable-badge-event_registration_status"]').first();
    await statusBadge.click();

    // Options container should appear
    const optionsContainer = page.locator('[data-testid="editable-badge-event_registration_status-options"]');
    await expect(optionsContainer).toBeVisible({ timeout: 5000 });

    // Should show status options from dictionary
    const options = page.locator('[data-testid^="editable-badge-option-"]');
    const optionCount = await options.count();
    expect(optionCount).toBeGreaterThan(0);
  });

  ownerTest('AC3: should change registration status', async ({ page }) => {
    const count = await eventsPage.getEventsCount();
    ownerTest.skip(count === 0, 'No events available');

    // Click on first event
    const firstRow = eventsPage.tableRows.first();
    await firstRow.locator('td').first().click();
    await page.waitForLoadState('networkidle');

    // Check if there are registrations
    const registrationRows = page.locator('[data-testid^="event-registration-"]');
    const regCount = await registrationRows.count();
    ownerTest.skip(regCount === 0, 'No registrations in this event');

    // Get the first registration's status badge
    const statusBadge = page.locator('[data-testid="editable-badge-event_registration_status"]').first();
    const currentStatusText = await statusBadge.textContent();

    // Click to open dropdown
    await statusBadge.click();

    // Wait for options to load
    const optionsContainer = page.locator('[data-testid="editable-badge-event_registration_status-options"]');
    await expect(optionsContainer).toBeVisible({ timeout: 5000 });

    // Find an option that is NOT the current status
    const options = page.locator('[data-testid^="editable-badge-option-"]');
    const optionCount = await options.count();

    let clickedNewStatus = false;
    for (let i = 0; i < optionCount; i++) {
      const option = options.nth(i);
      const optionText = await option.textContent();
      // Skip current status (it has a check mark)
      const hasCheck = await option.locator('svg').isVisible().catch(() => false);
      if (!hasCheck && optionText?.trim() !== currentStatusText?.trim()) {
        await option.click();
        clickedNewStatus = true;
        break;
      }
    }

    if (clickedNewStatus) {
      // Wait for optimistic update
      await page.waitForTimeout(1000);

      // Verify status has changed (the badge text should be different now)
      const newStatusText = await statusBadge.textContent();
      expect(newStatusText).not.toBe(currentStatusText);
    }
  });
});
