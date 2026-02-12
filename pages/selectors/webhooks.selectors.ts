export const WebhooksSelectors = {
  heading: 'h1:has-text("Webhooks")',
  list: '[data-testid="webhooks-list"]',
  createButton: 'button:has-text("Create webhook")',

  // Webhook row
  webhookRow: (id: string) => `[data-testid="webhook-item-${id}"]`,
  webhookToggle: (id: string) => `[data-testid="webhook-item-${id}-toggle"]`,
  webhookTest: (id: string) => `[data-testid="webhook-item-${id}-test"]`,
  webhookLogs: (id: string) => `[data-testid="webhook-item-${id}-logs"]`,
  webhookEdit: (id: string) => `[data-testid="webhook-item-${id}-edit"]`,
  webhookDelete: (id: string) => `[data-testid="webhook-item-${id}-delete"]`,

  // Create/Edit form (slide-over)
  form: '[data-testid="webhook-form"]',
  formInputName: '[data-testid="webhook-form"] input[name="name"]',
  formInputUrl: '[data-testid="webhook-form"] input[name="url"]',
  formSelectMethod: '[data-testid="webhook-form"] select[name="method"]',
  formCancel: '[data-testid="webhook-form-button-cancel"]',
  formSubmit: '[data-testid="webhook-form-button-submit"]',
  slideOverClose: '[data-testid="slide-over-close"]',
} as const;
