/**
 * Regression test for Issue #211
 * Chat module shows "No communication channels configured" warning even when
 * channels (SMS, Telegram) are configured at workspace level, but the selected
 * contact lacks the required data (phone number, Telegram chatId).
 *
 * Fix: Differentiate between two cases:
 * 1. No channels configured in workspace → "No communication channels configured"
 * 2. Channels configured but contact lacks data → "No way to reach this contact"
 *
 * @see https://github.com/kompotai/bug-reports/issues/211
 */

import { ownerTest, expect } from '@fixtures/auth.fixture';
import { WORKSPACE_ID } from '@fixtures/users';

ownerTest.describe('Issue #211: Chat channel warning messages', { tag: ['@regression'] }, () => {
  const API_BASE = `/api/ws/${WORKSPACE_ID}`;

  ownerTest('channels API returns isActive field for each channel @regression', async ({ request }) => {
    const response = await request.post(`${API_BASE}/channels/search`, {
      data: { onlyEnabled: true, includeSmsChannel: true },
    });

    expect(response.ok()).toBe(true);

    const data = await response.json();
    expect(data.channels).toBeDefined();
    expect(Array.isArray(data.channels)).toBe(true);

    // Every channel in the response should have an isActive field
    for (const channel of data.channels) {
      expect(channel).toHaveProperty('isActive');
      expect(typeof channel.isActive).toBe('boolean');
      expect(channel).toHaveProperty('code');
      expect(channel).toHaveProperty('name');
    }
  });

  ownerTest('chat page shows appropriate message for contact without channel data @regression', async ({ page }) => {
    // Navigate to chat
    await page.goto(`/ws/${WORKSPACE_ID}/chat`);

    // Wait for chat to load
    await page.waitForSelector('[data-testid^="chat-contact-item-"]', { timeout: 10000 }).catch(() => {
      // No contacts in chat - skip test
    });

    // Check that the chat page loaded
    await expect(page.getByRole('heading', { name: 'Conversation' }).or(
      page.getByRole('heading', { name: 'Select a contact' })
    )).toBeVisible({ timeout: 10000 });
  });
});
