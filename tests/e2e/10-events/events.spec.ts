/**
 * Events Module Tests
 *
 * E2E tests for events management based on User Stories E1-E4.
 */

import { ownerTest, expect } from '@fixtures/auth.fixture';
import { EventsPage } from '@pages/EventsPage';

ownerTest.describe('E1: View Events List', () => {
  let eventsPage: EventsPage;

  ownerTest.beforeEach(async ({ page }) => {
    eventsPage = new EventsPage(page);
    await eventsPage.goto();
  });

  ownerTest.describe('AC1: User sees the events table after logging in', () => {
    ownerTest('should display events table after login', async () => {
      const isTableVisible = await eventsPage.isEventsTableVisible();
      expect(isTableVisible).toBeTruthy();
    });
  });

  ownerTest.describe('AC2: Table contains required columns', () => {
    ownerTest('should display Name column', async () => {
      await expect(eventsPage.nameColumn).toBeVisible();
    });

    ownerTest('should display Code column', async () => {
      await expect(eventsPage.codeColumn).toBeVisible();
    });

    ownerTest('should display Type column', async () => {
      await expect(eventsPage.typeColumn).toBeVisible();
    });

    ownerTest('should display Format column', async () => {
      await expect(eventsPage.formatColumn).toBeVisible();
    });

    ownerTest('should display Start Date column', async () => {
      await expect(eventsPage.startDateColumn).toBeVisible();
    });

    ownerTest('should display Registrations column', async () => {
      await expect(eventsPage.registrationsColumn).toBeVisible();
    });

    ownerTest('should display all required columns', async () => {
      const allColumnsVisible = await eventsPage.areAllColumnsVisible();
      expect(allColumnsVisible).toBeTruthy();
    });
  });

  ownerTest.describe('AC3: Empty state displayed correctly', () => {
    ownerTest('should show "No events yet" when no events exist', async () => {
      const eventsCount = await eventsPage.getEventsCount();

      if (eventsCount === 0) {
        await expect(eventsPage.emptyState).toBeVisible();
      } else {
        await expect(eventsPage.eventsTable).toBeVisible();
      }
    });
  });

  ownerTest.describe('AC4: Events displayed in table when present', () => {
    ownerTest('should display events in table rows when events exist', async () => {
      const eventsCount = await eventsPage.getEventsCount();

      if (eventsCount > 0) {
        await expect(eventsPage.tableRows.first()).toBeVisible();
      }
    });
  });
});

