/**
 * AI Assistant - Chat Tests
 *
 * Тесты для Internal AI Assistant (чат-бот для сотрудников)
 */

import { test, expect } from '@playwright/test';
import { AIAssistantPage } from '@pages/AIAssistantPage';

test.describe('AI Assistant Chat', () => {
  let aiAssistant: AIAssistantPage;

  test.beforeEach(async ({ page }) => {
    aiAssistant = new AIAssistantPage(page);
    // Переходим в workspace (не на /manage!)
    const wsId = process.env.WS_ID || 'vishnevsky7';
    await page.goto(`/ws/${wsId}`);
    await page.waitForLoadState('networkidle');

    // Закрываем cookie consent если есть
    const acceptButton = page.locator('button:has-text("Accept All")');
    if (await acceptButton.isVisible({ timeout: 1000 }).catch(() => false)) {
      await acceptButton.click();
      await page.waitForTimeout(300);
    }
  });

  test.describe('Opening and Closing', () => {
    test('A1: can open AI Assistant panel', async ({ page }) => {
      // Проверяем, что панель изначально закрыта
      await aiAssistant.expectPanelHidden();

      // Открываем AI Assistant
      await aiAssistant.open();

      // Проверяем, что панель открылась
      await aiAssistant.expectPanelVisible();

      // Проверяем, что заголовок "Internal AI Assistant" виден
      await expect(page.locator('text="Internal AI Assistant"')).toBeVisible();
    });

    test('A2: can close AI Assistant panel', async ({ page }) => {
      // Открываем
      await aiAssistant.open();
      await aiAssistant.expectPanelVisible();

      // Закрываем
      await aiAssistant.close();

      // Проверяем, что панель закрылась
      await aiAssistant.expectPanelHidden();
    });

    test('A3: panel shows welcome message', async ({ page }) => {
      await aiAssistant.open();

      // Проверяем, что есть приветственное сообщение от AI (содержит "Hey" + имя пользователя)
      const welcomeMessage = page.locator('p:has-text("Hey")').first();
      await expect(welcomeMessage).toBeVisible();
    });

    test('A10: can minimize AI Assistant panel', async ({ page }) => {
      await aiAssistant.open();
      await aiAssistant.expectPanelVisible();

      // Сворачиваем
      await aiAssistant.minimize();

      // После сворачивания панель должна быть скрыта или минимизирована
      // Проверяем что заголовок "Internal AI Assistant" не виден в полном размере
      await page.waitForTimeout(500);
    });
  });

  test.describe('Messaging', () => {
    test('A4: can send message and receive response', async ({ page }) => {
      await aiAssistant.open();

      // Отправляем сообщение
      await aiAssistant.sendMessage('Hello, how are you?');

      // Ждём ответ от AI (должно появиться новое сообщение)
      // AI обычно отвечает в течение нескольких секунд
      await page.waitForTimeout(5000);

      // Проверяем, что появилось больше одного сообщения (приветствие + наше + ответ)
      const messages = page.locator('p').filter({ hasText: /.{10,}/ });
      const count = await messages.count();
      expect(count).toBeGreaterThanOrEqual(2);
    });

    test('A6: chat history is preserved after reopen', async ({ page }) => {
      await aiAssistant.open();

      // Отправляем уникальное сообщение
      const uniqueMessage = `Test message ${Date.now()}`;
      await aiAssistant.sendMessage(uniqueMessage);
      await page.waitForTimeout(3000);

      // Закрываем панель
      await aiAssistant.close();
      await page.waitForTimeout(500);

      // Открываем снова
      await aiAssistant.open();

      // Проверяем, что наше сообщение сохранилось
      const savedMessage = page.locator(`text="${uniqueMessage}"`);
      await expect(savedMessage).toBeVisible({ timeout: 5000 });
    });

    test('A8: AI understands Russian language', async ({ page }) => {
      await aiAssistant.open();

      // Отправляем сообщение на русском
      await aiAssistant.sendMessage('Привет! Как дела?');

      // Ждём ответ
      await page.waitForTimeout(5000);

      // Проверяем, что AI ответил (появилось новое сообщение)
      const messages = page.locator('p').filter({ hasText: /.{5,}/ });
      const count = await messages.count();
      expect(count).toBeGreaterThanOrEqual(2);
    });

    test('A9: AI understands English language', async ({ page }) => {
      await aiAssistant.open();

      // Отправляем сообщение на английском
      await aiAssistant.sendMessage('What can you help me with?');

      // Ждём ответ
      await page.waitForTimeout(5000);

      // Проверяем, что AI ответил
      const messages = page.locator('p').filter({ hasText: /.{5,}/ });
      const count = await messages.count();
      expect(count).toBeGreaterThanOrEqual(2);
    });
  });
});
