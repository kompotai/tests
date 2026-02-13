export const TasksSelectors = {
  heading: 'h1:has-text("All Tasks")',
  table: '[data-testid="tasks-table"]',
  emptyState: 'text="No tasks found"',
  createButton: '[data-testid="tasks-button-create"]',
  searchInput: '[data-testid="tasks-search"]',

  form: {
    container: '[data-testid="task-form"]',
    name: '[data-testid="task-form-input-title"]',
    description: '[data-testid="task-form-input-description"]',
    dueDate: 'button:has-text("Select date")',
    assignee: '[data-testid="task-form-select-assignee"]',
    priority: '[data-testid="task-form-select-priority"]',
    // Status only exists in Edit form (not in Create form)
    status: '[data-testid="task-form-select-status"]',
    submit: '[data-testid="task-form-button-submit"]',
    cancel: '[data-testid="task-form-button-cancel"]',
  },

  filter: {
    button: '[data-testid="tasks-button-filters"]',
    container: 'h3:has-text("Filters")',
    assignee: '[data-testid="tasks-filter-select-assignee"]',
    priority: '[data-testid="tasks-filter-select-priority"]',
    status: '[data-testid="tasks-filter-select-status"]',
    dueDate: '[data-testid="tasks-filter-select-dueDate"]',
    clearButton: 'button:has-text("Clear all filters")',
  },

  pagination: {
    pageButton: (n: number) => `button:text-is("${n}")`,
  },

  row: (identifier: string) => `tr:has-text("${identifier}")`,
  rowEditButton: 'button[data-testid$="-edit"]',
  rowDeleteButton: 'button[data-testid$="-delete"]',
} as const;
