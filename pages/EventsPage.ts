/**
 * Events Page Object
 *
 * Represents the events management page for E2E testing.
 */

import { Locator } from '@playwright/test';
import { BasePage } from './BasePage';

export class EventsPage extends BasePage {
  get path(): string {
    const WS_ID = process.env.WS_ID || 'megatest';
    return `/ws/${WS_ID}/events`;
  }

  // ============================================
  // Main Page Elements
  // ============================================

  get eventsTable(): Locator {
    return this.page.locator('[data-testid="events-table"]');
  }

  get emptyState(): Locator {
    return this.page.locator('[data-testid="events-empty-state"]');
  }

  get createEventButton(): Locator {
    return this.page.locator('[data-testid="events-button-create"]');
  }

  get tableRows(): Locator {
    return this.page.locator('[data-testid^="events-row-"]');
  }

  // ============================================
  // Table Column Headers
  // ============================================

  get nameColumn(): Locator {
    return this.page.locator('[data-testid="events-table-header-name"]');
  }

  get codeColumn(): Locator {
    return this.page.locator('[data-testid="events-table-header-code"]');
  }

  get typeColumn(): Locator {
    return this.page.locator('[data-testid="events-table-header-type"]');
  }

  get formatColumn(): Locator {
    return this.page.locator('[data-testid="events-table-header-format"]');
  }

  get startDateColumn(): Locator {
    return this.page.locator('[data-testid="events-table-header-startDate"]');
  }

  get registrationsColumn(): Locator {
    return this.page.locator('[data-testid="events-table-header-registrations"]');
  }

  // ============================================
  // Event Form Elements
  // ============================================

  get eventForm(): Locator {
    return this.page.locator('[data-testid="event-form"]');
  }

  get nameInput(): Locator {
    return this.page.locator('[data-testid="event-form-input-name"]');
  }

  get codeInput(): Locator {
    return this.page.locator('[data-testid="event-form-input-code"]');
  }

  get typeSelect(): Locator {
    return this.page.locator('[data-testid="event-form-select-type"]');
  }

  get formatSelect(): Locator {
    return this.page.locator('[data-testid="event-form-select-format"]');
  }

  get startDateInput(): Locator {
    return this.page.locator('[data-testid="events-form-input-startDate"]');
  }

  get endDateInput(): Locator {
    return this.page.locator('[data-testid="events-form-input-endDate"]');
  }

  get meetingUrlInput(): Locator {
    return this.page.locator('[data-testid="events-form-input-meetingUrl"]');
  }

  get maxAttendeesInput(): Locator {
    return this.page.locator('[data-testid="events-form-input-maxAttendees"]');
  }

  get descriptionInput(): Locator {
    return this.page.locator('[data-testid="event-form-input-description"]');
  }

  get submitButton(): Locator {
    return this.page.locator('[data-testid="event-form-button-submit"]');
  }

  get cancelButton(): Locator {
    return this.page.locator('[data-testid="event-form-button-cancel"]');
  }

  // ============================================
  // Search and Filter
  // ============================================

  get searchInput(): Locator {
    return this.page.locator('[data-testid="events-input-search"]');
  }

  get filterButton(): Locator {
    return this.page.locator('[data-testid="events-button-filter"]');
  }

  // ============================================
  // Helper Methods
  // ============================================

  getEventRowByName(name: string): Locator {
    return this.page.locator('[data-testid^="events-row-"]').filter({ hasText: name });
  }

  getEditButton(eventId: string): Locator {
    return this.page.locator(`[data-testid="events-row-${eventId}-edit"]`);
  }

  getDeleteButton(eventId: string): Locator {
    return this.page.locator(`[data-testid="events-row-${eventId}-delete"]`);
  }

  /**
   * Get all event names from table
   */
  async getAllEventNames(): Promise<string[]> {
    const rows = await this.page.locator('[data-testid^="events-row-"]').all();
    const names = await Promise.all(
        rows.map(row => row.locator('td').first().textContent())
    );
    return names.filter(Boolean) as string[];
  }

  /**
   * Get events count
   */
  async getEventsCount(): Promise<number> {
    return await this.page.locator('[data-testid^="events-row-"]').count();
  }

  /**
   * Verify event with specific data exists
   */
  async verifyEventExists(data: {
    name: string;
    type?: string;
    format?: string
  }): Promise<boolean> {
    const row = this.getEventRowByName(data.name);

    const isVisible = await row.isVisible({ timeout: 3000 }).catch(() => false);
    if (!isVisible) return false;

    if (data.type) {
      const typeCell = row.locator('[data-testid="events-row-type"]');
      const type = await typeCell.textContent();
      if (!type?.includes(data.type)) return false;
    }

    if (data.format) {
      const formatCell = row.locator('[data-testid="events-row-format"]');
      const format = await formatCell.textContent();
      if (!format?.includes(data.format)) return false;
    }

    return true;
  }

  // ============================================
  // Table Operations
  // ============================================

  async isEventsTableVisible(): Promise<boolean> {
    return await this.eventsTable.isVisible({ timeout: 3000 }).catch(() => false);
  }

  async isEmptyStateVisible(): Promise<boolean> {
    return await this.emptyState.isVisible({ timeout: 3000 }).catch(() => false);
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

  // ============================================
  // Form Operations
  // ============================================

  async clickCreateEvent(): Promise<void> {
    await this.createEventButton.click();
  }

  async isEventFormVisible(): Promise<boolean> {
    return await this.eventForm.isVisible({ timeout: 3000 }).catch(() => false);
  }

  async fillName(name: string): Promise<void> {
    await this.nameInput.fill(name);
  }

  async selectType(type: string): Promise<void> {
    await this.typeSelect.selectOption(type);
  }

  async selectFormat(format: 'Online' | 'Offline'): Promise<void> {
    await this.formatSelect.selectOption(format);
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

    // Wait for form to close
    await this.page.waitForLoadState('networkidle');
  }

  async searchEvents(query: string): Promise<void> {
    await this.searchInput.fill(query);
    await this.page.waitForLoadState('networkidle');
  }

  async sortByColumn(columnName: string): Promise<void> {
    const columnMap: { [key: string]: Locator } = {
      name: this.nameColumn,
      code: this.codeColumn,
      type: this.typeColumn,
      format: this.formatColumn,
      startDate: this.startDateColumn,
      registrations: this.registrationsColumn,
    };

    const column = columnMap[columnName.toLowerCase()];
    if (column) {
      await column.click();
    }
  }

  async clickEditEvent(eventName: string): Promise<void> {
    const row = this.getEventRowByName(eventName);
    const editButton = row.locator('[data-testid*="edit"]').first();
    await editButton.click();
  }
}