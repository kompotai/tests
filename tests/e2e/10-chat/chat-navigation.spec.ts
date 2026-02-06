/**
 * Chat Navigation & UI Tests
 *
 * Verifies chat page layout, contact selection, search, and UI elements.
 * All interactions go through ChatPage methods (no direct locators).
 */
import { ownerTest, expect } from '@fixtures/auth.fixture';
import { ChatPage } from '@pages/ChatPage';

ownerTest.describe('Chat - Navigation & UI', () => {
  let chatPage: ChatPage;

  ownerTest.beforeEach(async ({ page }) => {
    chatPage = new ChatPage(page);
    await chatPage.goto();
  });

  // ============================================
  // Page Load
  // ============================================

  ownerTest('should load chat page with contacts list', async () => {
    const count = await chatPage.getContactsCount();
    expect(count).toBeGreaterThan(0);
  });

  ownerTest('should display search input', async () => {
    const isVisible = await chatPage.isSearchInputVisible();
    expect(isVisible).toBe(true);
  });

  ownerTest('should display empty state when no contact selected', async () => {
    const isVisible = await chatPage.isEmptyStateVisible();
    expect(isVisible).toBe(true);
  });

  // ============================================
  // Contact Selection
  // ============================================

  ownerTest.describe('Contact Selection', () => {
    ownerTest.beforeEach(async () => {
      const count = await chatPage.getContactsCount();
      ownerTest.skip(count === 0, 'No contacts available');
    });

    ownerTest('should hide empty state after selecting contact', async () => {
      await chatPage.selectContactByIndex(0);

      const isEmptyState = await chatPage.isEmptyStateVisible();
      expect(isEmptyState).toBe(false);
    });

    ownerTest('should show messages container after selecting contact', async () => {
      await chatPage.selectContactByIndex(0);

      const isVisible = await chatPage.isMessagesContainerVisible();
      expect(isVisible).toBe(true);
    });

    ownerTest('should display message input after selecting contact', async () => {
      await chatPage.selectContactByIndex(0);

      const isVisible = await chatPage.isMessageInputVisible();
      expect(isVisible).toBe(true);
    });

    ownerTest('should display send button after selecting contact', async () => {
      await chatPage.selectContactByIndex(0);

      const isVisible = await chatPage.isSendButtonVisible();
      expect(isVisible).toBe(true);
    });

    ownerTest('should display contact name in panel', async () => {
      await chatPage.selectContactByIndex(0);

      const panelName = await chatPage.getContactPanelName();
      expect(panelName).not.toBe('');
    });

    ownerTest('should show telegram account selector', async () => {
      await chatPage.selectContactByIndex(0);

      const isVisible = await chatPage.isAccountSelectorVisible();
      expect(isVisible).toBe(true);
    });

    ownerTest('should have open card button', async () => {
      await chatPage.selectContactByIndex(0);

      const isVisible = await chatPage.isOpenCardButtonVisible();
      expect(isVisible).toBe(true);
    });
  });

  // ============================================
  // Send Button State
  // ============================================

  ownerTest.describe('Send Button State', () => {
    ownerTest.beforeEach(async () => {
      const count = await chatPage.getContactsCount();
      ownerTest.skip(count === 0, 'No contacts available');
      await chatPage.selectContactByIndex(0);
    });

    ownerTest('should be disabled when input is empty', async () => {
      await chatPage.clearMessageInput();

      const isEnabled = await chatPage.isSendButtonEnabled();
      expect(isEnabled).toBe(false);
    });

    ownerTest('should be enabled when text is entered', async () => {
      await chatPage.typeMessage('Test message');

      const isEnabled = await chatPage.isSendButtonEnabled();
      expect(isEnabled).toBe(true);
    });
  });

  // ============================================
  // Search
  // ============================================

  ownerTest.describe('Search', () => {
    ownerTest.beforeEach(async () => {
      const count = await chatPage.getContactsCount();
      ownerTest.skip(count === 0, 'No contacts available');
    });

    ownerTest('should restore contacts list after clearing search', async () => {
      const initialCount = await chatPage.getContactsCount();

      await chatPage.searchContact('xyz123nonexistent');
      await chatPage.clearSearch();

      const restoredCount = await chatPage.getContactsCount();
      expect(restoredCount).toBe(initialCount);
    });
  });
});
