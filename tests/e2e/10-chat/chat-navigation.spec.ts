/**
 * Chat Navigation & UI Tests
 */
import { ownerTest, expect } from '@fixtures/auth.fixture';
import { ChatPage } from '@pages/ChatPage';
import { setupChatMocks } from '@fixtures/mocks.fixture';

ownerTest.describe('Chat - Navigation & UI', () => {
  let chatPage: ChatPage;

  ownerTest.beforeEach(async ({ page }) => {
    // Setup mocks for Telegram integration
    await setupChatMocks(page);

    chatPage = new ChatPage(page);
    await chatPage.goto();
  });

  ownerTest('should load chat page successfully', async () => {
    const contactsList = await chatPage.page.locator('[data-testid="chat-contacts-list"]');
    await expect(contactsList).toBeVisible();
  });

  ownerTest('should display search input', async ({ page }) => {
    const searchInput = page.locator('[data-testid="chat-input-search"]');
    await expect(searchInput).toBeVisible();
  });

  ownerTest('should display empty state when no contact selected', async () => {
    const isEmptyState = await chatPage.isEmptyStateVisible();
    expect(isEmptyState).toBeTruthy();
  });

  ownerTest('should show at least one contact in list', async () => {
    const count = await chatPage.getContactsCount();
    expect(count).toBeGreaterThan(0);
  });

  ownerTest('should select contact and hide empty state', async ({ page }) => {
    const count = await chatPage.getContactsCount();

    if (count > 0) {
      await chatPage.selectContactByIndex(0);

      // Wait for loading to complete
      await page.locator('[role="status"]').waitFor({ state: 'hidden', timeout: 10000 }).catch(() => {});

      // Wait for either messages container or contact panel to appear
      await Promise.race([
        page.locator('[data-testid="chat-messages-container"]').waitFor({ state: 'visible', timeout: 5000 }),
        page.locator('[data-testid="chat-contact-panel-name"]').waitFor({ state: 'visible', timeout: 5000 })
      ]).catch(() => {});

      const isEmptyState = await chatPage.isEmptyStateVisible();
      expect(isEmptyState).toBeFalsy();
    }
  });

  ownerTest('should highlight selected contact', async ({ page }) => {
    const count = await chatPage.getContactsCount();

    if (count > 0) {
      await chatPage.selectContactByIndex(0);

      const activeContact = page.locator('[data-testid*="chat-contact-item-"].bg-blue-50');
      await expect(activeContact).toBeVisible({ timeout: 5000 });
    }
  });

  ownerTest('should filter contacts by search', async ({ page }) => {
    const initialCount = await chatPage.getContactsCount();

    if (initialCount > 0) {
      await chatPage.searchContact('xyz123nonexistent');

      // Wait for search to filter results (longer timeout for debounced search)
      await page.waitForTimeout(1500);

      // Verify no contacts shown for non-existent search
      const noResultsCount = await chatPage.getContactsCount();
      expect(noResultsCount).toBe(0);

      await chatPage.clearSearch();

      // Wait for contacts to reload after clearing search
      await page.waitForTimeout(1000);

      const restoredCount = await chatPage.getContactsCount();
      expect(restoredCount).toBe(initialCount);
    }
  });

  ownerTest('should display message input after selecting contact', async ({ page }) => {
    const count = await chatPage.getContactsCount();

    if (count > 0) {
      await chatPage.selectContactByIndex(0);

      const messageInput = page.locator('[data-testid="chat-input-message"]');
      await expect(messageInput).toBeVisible();
    }
  });

  ownerTest('should display send button', async ({ page }) => {
    const count = await chatPage.getContactsCount();

    if (count > 0) {
      await chatPage.selectContactByIndex(0);

      const sendButton = page.locator('[data-testid="chat-button-send"]');
      await expect(sendButton).toBeVisible();
    }
  });

  ownerTest('should have send button disabled when input is empty', async () => {
    const count = await chatPage.getContactsCount();
    
    if (count > 0) {
      await chatPage.selectContactByIndex(0);
      await chatPage.clearMessageInput();
      
      const isEnabled = await chatPage.isSendButtonEnabled();
      expect(isEnabled).toBeFalsy();
    }
  });

  ownerTest('should enable send button when text is entered', async ({ page }) => {
    const count = await chatPage.getContactsCount();

    if (count > 0) {
      await chatPage.selectContactByIndex(0);
      await chatPage.typeMessage('Test message');

      // Verify send button is enabled
      const sendButton = page.locator('[data-testid="chat-button-send"]');
      await expect(sendButton).toBeEnabled({ timeout: 3000 });
    }
  });

  ownerTest('should display contact name in panel', async () => {
    const count = await chatPage.getContactsCount();
    
    if (count > 0) {
      await chatPage.selectContactByIndex(0);
      
      const panelName = await chatPage.getContactPanelName();
      expect(panelName.length).toBeGreaterThan(0);
    }
  });

  ownerTest('should have open card button', async ({ page }) => {
    const count = await chatPage.getContactsCount();

    if (count > 0) {
      await chatPage.selectContactByIndex(0);

      // Wait for loading to complete
      await page.locator('[role="status"]').waitFor({ state: 'hidden', timeout: 10000 }).catch(() => {});

      const openCardButton = page.locator('[data-testid="chat-button-openCard"]');
      await expect(openCardButton).toBeVisible();
    }
  });
});
