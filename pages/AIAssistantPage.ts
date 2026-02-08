import { Page, expect } from '@playwright/test';
import { AIAssistantSelectors } from './selectors/ai-assistant.selectors';

/**
 * AI Assistant Page Object
 *
 * Методы для работы с Internal AI Assistant:
 * - Открытие/закрытие чата
 * - Отправка сообщений
 * - Настройки (смена модели, API key)
 */
export class AIAssistantPage {
  private readonly S = AIAssistantSelectors;

  constructor(private page: Page) {}

  // ============================================
  // Chat Panel
  // ============================================

  /**
   * Открыть окно AI Assistant
   */
  async open(): Promise<void> {
    await this.page.locator(this.S.openButton).click();
    await this.page.locator(this.S.panel).waitFor({ state: 'visible', timeout: 5000 });
  }

  /**
   * Закрыть окно AI Assistant
   */
  async close(): Promise<void> {
    await this.page.locator(this.S.closeButton).click();
    await this.page.locator(this.S.panel).waitFor({ state: 'hidden', timeout: 5000 });
  }

  /**
   * Свернуть окно AI Assistant
   */
  async minimize(): Promise<void> {
    await this.page.locator(this.S.minimizeButton).click();
  }

  /**
   * Проверить, что окно чата открыто
   */
  async isOpen(): Promise<boolean> {
    return await this.page.locator(this.S.panel).isVisible();
  }

  /**
   * Проверить, что окно чата видимо
   */
  async expectPanelVisible(): Promise<void> {
    await expect(this.page.locator(this.S.panel)).toBeVisible();
  }

  /**
   * Проверить, что окно чата скрыто
   */
  async expectPanelHidden(): Promise<void> {
    await expect(this.page.locator(this.S.panel)).toBeHidden();
  }

  // ============================================
  // Messaging
  // ============================================

  /**
   * Отправить сообщение
   */
  async sendMessage(text: string): Promise<void> {
    await this.page.locator(this.S.messageInput).fill(text);
    await this.page.locator(this.S.sendButton).click();
  }

  /**
   * Получить текст последнего сообщения
   */
  async getLastMessage(): Promise<string> {
    const messages = this.page.locator(this.S.messagesContainer).locator('div').last();
    return await messages.textContent() || '';
  }

  /**
   * Подождать ответ от AI (появление нового сообщения)
   */
  async waitForResponse(timeout = 30000): Promise<void> {
    // Ждём, пока появится индикатор загрузки и исчезнет
    await this.page.waitForTimeout(1000); // небольшая пауза для начала ответа
    // TODO: улучшить логику ожидания ответа
  }

  // ============================================
  // Settings
  // ============================================

  /**
   * Перейти на страницу настроек AI Assistant
   */
  async goToSettings(): Promise<void> {
    await this.page.goto('/settings/ai-assistant');
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Выбрать провайдера (Claude, GPT, Gemini)
   */
  async selectProvider(provider: 'claude' | 'gpt' | 'gemini'): Promise<void> {
    const selectors = {
      claude: this.S.tabClaude,
      gpt: this.S.tabGPT,
      gemini: this.S.tabGemini,
    };
    await this.page.locator(selectors[provider]).click();
  }

  /**
   * Ввести API ключ
   */
  async enterApiKey(key: string): Promise<void> {
    await this.page.locator(this.S.apiKeyInput).fill(key);
  }

  /**
   * Показать/скрыть API ключ
   */
  async toggleApiKeyVisibility(): Promise<void> {
    await this.page.locator(this.S.toggleKeyButton).click();
  }

  /**
   * Сохранить настройки
   */
  async saveSettings(): Promise<void> {
    await this.page.locator(this.S.saveButton).click();
  }
}
