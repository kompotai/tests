/**
 * Mock Handlers for E2E Tests
 *
 * Provides mock responses for external integrations that may not be available in test environment
 */
import { Page, Route } from '@playwright/test';

/**
 * Mock Outbound Interactions
 *
 * Intercepts /api/interactions requests for all outbound messages and returns successful responses
 */
export async function mockOutboundInteractions(page: Page) {
  // Mock interactions API for all outbound messages (webchat, telegram, sms, email, etc)
  await page.route('**/api/interactions', async (route: Route) => {
    const request = route.request();
    const method = request.method();

    if (method === 'POST') {
      const postData = request.postDataJSON();

      // Mock all outbound interactions
      if (postData?.direction === 'outbound') {
        const mockInteraction = {
          id: `mock_interaction_${Date.now()}`,
          type: postData.type,
          channelId: postData.channelId,
          contactId: postData.contactId,
          direction: 'outbound',
          status: 'sent',
          metadata: postData.metadata,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify(mockInteraction),
        });
        return;
      }
    }

    // Let other requests through
    await route.continue();
  });

  console.log('✓ Outbound interactions mocked');
}

/**
 * Mock Socket.IO interaction:created events
 *
 * Simulates websocket events when messages are sent
 */
export async function mockSocketEvents(page: Page) {
  // Intercept Socket.IO connection and mock events
  await page.addInitScript(() => {
    // Wait for socket.io to load and then mock
    const originalSocketIO = (window as any).io;
    if (typeof originalSocketIO === 'function') {
      const originalConnect = originalSocketIO.connect || originalSocketIO;

      (window as any).io = function(...args: any[]) {
        const socket = originalConnect.apply(this, args);

        // Mock emit to simulate receiving events
        const originalEmit = socket.emit;
        socket.emit = function(eventName: string, ...data: any[]) {
          const result = originalEmit.apply(this, [eventName, ...data]);

          // Simulate interaction:created event after sending
          if (eventName === 'send:message' || eventName === 'interaction:send') {
            setTimeout(() => {
              const handlers = socket._callbacks?.$['interaction:created'];
              if (handlers) {
                handlers.forEach((handler: Function) => {
                  handler({
                    ...data[0],
                    id: `mock_${Date.now()}`,
                    createdAt: new Date().toISOString(),
                  });
                });
              }
            }, 50);
          }

          return result;
        };

        return socket;
      };
      (window as any).io.connect = (window as any).io;
    }
  });

  console.log('✓ Socket events mocked');
}

/**
 * Setup all mocks for Chat tests
 */
export async function setupChatMocks(page: Page) {
  await mockOutboundInteractions(page);
  await mockSocketEvents(page);
}
