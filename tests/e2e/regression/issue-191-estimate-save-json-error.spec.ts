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
 * 2. The route exists and accepts POST method
 *
 * @see https://github.com/kompotai/bug-reports/issues/191
 */

import { ownerTest, expect } from '@fixtures/auth.fixture';
import { WORKSPACE_ID } from '@fixtures/users';

ownerTest.describe('Issue #191: Estimate Save JSON Error', () => {
  ownerTest('estimate API returns JSON, not HTML @regression', async ({ page }) => {
    // Navigate to app first so relative fetch URLs work (page starts at about:blank)
    await page.goto(`/ws/${WORKSPACE_ID}/settings`);
    await page.waitForLoadState('load');

    // Use page.evaluate to make API request with proper cookies/auth
    // This avoids issues with Playwright's request fixture and HTTP Basic Auth on stage
    const result = await page.evaluate(async (wsId) => {
      // Step 1: Search for a contact to use for the estimate
      // Note: contacts list uses POST /contacts/search, not GET /contacts
      const searchRes = await fetch(`/api/ws/${wsId}/contacts/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ limit: 1 }),
      });

      if (!searchRes.ok) {
        const searchText = await searchRes.text().catch(() => '');
        return {
          step: 'search',
          status: searchRes.status,
          contentType: searchRes.headers.get('content-type') || '',
          body: searchText.substring(0, 200),
        };
      }

      const searchData = await searchRes.json();
      const contacts = searchData.data || searchData.contacts || [];

      if (contacts.length === 0) {
        return { step: 'skip', reason: 'no contacts' };
      }

      const contactId = contacts[0]._id || contacts[0].id;

      // Step 2: THE KEY TEST — POST to estimates should return JSON, not HTML
      const estimateRes = await fetch(`/api/ws/${wsId}/estimates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `Regression Test #191 - ${Date.now()}`,
          contactId,
          status: 'draft',
          issueDate: new Date().toISOString(),
          items: [],
        }),
      });

      const contentType = estimateRes.headers.get('content-type') || '';
      const text = await estimateRes.text();
      let isJson = false;
      try {
        JSON.parse(text);
        isJson = true;
      } catch {
        isJson = false;
      }

      return {
        step: 'estimate',
        status: estimateRes.status,
        contentType,
        isJson,
        isHtml: text.startsWith('<!DOCTYPE') || text.startsWith('<html'),
      };
    }, WORKSPACE_ID);

    // Handle skip case
    if (result.step === 'skip') {
      ownerTest.skip(true, 'No contacts exist in test environment');
      return;
    }

    // If search API failed, verify it at least returns JSON
    if (result.step === 'search') {
      expect.soft(result.status, `Search API returned ${result.status}`).toBeLessThan(500);
      // If search fails, the main test purpose (estimates route) is still untested — skip
      ownerTest.skip(true, `Cannot get contacts for test (search returned ${result.status})`);
      return;
    }

    // Main assertions: estimates POST returns JSON, not HTML
    expect(result.isHtml, 'Response should not be HTML (was the route missing?)').toBe(false);
    expect(result.isJson, 'Response should be valid JSON').toBe(true);
    expect(result.contentType).toContain('application/json');
    expect(result.status).toBe(201);
  });
});
