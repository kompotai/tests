/**
 * Regression Test: Issue #151
 * Bug: Too many requests on contacts page load (19-86 requests depending on operations)
 *
 * Problem: Multiple components (Navigation, QuickCreate, ContactsFilters, ContactsTable)
 * independently requested the same data, causing excessive API calls:
 * - /api/system-settings/workflow was called 5 times (once per component using useWorkflowConfig)
 * - /api/dictionaries/sources/items was called 3-4 times
 * - /api/users/search was called multiple times
 * - Other endpoints were also duplicated
 *
 * Root Cause: useWorkflowConfig hook was called in multiple components (Navigation,
 * QuickCreate) without shared state. Each hook instance made its own API request.
 *
 * Fix: Created WorkflowConfigProvider at layout level that:
 * - Makes a single API request for workflow configuration
 * - Provides data via Context to all child components
 * - Reduces /api/system-settings/workflow from 5 requests to 1
 * - Follows the same pattern as existing SystemSettingsProvider
 *
 * Migration: Updated hooks/useWorkflowConfig.ts to re-export from provider
 * for backward compatibility.
 *
 * @see https://github.com/kompotai/bug-reports/issues/151
 */

import { ownerTest, expect } from '@fixtures/auth.fixture';
import { WORKSPACE_ID } from '@fixtures/users';

ownerTest.describe('Issue #151: Too Many Requests', () => {
  ownerTest('contacts page makes minimal API requests on load @regression @smoke', async ({ page }) => {
    // Set up request tracking
    const requests: Map<string, number> = new Map();

    page.on('request', (request) => {
      const url = request.url();
      // Only track API requests, ignore static assets
      if (url.includes('/api/') && !url.includes('/_next/')) {
        const count = requests.get(url) || 0;
        requests.set(url, count + 1);
      }
    });

    // Navigate to contacts page
    await page.goto(`/ws/${WORKSPACE_ID}/contacts`);
    await page.waitForLoadState('networkidle');

    // Handle cookie consent if present
    const acceptCookies = page.getByRole('button', { name: 'Accept All' });
    if (await acceptCookies.isVisible({ timeout: 1000 }).catch(() => false)) {
      await acceptCookies.click();
      await page.waitForTimeout(300);
    }

    // Wait for table to load
    const table = page.locator('[data-testid="contacts-table"]');
    await expect(table).toBeVisible({ timeout: 10000 });

    // Give it a moment for any delayed requests
    await page.waitForTimeout(1000);

    // THE KEY TEST: Verify workflow config endpoint is called only ONCE
    const workflowRequests = Array.from(requests.entries())
      .filter(([url]) => url.includes('/system-settings/workflow'));

    expect(workflowRequests.length).toBeGreaterThan(0); // Should have at least one entry

    for (const [url, count] of workflowRequests) {
      console.log(`Workflow config request: ${url} - ${count} times`);
      // Before fix: 5 times
      // After fix: 1 time
      expect(count).toBeLessThanOrEqual(1);
    }

    // Verify total API request count is reasonable
    const totalRequests = Array.from(requests.values()).reduce((sum, count) => sum + count, 0);
    console.log(`Total API requests: ${totalRequests}`);

    // Before fix: ~40 requests
    // After fix: ~31 requests
    // Allow some margin for variability, but should be well under 40
    expect(totalRequests).toBeLessThan(40);

    // Log all duplicate requests for debugging
    const duplicates = Array.from(requests.entries())
      .filter(([, count]) => count > 1)
      .sort((a, b) => b[1] - a[1]);

    if (duplicates.length > 0) {
      console.log('\nDuplicate API requests detected:');
      for (const [url, count] of duplicates) {
        const endpoint = url.replace(`http://localhost:3000/api/ws/${WORKSPACE_ID}/`, '');
        console.log(`  ${count}x ${endpoint}`);
      }
    }

    // Verify critical endpoints are not excessively duplicated
    const maxAcceptableDuplicates = 3; // Some duplication is OK (e.g., filters + table)

    for (const [url, count] of requests.entries()) {
      // Ignore auth and session endpoints which may legitimately be called multiple times
      if (url.includes('/auth/') || url.includes('/session')) {
        continue;
      }

      // Verify no endpoint is called more than 6 times (reasonable limit)
      expect(count, `Endpoint ${url} was called ${count} times (expected ≤6)`).toBeLessThanOrEqual(6);
    }
  });
});
