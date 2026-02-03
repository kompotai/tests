export const OpportunitiesSelectors = {
  heading: 'h1:has-text("Opportunities"), [data-testid="opportunities-heading"]',
  table: '[data-testid="opportunities-table"], table',
  emptyState: 'text="No opportunities found"',
  pipelineTabs: '.bg-zinc-100.p-1.rounded-lg button',
  stageColumn: 'th:has-text("Stage"), [role="columnheader"]:has-text("Stage")',
  createButton: '[data-testid="opportunities-button-create"]:not([type="submit"])',
  searchInput: '[data-testid="opportunities-search"], input[placeholder*="search" i]',

  form: {
    container: '[data-testid="opportunity-form"]',
    heading: 'text="New opportunity"',
    editHeading: 'text="Edit opportunity"',
    name: '[data-testid="opportunity-form-input-name"]',
    amount: '[data-testid="opportunity-form-input-amount"]',
    contactSelect: '[data-testid="opportunity-form-select-contact"]',
    pipelineSelect: '[data-testid="opportunity-form-select-pipeline"]',
    stageSelect: '[data-testid="opportunity-form-select-stage"]',
    submit: '[data-testid="opportunity-form-button-submit"]',
    cancel: '[data-testid="opportunity-form-button-cancel"]',
  },

  // Row selectors
  row: (identifier: string) => `tr:has-text("${identifier}")`,
  rowEditButton: (identifier: string) => `tr:has-text("${identifier}") [data-testid*="edit"], tr:has-text("${identifier}") button:has-text("Edit")`,
  rowDeleteButton: (identifier: string) => `tr:has-text("${identifier}") [data-testid*="delete"], tr:has-text("${identifier}") button:has-text("Delete")`,
  rowAmount: (identifier: string) => `tr:has-text("${identifier}") td[data-column="amount"], tr:has-text("${identifier}") td:nth-child(3)`,
  rowContact: (identifier: string) => `tr:has-text("${identifier}") td[data-column="contact"]`,
  rowStage: (identifier: string) => `tr:has-text("${identifier}") td button[data-testid*="stage"]`,
  stageBadge: 'td button:has-text("New Lead"), td button:has-text("Qualified"), td button:has-text("Proposal")',

  // Pipeline and stage selectors
  pipelineTab: (name: string) => `button:has-text("${name}")`,
  activePipelineTab: '.bg-zinc-100 button[aria-pressed="true"]',
  stageDropdownButton: (opportunityName: string) =>
    `tr:has-text("${opportunityName}") td button[data-testid*="stage"]`,
  stageOption: (stageName: string) =>
    `[role="option"]:has-text("${stageName}")`,

  // View page selectors
  viewPage: {
    container: '[data-testid="opportunity-view"]',
    editButton: 'button:has(svg.lucide-pencil), button:has-text("Edit")',
    deleteButton: 'button:has(svg.lucide-trash-2), button:has-text("Delete")',
    name: 'h1, [data-testid="opportunity-name"]',
    amount: '[data-testid="opportunity-amount"]',
    stage: '[data-testid="opportunity-stage"]',
  },

  // Error messages
  errorMessage: '[data-testid="form-error"], [role="alert"]',
  fieldError: (fieldName: string) => `[data-testid="error-${fieldName}"]`,
} as const;
