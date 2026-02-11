export const TasksSelectors = {
  heading: 'h1:has-text("All Tasks")',
  table: 'table',
  emptyState: 'text="No tasks found"',
  createButton: 'button:has-text("Create task")',
  searchInput: 'input[placeholder*="Search by title"]',

  form: {
    container: 'h2:has-text("task")',
    name: 'input#title, input[placeholder*="Call client"]',
    description: 'textarea[placeholder*="Additional details"]',
    dueDate: 'button:has-text("Select date")',
    // Assignee & Priority are react-selects identified by placeholder text
    assigneePlaceholder: 'Not assigned',
    priorityPlaceholder: 'Not specified',
    // Status only exists in Edit form (not in Create form)
    statusPlaceholder: 'To Do',
    submit: 'button:has-text("Create Task"), button:has-text("Save")',
    cancel: 'button:has-text("Cancel")',
  },

  filter: {
    button: 'button:has-text("Filters")',
    container: 'h3:has-text("Filters")',
    assigneePlaceholder: 'All assignees',
    priorityPlaceholder: 'All priorities',
    statusPlaceholder: 'All statuses',
    dueDatePlaceholder: 'Any date',
    clearButton: 'button:has-text("Clear all filters")',
  },

  pagination: {
    container: 'nav[aria-label="pagination"]',
    nextButton: 'button:has-text("Next")',
    prevButton: 'button:has-text("Previous")',
  },

  row: (identifier: string) => `tr:has-text("${identifier}")`,
  rowEditButton: 'td:last-child button:first-child',
  rowDeleteButton: 'td:last-child button:last-child',
} as const;
