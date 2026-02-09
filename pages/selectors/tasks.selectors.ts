export const TasksSelectors = {
  heading: 'h1:has-text("Tasks"), [data-testid="tasks-heading"]',
  table: '[data-testid="tasks-table"], table',
  emptyState: 'text="No tasks found"',
  createButton: '[data-testid="tasks-create-button"], button:has-text("Create task")',
  searchInput: '[data-testid="tasks-search"], input[placeholder*="search" i]',

  form: {
    container: '[role="dialog"], [data-testid="task-form"]',
    heading: 'text="New task"',
    name: 'input#title, input[placeholder*="Call client"], [data-testid="task-form-input-name"]',
    description: 'textarea[placeholder*="Additional details"], [data-testid="task-form-input-description"]',
    priority: '[data-testid="task-form-select-priority"]',
    status: '[data-testid="task-form-select-status"]',
    dueDate: 'button:has-text("Select date"), [data-testid="task-form-input-dueDate"]',
    assignee: '[data-testid="task-form-select-assignee"]',
    assigneeClear: '[data-testid="task-form-clear-assignee"]',
    submit: '[data-testid="task-form-button-submit"], button:has-text("Create Task"), button:has-text("Save")',
    cancel: '[data-testid="task-form-cancel"]',
  },

  filter: {
    button: '[data-testid="tasks-button-filter"]',
    container: '[data-testid="tasks-filter"]',
    statusSelect: '[data-testid="tasks-filter-status"]',
    prioritySelect: '[data-testid="tasks-filter-priority"]',
    assigneeSelect: '[data-testid="tasks-filter-assignee"]',
    dueDateFrom: '[data-testid="tasks-filter-dueDate-from"]',
    dueDateTo: '[data-testid="tasks-filter-dueDate-to"]',
    clearButton: '[data-testid="tasks-filter-clear"]',
    applyButton: '[data-testid="tasks-filter-apply"]',
  },

  pagination: {
    container: '[data-testid="tasks-pagination"], nav[aria-label="pagination"]',
    nextButton: '[data-testid="tasks-pagination-next"], button:has-text("Next")',
    prevButton: '[data-testid="tasks-pagination-prev"], button:has-text("Previous")',
  },

  row: (identifier: string) => `tr:has-text("${identifier}")`,
  // Edit and Delete are icon buttons (pencil and trash icons)
  rowEditButton: 'td:last-child button:first-child, button[title*="Edit"], button:has(svg[class*="pencil"])',
  rowDeleteButton: 'td:last-child button:last-child, button[title*="Delete"], button:has(svg[class*="trash"])',
} as const;
