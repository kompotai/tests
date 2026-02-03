/**
 * Chat Page Object
 */
import { Page, expect, Locator } from '@playwright/test';
import { BasePage } from './BasePage';
import { Selectors } from './selectors';

const WORKSPACE_ID = process.env.WS_ID || 'megatest';

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
    const contacts = await this.page.locator('[data-testid*="chat-contact-item-"]').all();
    return contacts.length;
  }

  async selectContactById(contactId: string): Promise<void> {
    const contact = this.page.locator(this.selectors.contactItem(contactId));
    await contact.click();
    // Wait for messages container or empty state to appear
    await Promise.race([
      this.page.locator(this.selectors.messagesContainer).waitFor({ state: 'visible' }),
      this.page.locator(this.selectors.emptyState).waitFor({ state: 'visible' })
    ]);
  }

  async selectContactByName(name: string): Promise<void> {
    const contact = this.page.locator(this.selectors.contactItemByName(name));
    await contact.click();
    await Promise.race([
      this.page.locator(this.selectors.messagesContainer).waitFor({ state: 'visible' }),
      this.page.locator(this.selectors.emptyState).waitFor({ state: 'visible' })
    ]);
  }

  async selectContactByIndex(index: number): Promise<void> {
    const contacts = await this.page.locator('[data-testid*="chat-contact-item-"]').all();
    if (contacts[index]) {
      await contacts[index].click();
      // Wait for empty state to disappear OR messages container to appear
      await Promise.race([
        this.page.locator(this.selectors.emptyState).waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {}),
        this.page.locator(this.selectors.messagesContainer).waitFor({ state: 'visible', timeout: 5000 })
      ]);
    }
  }

  async searchContact(query: string): Promise<void> {
    const searchInput = this.page.locator(this.selectors.searchInput);
    await searchInput.fill(query);
    // Wait for loading indicator to disappear
    await this.page.locator('[role="status"]:has-text("Loading")').waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {});
    // Also wait for network idle
    await this.page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});
  }

  async clearSearch(): Promise<void> {
    const searchInput = this.page.locator(this.selectors.searchInput);
    await searchInput.clear();
    await this.page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});
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

  async isSendButtonEnabled(): Promise<boolean> {
    const button = this.page.locator(this.selectors.sendButton);
    const isDisabled = await button.getAttribute('disabled');
    return isDisabled === null;
  }

  async clickSend(): Promise<void> {
    const sendButton = this.page.locator(this.selectors.sendButton);
    // Use force: true to bypass cookie consent banner or other overlays
    await sendButton.click({ force: true });
  }

  async sendMessage(text: string): Promise<void> {
    await this.typeMessage(text);
    await this.clickSend();
    // Wait for the message to appear in the chat
    await this.waitForMessage(text, 15000);
  }

  // ============================================
  // Contact Panel
  // ============================================

  async getContactPanelName(): Promise<string> {
    const name = await this.page.locator(this.selectors.contactPanelName)
      .textContent()
      .catch(() => '');
    return name?.trim() || '';
  }

  async clickOpenCard(): Promise<void> {
    const openCardButton = this.page.locator(this.selectors.openCardButton);
    await openCardButton.click();
    // Wait for navigation to contacts page
    await this.page.waitForURL(/\/ws\/.*\/contacts\/.*/, { timeout: 5000 });
  }
}
