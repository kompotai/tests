/**
 * Regression Test: Issue #191
 * Bug: Can't save new Estimate - "Unexpected token '<', '<!DOCTYPE'... is not valid JSON"
 *
 * Problem: EstimateForm used fetch() instead of workspaceFetch(), causing the request
 * to hit /api/estimates (non-existent route) instead of /api/ws/{wsid}/estimates.
 * Next.js returned a 404 HTML page which the frontend tried to parse as JSON.
 *
 * This test verifies:
 * 1. POST /api/ws/{wsid}/estimates returns JSON (not HTML)
 * 2. Owner can create an estimate via API
 *
 * @see https://github.com/kompotai/bug-reports/issues/191
 */

import { ownerTest, expect } from '@fixtures/auth.fixture';
import { WORKSPACE_ID } from '@fixtures/users';

ownerTest.describe('Issue #191: Estimate Save JSON Error', () => {
  ownerTest('estimate API returns JSON, not HTML @regression', async ({ request }) => {
    // First, get a contact to use for the estimate
    const contactsResponse = await request.get(`/api/ws/${WORKSPACE_ID}/contacts?limit=1`);
    expect(contactsResponse.status()).toBe(200);
    const contactsData = await contactsResponse.json();

    // Skip if no contacts exist (test environment may not have data)
    if (!contactsData.data || contactsData.data.length === 0) {
      ownerTest.skip();
      return;
    }

    const contactId = contactsData.data[0]._id || contactsData.data[0].id;

    // THE KEY TEST: Create estimate via API - should return JSON, not HTML
    const response = await request.post(`/api/ws/${WORKSPACE_ID}/estimates`, {
      data: {
        title: `Regression Test #191 - ${Date.now()}`,
        contactId,
        status: 'draft',
        issueDate: new Date().toISOString().split('T')[0],
        items: [
          {
            name: 'Test Item',
            price: 100,
            quantity: 1,
            discount: 0,
          },
        ],
      },
    });

    // Must be 201, not 404 (HTML page)
    expect(response.status()).toBe(201);

    // Must be valid JSON
    const contentType = response.headers()['content-type'];
    expect(contentType).toContain('application/json');

    const body = await response.json();
    expect(body.id || body._id).toBeDefined();
  });
});
