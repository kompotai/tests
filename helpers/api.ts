/**
 * API Helper for E2E tests
 *
 * Makes authenticated API requests to the test workspace
 */

import { request } from '@playwright/test';

// Get base URL from environment or use default
const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';
const WSID = process.env.TEST_WSID || 'megatest';

// Auth state for API requests
let authCookie: string | null = null;

/**
 * Initialize auth cookie from auth state file
 */
export async function initApiAuth(): Promise<void> {
  // Read auth state from file
  const fs = await import('fs');
  const path = await import('path');
  const authStatePath = path.join(__dirname, '..', '.auth', 'owner.json');

  try {
    const authState = JSON.parse(fs.readFileSync(authStatePath, 'utf-8'));
    const cookies = authState.cookies || [];
    const sessionCookie = cookies.find((c: { name: string }) => c.name === 'auth_session');
    if (sessionCookie) {
      authCookie = `auth_session=${sessionCookie.value}`;
    }
  } catch {
    console.warn('Could not read auth state file, API calls may fail');
  }
}

/**
 * Make authenticated fetch request to workspace API
 */
export async function workspaceFetch(
  path: string,
  options: {
    method?: string;
    body?: string;
    headers?: Record<string, string>;
  } = {}
): Promise<Response> {
  // Initialize auth if not done
  if (!authCookie) {
    await initApiAuth();
  }

  const url = `${BASE_URL}${path}`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Cookie': `WORKSPACE_ID=${WSID}; ${authCookie || ''}`,
    ...options.headers,
  };

  const response = await fetch(url, {
    method: options.method || 'GET',
    headers,
    body: options.body,
  });

  return response;
}