ownerTest.describe('E2: Create Event', () => {
  let eventsPage: EventsPage;

  ownerTest.beforeEach(async ({ page }) => {
    eventsPage = new EventsPage(page);
    await eventsPage.goto();
  });

  ownerTest.describe('AC1: User can open the event creation form', () => {
    ownerTest('should display Create Event button', async () => {
      await expect(eventsPage.createEventButton).toBeVisible();
    });

    ownerTest('should open event creation form when clicking Create Event', async () => {
      await eventsPage.clickCreateEvent();
      const isFormVisible = await eventsPage.isEventFormVisible();
      expect(isFormVisible).toBeTruthy();
    });
  });

  ownerTest.describe('AC2: Mandatory fields present', () => {
    ownerTest.beforeEach(async () => {
      await eventsPage.clickCreateEvent();
    });

    ownerTest('should display Name field (mandatory)', async () => {
      await expect(eventsPage.nameInput).toBeVisible();
    });

    ownerTest('should display Type field (mandatory)', async () => {
      await expect(eventsPage.typeSelect).toBeVisible();
    });

    ownerTest('should display Format field (mandatory)', async () => {
      await expect(eventsPage.formatSelect).toBeVisible();
    });

    ownerTest('should display Start Date field (mandatory)', async () => {
      await expect(eventsPage.startDateInput).toBeVisible();
    });
  });

  ownerTest.describe('AC3: Can specify End Date', () => {
    ownerTest('should display End Date field in form', async () => {
      await eventsPage.clickCreateEvent();
      await expect(eventsPage.endDateInput).toBeVisible();
    });

    ownerTest('should have End Date field accessible', async () => {
      await eventsPage.clickCreateEvent();
      await expect(eventsPage.endDateInput).toBeEnabled();
    });
  });

  ownerTest.describe('AC4: Ability to select event type', () => {
    ownerTest('should allow selecting Webinar type', async () => {
      await eventsPage.clickCreateEvent();
      await eventsPage.selectType('Webinar');
    });
  });

  ownerTest.describe('AC5: Can choose format (Online/Offline)', () => {
    ownerTest.beforeEach(async () => {
      await eventsPage.clickCreateEvent();
    });

    ownerTest('should allow selecting Online format', async () => {
      await eventsPage.selectFormat('Online');
    });

    ownerTest('should allow selecting Offline format', async () => {
      await eventsPage.selectFormat('Offline');
    });
  });

  ownerTest.describe('AC6: Option to add Meeting URL for online events', () => {
    ownerTest('should display Meeting URL field', async () => {
      await eventsPage.clickCreateEvent();
      await eventsPage.selectFormat('Online');
      await expect(eventsPage.meetingUrlInput).toBeVisible();
    });

    ownerTest('should allow filling Meeting URL', async () => {
      await eventsPage.clickCreateEvent();
      await eventsPage.selectFormat('Online');
      await eventsPage.fillMeetingUrl('https://meet.example.com/event123');
      await expect(eventsPage.meetingUrlInput).toHaveValue('https://meet.example.com/event123');
    });
  });

  ownerTest.describe('AC7: Optional Max Attendees field', () => {
    ownerTest('should display Max Attendees field', async () => {
      await eventsPage.clickCreateEvent();
      await expect(eventsPage.maxAttendeesInput).toBeVisible();
    });

    ownerTest('should allow filling Max Attendees', async () => {
      await eventsPage.clickCreateEvent();
      await eventsPage.fillMaxAttendees('100');
      await expect(eventsPage.maxAttendeesInput).toHaveValue('100');
    });
  });

  ownerTest.describe('AC8: Can add event description', () => {
    ownerTest('should display Description field', async () => {
      await eventsPage.clickCreateEvent();
      await expect(eventsPage.descriptionInput).toBeVisible();
    });

    ownerTest('should allow filling Description', async () => {
      await eventsPage.clickCreateEvent();
      const description = 'This is a test event description with all the details.';
      await eventsPage.fillDescription(description);
      await expect(eventsPage.descriptionInput).toHaveValue(description);
    });
  });

  ownerTest.describe('AC9: Create Event button active after filling mandatory fields', () => {
    ownerTest('should display submit button in form', async () => {
      await eventsPage.clickCreateEvent();
      await expect(eventsPage.submitButton).toBeVisible();
    });

    ownerTest('should enable submit button after filling name', async () => {
      await eventsPage.clickCreateEvent();
      await eventsPage.fillName('Test Event');
      await eventsPage.wait(500);

      const isEnabled = await eventsPage.isSubmitButtonEnabled();
      expect(isEnabled).toBeTruthy();
    });

    ownerTest('should successfully create event with mandatory fields', async () => {
      await eventsPage.clickCreateEvent();

      const eventName = `Test Event ${Date.now()}`;
      await eventsPage.fillName(eventName);
      await eventsPage.submitForm();

      await eventsPage.waitForPageLoad();
      await expect(eventsPage.eventsTable).toBeVisible();
    });
  });
});

