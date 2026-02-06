/**
 * Agreement Test Setup
 *
 * Runs FIRST (alphabetically: 00-* < agreement-*).
 * Creates a template with 2 signer roles via API for use by other agreement tests.
 * This eliminates cascading skips when UI-based template creation (comprehensive) fails.
 */

import { ownerTest, expect } from '@fixtures/auth.fixture';
import { workspaceFetch, initApiAuth } from '@helpers/api';
import { getSetupData, writeSetupData } from './agreement-setup.utils';

const WSID = process.env.TEST_WSID || 'megatest';

ownerTest.describe('Agreement Test Setup', () => {
  ownerTest('creates template with signer roles via API', async () => {
    await initApiAuth();

    // 1. Check if setup template already exists
    const existing = getSetupData();
    if (existing) {
      const checkResp = await workspaceFetch(
        `/api/ws/${WSID}/agreement-templates/${existing.templateId}`
      );
      if (checkResp.ok) {
        console.log(`[setup] Template already exists: ${existing.templateName} (${existing.templateId})`);
        return;
      }
      console.log(`[setup] Previous template ${existing.templateId} not found, creating new one`);
    }

    // 2. Create template
    const templateName = `Setup Template ${Date.now()}`;
    const createResp = await workspaceFetch(`/api/ws/${WSID}/agreement-templates`, {
      method: 'POST',
      body: JSON.stringify({
        name: templateName,
        type: 'contract',
        isActive: true,
      }),
    });
    expect(createResp.ok, `Failed to create template: ${createResp.status}`).toBeTruthy();
    const template = await createResp.json();

    // 3. Add 2 signer roles via PATCH
    const updateResp = await workspaceFetch(
      `/api/ws/${WSID}/agreement-templates/${template.id}`,
      {
        method: 'PATCH',
        body: JSON.stringify({
          roles: [
            {
              id: 'role-1',
              name: 'Company Representative',
              routingOrder: 1,
              color: '#3B82F6',
              isInternal: false,
            },
            {
              id: 'role-2',
              name: 'Client',
              routingOrder: 2,
              color: '#EF4444',
              isInternal: false,
            },
          ],
        }),
      }
    );
    expect(updateResp.ok, `Failed to add roles: ${updateResp.status}`).toBeTruthy();

    // 4. Save data for other tests
    writeSetupData({
      templateId: template.id,
      templateName,
      createdAt: new Date().toISOString(),
    });

    console.log(`[setup] Created template: ${templateName} (${template.id}) with 2 roles`);
  });
});
