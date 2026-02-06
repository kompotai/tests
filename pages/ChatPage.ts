/**
 * Chat Page Object
 *
 * Handles chat UI interactions: contacts list, messaging, contact panel.
 * All selectors come from Selectors.chat (data-testid based).
 */
import { Page, expect, Locator } from '@playwright/test';
import { BasePage } from './BasePage';
import { Selectors } from './selectors';
import { WORKSPACE_ID } from '@fixtures/users';

export class ChatPage extends BasePage {
  get path() {
    return `/ws/${WORKSPACE_ID}/chat`;
  }

  private get selectors() {
    return Selectors.chat;
  }

  // ============================================
  // Navigation
  // ============================================

  async goto(): Promise<void> {
    await this.page.goto(this.path);
    await this.waitForPageLoad();
  }

  async waitForPageLoad(): Promise<void> {
    await super.waitForPageLoad();
    await this.page.locator(this.selectors.contactsList)
      .waitFor({ state: 'visible', timeout: 10000 });
  }

  // ============================================
  // Contacts List
  // ============================================

  async getContactsCount(): Promise<number> {
    const contacts = await this.page.locator(this.selectors.allContactItems).all();
    return contacts.length;
  }

  async selectContactById(contactId: string): Promise<void> {
    await this.page.locator(this.selectors.contactItem(contactId)).click();
    await this.waitForContactLoaded();
  }

  async selectContactByName(name: string): Promise<void> {
    await this.page.locator(this.selectors.contactItemByName(name)).click();
    await this.waitForContactLoaded();
  }

  async selectContactByIndex(index: number): Promise<void> {
    const contacts = this.page.locator(this.selectors.allContactItems);
    const count = await contacts.count();
    if (index >= count) {
      throw new Error(`Contact index ${index} out of range (total: ${count})`);
    }
    await contacts.nth(index).click();
    await this.waitForContactLoaded();
  }

  async searchContact(query: string): Promise<void> {
    await this.page.locator(this.selectors.searchInput).fill(query);
    // Wait for loading indicator to disappear, then network idle
    await this.page.locator('[role="status"]:has-text("Loading")')
      .waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {});
    await this.page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});
  }

  async clearSearch(): Promise<void> {
    await this.page.locator(this.selectors.searchInput).clear();
    await this.page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});
  }

  async isSearchInputVisible(): Promise<boolean> {
    return await this.page.locator(this.selectors.searchInput)
      .isVisible({ timeout: 3000 })
      .catch(() => false);
  }

  // ============================================
  // Messages
  // ============================================

  async isEmptyStateVisible(): Promise<boolean> {
    return await this.page.locator(this.selectors.emptyState)
      .isVisible({ timeout: 3000 })
      .catch(() => false);
  }

  async isMessagesContainerVisible(): Promise<boolean> {
    return await this.page.locator(this.selectors.messagesContainer)
      .isVisible({ timeout: 3000 })
      .catch(() => false);
  }

  async getMessagesCount(): Promise<number> {
    const messages = await this.page.locator(this.selectors.messageText).all();
    return messages.length;
  }

  async hasMessageWithText(text: string): Promise<boolean> {
    return await this.page.locator(this.selectors.messageByText(text))
      .isVisible({ timeout: 3000 })
      .catch(() => false);
  }

  async waitForMessage(text: string, timeout: number = 10000): Promise<void> {
    await this.page.locator(this.selectors.messageByText(text))
      .waitFor({ state: 'visible', timeout });
  }

  // ============================================
  // Message Input
  // ============================================

  async typeMessage(text: string): Promise<void> {
    await this.page.locator(this.selectors.messageInput).fill(text);
  }

  async clearMessageInput(): Promise<void> {
    await this.page.locator(this.selectors.messageInput).clear();
  }

  async getMessageInputValue(): Promise<string> {
    const value = await this.page.locator(this.selectors.messageInput).inputValue();
    return value.trim();
  }

  async isMessageInputVisible(): Promise<boolean> {
    return await this.page.locator(this.selectors.messageInput)
      .isVisible({ timeout: 3000 })
      .catch(() => false);
  }

  async isSendButtonEnabled(): Promise<boolean> {
    return await this.page.locator(this.selectors.sendButton).isEnabled();
  }

  async isSendButtonVisible(): Promise<boolean> {
    return await this.page.locator(this.selectors.sendButton)
      .isVisible({ timeout: 3000 })
      .catch(() => false);
  }

  async clickSend(): Promise<void> {
    await this.page.locator(this.selectors.sendButton).click();
    // Wait for input to clear (confirms message was sent)
    await expect(this.page.locator(this.selectors.messageInput)).toHaveValue('', { timeout: 5000 });
  }

  async sendMessage(text: string): Promise<void> {
    await this.typeMessage(text);
    await this.clickSend();
    await this.waitForMessage(text, 15000);
  }

  // ============================================
  // Contact Panel
  // ============================================

  async getContactPanelName(): Promise<string> {
    const name = await this.page.locator(this.selectors.contactPanelName)
      .textContent({ timeout: 3000 })
      .catch(() => '');
    return name?.trim() || '';
  }

  async isOpenCardButtonVisible(): Promise<boolean> {
    return await this.page.locator(this.selectors.openCardButton)
      .isVisible({ timeout: 3000 })
      .catch(() => false);
  }

  async clickOpenCard(): Promise<void> {
    await this.page.locator(this.selectors.openCardButton).click();
    // Wait for navigation to contact detail page
    await this.page.waitForURL(/\/ws\/.*\/contacts\/.*/, { timeout: 5000 });
  }

  async getSelectedAccount(): Promise<string> {
    const username = await this.page.locator(this.selectors.accountSelector)
      .textContent({ timeout: 3000 })
      .catch(() => '');
    return username?.trim() || '';
  }

  async isAccountSelectorVisible(): Promise<boolean> {
    return await this.page.locator(this.selectors.accountSelector)
      .isVisible({ timeout: 3000 })
      .catch(() => false);
  }

  // ============================================
  // Helpers
  // ============================================

  /**
   * Wait for contact conversation to load after selecting a contact.
   * Either messages container or message input should become visible.
   */
  private async waitForContactLoaded(): Promise<void> {
    await Promise.race([
      this.page.locator(this.selectors.messagesContainer)
        .waitFor({ state: 'visible', timeout: 5000 }),
      this.page.locator(this.selectors.messageInput)
        .waitFor({ state: 'visible', timeout: 5000 }),
    ]).catch(() => {});
  }
}
