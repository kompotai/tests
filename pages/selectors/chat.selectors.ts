/**
 * Chat Selectors
 * 
 * NOTE: Некоторые элементы используют временные селекторы.
 * TODO: Попросить разработчиков добавить data-testid (см. PR description)
 */

export const ChatSelectors = {
  // ============================================
  // Existing data-testid (already in code)
  // ============================================
  
  contactsList: '[data-testid="chat-contacts-list"]',
  contactItem: (contactId: string) => `[data-testid="chat-contact-item-${contactId}"]`,
  quickCreateButton: '[data-testid="quick-create-button"]',
  
  // ============================================
  // Temporary selectors (need data-testid)
  // ============================================
  
  // TODO: Add data-testid="chat-input-search"
  searchInput: 'input[placeholder*="Search"]',
  
  // TODO: Add data-testid="chat-messages-container"
  messagesContainer: '.flex-1.min-h-0.overflow-y-auto',
  
  // TODO: Add data-testid="chat-input-message"
  messageInput: 'textarea[placeholder*="Telegram"]',
  
  // TODO: Add data-testid="chat-button-send"
  sendButton: 'button:has-text("Send")',
  
  // TODO: Add data-testid="chat-select-account"
  accountSelector: 'button:has-text("@")',
  
  // TODO: Add data-testid="chat-empty-state"
  emptyState: 'text="Select a contact"',
  
  // TODO: Add data-testid="chat-button-openCard"
  openCardButton: 'a:has(svg.lucide-external-link)',
  
  // ============================================
  // Helper selectors
  // ============================================
  
  // Contact in list by name (fallback)
  contactItemByName: (name: string) => `[data-testid*="chat-contact-item-"]:has-text("${name}")`,
  
  // Active contact (selected)
  activeContact: '[data-testid*="chat-contact-item-"].bg-blue-50',
  
  // Messages
  messageText: '.text-sm.whitespace-pre-wrap.break-words',
  messageByText: (text: string) => `.whitespace-pre-wrap:has-text("${text}")`,
  
  // Contact panel
  contactPanelName: 'h3.text-base.font-medium',
  
} as const;
