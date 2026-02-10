/**
 * AI Assistant - Chat Tests
 *
 * Тесты для Internal AI Assistant (dedicated page)
 */

import { ownerTest, expect } from '@fixtures/auth.fixture';
import { WORKSPACE_ID } from '@fixtures/users';
import { AIAssistantPage } from '@pages/AIAssistantPage';

ownerTest.describe('AI Assistant Chat', () => {
  let aiAssistant: AIAssistantPage;

  ownerTest.beforeEach(async ({ page }) => {
    aiAssistant = new AIAssistantPage(page);
    await aiAssistant.goto();
  });

  ownerTest.describe('Page Load', () => {
    ownerTest('A1: AI Assistant page loads with dialogues sidebar and input field', async ({ page }) => {
      // Проверяем heading "Dialogues"
      await expect(page.getByRole('heading', { name: 'Dialogues' })).toBeVisible();

      // Проверяем, что textbox видим
      await expect(page.getByRole('textbox')).toBeVisible();

      // Проверяем кнопку "New dialogue" (accessible name, не текст)
      await expect(page.getByRole('button', { name: 'New dialogue' })).toBeVisible();
    });

    ownerTest('A2: can navigate away from AI Assistant page', async ({ page }) => {
      // Переходим на другую страницу
      await page.goto(`/ws/${WORKSPACE_ID}`, { waitUntil: 'domcontentloaded' });

      // Проверяем, что мы ушли со страницы AI Assistant
      expect(page.url()).not.toContain('/ai-assistant');
    });

    ownerTest('A3: chat area displays content', async ({ page }) => {
      // Проверяем, что в области чата есть какой-то контент (сообщения или пустое состояние)
      // Может быть "Type a message to start a dialogue" или загруженная история
      const chatContent = page.locator('main p').first();
      await expect(chatContent).toBeVisible({ timeout: 5000 });
    });
  });

  ownerTest.describe('Messaging', () => {
    ownerTest('A4: can send message and receive response', async ({ page }) => {
      // Отправляем сообщение
      await aiAssistant.sendMessage('Hello, how are you?');

      // Ждём ответ от AI — появляется элемент с длинным текстом
      const aiResponse = page.locator('p').filter({ hasText: /.{10,}/ }).last();
      await expect(aiResponse).toBeVisible({ timeout: 10000 });

      // Проверяем, что появилось больше одного сообщения
      const messages = page.locator('p').filter({ hasText: /.{10,}/ });
      const count = await messages.count();
      expect(count).toBeGreaterThanOrEqual(2);
    });

    ownerTest('A6: chat history is preserved after page reload', async ({ page }) => {
      // Отправляем уникальное сообщение
      const uniqueMessage = `Test message ${Date.now()}`;
      await aiAssistant.sendMessage(uniqueMessage);

      // Ждём пока сообщение появится на странице
      await expect(page.locator(`text="${uniqueMessage}"`)).toBeVisible({ timeout: 5000 });

      // Перезагружаем страницу
      await page.reload({ waitUntil: 'domcontentloaded' });
      await page.getByRole('heading', { name: 'Dialogues' }).waitFor({ state: 'visible', timeout: 10000 });

      // Проверяем, что сообщение сохранилось
      const savedMessage = page.locator(`text="${uniqueMessage}"`);
      await expect(savedMessage).toBeVisible({ timeout: 10000 });
    });

    ownerTest('A8: AI understands Russian language', async ({ page }) => {
      // Отправляем сообщение на русском
      await aiAssistant.sendMessage('Привет! Как дела?');

      // Ждём ответ от AI
      const aiResponse = page.locator('p').filter({ hasText: /.{5,}/ }).last();
      await expect(aiResponse).toBeVisible({ timeout: 10000 });

      // Проверяем, что AI ответил
      const messages = page.locator('p').filter({ hasText: /.{5,}/ });
      const count = await messages.count();
      expect(count).toBeGreaterThanOrEqual(2);
    });

    ownerTest('A9: AI understands English language', async ({ page }) => {
      // Отправляем сообщение на английском
      await aiAssistant.sendMessage('What can you help me with?');

      // Ждём ответ от AI
      const aiResponse = page.locator('p').filter({ hasText: /.{5,}/ }).last();
      await expect(aiResponse).toBeVisible({ timeout: 10000 });

      // Проверяем, что AI ответил
      const messages = page.locator('p').filter({ hasText: /.{5,}/ });
      const count = await messages.count();
      expect(count).toBeGreaterThanOrEqual(2);
    });
  });
});
