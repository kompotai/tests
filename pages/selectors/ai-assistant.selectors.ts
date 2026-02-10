/**
 * AI Assistant Selectors
 *
 * NOTE: Некоторые элементы используют временные селекторы.
 * TODO: Попросить разработчиков добавить data-testid
 */

export const AIAssistantSelectors = {
  // ============================================
  // Chat Page (dedicated page /ws/{id}/ai-assistant)
  // ============================================

  // Placeholder text when no active chat
  emptyStateText: 'text="Type a message to start a dialogue"',

  // ============================================
  // Settings Page (Settings > Internal AI Assistant)
  // ============================================

  // Credentials dropdown button — shows "CredentialName (Provider)"
  // e.g. "OpenAI 2 (OpenAI)", "Claude Key (Anthropic)"
  credentialsButton: 'button:has-text("(OpenAI)"), button:has-text("(Anthropic)"), button:has-text("(Google)"), button:has-text("Select")',

  // Model select — native <select> / combobox
  modelSelect: 'select, [role="combobox"]',

  // TODO: Add data-testid="ai-assistant-button-save"
  updateSettingsButton: 'button:has-text("Update settings")',
} as const;
