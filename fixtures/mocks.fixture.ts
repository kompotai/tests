/**
 * Mock Handlers for E2E Tests
 *
 * Provides mock responses for external integrations that may not be available in test environment
 */
import { Page, Route } from '@playwright/test';

/**
 * Mock Telegram Integration
 *
 * Intercepts /api/interactions requests for Telegram and returns successful responses
 */
export async function mockTelegramIntegration(page: Page) {
  // Mock interactions API for Telegram messages
  await page.route('**/api/interactions', async (route: Route) => {
    const request = route.request();
    const method = request.method();

    if (method === 'POST') {
      const postData = request.postDataJSON();

      // Only mock Telegram interactions
      if (postData?.type === 'telegram' && postData?.direction === 'outbound') {
        const mockInteraction = {
          id: `mock_interaction_${Date.now()}`,
          type: 'telegram',
          channelId: postData.channelId,
          contactId: postData.contactId,
          direction: 'outbound',
          status: 'sent',
          metadata: postData.metadata,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(mockInteraction),
        });
        return;
      }
    }

    // Let other requests through
    await route.continue();
  });

  console.log('✓ Telegram integration mocked');
}

/**
 * Mock Telegram Account Data
 *
 * Provides mock Telegram account for account selector
 */
export async function mockTelegramAccounts(page: Page) {
  // Mock channel config endpoint to include Telegram account
  await page.route('**/api/channels/config/telegram', async (route: Route) => {
    const mockConfig = {
      code: 'telegram',
      name: 'Telegram',
      enabled: true,
      telegram: {
        enabled: true,
        botToken: 'mock_bot_token',
        botUsername: '@mock_test_bot',
        accounts: [
          {
            username: '@test_account',
            chatId: 'mock_chat_id_123',
          },
        ],
      },
    };

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mockConfig),
    });
  });

  console.log('✓ Telegram accounts mocked');
}

/**
 * Setup all mocks for Chat tests
 */
export async function setupChatMocks(page: Page) {
  await mockTelegramIntegration(page);
  await mockTelegramAccounts(page);
}
