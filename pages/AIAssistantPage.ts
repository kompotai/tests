import { Page } from '@playwright/test';
import { AIAssistantSelectors } from './selectors/ai-assistant.selectors';
import { WORKSPACE_ID } from '@fixtures/users';

/**
 * AI Assistant Page Object
 *
 * Методы для работы с Internal AI Assistant:
 * - Навигация на страницу чата
 * - Отправка сообщений
 * - Настройки
 */
export class AIAssistantPage {
  private readonly S = AIAssistantSelectors;

  constructor(private page: Page) {}

  // ============================================
  // Navigation
  // ============================================

  /**
   * Перейти на страницу AI Assistant и дождаться загрузки
   */
  async goto(): Promise<void> {
    await this.page.goto(`/ws/${WORKSPACE_ID}/ai-assistant`, { waitUntil: 'domcontentloaded' });
    await this.dismissCookieConsent();
    // Ждём появления heading "Dialogues"
    await this.page.getByRole('heading', { name: 'Dialogues' }).waitFor({ state: 'visible', timeout: 10000 });
    // Ждём пока textbox станет visible
    await this.page.getByRole('textbox').waitFor({ state: 'visible', timeout: 10000 });
  }

  /**
   * Закрыть cookie consent если он появился
   */
  async dismissCookieConsent(): Promise<void> {
    const acceptButton = this.page.locator('[data-testid="cookie-accept-all"]');
    if (await acceptButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await acceptButton.click({ force: true });
    }
  }

  // ============================================
  // Messaging
  // ============================================

  /**
   * Отправить сообщение через Enter
   */
  async sendMessage(text: string): Promise<void> {
    const input = this.page.getByRole('textbox');
    await input.fill(text);
    await input.press('Enter');
  }

  /**
   * Подождать ответ от AI (появление нового сообщения)
   */
  async waitForResponse(timeout = 10000): Promise<void> {
    await this.page.locator('p').filter({ hasText: /.{10,}/ }).last().waitFor({ state: 'visible', timeout });
  }

  // ============================================
  // Settings
  // ============================================

  /**
   * Перейти на страницу настроек AI Assistant напрямую
   */
  async goToSettings(): Promise<void> {
    await this.page.goto(`/ws/${WORKSPACE_ID}/settings/internal-ai-assistant`, { waitUntil: 'domcontentloaded' });
    await this.dismissCookieConsent();
    // Ждём загрузки страницы — появление кнопки "Update settings"
    await this.page.locator(this.S.updateSettingsButton).first().waitFor({ state: 'visible', timeout: 10000 });
  }

  /**
   * Сохранить настройки
   */
  async saveSettings(): Promise<void> {
    await this.page.locator(this.S.updateSettingsButton).click();
  }
}
