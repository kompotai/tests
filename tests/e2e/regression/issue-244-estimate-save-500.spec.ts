/**
 * Regression test for Issue #244
 * Estimate edit returned 500 because populated ObjectId fields (contactId,
 * opportunityId, projectId, ownerId) were serialized as "[object Object]"
 * instead of actual ID strings.
 *
 * Fix: Updated toEstimateResponse() to correctly extract _id from populated objects.
 *
 * @see https://github.com/kompotai/bug-reports/issues/244
 */

import { ownerTest, expect } from '@fixtures/auth.fixture';
import { WORKSPACE_ID } from '@fixtures/users';

ownerTest.describe('Issue #244: Estimate Save 500 Error', { tag: ['@regression'] }, () => {
  const API_BASE = `/api/ws/${WORKSPACE_ID}`;

  ownerTest('editing an existing estimate should not return 500 @regression', async ({ request }) => {
    // Get a contact to use for the estimate
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

    // Create a test estimate
    const createRes = await request.post(`${API_BASE}/estimates`, {
      data: {
        title: `Regression test #244 - ${Date.now()}`,
        contactId,
        status: 'draft',
        issueDate: new Date().toISOString(),
      },
    });

    expect(createRes.status()).toBe(201);
    const created = await createRes.json();
    const estimateId = created.id;

    try {
      // GET the estimate — verify ObjectId fields are valid strings
      const getRes = await request.get(`${API_BASE}/estimates/${estimateId}`);
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

      // PATCH the estimate — this was the original crash (500)
      const patchRes = await request.patch(`${API_BASE}/estimates/${estimateId}`, {
        data: {
          contactId: data.contactId,
          notes: 'Updated via regression test #244',
        },
      });

      // Should succeed, not 500
      expect(patchRes.status()).toBe(200);
    } finally {
      // Cleanup: delete the test estimate
      await request.delete(`${API_BASE}/estimates/${estimateId}`);
    }
  });
});
