/**
 * Chat Selectors
 *
 * All selectors use data-testid attributes for reliability
 */

export const ChatSelectors = {
  // ============================================
  // Main elements (data-testid)
  // ============================================

  contactsList: '[data-testid="chat-contacts-list"]',
  contactItem: (contactId: string) => `[data-testid="chat-contact-item-${contactId}"]`,
  quickCreateButton: '[data-testid="quick-create-button"]',
  searchInput: '[data-testid="chat-input-search"]',
  messagesContainer: '[data-testid="chat-messages-container"]',
  messageInput: '[data-testid="chat-input-message"]',
  sendButton: '[data-testid="chat-button-send"]',
  emptyState: '[data-testid="chat-empty-state"]',
  openCardButton: '[data-testid="chat-button-openCard"]',

  // ============================================
  // Helper selectors
  // ============================================

  // Contact in list by name (fallback)
  contactItemByName: (name: string) => `[data-testid*="chat-contact-item-"]:has-text("${name}")`,

  // Active contact (selected)
  activeContact: '[data-testid*="chat-contact-item-"].bg-blue-50',

  // Messages - using data-testid container
  messageText: '[data-testid="chat-messages-container"] .text-sm.whitespace-pre-wrap.break-words',
  messageByText: (text: string) => `[data-testid="chat-messages-container"] .whitespace-pre-wrap:has-text("${text}")`,

  // Contact panel
  contactPanelName: '[data-testid="chat-contact-panel-name"]',

} as const;
