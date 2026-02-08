/**
 * Expenses Test Fixtures
 *
 * Provides unique test data generators for expense tests.
 */

import { ExpenseData, ExpenseItem } from '@pages/ExpensesPage';

const TEST_RUN_ID = Date.now();

let expenseCounter = 0;
let priceCounter = 100;

export function uniqueDescription(prefix = 'Expense'): string {
  return `${prefix} ${TEST_RUN_ID}-${++expenseCounter}`;
}

export function uniqueItemName(prefix = 'Test Item'): string {
  return `${prefix} ${TEST_RUN_ID}-${expenseCounter}`;
}

export function uniquePrice(): number {
  return priceCounter++;
}

export function createMinimalExpense(overrides: Partial<ExpenseData> = {}): ExpenseData {
  const description = uniqueDescription('Minimal');
  return {
    contactName: TEST_CONTACTS.SAMPLE,
    items: [{ name: uniqueItemName(), price: uniquePrice() }],
    description,
    ...overrides,
  };
}

export function createFullExpense(overrides: Partial<ExpenseData> = {}): ExpenseData {
  const description = uniqueDescription('Full');
  return {
    contactName: TEST_CONTACTS.SAMPLE,
    category: 'Office Supplies',
    status: 'paid',
    items: [
      { name: uniqueItemName('Full Item'), price: uniquePrice(), quantity: 2, description: 'Item description' },
    ],
    description,
    ...overrides,
  };
}

export function createMultiItemExpense(overrides: Partial<ExpenseData> = {}): ExpenseData {
  const description = uniqueDescription('MultiItem');
  return {
    contactName: TEST_CONTACTS.SAMPLE,
    items: [
      { name: uniqueItemName('Item A'), price: 150, quantity: 1 },
      { name: uniqueItemName('Item B'), price: 200, quantity: 3 },
      { name: uniqueItemName('Item C'), price: 75, quantity: 2 },
    ],
    description,
    ...overrides,
  };
}

// Test contacts available in the workspace
export const TEST_CONTACTS = {
  SAMPLE: 'Sample Contact',
};