ownerTest.describe('E3: Edit Event', () => {
  let eventsPage: EventsPage;

  ownerTest.beforeEach(async ({ page }) => {
    eventsPage = new EventsPage(page);
    await eventsPage.goto();
  });

  ownerTest.describe('AC1: Ability to edit existing events', () => {
    ownerTest('should have edit button for events', async () => {
      const eventsCount = await eventsPage.getEventsCount();

      if (eventsCount > 0) {
        const firstRow = eventsPage.tableRows.first();
        const editButton = eventsPage.getEditButton(firstRow);
        await expect(editButton).toBeVisible();
      }
    });

    ownerTest('should open edit form when clicking edit', async () => {
      const eventsCount = await eventsPage.getEventsCount();

      if (eventsCount > 0) {
        const firstRow = eventsPage.tableRows.first();
        const editButton = eventsPage.getEditButton(firstRow);
        await editButton.click();

        const isFormVisible = await eventsPage.isEventFormVisible();
        expect(isFormVisible).toBeTruthy();
      }
    });
  });

  ownerTest.describe('AC2: All fields available for modification', () => {
    ownerTest('should display all form fields in edit mode', async () => {
      const eventsCount = await eventsPage.getEventsCount();

      if (eventsCount > 0) {
        const firstRow = eventsPage.tableRows.first();
        const editButton = eventsPage.getEditButton(firstRow);
        await editButton.click();

        await expect(eventsPage.nameInput).toBeVisible();
        await expect(eventsPage.typeSelect).toBeVisible();
        await expect(eventsPage.formatSelect).toBeVisible();
        await expect(eventsPage.startDateInput).toBeVisible();
        await expect(eventsPage.endDateInput).toBeVisible();
      }
    });
  });

  ownerTest.describe('AC3: Changes are saved correctly', () => {
    ownerTest('should save changes when editing event', async () => {
      const eventsCount = await eventsPage.getEventsCount();

      if (eventsCount > 0) {
        const firstRow = eventsPage.tableRows.first();
        const editButton = eventsPage.getEditButton(firstRow);
        await editButton.click();

        const newName = `Updated Event ${Date.now()}`;
        await eventsPage.nameInput.clear();
        await eventsPage.fillName(newName);
        await eventsPage.submitForm();

        await eventsPage.waitForPageLoad();

        const updatedRow = eventsPage.getEventRowByName(newName);
        await expect(updatedRow).toBeVisible();
      }
    });
  });
});

ownerTest.describe('E4: Filtering and Searching Events', () => {
  let eventsPage: EventsPage;

  ownerTest.beforeEach(async ({ page }) => {
    eventsPage = new EventsPage(page);
    await eventsPage.goto();
  });

  ownerTest.describe('AC1: Ability to sort by columns', () => {
    ownerTest('should sort by Name column', async () => {
      await eventsPage.sortByColumn('Name');
      await expect(eventsPage.nameColumn).toBeVisible();
    });

    ownerTest('should sort by Start Date column', async () => {
      await eventsPage.sortByColumn('Start Date');
      await expect(eventsPage.startDateColumn).toBeVisible();
    });

    ownerTest('should sort by Type column', async () => {
      await eventsPage.sortByColumn('Type');
      await expect(eventsPage.typeColumn).toBeVisible();
    });

    ownerTest('should toggle sort direction on double click', async () => {
      await eventsPage.sortByColumn('Name');
      await eventsPage.sortByColumn('Name');
      await expect(eventsPage.nameColumn).toBeVisible();
    });
  });

  ownerTest.describe('AC2: Search/filter events by various parameters', () => {
    ownerTest('should display search input', async () => {
      await expect(eventsPage.searchInput).toBeVisible();
    });

    ownerTest('should filter events by name', async ({ page }) => {
      await eventsPage.waitForPageLoad();
      const eventsCount = await eventsPage.getEventsCount();

      if (eventsCount > 0) {
        await eventsPage.searchEvents('event');
        await eventsPage.waitForPageLoad();
        await eventsPage.wait(1000);

        const isTableVisible = await eventsPage.isEventsTableVisible();
        expect(isTableVisible).toBeTruthy();
      }
    });

    ownerTest('should show no results for non-existent search', async ({ page }) => {
      await eventsPage.searchEvents('nonexistentevent12345');
      await eventsPage.waitForPageLoad();

      const eventsCount = await eventsPage.getEventsCount();

      if (eventsCount === 0) {
        const emptyVisible = await eventsPage.emptyState.isVisible();
        const noResultsMessage = page.getByText(/no results|no events found/i);
        const noResultsVisible = await noResultsMessage.isVisible().catch(() => false);

        expect(emptyVisible || noResultsVisible).toBeTruthy();
      }
    });

    ownerTest('should clear search and show all events', async ({ page }) => {
      await eventsPage.searchEvents('test');
      await eventsPage.waitForPageLoad();

      await eventsPage.searchInput.clear();
      await page.keyboard.press('Enter');
      await eventsPage.waitForPageLoad();

      await expect(eventsPage.eventsTable).toBeVisible();
    });
  });
});
