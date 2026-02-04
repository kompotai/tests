/**
 * Events Module Tests
 *
 * E2E tests for events management based on User Stories E1-E4.
 */

import { ownerTest, expect } from '@fixtures/auth.fixture';
import { EventsPage } from '@pages/EventsPage';

// Setup: Ensure at least one event exists for edit/filter tests
ownerTest.beforeAll(async ({ page }) => {
  const eventsPage = new EventsPage(page);
  await eventsPage.goto();
  await eventsPage.waitForPageLoad();

  const count = await eventsPage.getEventsCount();

  if (count === 0) {
    console.log('Creating initial test event for E2E tests...');

    await eventsPage.createEventButton.click();
    await eventsPage.fillName('E2E Test Event');
    await eventsPage.selectType('Webinar');
    await eventsPage.selectFormat('Online');
    await eventsPage.fillStartDate('2026-03-01');
    await eventsPage.submitForm();

    await page.waitForLoadState('networkidle');
  }
});

ownerTest.describe('E1: View Events List', () => {
  let eventsPage: EventsPage;

  ownerTest.beforeEach(async ({ page }) => {
    eventsPage = new EventsPage(page);
    await eventsPage.goto();
    await eventsPage.waitForPageLoad();
  });

  ownerTest('AC1-AC2: should display events table with all required columns', async () => {
    // Verify table exists
    await expect(eventsPage.eventsTable).toBeVisible();

    // Verify all required columns are present
    await expect(eventsPage.nameColumn).toBeVisible();
    await expect(eventsPage.codeColumn).toBeVisible();
    await expect(eventsPage.typeColumn).toBeVisible();
    await expect(eventsPage.formatColumn).toBeVisible();
    await expect(eventsPage.startDateColumn).toBeVisible();
    await expect(eventsPage.registrationsColumn).toBeVisible();

    const allColumnsVisible = await eventsPage.areAllColumnsVisible();
    expect(allColumnsVisible).toBeTruthy();
  });

  ownerTest('AC3-AC4: should show events or empty state correctly', async () => {
    const count = await eventsPage.getEventsCount();

    if (count === 0) {
      // Empty state should be visible
      await expect(eventsPage.emptyState).toBeVisible();
    } else {
      // Events should be displayed in table
      await expect(eventsPage.eventsTable).toBeVisible();
      await expect(eventsPage.tableRows.first()).toBeVisible();

      // Verify we can get event names
      const names = await eventsPage.getAllEventNames();
      expect(names.length).toBeGreaterThan(0);
    }
  });
});

ownerTest.describe('E2: Create Event', () => {
  let eventsPage: EventsPage;

  ownerTest.beforeEach(async ({ page }) => {
    eventsPage = new EventsPage(page);
    await eventsPage.goto();
    await eventsPage.waitForPageLoad();
  });

  ownerTest('AC1: should open event creation form', async () => {
    await expect(eventsPage.createEventButton).toBeVisible();

    await eventsPage.clickCreateEvent();

    await expect(eventsPage.eventForm).toBeVisible();
  });

  ownerTest('AC2-AC4: should display all mandatory fields', async () => {
    await eventsPage.clickCreateEvent();

    // Mandatory fields
    await expect(eventsPage.nameInput).toBeVisible();
    await expect(eventsPage.typeSelect).toBeVisible();
    await expect(eventsPage.formatSelect).toBeVisible();
    await expect(eventsPage.startDateInput).toBeVisible();
  });

  ownerTest('AC3-AC7: should display all optional fields', async () => {
    await eventsPage.clickCreateEvent();

    // Optional fields
    await expect(eventsPage.endDateInput).toBeVisible();
    await expect(eventsPage.meetingUrlInput).toBeVisible();
    await expect(eventsPage.maxAttendeesInput).toBeVisible();
    await expect(eventsPage.descriptionInput).toBeVisible();
  });

  ownerTest('AC5: should allow selecting format (Online/Offline)', async () => {
    await eventsPage.clickCreateEvent();

    await eventsPage.selectFormat('Online');
    await eventsPage.selectFormat('Offline');
  });

  ownerTest('AC6: should allow filling Meeting URL for online events', async () => {
    await eventsPage.clickCreateEvent();

    await eventsPage.selectFormat('Online');
    await eventsPage.fillMeetingUrl('https://meet.example.com/event123');

    await expect(eventsPage.meetingUrlInput).toHaveValue('https://meet.example.com/event123');
  });

  ownerTest('AC9: should successfully create event and verify it appears in table', async ({ page }) => {
    await eventsPage.clickCreateEvent();

    const eventName = `Test Event ${Date.now()}`;
    const eventData = {
      name: eventName,
      type: 'Webinar',
      format: 'Online' as 'Online',
      startDate: '2026-03-15',
    };

    await eventsPage.fillName(eventData.name);
    await eventsPage.selectType(eventData.type);
    await eventsPage.selectFormat(eventData.format);
    await eventsPage.fillStartDate(eventData.startDate);

    await eventsPage.submitForm();

    // Wait for page to reload
    await page.waitForLoadState('networkidle');

    // Verify event was created - it should appear in table
    const eventExists = await eventsPage.verifyEventExists({
      name: eventName,
      type: eventData.type,
      format: eventData.format,
    });

    expect(eventExists).toBeTruthy();

    // Also verify row is visible
    const row = eventsPage.getEventRowByName(eventName);
    await expect(row).toBeVisible();
  });

  ownerTest('AC9: should create event with all fields filled', async ({ page }) => {
    await eventsPage.clickCreateEvent();

    const eventName = `Full Event ${Date.now()}`;
    const eventData = {
      name: eventName,
      type: 'Workshop',
      format: 'Online' as 'Online',
      startDate: '2026-04-01',
      endDate: '2026-04-02',
      meetingUrl: 'https://meet.example.com/workshop',
      maxAttendees: '50',
      description: 'Test workshop with all fields filled',
    };

    await eventsPage.fillName(eventData.name);
    await eventsPage.selectType(eventData.type);
    await eventsPage.selectFormat(eventData.format);
    await eventsPage.fillStartDate(eventData.startDate);
    await eventsPage.fillEndDate(eventData.endDate);
    await eventsPage.fillMeetingUrl(eventData.meetingUrl);
    await eventsPage.fillMaxAttendees(eventData.maxAttendees);
    await eventsPage.fillDescription(eventData.description);

    await eventsPage.submitForm();

    await page.waitForLoadState('networkidle');

    // Verify event appears in table
    const row = eventsPage.getEventRowByName(eventName);
    await expect(row).toBeVisible();
  });
});

