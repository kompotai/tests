/**
 * Regression test for Issue #203
 * Expense edit returned 500 because populated ObjectId fields (contactId,
 * categoryId, ownerId) were serialized as "[object Object]" instead of
 * actual ID strings.
 *
 * Fix: Updated toExpenseResponse() to correctly extract _id from populated objects.
 *
 * @see https://github.com/kompotai/bug-reports/issues/203
 */

import { ownerTest, expect } from '@fixtures/auth.fixture';
import { WORKSPACE_ID } from '@fixtures/users';

ownerTest.describe('Issue #203: Expense Edit', { tag: ['@regression'] }, () => {
  const API_BASE = `/api/ws/${WORKSPACE_ID}`;

  ownerTest('expense API should return valid ObjectId fields after create @regression', async ({ request }) => {
    // First, get a contact to use
    const contactsRes = await request.post(`${API_BASE}/contacts/search`, {
      data: { limit: 1 },
    });

    if (!contactsRes.ok()) {
      ownerTest.skip(true, 'Cannot fetch contacts');
      return;
    }

    const contactsData = await contactsRes.json();
    const contacts = contactsData.contacts || [];

    if (contacts.length === 0) {
      ownerTest.skip(true, 'No contacts found in workspace');
      return;
    }

    const contactId = contacts[0].id;

    // Create an expense
    const createRes = await request.post(`${API_BASE}/expenses`, {
      data: {
        contactId,
        items: [{ name: 'Test item #203', quantity: 1, price: 10 }],
        expenseDate: new Date().toISOString(),
        status: 'pending',
      },
    });

    expect(createRes.status()).toBe(201);
    const created = await createRes.json();
    const expenseId = created.id;

    try {
      // GET the expense — verify ObjectId fields are valid strings
      const getRes = await request.get(`${API_BASE}/expenses/${expenseId}`);
      expect(getRes.status()).toBe(200);
      const data = await getRes.json();

      // contactId must be valid ObjectId, not "[object Object]"
      expect(data.contactId).toBeTruthy();
      expect(data.contactId).not.toBe('[object Object]');
      expect(data.contactId).toMatch(/^[a-f0-9]{24}$/);

      // ownerId must be valid ObjectId
      expect(data.ownerId).toBeTruthy();
      expect(data.ownerId).not.toBe('[object Object]');
      expect(data.ownerId).toMatch(/^[a-f0-9]{24}$/);

      // Now PATCH the expense — this was the original crash (500)
      const patchRes = await request.patch(`${API_BASE}/expenses/${expenseId}`, {
        data: {
          contactId: data.contactId,
          description: 'Updated via regression test #203',
          items: [{ name: 'Updated item', quantity: 2, price: 15 }],
        },
      });

      // Should succeed, not 500
      expect(patchRes.status()).toBe(200);

      const updated = await patchRes.json();
      expect(updated.description).toBe('Updated via regression test #203');
    } finally {
      // Cleanup: delete the test expense
      await request.delete(`${API_BASE}/expenses/${expenseId}`);
    }
  });
});
