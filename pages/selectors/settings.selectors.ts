/**
 * Settings Page Selectors
 *
 * Selectors for settings pages including MCP, API, etc.
 */

export const SettingsSelectors = {
  // Navigation
  nav: {
    mcp: '[data-testid="settings-nav-mcp"]',
    api: '[data-testid="settings-nav-api"]',
  },

  // MCP Settings
  mcp: {
    container: '[data-testid="mcp-settings"]',
    serverStatus: '[data-testid="mcp-server-status"]',
    serverName: '[data-testid="mcp-server-name"]',
    endpointSse: '[data-testid="mcp-endpoint-sse"]',
    endpointMessages: '[data-testid="mcp-endpoint-messages"]',
    copySse: '[data-testid="mcp-copy-sse"]',
    copyMessages: '[data-testid="mcp-copy-messages"]',
    toolsSection: '[data-testid="mcp-tools-section"]',
    toolsCount: '[data-testid="mcp-tools-count"]',
    error: '[data-testid="mcp-error"]',
    savedMessage: '[data-testid="mcp-saved-message"]',
  },

  // API Settings
  api: {
    container: '[data-testid="api-settings"]',
    tokensList: '[data-testid="api-tokens-list"]',
    createTokenBtn: '[data-testid="api-create-token"]',
  },
} as const;