ownerTest.describe('E3: Edit Event', () => {
  let eventsPage: EventsPage;

  ownerTest.beforeEach(async ({ page }) => {
    eventsPage = new EventsPage(page);
    await eventsPage.goto();
    await eventsPage.waitForPageLoad();
  });

  ownerTest('AC1: should have edit button for events', async () => {
    const count = await eventsPage.getEventsCount();
    ownerTest.skip(count === 0, 'No events to edit - create test data first');

    const firstRow = eventsPage.tableRows.first();
    const editButton = firstRow.locator('[data-testid*="edit"]');

    await expect(editButton).toBeVisible();
  });

  ownerTest('AC2: should display all fields in edit form', async () => {
    const count = await eventsPage.getEventsCount();
    ownerTest.skip(count === 0, 'No events to edit - create test data first');

    const firstRow = eventsPage.tableRows.first();
    const editButton = firstRow.locator('[data-testid*="edit"]');
    await editButton.click();

    // Verify all form fields are visible
    await expect(eventsPage.nameInput).toBeVisible();
    await expect(eventsPage.typeSelect).toBeVisible();
    await expect(eventsPage.formatSelect).toBeVisible();
    await expect(eventsPage.startDateInput).toBeVisible();
    await expect(eventsPage.endDateInput).toBeVisible();
    await expect(eventsPage.meetingUrlInput).toBeVisible();
    await expect(eventsPage.maxAttendeesInput).toBeVisible();
    await expect(eventsPage.descriptionInput).toBeVisible();
  });

  ownerTest('AC3: should save changes and verify they persist', async ({ page }) => {
    const count = await eventsPage.getEventsCount();
    ownerTest.skip(count === 0, 'No events to edit - create test data first');

    // Get first event name
    const names = await eventsPage.getAllEventNames();
    const originalName = names[0];
    const newName = `${originalName} - Edited ${Date.now()}`;

    // Click edit on first event
    const firstRow = eventsPage.getEventRowByName(originalName);
    const editButton = firstRow.locator('[data-testid*="edit"]');
    await editButton.click();

    // Wait for form to load
    await eventsPage.nameInput.waitFor({ state: 'visible' });

    // Change name
    await eventsPage.nameInput.clear();
    await eventsPage.fillName(newName);

    // Submit
    await eventsPage.submitForm();

    // Wait for save
    await page.waitForLoadState('networkidle');

    // Verify name was changed
    const eventExists = await eventsPage.verifyEventExists({ name: newName });
    expect(eventExists).toBeTruthy();

    // Verify old name is gone
    const oldRow = eventsPage.getEventRowByName(originalName);
    await expect(oldRow).not.toBeVisible();
  });
});

