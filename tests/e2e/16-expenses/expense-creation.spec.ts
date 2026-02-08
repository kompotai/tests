/**
 * Expense Creation Tests
 *
 * TC-1: Create expense with minimal data
 * TC-2: Create expense with all fields
 * TC-3: Create expense with multiple items
 * TC-4: Validation — required fields
 * TC-5: Edit expense
 * TC-7: Delete expense
 * TC-8: Cancel create form
 */

import { ownerTest, expect } from '@fixtures/auth.fixture';
import { ExpensesPage } from '@pages/ExpensesPage';
import { createMinimalExpense, createFullExpense, createMultiItemExpense, uniqueDescription, uniqueItemName, uniquePrice, TEST_CONTACTS } from './expenses.fixture';

ownerTest.describe('Expense Creation', () => {
  let expensesPage: ExpensesPage;

  ownerTest.beforeEach(async ({ page }) => {
    expensesPage = new ExpensesPage(page);
    await expensesPage.goto();
  });

  ownerTest('TC-1: creates expense with minimal data', async () => {
    const expense = createMinimalExpense();
    const description = expense.description!;
    const itemPrice = expense.items[0].price;

    await expensesPage.create(expense);

    // Verify expense appears in the table (search by unique description)
    await expensesPage.shouldSeeExpense(description);

    // Verify row data
    const rowData = await expensesPage.getExpenseRowData(description);
    expect(rowData.contact).toBe(TEST_CONTACTS.SAMPLE);
    expect(rowData.status).toContain('Pending');
    expect(rowData.amount).toContain(`$${itemPrice}`);

    // Cleanup: delete the created expense
    await expensesPage.deleteExpense(description);
    await expensesPage.shouldNotSeeExpense(description);
  });

  ownerTest('TC-2: creates expense with all fields and verifies detail page', async () => {
    const expense = createFullExpense();
    const description = expense.description!;
    const item = expense.items[0];
    const expectedTotal = item.price * (item.quantity || 1);

    await expensesPage.create(expense);

    // Verify expense appears in the table
    await expensesPage.shouldSeeExpense(description);

    // Verify table row data
    const rowData = await expensesPage.getExpenseRowData(description);
    expect(rowData.contact).toBe(TEST_CONTACTS.SAMPLE);
    expect(rowData.status).toContain('Paid');
    expect(rowData.category).toContain('Office Supplies');
    expect(rowData.amount).toContain(`$${expectedTotal}`);

    // Navigate to detail page and verify all fields
    await expensesPage.openDetailPage(description);

    await expensesPage.shouldSeeOnDetailPage(TEST_CONTACTS.SAMPLE);
    await expensesPage.shouldSeeOnDetailPage('Office Supplies');
    await expensesPage.shouldSeeOnDetailPage(description);
    await expensesPage.shouldSeeOnDetailPage(item.name);
    await expensesPage.shouldSeeOnDetailPage(`$${expectedTotal}`);

    const itemsCount = await expensesPage.getDetailItemsCount();
    expect(itemsCount).toBe(1);

    // Go back to list and cleanup
    await expensesPage.goto();
    await expensesPage.deleteExpense(description);
    await expensesPage.shouldNotSeeExpense(description);
  });

  ownerTest('TC-3: creates expense with multiple items and verifies total', async () => {
    const expense = createMultiItemExpense();
    const description = expense.description!;
    // 150*1 + 200*3 + 75*2 = 150 + 600 + 150 = 900
    const expectedTotal = 900;

    await expensesPage.create(expense);

    // Verify expense in the table with correct total
    await expensesPage.shouldSeeExpense(description);
    const rowData = await expensesPage.getExpenseRowData(description);
    expect(rowData.amount).toContain(`$${expectedTotal}`);

    // Verify detail page shows all 3 items and correct total
    await expensesPage.openDetailPage(description);

    const itemsCount = await expensesPage.getDetailItemsCount();
    expect(itemsCount).toBe(3);
    await expensesPage.shouldSeeOnDetailPage(`$${expectedTotal}`);

    // Go back to list and cleanup
    await expensesPage.goto();
    await expensesPage.deleteExpense(description);
    await expensesPage.shouldNotSeeExpense(description);
  });

  ownerTest.describe('TC-4: Validation — required fields', () => {
    ownerTest('4a: cannot submit empty form', async () => {
      await expensesPage.openCreateForm();
      await expensesPage.clickSubmitExpectingError();

      // Form should remain open — expense was not created
      const formVisible = await expensesPage.shouldSeeForm();
      expect(formVisible).toBe(true);

      await expensesPage.cancelForm();
    });

    ownerTest('4b: cannot submit without items', async () => {
      await expensesPage.openCreateForm();
      await expensesPage.selectContact(TEST_CONTACTS.SAMPLE);
      await expensesPage.clickSubmitExpectingError();

      // Form should remain open — expense was not created
      const formVisible = await expensesPage.shouldSeeForm();
      expect(formVisible).toBe(true);

      await expensesPage.cancelForm();
    });

    ownerTest('4c: cannot submit without contact', async () => {
      await expensesPage.openCreateForm();
      await expensesPage.addItemWithoutContact({ name: uniqueItemName('NoContact'), price: uniquePrice() });
      await expensesPage.clickSubmitExpectingError();

      // Form should remain open — expense was not created
      const formVisible = await expensesPage.shouldSeeForm();
      expect(formVisible).toBe(true);

      await expensesPage.cancelForm();
    });
  });

  ownerTest('TC-5: edits expense and verifies changes', async () => {
    // Create expense to edit
    const expense = createMinimalExpense();
    const originalDesc = expense.description!;
    await expensesPage.create(expense);
    await expensesPage.shouldSeeExpense(originalDesc);

    // Open edit form and change fields
    const newDescription = uniqueDescription('Edited');
    await expensesPage.openEditForm(originalDesc);
    await expensesPage.editFields({
      status: 'paid',
      description: newDescription,
    });
    await expensesPage.submitForm();

    // Verify updated data in table (find by new description)
    await expensesPage.shouldSeeExpense(newDescription);
    const rowData = await expensesPage.getExpenseRowData(newDescription);
    expect(rowData.status).toContain('Paid');

    // Cleanup
    await expensesPage.deleteExpense(newDescription);
    await expensesPage.shouldNotSeeExpense(newDescription);
  });

  ownerTest('TC-7: deletes expense and verifies removal', async () => {
    // Create expense to delete
    const expense = createMinimalExpense();
    const description = expense.description!;
    await expensesPage.create(expense);
    await expensesPage.shouldSeeExpense(description);

    // Click delete — confirmation dialog should appear
    await expensesPage.clickDeleteButton(description);
    const dialogVisible = await expensesPage.shouldSeeDeleteDialog();
    expect(dialogVisible).toBe(true);

    // Confirm deletion
    await expensesPage.confirmDelete();

    // Verify expense is removed from the table
    await expensesPage.shouldNotSeeExpense(description);
  });

  ownerTest('TC-8: cancel create form discards data', async () => {
    const description = uniqueDescription('Cancelled');

    // Open form and fill data
    await expensesPage.openCreateForm();
    await expensesPage.selectContact(TEST_CONTACTS.SAMPLE);
    await expensesPage.page.locator('[data-testid="expense-form"] button:has-text("+ Add item")').click();
    await expensesPage.wait(300);
    await expensesPage.page.locator('[data-testid="expense-form"] input[placeholder="Item name"]').fill(uniqueItemName('CancelItem'));
    await expensesPage.page.locator('[data-testid="expense-form"] input[type="number"]').first().fill('999');
    await expensesPage.page.locator('[data-testid="expense-form-input-description"]').fill(description);

    // Cancel the form
    await expensesPage.cancelForm();

    // Form should be closed
    const formVisible = await expensesPage.shouldSeeForm();
    expect(formVisible).toBe(false);

    // Expense should NOT appear in the table
    await expensesPage.shouldNotSeeExpense(description);
  });
});
