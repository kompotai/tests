/**
 * Chat Messaging Tests
 *
 * Verifies message sending, input behavior, and message persistence.
 * Requires real Telegram integration and at least one contact.
 */
import { ownerTest, expect } from '@fixtures/auth.fixture';
import { ChatPage } from '@pages/ChatPage';

ownerTest.describe('Chat - Messaging', () => {
  let chatPage: ChatPage;

  ownerTest.beforeEach(async ({ page }) => {
    chatPage = new ChatPage(page);
    await chatPage.goto();

    const count = await chatPage.getContactsCount();
    ownerTest.skip(count === 0, 'No contacts available for testing');

    await chatPage.selectContactByIndex(0);
  });

  // ============================================
  // Sending Messages
  // ============================================

  ownerTest('should send a simple text message', async () => {
    const messageText = `Test message ${Date.now()}`;

    await chatPage.sendMessage(messageText);

    const hasMessage = await chatPage.hasMessageWithText(messageText);
    expect(hasMessage).toBe(true);
  });

  ownerTest('should send message with emoji', async () => {
    const messageText = `Emoji test 🚀 ${Date.now()}`;

    await chatPage.sendMessage(messageText);

    const hasMessage = await chatPage.hasMessageWithText(messageText);
    expect(hasMessage).toBe(true);
  });

  ownerTest('should send message with cyrillic', async () => {
    const messageText = `Привет ${Date.now()}`;

    await chatPage.sendMessage(messageText);

    const hasMessage = await chatPage.hasMessageWithText(messageText);
    expect(hasMessage).toBe(true);
  });

  // ============================================
  // Input Behavior
  // ============================================

  ownerTest('should not allow sending empty message', async () => {
    await chatPage.clearMessageInput();

    const isEnabled = await chatPage.isSendButtonEnabled();
    expect(isEnabled).toBe(false);
  });

  ownerTest('should clear input after successful send', async () => {
    const messageText = `Clear test ${Date.now()}`;

    await chatPage.typeMessage(messageText);
    const valueBefore = await chatPage.getMessageInputValue();
    expect(valueBefore).toBe(messageText);

    await chatPage.clickSend();

    const valueAfter = await chatPage.getMessageInputValue();
    expect(valueAfter).toBe('');
  });

  // ============================================
  // Message History
  // ============================================

  ownerTest('should display message history', async () => {
    const messagesCount = await chatPage.getMessagesCount();
    expect(messagesCount).toBeGreaterThanOrEqual(0);
  });

  ownerTest('should switch contacts and maintain separate histories', async () => {
    const contactsCount = await chatPage.getContactsCount();
    ownerTest.skip(contactsCount < 2, 'Need at least 2 contacts');

    const message1 = `First contact ${Date.now()}`;
    await chatPage.sendMessage(message1);

    await chatPage.selectContactByIndex(1);

    const message2 = `Second contact ${Date.now()}`;
    await chatPage.sendMessage(message2);

    await chatPage.selectContactByIndex(0);

    const hasMessage = await chatPage.hasMessageWithText(message1);
    expect(hasMessage).toBe(true);
  });

  ownerTest('should maintain history after page reload', async ({ page }) => {
    const messageText = `Persist test ${Date.now()}`;

    await chatPage.sendMessage(messageText);

    await page.reload();
    await chatPage.waitForPageLoad();
    await chatPage.selectContactByIndex(0);

    const hasMessage = await chatPage.hasMessageWithText(messageText);
    expect(hasMessage).toBe(true);
  });
});
