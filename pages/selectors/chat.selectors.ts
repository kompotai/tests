/**
 * Chat Selectors
 *
 * All selectors use data-testid attributes for reliability.
 * See: https://github.com/kompotai/tests/issues/9
 */

export const ChatSelectors = {
  // ============================================
  // Layout & Navigation
  // ============================================

  contactsList: '[data-testid="chat-contacts-list"]',
  contactItem: (contactId: string) => `[data-testid="chat-contact-item-${contactId}"]`,
  contactItemByName: (name: string) => `[data-testid*="chat-contact-item-"]:has-text("${name}")`,
  allContactItems: '[data-testid*="chat-contact-item-"]',
  searchInput: '[data-testid="chat-input-search"]',
  emptyState: '[data-testid="chat-empty-state"]',

  // ============================================
  // Messages
  // ============================================

  messagesContainer: '[data-testid="chat-messages-container"]',
  // TODO: Request data-testid="chat-message-text" for individual message elements
  messageText: '[data-testid="chat-messages-container"] .whitespace-pre-wrap',
  messageByText: (text: string) => `[data-testid="chat-messages-container"] .whitespace-pre-wrap:has-text("${text}")`,

  // ============================================
  // Message Input
  // ============================================

  messageInput: '[data-testid="chat-input-message"]',
  sendButton: '[data-testid="chat-button-send"]',

  // ============================================
  // Contact Panel
  // ============================================

  accountSelector: '[data-testid="chat-select-account"]',
  openCardButton: '[data-testid="chat-button-openCard"]',
  contactPanelName: '[data-testid="chat-contact-panel-name"]',

} as const;
