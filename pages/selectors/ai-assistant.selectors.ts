/**
 * AI Assistant Selectors
 *
 * NOTE: Некоторые элементы используют временные селекторы.
 * TODO: Попросить разработчиков добавить data-testid
 */

export const AIAssistantSelectors = {
  // ============================================
  // Chat Panel (окно чата справа)
  // ============================================

  // TODO: Add data-testid="ai-assistant-button-open"
  // Иконка в header справа - пробуем разные варианты
  openButton: 'button:has(svg.lucide-radio), button:has(svg.lucide-sparkles), header button:nth-last-child(3)',

  // TODO: Add data-testid="ai-assistant-panel"
  panel: '[class*="fixed"][class*="right-0"]:has-text("Internal AI Assistant")',

  // TODO: Add data-testid="ai-assistant-button-close"
  closeButton: 'button:has(svg.lucide-x)',

  // TODO: Add data-testid="ai-assistant-button-minimize"
  minimizeButton: 'button:has(svg.lucide-minus)',

  // TODO: Add data-testid="ai-assistant-messages"
  messagesContainer: '[class*="overflow-y-auto"]:has([class*="message"])',

  // TODO: Add data-testid="ai-assistant-input-message"
  messageInput: 'input[placeholder*="message" i], textarea[placeholder*="message" i], input[placeholder*="Type" i]',

  // TODO: Add data-testid="ai-assistant-button-send"
  sendButton: 'button:has(svg.lucide-send), button:has(svg.lucide-send-horizontal), button[type="submit"]:has(svg)',

  // Header
  header: 'text="Internal AI Assistant"',

  // ============================================
  // Settings Page (Settings > AI Assistant)
  // ============================================

  // Navigation to settings
  settingsMenuItem: 'a[href*="/settings/ai-assistant"], button:has-text("AI Assistant")',

  // TODO: Add data-testid="ai-assistant-tab-claude"
  tabClaude: 'button:has-text("Claude")',

  // TODO: Add data-testid="ai-assistant-tab-gpt"
  tabGPT: 'button:has-text("GPT")',

  // TODO: Add data-testid="ai-assistant-tab-gemini"
  tabGemini: 'button:has-text("Gemini")',

  // TODO: Add data-testid="ai-assistant-select-model"
  modelSelect: 'select, [role="combobox"], button:has-text("Pro"), button:has-text("Opus")',

  // TODO: Add data-testid="ai-assistant-input-apikey"
  apiKeyInput: 'input[type="password"], input[placeholder*="key" i], input[placeholder*="API" i]',

  // TODO: Add data-testid="ai-assistant-button-togglekey"
  toggleKeyButton: 'button:has(svg.lucide-eye), button:has(svg.lucide-eye-off)',

  // TODO: Add data-testid="ai-assistant-link-getkey"
  getKeyLink: 'a[href*="openai.com"], a[href*="anthropic.com"], a[href*="google"], button:has(svg.lucide-external-link)',

  // TODO: Add data-testid="ai-assistant-input-prompt"
  systemPromptInput: 'textarea[placeholder*="prompt" i], textarea:has-text("You are")',

  // TODO: Add data-testid="ai-assistant-button-save"
  saveButton: 'button:has-text("Save"), button:has-text("activate")',
} as const;
