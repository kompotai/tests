/**
 * Workflow Settings Tests
 *
 * Settings → Workflow
 *
 * TC-1: Page displays all entities
 * TC-2: Contact entity is always enabled (no toggle)
 * TC-3: Toggle entity ON — Structure Preview updates
 * TC-4: Toggle entity OFF — Structure Preview updates
 * TC-5: Toggle persists after page reload
 */

import { ownerTest, expect } from '@fixtures/auth.fixture';
import { WorkflowPage } from '@pages/WorkflowPage';
import type { WorkflowEntity } from '@pages/WorkflowPage';

ownerTest.describe('Workflow Settings', () => {
  let workflowPage: WorkflowPage;

  ownerTest.beforeEach(async ({ page }) => {
    workflowPage = new WorkflowPage(page);
    await workflowPage.goto();
  });

  ownerTest('TC-1: displays all entities', async () => {
    // Page heading
    await workflowPage.shouldSeeText('Workflow');
    await workflowPage.shouldSeeText('Modules & Entities');
    await workflowPage.shouldSeeText('Structure Preview');

    // All entity rows should be visible
    const entities = [
      'contact', 'opportunity', 'estimate', 'project', 'job',
      'event', 'meeting', 'expense', 'agreement', 'invoice',
      'payment', 'task', 'calendar', 'telephony', 'product',
      'aiAssistant', 'chat', 'marketing', 'knowledgeBase',
    ];

    for (const entity of entities) {
      await workflowPage.shouldSeeEntityRow(entity);
    }
  });

  ownerTest('TC-2: Contact entity is always enabled', async ({ page }) => {
    // Contact row should be visible
    await workflowPage.shouldSeeEntityRow('contact');

    // Contact row should show "Always" text (no toggle)
    const rowText = await workflowPage.getEntityRowText('contact');
    expect(rowText).toContain('Always');

    // Contact row should NOT have a toggle
    const toggle = page.locator('[data-testid="workflow-toggle-contact"]');
    await expect(toggle).not.toBeVisible();
  });

  ownerTest('TC-3: toggle entity ON updates Structure Preview', async () => {
    // Find a disabled entity to toggle
    const entity: WorkflowEntity = 'estimate';
    const wasEnabled = await workflowPage.isEntityEnabled(entity);

    if (wasEnabled) {
      // If already enabled, disable first
      await workflowPage.disableEntity(entity);
    }

    // Verify NOT in preview
    expect(await workflowPage.structurePreviewContains('Estimate')).toBe(false);

    // Enable
    await workflowPage.enableEntity(entity);

    // Verify appears in preview
    expect(await workflowPage.structurePreviewContains('Estimate')).toBe(true);

    // Restore
    if (!wasEnabled) {
      await workflowPage.disableEntity(entity);
    }
  });

  ownerTest('TC-4: toggle entity OFF updates Structure Preview', async () => {
    // Find an enabled entity to toggle
    const entity: WorkflowEntity = 'opportunity';
    const wasEnabled = await workflowPage.isEntityEnabled(entity);

    if (!wasEnabled) {
      await workflowPage.enableEntity(entity);
    }

    // Verify in preview
    expect(await workflowPage.structurePreviewContains('Opportunity')).toBe(true);

    // Disable
    await workflowPage.disableEntity(entity);

    // Verify removed from preview
    expect(await workflowPage.structurePreviewContains('Opportunity')).toBe(false);

    // Restore
    if (wasEnabled) {
      await workflowPage.enableEntity(entity);
    }
  });

  ownerTest('TC-5: toggle persists after page reload', async ({ page }) => {
    const entity: WorkflowEntity = 'estimate';
    const originalState = await workflowPage.isEntityEnabled(entity);

    // Toggle
    await workflowPage.toggleEntity(entity);
    const newState = !originalState;
    expect(await workflowPage.isEntityEnabled(entity)).toBe(newState);

    // Reload
    await page.reload();
    await workflowPage.waitForPageLoad();

    // Verify persisted
    expect(await workflowPage.isEntityEnabled(entity)).toBe(newState);

    // Restore
    if (await workflowPage.isEntityEnabled(entity) !== originalState) {
      await workflowPage.toggleEntity(entity);
    }
  });
});
