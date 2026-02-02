import { Page } from '@playwright/test';
import { BasePage } from './BasePage';
import { WORKSPACE_ID } from '@fixtures/users';

export class MeetingsPage extends BasePage {
  get path() { return `/ws/${WORKSPACE_ID}/meetings`; }

  // Selectors
  readonly createButton = '[data-testid="create-meeting-button"]';
  readonly meetingForm = '[data-testid="meeting-form"]';
  readonly titleInput = '[data-testid="title-input"]';
  readonly formatSelect = '[data-testid="format-select"]';
  readonly phoneInput = 'input[id*="phoneNumber"]';
  readonly submitButton = '[data-testid="submit-button"]';

  async clickCreateMeeting() {
    await this.page.click(this.createButton);
    await this.page.waitForSelector(this.meetingForm);
  }

  async selectPhoneFormat() {
    await this.page.click(this.formatSelect);
    await this.page.click('text=Phone Call');
  }

  async fillPhoneNumber(phone: string) {
    await this.page.waitForSelector(this.phoneInput);
    await this.page.fill(this.phoneInput, phone);
  }
}
