/**
 * Events Page Object
 *
 * Represents the events management page for E2E testing.
 */

import { Locator } from '@playwright/test';
import { BasePage } from './BasePage';

export class EventsPage extends BasePage {
  get path(): string {
    return '/ws/events';
  }

  // Table and list elements
  get eventsTable(): Locator {
    return this.page.locator('table').or(this.page.getByRole('table'));
  }

  get emptyState(): Locator {
    return this.page.getByText(/no events yet/i);
  }

  get tableRows(): Locator {
    return this.page.locator('table tbody tr');
  }

  // Table column headers
  get nameColumn(): Locator {
    return this.page.getByRole('columnheader', { name: /name/i });
  }

  get codeColumn(): Locator {
    return this.page.getByRole('columnheader', { name: /code/i });
  }

  get typeColumn(): Locator {
    return this.page.getByRole('columnheader', { name: /type/i });
  }

  get formatColumn(): Locator {
    return this.page.getByRole('columnheader', { name: /format/i });
  }

  get startDateColumn(): Locator {
    return this.page.getByRole('columnheader', { name: /start date/i });
  }

  get registrationsColumn(): Locator {
    return this.page.getByRole('columnheader', { name: /registrations/i });
  }

  // Action buttons
  get createEventButton(): Locator {
    return this.page.getByRole('button', { name: /create event/i });
  }

  // Event form elements
  get eventForm(): Locator {
    return this.page.locator('[role="dialog"]').or(
      this.page.locator('div', { has: this.page.getByRole('heading', { name: /new event|edit event/i }) })
    );
  }

  get nameInput(): Locator {
    return this.page.getByPlaceholder(/event name/i);
  }

  get codeInput(): Locator {
    return this.page.getByPlaceholder(/unique event code/i);
  }

  get typeSelect(): Locator {
    return this.page.getByLabel(/type/i);
  }

  get formatSelect(): Locator {
    return this.page.getByLabel(/format/i);
  }

  get startDateInput(): Locator {
    return this.page.getByLabel(/start date/i);
  }

  get endDateInput(): Locator {
    return this.page.getByLabel(/end date/i);
  }

  get meetingUrlInput(): Locator {
    return this.page.getByPlaceholder(/https:\/\//i).or(this.page.getByLabel(/meeting url/i));
  }

  get maxAttendeesInput(): Locator {
    return this.page.getByPlaceholder(/leave empty for unlimited/i);
  }

  get descriptionInput(): Locator {
    return this.page.getByLabel(/description/i).or(this.page.getByPlaceholder(/event description/i));
  }

  get submitButton(): Locator {
    return this.page.getByRole('button', { name: /^cancel$/i }).locator('..').getByRole('button', { name: /create event|save/i });
  }

  get cancelButton(): Locator {
    return this.page.getByRole('button', { name: /^cancel$/i });
  }

  // Search and filter
  get searchInput(): Locator {
    return this.page.getByPlaceholder(/search events/i);
  }

  get filterButton(): Locator {
    return this.page.getByRole('button', { name: /filter/i });
  }

  // ============================================
  // Table Operations
  // ============================================

  async isEventsTableVisible(): Promise<boolean> {
    return await this.eventsTable.isVisible();
  }

  async isEmptyStateVisible(): Promise<boolean> {
    return await this.emptyState.isVisible();
  }

  async getEventsCount(): Promise<number> {
    return await this.tableRows.count();
  }

  async areAllColumnsVisible(): Promise<boolean> {
    const nameVisible = await this.nameColumn.isVisible();
    const codeVisible = await this.codeColumn.isVisible();
    const typeVisible = await this.typeColumn.isVisible();
    const formatVisible = await this.formatColumn.isVisible();
    const startDateVisible = await this.startDateColumn.isVisible();
    const registrationsVisible = await this.registrationsColumn.isVisible();

    return nameVisible && codeVisible && typeVisible && formatVisible && startDateVisible && registrationsVisible;
  }

  getEventRowByName(name: string): Locator {
    return this.page.locator('table tbody tr', { hasText: name });
  }

  getEditButton(row: Locator): Locator {
    return row.locator('button').filter({ has: this.page.locator('svg') }).first();
  }

  // ============================================
  // Form Operations
  // ============================================

  async clickCreateEvent(): Promise<void> {
    await this.createEventButton.click();
  }

  async isEventFormVisible(): Promise<boolean> {
    const heading = this.page.getByRole('heading', { name: /new event|edit event/i });
    return await heading.isVisible();
  }

  async fillName(name: string): Promise<void> {
    await this.nameInput.fill(name);
  }

  async selectType(type: string): Promise<void> {
    await this.typeSelect.click();
    await this.page.getByRole('option', { name: new RegExp(type, 'i') }).click();
  }

  async selectFormat(format: 'Online' | 'Offline'): Promise<void> {
    await this.formatSelect.click();
    await this.page.getByRole('option', { name: new RegExp(format, 'i') }).click();
  }

  async fillStartDate(date: string): Promise<void> {
    await this.startDateInput.fill(date);
  }

  async fillEndDate(date: string): Promise<void> {
    await this.endDateInput.fill(date);
  }

  async fillMeetingUrl(url: string): Promise<void> {
    await this.meetingUrlInput.fill(url);
  }

  async fillMaxAttendees(count: string): Promise<void> {
    await this.maxAttendeesInput.fill(count);
  }

  async fillDescription(description: string): Promise<void> {
    await this.descriptionInput.fill(description);
  }

  async submitForm(): Promise<void> {
    await this.submitButton.click();
  }

  async isSubmitButtonEnabled(): Promise<boolean> {
    return await this.submitButton.isEnabled();
  }

  // ============================================
  // Complex Operations
  // ============================================

  async createEvent(data: {
    name: string;
    type: string;
    format: 'Online' | 'Offline';
    startDate: string;
    endDate?: string;
    meetingUrl?: string;
    maxAttendees?: string;
    description?: string;
  }): Promise<void> {
    await this.fillName(data.name);
    await this.selectType(data.type);
    await this.selectFormat(data.format);
    await this.fillStartDate(data.startDate);

    if (data.endDate) {
      await this.fillEndDate(data.endDate);
    }
    if (data.meetingUrl) {
      await this.fillMeetingUrl(data.meetingUrl);
    }
    if (data.maxAttendees) {
      await this.fillMaxAttendees(data.maxAttendees);
    }
    if (data.description) {
      await this.fillDescription(data.description);
    }

    await this.submitForm();
  }

  async searchEvents(query: string): Promise<void> {
    await this.searchInput.fill(query);
    await this.page.keyboard.press('Enter');
  }

  async sortByColumn(columnName: string): Promise<void> {
    const header = this.page.getByRole('columnheader', { name: new RegExp(columnName, 'i') });
    await header.click();
  }

  async clickEditEvent(eventName: string): Promise<void> {
    const row = this.getEventRowByName(eventName);
    await row.locator('button').filter({ has: this.page.locator('svg') }).first().click();
  }
}
