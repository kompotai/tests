export const ExpensesSelectors = {
  heading: 'h1:has-text("Expenses")',
  table: '[data-testid="expenses-table"]',
  createButton: 'button:has-text("Create Expense")',
  searchInput: 'input[placeholder*="Search by number"]',

  form: {
    container: '[data-testid="expense-form"]',
    contact: '[data-testid="expense-form-input-contact"]',
    category: '[data-testid="expense-form-select-category"]',
    status: '[data-testid="expense-form-select-status"]',
    expenseDate: '[data-testid="expense-form-input-expenseDate"]',
    description: '[data-testid="expense-form-input-description"]',
    submit: '[data-testid="expense-form-button-submit"]',
    cancel: '[data-testid="expense-form-button-cancel"]',
    addItem: 'button:has-text("+ Add item")',
    itemName: 'input[placeholder="Item name"]',
    itemDescription: 'input[placeholder="Description"]',
    itemPrice: (index: number) => `[data-testid="expense-form"] .space-y-3 > div:nth-child(${index + 1}) input[type="number"]:first-of-type`,
    itemQuantity: (index: number) => `[data-testid="expense-form"] .space-y-3 > div:nth-child(${index + 1}) input[type="number"]:last-of-type`,
    itemDelete: (index: number) => `[data-testid="expense-form"] .space-y-3 > div:nth-child(${index + 1}) button:has(svg.lucide-trash-2)`,
  },

  contactDropdown: '[data-testid="expense-form-input-contact"] ~ div, [data-testid="expense-form"] .absolute',
  contactOption: (name: string) => `text="${name}"`,

  row: (identifier: string) => `[data-testid="expenses-table"] tr:has-text("${identifier}")`,
  rowView: (id: string) => `[data-testid="expenses-row-${id}-view"]`,
  rowEdit: (id: string) => `[data-testid="expenses-row-${id}-edit"]`,
  rowDelete: (id: string) => `[data-testid="expenses-row-${id}-delete"]`,

  deleteDialog: {
    container: '.fixed.inset-0',
    confirm: 'button:has-text("Delete")',
    cancel: 'button:has-text("Cancel")',
  },
} as const;
