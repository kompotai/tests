/**
 * Regression test for Issue #221
 * AI Assistant send button was not clickable because the disabled state
 * did not include the hasValidConnection check, while handleSubmit did.
 * This caused a silent failure — button appeared clickable but did nothing.
 *
 * Fix: Added !hasValidConnection to both input and button disabled states
 * in DialogueChat.tsx to match the handleSubmit guard.
 *
 * @see https://github.com/kompotai/bug-reports/issues/221
 */

import { ownerTest, expect } from '@fixtures/auth.fixture';
import { WORKSPACE_ID } from '@fixtures/users';

ownerTest.describe('Issue #221: AI Assistant send button', { tag: ['@regression'] }, () => {
  const API_BASE = `/api/ws/${WORKSPACE_ID}`;

  ownerTest('system-settings API returns AI config with hasApiKey field @regression', async ({ request }) => {
    const response = await request.get(`${API_BASE}/system-settings`);
    expect(response.ok()).toBe(true);

    const data = await response.json();

    // If AI is configured, check structure
    if (data.ai) {
      expect(data.ai).toHaveProperty('providers');

      // Check that each configured provider has hasApiKey field
      for (const [, config] of Object.entries(data.ai.providers || {})) {
        if (config) {
          expect(config).toHaveProperty('hasApiKey');
          expect(typeof (config as { hasApiKey: boolean }).hasApiKey).toBe('boolean');
        }
      }

      // If there's an active provider, it must have hasApiKey
      if (data.ai.activeProvider) {
        const activeConfig = data.ai.providers[data.ai.activeProvider];
        expect(activeConfig).toBeTruthy();
        expect(activeConfig.hasApiKey).toBe(true);
      }
    }
  });

  ownerTest('AI assistant page loads and shows input when configured @regression', async ({ page }) => {
    await page.goto(`/ws/${WORKSPACE_ID}/ai-assistant`);

    // Wait for the page to load (either chat input or configuration message)
    await expect(
      page.locator('input[placeholder]').or(
        page.locator('text=configure').first()
      )
    ).toBeVisible({ timeout: 15000 });

    // If AI is configured, input should be enabled and button should exist
    const input = page.locator('form input[type="text"], form input:not([type])').first();
    const sendButton = page.locator('form button[type="submit"]').first();

    if (await input.isVisible({ timeout: 3000 }).catch(() => false)) {
      // When AI is configured, input and button should both be present
      await expect(sendButton).toBeVisible();

      // Both should have consistent disabled state (either both enabled or both disabled)
      const inputDisabled = await input.isDisabled();
      const buttonDisabled = await sendButton.isDisabled();

      // If input is enabled, button should also be enabled (when text is entered)
      if (!inputDisabled) {
        await input.fill('test message');
        // After typing, button should be enabled
        await expect(sendButton).toBeEnabled({ timeout: 3000 });
      } else {
        // Both should be disabled consistently
        expect(buttonDisabled).toBe(true);
      }
    }
  });
});
