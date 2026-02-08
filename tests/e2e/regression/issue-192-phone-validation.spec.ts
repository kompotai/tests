/**
 * Regression test for Issue #192
 * System allowed creating contacts with improperly formatted phone numbers.
 *
 * Validation uses libphonenumber-js on both client and server sides.
 * Server-side Zod schema validates E.164 format and country-specific rules.
 *
 * @see https://github.com/kompotai/bug-reports/issues/192
 */

import { ownerTest, expect } from '@fixtures/auth.fixture';
import { WORKSPACE_ID } from '@fixtures/users';

ownerTest.describe('Issue #192: Phone Number Validation', { tag: ['@regression'] }, () => {
  const API_BASE = `/api/ws/${WORKSPACE_ID}`;

  ownerTest('should reject contact with invalid US phone (missing digit) @regression', async ({ request }) => {
    // +1988989898 = only 9 digits after country code (US needs 10)
    const createRes = await request.post(`${API_BASE}/contacts`, {
      data: {
        name: 'Invalid Phone Test #192',
        phones: [{ e164: '+1988989898', isPrimary: true }],
      },
    });

    // Should be rejected by validation (400)
    expect(createRes.status()).toBe(400);
  });

  ownerTest('should reject contact with too short phone @regression', async ({ request }) => {
    // +123456 = too few digits
    const createRes = await request.post(`${API_BASE}/contacts`, {
      data: {
        name: 'Short Phone Test #192',
        phones: [{ e164: '+123456', isPrimary: true }],
      },
    });

    expect(createRes.status()).toBe(400);
  });

  ownerTest('should accept contact with valid US phone @regression', async ({ request }) => {
    // +12025551234 = valid US phone (10 digits after +1)
    const createRes = await request.post(`${API_BASE}/contacts`, {
      data: {
        name: 'Valid Phone Test #192',
        phones: [{ e164: '+12025551234', isPrimary: true }],
      },
    });

    expect(createRes.status()).toBe(201);
    const contact = await createRes.json();

    try {
      expect(contact.phones).toHaveLength(1);
      expect(contact.phones[0].e164).toBe('+12025551234');
    } finally {
      await request.delete(`${API_BASE}/contacts/${contact.id}`);
    }
  });

  ownerTest('should accept contact with valid Russian phone @regression', async ({ request }) => {
    // +79001234567 = valid Russian phone
    const createRes = await request.post(`${API_BASE}/contacts`, {
      data: {
        name: 'Valid RU Phone Test #192',
        phones: [{ e164: '+79001234567', isPrimary: true }],
      },
    });

    expect(createRes.status()).toBe(201);
    const contact = await createRes.json();

    try {
      expect(contact.phones).toHaveLength(1);
      expect(contact.phones[0].e164).toBe('+79001234567');
    } finally {
      await request.delete(`${API_BASE}/contacts/${contact.id}`);
    }
  });
});