ownerTest.describe('E4: Filtering and Searching Events', () => {
  let eventsPage: EventsPage;

  ownerTest.beforeEach(async ({ page }) => {
    eventsPage = new EventsPage(page);
    await eventsPage.goto();
    await eventsPage.waitForPageLoad();
  });

  ownerTest('AC1: should be able to click column headers for sorting', async () => {
    // Click each column header to trigger sort
    await eventsPage.nameColumn.click();
    await eventsPage.codeColumn.click();
    await eventsPage.typeColumn.click();
    await eventsPage.formatColumn.click();
    await eventsPage.startDateColumn.click();

    // All columns should remain visible after clicks
    const allVisible = await eventsPage.areAllColumnsVisible();
    expect(allVisible).toBeTruthy();
  });

  ownerTest('AC2: should display search input', async () => {
    await expect(eventsPage.searchInput).toBeVisible();
  });

  ownerTest('AC2: should filter events by search query', async ({ page }) => {
    const count = await eventsPage.getEventsCount();
    ownerTest.skip(count === 0, 'No events to filter - create test data first');

    // Get first event name and search for part of it
    const allNames = await eventsPage.getAllEventNames();
    const searchQuery = allNames[0].substring(0, 5);

    // Perform search
    await eventsPage.searchEvents(searchQuery);
    await page.waitForLoadState('networkidle');

    // Verify results match query
    const filteredNames = await eventsPage.getAllEventNames();

    // All visible names should contain search query
    filteredNames.forEach(name => {
      expect(name.toLowerCase()).toContain(searchQuery.toLowerCase());
    });

    // Should have filtered results (not necessarily fewer, but matching)
    expect(filteredNames.length).toBeGreaterThan(0);
  });

  ownerTest('AC2: should show empty state for non-existent search', async ({ page }) => {
    await eventsPage.searchEvents('nonexistentevent12345xyz');
    await page.waitForLoadState('networkidle');

    const count = await eventsPage.getEventsCount();

    if (count === 0) {
      // Should show empty state or no results message
      const emptyVisible = await eventsPage.emptyState.isVisible().catch(() => false);
      const noResultsMessage = page.getByText(/no results|no events found/i);
      const noResultsVisible = await noResultsMessage.isVisible().catch(() => false);

      expect(emptyVisible || noResultsVisible).toBeTruthy();
    }
  });

  ownerTest('AC2: should clear search and show all events', async ({ page }) => {
    const originalCount = await eventsPage.getEventsCount();

    // Perform search
    await eventsPage.searchEvents('test');
    await page.waitForLoadState('networkidle');

    // Clear search
    await eventsPage.searchInput.clear();
    await page.keyboard.press('Enter');
    await page.waitForLoadState('networkidle');

    // Should show all events again
    await expect(eventsPage.eventsTable).toBeVisible();

    const clearedCount = await eventsPage.getEventsCount();
    expect(clearedCount).toBeGreaterThanOrEqual(originalCount);
  });

ownerTest.describe('E5: Delete Event', () => {
  let eventsPage: EventsPage;

  ownerTest.beforeEach(async ({ page }) => {
    eventsPage = new EventsPage(page);
    await eventsPage.goto();
    await eventsPage.waitForPageLoad();
  });

  ownerTest('AC1: should have delete button for events', async () => {
    const count = await eventsPage.getEventsCount();
    ownerTest.skip(count === 0, 'No events to delete - create test data first');

    const firstRow = eventsPage.tableRows.first();
    const deleteButton = firstRow.locator('[data-testid*="delete"]');

    await expect(deleteButton).toBeVisible();
  });

  ownerTest('AC2: should delete an event and remove it from table', async ({ page }) => {
    // Create a unique event to delete
    await eventsPage.clickCreateEvent();

    const eventName = `Delete Event ${Date.now()}`;
    const eventData = {
      name: eventName,
      type: 'Webinar',
      format: 'Online' as 'Online',
      startDate: '2026-05-01',
    };

    await eventsPage.fillName(eventData.name);
    await eventsPage.selectType(eventData.type);
    await eventsPage.selectFormat(eventData.format);
    await eventsPage.fillStartDate(eventData.startDate);
    await eventsPage.submitForm();

    await page.waitForLoadState('networkidle');

    // Ensure event exists
    await expect(eventsPage.getEventRowByName(eventName)).toBeVisible();

    // Delete the event using the new helper
    await eventsPage.deleteEvent(eventName);

    // Verify the event no longer exists
    const exists = await eventsPage.verifyEventExists({ name: eventName }).catch(() => false);
    expect(exists).toBeFalsy();

    const row = eventsPage.getEventRowByName(eventName);
    await expect(row).not.toBeVisible();
  });
});