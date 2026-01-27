export const OpportunitiesSelectors = {
  heading: 'h1:has-text("Opportunities"), [data-testid="opportunities-heading"]',
  table: '[data-testid="opportunities-table"], table',
  emptyState: 'text="No opportunities found"',
  pipelineTabs: '.bg-zinc-100.p-1.rounded-lg button',
  stageColumn: 'th:has-text("Stage"), [role="columnheader"]:has-text("Stage")',
  createButton: '[data-testid="opportunities-create-button"], button:has-text("Create opportunity")',
  searchInput: '[data-testid="opportunities-search"], input[placeholder*="search" i]',

  form: {
    container: '[data-testid="opportunity-form"], form',
    heading: 'text="New opportunity"',
    name: '[data-testid="opportunity-form-input-name"], input[name="name"]',
    amount: '[data-testid="opportunity-form-input-amount"], input[name="amount"]',
    contactSelect: '[id*="contactId"], [data-testid*="contact"]',
    submit: '[data-testid="opportunity-form-submit"], button:has-text("Create Opportunity"), button:has-text("Save")',
    cancel: '[data-testid="opportunity-form-cancel"], button:has-text("Cancel")',
  },

  row: (identifier: string) => `tr:has-text("${identifier}")`,
  rowEditButton: 'td:last-child button:has-text("Edit")',
  rowDeleteButton: 'td:last-child button:has-text("Delete")',
  stageBadge: 'td button:has-text("New Lead"), td button:has-text("Qualified"), td button:has-text("Proposal")',
} as const;
