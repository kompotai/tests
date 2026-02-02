/**
 * Chat Navigation & UI Tests
 */
import { ownerTest, expect } from '@fixtures/auth.fixture';
import { ChatPage } from '@pages/ChatPage';

ownerTest.describe('Chat - Navigation & UI', () => {
  let chatPage: ChatPage;

  ownerTest.beforeEach(async ({ page }) => {
    chatPage = new ChatPage(page);
    await chatPage.goto();
  });

  ownerTest('should load chat page successfully', async () => {
    const contactsList = await chatPage.page.locator('[data-testid="chat-contacts-list"]');
    await expect(contactsList).toBeVisible();
  });

  ownerTest('should display search input', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="Search"]');
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

  ownerTest('should select contact and hide empty state', async () => {
    const count = await chatPage.getContactsCount();
    
    if (count > 0) {
      await chatPage.selectContactByIndex(0);
      
      const isEmptyState = await chatPage.isEmptyStateVisible();
      expect(isEmptyState).toBeFalsy();
      
      const isMessagesVisible = await chatPage.isMessagesContainerVisible();
      expect(isMessagesVisible).toBeTruthy();
    }
  });

  ownerTest('should highlight selected contact', async ({ page }) => {
    const count = await chatPage.getContactsCount();
    
    if (count > 0) {
      await chatPage.selectContactByIndex(0);
      await chatPage.wait(500);
      
      const activeContact = await page
        .locator('[data-testid*="chat-contact-item-"].bg-blue-50')
        .isVisible();
      expect(activeContact).toBeTruthy();
    }
  });

  ownerTest('should filter contacts by search', async () => {
    const initialCount = await chatPage.getContactsCount();
    
    if (initialCount > 0) {
      await chatPage.searchContact('xyz123nonexistent');
      await chatPage.wait(500);
      
      await chatPage.clearSearch();
      await chatPage.wait(500);
      
      const restoredCount = await chatPage.getContactsCount();
      expect(restoredCount).toBe(initialCount);
    }
  });

  ownerTest('should display message input after selecting contact', async ({ page }) => {
    const count = await chatPage.getContactsCount();
    
    if (count > 0) {
      await chatPage.selectContactByIndex(0);
      
      const messageInput = page.locator('textarea[placeholder*="Telegram"]');
      await expect(messageInput).toBeVisible();
    }
  });

  ownerTest('should display send button', async ({ page }) => {
    const count = await chatPage.getContactsCount();
    
    if (count > 0) {
      await chatPage.selectContactByIndex(0);
      
      const sendButton = page.locator('button:has-text("Send")');
      await expect(sendButton).toBeVisible();
    }
  });

  ownerTest('should show telegram account selector', async () => {
    const count = await chatPage.getContactsCount();
    
    if (count > 0) {
      await chatPage.selectContactByIndex(0);
      
      const account = await chatPage.getSelectedAccount();
      expect(account).toContain('@');
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

  ownerTest('should enable send button when text is entered', async () => {
    const count = await chatPage.getContactsCount();
    
    if (count > 0) {
      await chatPage.selectContactByIndex(0);
      await chatPage.typeMessage('Test message');
      await chatPage.wait(300);
      
      const isEnabled = await chatPage.isSendButtonEnabled();
      expect(isEnabled).toBeTruthy();
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
      
      const openCardButton = page.locator('a:has(svg.lucide-external-link)');
      await expect(openCardButton).toBeVisible();
    }
  });
});
