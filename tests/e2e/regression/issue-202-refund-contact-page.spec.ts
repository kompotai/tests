/**
 * Regression test for Issue #202
 * Refund should appear on contact's page after creation.
 *
 * Verifies that the refund search API correctly returns refunds
 * filtered by contactId, which the contact detail page uses to display refunds.
 *
 * @see https://github.com/kompotai/bug-reports/issues/202
 */

import { ownerTest, expect } from '@fixtures/auth.fixture';
import { WORKSPACE_ID } from '@fixtures/users';

ownerTest.describe('Issue #202: Refund on Contact Page', { tag: ['@regression'] }, () => {
  const API_BASE = `/api/ws/${WORKSPACE_ID}`;

  ownerTest('refund should appear in contact refund search after creation @regression', async ({ request }) => {
    // Get a contact
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

    // Create a refund for this contact
    const createRes = await request.post(`${API_BASE}/refunds`, {
      data: {
        contactId,
        amount: 5.00,
        method: 'cash',
        reasonCode: 'customer_request',
      },
    });

    expect(createRes.status()).toBe(201);
    const refund = await createRes.json();

    try {
      // Search refunds by contactId — this is what the contact page does
      const searchRes = await request.post(`${API_BASE}/refunds/search`, {
        data: { contactId, limit: 100 },
      });

      expect(searchRes.status()).toBe(200);
      const searchData = await searchRes.json();

      // The refund should be in the results
      expect(searchData.refunds.length).toBeGreaterThan(0);
      const found = searchData.refunds.find((r: { id: string }) => r.id === refund.id);
      expect(found).toBeTruthy();
      expect(found.contactId).toBe(contactId);
    } finally {
      // Cleanup
      await request.delete(`${API_BASE}/refunds/${refund.id}`);
    }
  });
});
