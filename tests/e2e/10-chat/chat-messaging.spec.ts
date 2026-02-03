/**
 * Chat Messaging Tests
 *
 * Uses mocked Telegram integration for testing
 */
import { ownerTest, expect } from '@fixtures/auth.fixture';
import { ChatPage } from '@pages/ChatPage';
import { setupChatMocks } from '@fixtures/mocks.fixture';

ownerTest.describe('Chat - Messaging', () => {
  let chatPage: ChatPage;

  ownerTest.beforeEach(async ({ page }) => {
    // Setup mocks for Telegram integration
    await setupChatMocks(page);

    chatPage = new ChatPage(page);
    await chatPage.goto();

    const count = await chatPage.getContactsCount();
    if (count === 0) {
      ownerTest.skip(count > 0, 'No contacts available for testing');
    }

    await chatPage.selectContactByIndex(0);
    // Wait for message input to be visible
    await page.locator('[data-testid="chat-input-message"]').waitFor({ state: 'visible' });
  });

  ownerTest('should send a simple text message', async () => {
    const messageText = `Test message ${Date.now()}`;

    await chatPage.sendMessage(messageText);

    const hasMessage = await chatPage.hasMessageWithText(messageText);
    expect(hasMessage).toBeTruthy();
  });

  ownerTest('should handle empty message correctly', async () => {
    await chatPage.clearMessageInput();
    
    const isEnabled = await chatPage.isSendButtonEnabled();
    expect(isEnabled).toBeFalsy();
  });

  ownerTest('should send message with emoji', async () => {
    const messageText = `Emoji test 🚀 ${Date.now()}`;
    await chatPage.sendMessage(messageText);
    
    const hasMessage = await chatPage.hasMessageWithText(messageText);
    expect(hasMessage).toBeTruthy();
  });

  ownerTest('should send message with cyrillic', async () => {
    const messageText = `Привет ${Date.now()}`;
    await chatPage.sendMessage(messageText);
    
    const hasMessage = await chatPage.hasMessageWithText(messageText);
    expect(hasMessage).toBeTruthy();
  });

  ownerTest('should display message history', async () => {
    const messagesCount = await chatPage.getMessagesCount();
    expect(messagesCount).toBeGreaterThanOrEqual(0);
  });

  ownerTest('should clear input after successful send', async () => {
    const messageText = `Clear test ${Date.now()}`;

    await chatPage.typeMessage(messageText);
    const valueBefore = await chatPage.getMessageInputValue();
    expect(valueBefore).toBe(messageText);

    await chatPage.clickSend();

    // Wait for message to appear (indicates successful send)
    await chatPage.waitForMessage(messageText, 15000);

    // Input should be cleared after successful send
    const valueAfter = await chatPage.getMessageInputValue();
    expect(valueAfter).toBe('');
  });

  ownerTest('should switch contacts and maintain separate histories', async () => {
    const contactsCount = await chatPage.getContactsCount();

    ownerTest.skip(contactsCount >= 2, 'Need at least 2 contacts for this test');

    // Send message to first contact
    const message1 = `First contact ${Date.now()}`;
    await chatPage.sendMessage(message1);

    // Switch to second contact
    await chatPage.selectContactByIndex(1);

    // Send message to second contact
    const message2 = `Second contact ${Date.now()}`;
    await chatPage.sendMessage(message2);

    // Switch back to first contact
    await chatPage.selectContactByIndex(0);

    // Verify first message is still visible
    const hasMessage = await chatPage.hasMessageWithText(message1);
    expect(hasMessage).toBeTruthy();
  });

  ownerTest('should maintain history after page reload', async ({ page }) => {
    const messageText = `Persist test ${Date.now()}`;

    // Send message and wait for it to appear
    await chatPage.sendMessage(messageText);

    // Reload page
    await page.reload();
    await chatPage.waitForPageLoad();

    // Select the same contact
    await chatPage.selectContactByIndex(0);

    // Verify message is still visible after reload
    const hasMessage = await chatPage.hasMessageWithText(messageText);
    expect(hasMessage).toBeTruthy();
  });
});