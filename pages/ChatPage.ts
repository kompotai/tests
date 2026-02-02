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
    await this.page.locator(this.selectors.contactItem(contactId)).click();
    await this.wait(500);
  }

  async selectContactByName(name: string): Promise<void> {
    await this.page.locator(this.selectors.contactItemByName(name)).click();
    await this.wait(500);
  }

  async selectContactByIndex(index: number): Promise<void> {
    const contacts = await this.page.locator('[data-testid*="chat-contact-item-"]').all();
    if (contacts[index]) {
      await contacts[index].click();
      await this.wait(500);
    }
  }

  async searchContact(query: string): Promise<void> {
    await this.page.locator(this.selectors.searchInput).fill(query);
    await this.wait(500);
  }

  async clearSearch(): Promise<void> {
    await this.page.locator(this.selectors.searchInput).clear();
    await this.wait(300);
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
    await this.page.locator(this.selectors.sendButton).click();
    await this.wait(500);
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
      .textContent()
      .catch(() => '');
    return name?.trim() || '';
  }

  async clickOpenCard(): Promise<void> {
    await this.page.locator(this.selectors.openCardButton).click();
    await this.wait(500);
  }

  async getSelectedAccount(): Promise<string> {
    const username = await this.page.locator(this.selectors.accountSelector)
      .textContent()
      .catch(() => '');
    return username?.trim() || '';
  }
}
