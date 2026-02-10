/**
 * AI Assistant - Settings Tests
 *
 * Тесты для настроек AI Assistant (Settings > Internal AI Assistant)
 */

import { ownerTest, expect } from '@fixtures/auth.fixture';
import { AIAssistantPage } from '@pages/AIAssistantPage';
import { AIAssistantSelectors } from '@pages/selectors/ai-assistant.selectors';

ownerTest.describe('AI Assistant Settings', () => {
  let aiAssistant: AIAssistantPage;
  const S = AIAssistantSelectors;

  ownerTest.beforeEach(async ({ page }) => {
    aiAssistant = new AIAssistantPage(page);
    await aiAssistant.goToSettings();
  });

  ownerTest.describe('Model Selection', () => {
    ownerTest('A5a: settings page shows credentials selector', async ({ page }) => {
      // Проверяем, что есть кнопка выбора credentials (показывает "Name (Provider)")
      const credentialsButton = page.locator(S.credentialsButton).first();
      await expect(credentialsButton).toBeVisible({ timeout: 5000 });
    });

    ownerTest('A5b: model selector dropdown is visible and clickable', async ({ page }) => {
      // Проверяем, что есть combobox/select для выбора модели
      const modelSelector = page.locator(S.modelSelect).first();
      await expect(modelSelector).toBeVisible({ timeout: 5000 });
    });

    ownerTest('A5c: model dropdown has options', async ({ page }) => {
      // Проверяем, что combobox для модели содержит options
      const modelSelector = page.locator(S.modelSelect).first();
      await expect(modelSelector).toBeVisible({ timeout: 5000 });
      // Проверяем наличие хотя бы одного option
      const options = modelSelector.locator('option');
      const count = await options.count();
      expect(count).toBeGreaterThanOrEqual(1);
    });
  });

  ownerTest.describe('System Prompt', () => {
    ownerTest('A5f: system prompt textarea is visible', async ({ page }) => {
      const promptTextarea = page.getByRole('textbox').first();
      await expect(promptTextarea).toBeVisible({ timeout: 5000 });
    });

    ownerTest('A5g: system prompt has default content', async ({ page }) => {
      const promptTextarea = page.getByRole('textbox').first();
      const content = await promptTextarea.inputValue();
      expect(content.length).toBeGreaterThan(0);
    });
  });

  ownerTest.describe('Save Settings', () => {
    ownerTest('A5h: update settings button is visible', async ({ page }) => {
      const updateButton = page.locator(S.updateSettingsButton).first();
      await expect(updateButton).toBeVisible({ timeout: 5000 });
    });
  });
});
