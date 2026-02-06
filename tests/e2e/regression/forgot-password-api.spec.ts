/**
 * Regression Test: Forgot Password API Endpoint
 *
 * Verifies that /api/forgot-password endpoint exists and works correctly.
 * Bug: Form was posting to /api/forgot-password but the route file was
 * incorrectly placed in /api/ws/[wsid]/forgot-password/ (wsid unused).
 * Fix: Moved route to /api/forgot-password/route.ts
 */

import { test, expect } from '@playwright/test';
import { WORKSPACE_ID } from '@fixtures/users';

test.describe('Regression: Forgot Password API', () => {
  test('FP1: POST /api/forgot-password returns success for valid request', async ({ request }) => {
    const response = await request.post('/api/forgot-password', {
      data: {
        wsid: WORKSPACE_ID,
        email: 'test-nonexistent@example.com',
      },
    });

    // Should return 200 (always returns success to prevent enumeration)
    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.message).toContain('If the email exists');

    console.log('✅ /api/forgot-password endpoint works correctly');
  });

  test('FP2: POST /api/forgot-password validates wsid format', async ({ request }) => {
    const response = await request.post('/api/forgot-password', {
      data: {
        wsid: 'INVALID_WSID!@#', // Invalid format
        email: 'test@example.com',
      },
    });

    // Should return 400 for invalid wsid format
    expect(response.status()).toBe(400);

    const body = await response.json();
    expect(body.error).toBeDefined();

    console.log('✅ /api/forgot-password validates wsid format');
  });

  test('FP3: POST /api/forgot-password validates email format', async ({ request }) => {
    const response = await request.post('/api/forgot-password', {
      data: {
        wsid: WORKSPACE_ID,
        email: 'not-an-email',
      },
    });

    // Should return 400 for invalid email
    expect(response.status()).toBe(400);

    const body = await response.json();
    expect(body.error).toBeDefined();

    console.log('✅ /api/forgot-password validates email format');
  });

  test('FP4: Forgot password form sends request to correct endpoint', async ({ page }) => {
    // Intercept network requests
    const apiRequests: string[] = [];
    page.on('request', (req) => {
      if (req.url().includes('forgot-password') && req.method() === 'POST') {
        apiRequests.push(req.url());
      }
    });

    // Go to forgot password page
    await page.goto('/account/forgot-password');
    await page.waitForLoadState('networkidle');

    // Fill the form
    await page.locator('[data-testid="forgot-password-input-wsid"]').fill(WORKSPACE_ID);
    await page.locator('[data-testid="forgot-password-input-email"]').fill('test@example.com');

    // Submit
    await page.locator('[data-testid="forgot-password-button-submit"]').click();

    // Wait for response
    await page.waitForTimeout(2000);

    // Verify request was sent to correct endpoint (not /api/ws/[wsid]/forgot-password)
    expect(apiRequests.length).toBeGreaterThan(0);
    const requestUrl = apiRequests[0];
    expect(requestUrl).toContain('/api/forgot-password');
    expect(requestUrl).not.toContain('/api/ws/');

    console.log(`✅ Form sends request to correct endpoint: ${requestUrl}`);
  });
});
