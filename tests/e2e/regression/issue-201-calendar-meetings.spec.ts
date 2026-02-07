/**
 * Regression test for Issue #201
 * Calendar did not reflect Meetings because getMeetingEvents() handler
 * was not implemented in getEventsFromSource().
 *
 * Fix: Implemented getMeetingEvents() and wired it into the calendar controller.
 *
 * @see https://github.com/kompotai/bug-reports/issues/201
 */

import { ownerTest, expect } from '@fixtures/auth.fixture';
import { WORKSPACE_ID } from '@fixtures/users';

ownerTest.describe('Issue #201: Calendar reflects Meetings', { tag: ['@regression'] }, () => {
  const API_BASE = `/api/ws/${WORKSPACE_ID}`;

  ownerTest('meetings should appear in calendar events @regression', async ({ request }) => {
    // Get a contact for the meeting
    const contactsRes = await request.post(`${API_BASE}/contacts/search`, {
      data: { limit: 1 },
    });

    if (!contactsRes.ok()) {
      ownerTest.skip(true, 'Cannot fetch contacts');
      return;
    }

    const contactsData = await contactsRes.json();
    const contacts = contactsData.contacts || [];

    if (contacts.length === 0) {
      ownerTest.skip(true, 'No contacts found in workspace');
      return;
    }

    const contactId = contacts[0].id;

    // Create a meeting
    const now = new Date();
    const startAt = new Date(now.getTime() + 60 * 60 * 1000); // +1 hour
    const endAt = new Date(now.getTime() + 2 * 60 * 60 * 1000); // +2 hours

    const createRes = await request.post(`${API_BASE}/meetings`, {
      data: {
        title: 'Regression test meeting #201',
        contactId,
        format: 'phone',
        startAt: startAt.toISOString(),
        endAt: endAt.toISOString(),
        status: 'scheduled',
      },
    });

    expect(createRes.status()).toBe(201);
    const meeting = await createRes.json();

    try {
      // Get or create a default calendar
      const calendarsRes = await request.get(`${API_BASE}/calendars`);
      expect(calendarsRes.status()).toBe(200);
      const calendarsData = await calendarsRes.json();

      let calendarId: string;

      if (calendarsData.calendars && calendarsData.calendars.length > 0) {
        // Use existing calendar — add meeting source if needed
        const calendar = calendarsData.calendars[0];
        calendarId = calendar.id;

        const hasMeetingSource = calendar.sources?.some(
          (s: { type: string; enabled: boolean }) => s.type === 'meeting' && s.enabled
        );

        if (!hasMeetingSource) {
          // Add meeting source
          const updatedSources = [
            ...(calendar.sources || []),
            { type: 'meeting', filters: {}, enabled: true },
          ];

          const updateRes = await request.patch(`${API_BASE}/calendars/${calendarId}`, {
            data: { sources: updatedSources },
          });
          expect(updateRes.status()).toBe(200);
        }
      } else {
        // Create calendar with meeting source
        const createCalRes = await request.post(`${API_BASE}/calendars`, {
          data: {
            name: 'Test Calendar #201',
            sources: [{ type: 'meeting', filters: {}, enabled: true }],
            isDefault: true,
          },
        });
        expect(createCalRes.status()).toBe(201);
        const calData = await createCalRes.json();
        calendarId = calData.id;
      }

      // Fetch calendar events for the date range that includes the meeting
      const dateFrom = new Date(now.getTime() - 24 * 60 * 60 * 1000); // -1 day
      const dateTo = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // +7 days

      const eventsRes = await request.post(`${API_BASE}/calendars/events`, {
        data: {
          calendarIds: [calendarId],
          dateFrom: dateFrom.toISOString(),
          dateTo: dateTo.toISOString(),
        },
      });

      expect(eventsRes.status()).toBe(200);
      const eventsData = await eventsRes.json();

      // The meeting should be in the events
      const meetingEvent = eventsData.events.find(
        (e: { sourceType: string; sourceId: string }) =>
          e.sourceType === 'meeting' && e.sourceId === meeting.id
      );

      expect(meetingEvent).toBeTruthy();
      expect(meetingEvent.title).toBe('Regression test meeting #201');
      expect(meetingEvent.meta.status).toBe('scheduled');
      expect(meetingEvent.meta.meeting).toBeTruthy();
      expect(meetingEvent.meta.meeting.format).toBe('phone');
    } finally {
      // Cleanup: delete the meeting
      await request.delete(`${API_BASE}/meetings/${meeting.id}`);
    }
  });
});
