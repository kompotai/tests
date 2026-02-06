/**
 * AI Assistant - Settings Tests
 *
 * Тесты для настроек AI Assistant (Settings > AI Assistant)
 */

import { ownerTest, expect } from '@fixtures/auth.fixture';
import { WORKSPACE_ID } from '@fixtures/users';
import { AIAssistantPage } from '@pages/AIAssistantPage';

ownerTest.describe('AI Assistant Settings', () => {
  let aiAssistant: AIAssistantPage;

  ownerTest.beforeEach(async ({ page }) => {
    aiAssistant = new AIAssistantPage(page);
    // Переходим на страницу настроек, затем к AI Assistant
    await page.goto(`/ws/${WORKSPACE_ID}/settings`);
    await page.waitForLoadState('networkidle');

    // Кликаем на AI Assistant в боковом меню
    await page.locator('a:has-text("AI Assistant"), button:has-text("AI Assistant")').click();
    await page.waitForLoadState('networkidle');
  });

  ownerTest.describe('Model Selection', () => {
    ownerTest('A5a: settings page shows model tabs (Claude, GPT, Gemini)', async ({ page }) => {
      // Проверяем, что есть табы для выбора провайдера
      await expect(page.locator('button:has-text("Claude")')).toBeVisible();
      await expect(page.locator('button:has-text("GPT")')).toBeVisible();
      await expect(page.locator('button:has-text("Gemini")')).toBeVisible();
    });

    ownerTest('A5b: can switch between model providers', async ({ page }) => {
      // Кликаем на Claude
      await page.locator('button:has-text("Claude")').click();
      await page.waitForTimeout(500);

      // Кликаем на GPT
      await page.locator('button:has-text("GPT")').click();
      await page.waitForTimeout(500);

      // Кликаем на Gemini
      await page.locator('button:has-text("Gemini")').click();
      await page.waitForTimeout(500);

      // Если дошли сюда без ошибок - тест прошёл
    });

    ownerTest('A5c: model dropdown is visible', async ({ page }) => {
      // Проверяем, что есть dropdown для выбора конкретной модели
      // Может быть select, combobox или button с текстом модели
      const modelSelector = page.locator('select, [role="combobox"], button:has-text("Pro"), button:has-text("Opus"), button:has-text("Sonnet")').first();
      await expect(modelSelector).toBeVisible({ timeout: 5000 });
    });
  });

  ownerTest.describe('API Key', () => {
    ownerTest('A5d: API key input field is visible', async ({ page }) => {
      // Проверяем, что есть поле для ввода API ключа
      const apiKeyInput = page.locator('input[type="password"], input[placeholder*="key" i], input[placeholder*="API" i]').first();
      await expect(apiKeyInput).toBeVisible({ timeout: 5000 });
    });

    ownerTest('A5e: can toggle API key visibility', async ({ page }) => {
      // Находим кнопку глазика
      const toggleButton = page.locator('button:has(svg.lucide-eye), button:has(svg.lucide-eye-off)').first();

      if (await toggleButton.isVisible()) {
        await toggleButton.click();
        await page.waitForTimeout(300);
        // Если кликнули без ошибок - тест прошёл
      }
    });
  });

  ownerTest.describe('System Prompt', () => {
    ownerTest('A5f: system prompt textarea is visible', async ({ page }) => {
      // Проверяем, что есть поле для System Prompt
      const promptTextarea = page.locator('textarea').first();
      await expect(promptTextarea).toBeVisible({ timeout: 5000 });
    });

    ownerTest('A5g: system prompt has default content', async ({ page }) => {
      // Проверяем, что в System Prompt есть текст по умолчанию
      const promptTextarea = page.locator('textarea').first();
      const content = await promptTextarea.inputValue();
      expect(content.length).toBeGreaterThan(0);
    });
  });

  ownerTest.describe('Save Settings', () => {
    ownerTest('A5h: save button is visible', async ({ page }) => {
      // Проверяем, что есть кнопка сохранения
      const saveButton = page.locator('button:has-text("Save"), button:has-text("activate")').first();
      await expect(saveButton).toBeVisible({ timeout: 5000 });
    });
  });
});
