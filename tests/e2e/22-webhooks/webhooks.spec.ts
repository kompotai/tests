/**
 * Webhooks Settings Tests
 *
 * Settings → Webhooks
 *
 * TC-1: List page displays existing webhooks
 * TC-2: Create webhook with minimal data
 * TC-3: Edit webhook name and URL
 * TC-4: Delete webhook
 * TC-5: Toggle webhook active/inactive
 * TC-6: Validation — empty form submit
 */

import { ownerTest, expect } from '@fixtures/auth.fixture';
import { WebhooksPage } from '@pages/WebhooksPage';

const TEST_RUN_ID = Date.now();
let counter = 0;

function uniqueWebhookName(): string {
  return `Test Webhook ${TEST_RUN_ID}-${++counter}`;
}

ownerTest.describe('Webhooks Settings', () => {
  let webhooksPage: WebhooksPage;

  ownerTest.beforeEach(async ({ page }) => {
    webhooksPage = new WebhooksPage(page);
    await webhooksPage.goto();
  });

  ownerTest('TC-1: list page displays existing webhooks', async () => {
    await webhooksPage.shouldSeeText('Webhooks');
    await webhooksPage.shouldSeeText('Contacts');

    // At least one existing webhook should be visible
    await webhooksPage.shouldSeeWebhook('New Contact');
  });

  ownerTest('TC-2: create webhook with minimal data', async () => {
    const name = uniqueWebhookName();

    await webhooksPage.createWebhook({
      name,
      url: 'https://httpbin.org/post',
      events: ['Contact Created'],
    });

    // Verify it appears in the list
    await webhooksPage.shouldSeeWebhook(name);

    // Cleanup
    await webhooksPage.deleteWebhook(name);
  });

  ownerTest('TC-3: edit webhook name and URL', async () => {
    const name = uniqueWebhookName();

    await webhooksPage.createWebhook({
      name,
      url: 'https://httpbin.org/post',
      events: ['Contact Created'],
    });

    // Edit
    const newName = `Renamed Webhook ${Date.now()}`;
    await webhooksPage.editWebhook(name, {
      name: newName,
      url: 'https://httpbin.org/put',
    });

    // Verify
    await webhooksPage.shouldSeeWebhook(newName);

    // Cleanup
    await webhooksPage.deleteWebhook(newName);
  });

  ownerTest('TC-4: delete webhook', async () => {
    const name = uniqueWebhookName();

    await webhooksPage.createWebhook({
      name,
      url: 'https://httpbin.org/post',
      events: ['Contact Created'],
    });

    await webhooksPage.shouldSeeWebhook(name);

    // Delete
    await webhooksPage.deleteWebhook(name);

    // Verify removed
    await webhooksPage.shouldNotSeeWebhook(name);
  });

  ownerTest('TC-5: toggle webhook active/inactive', async () => {
    const name = uniqueWebhookName();

    await webhooksPage.createWebhook({
      name,
      url: 'https://httpbin.org/post',
      events: ['Contact Created'],
    });

    // Check initial state (should be active after creation)
    const initialState = await webhooksPage.isWebhookEnabled(name);

    // Toggle
    await webhooksPage.toggleWebhook(name);
    const toggledState = await webhooksPage.isWebhookEnabled(name);
    expect(toggledState).toBe(!initialState);

    // Toggle back
    await webhooksPage.toggleWebhook(name);
    const restoredState = await webhooksPage.isWebhookEnabled(name);
    expect(restoredState).toBe(initialState);

    // Cleanup
    await webhooksPage.deleteWebhook(name);
  });

  ownerTest('TC-6: validation — empty form submit', async () => {
    await webhooksPage.openCreateForm();

    // Clear pre-filled fields and submit empty
    const nameInput = webhooksPage.page.locator('[data-testid="webhook-form"] input[name="name"]');
    await nameInput.clear();

    const urlInput = webhooksPage.page.locator('[data-testid="webhook-form"] input[name="url"]');
    await urlInput.clear();

    await webhooksPage.submitForm();

    // Form should still be visible (not closed)
    await expect(webhooksPage.page.locator('[data-testid="webhook-form"]')).toBeVisible();

    // Close form
    await webhooksPage.cancelForm();
  });
});
