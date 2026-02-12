/**
 * Workflow Settings Page Object
 *
 * Settings → Workflow
 * Configure which modules are enabled and how entities are organized.
 */

import { expect } from '@playwright/test';
import { BasePage } from './BasePage';
import { Selectors } from './selectors';
import { WORKSPACE_ID } from '@fixtures/users';

/** All toggleable entities on the Workflow page */
export const WORKFLOW_ENTITIES = [
  'opportunity', 'estimate', 'project', 'job', 'event', 'meeting',
  'expense', 'agreement', 'invoice', 'payment', 'task', 'calendar',
  'telephony', 'product', 'aiAssistant', 'chat', 'marketing', 'knowledgeBase',
] as const;

export type WorkflowEntity = typeof WORKFLOW_ENTITIES[number];

export class WorkflowPage extends BasePage {
  get path() { return `/ws/${WORKSPACE_ID}/settings/workflow`; }
  private get s() { return Selectors.workflow; }

  async waitForPageLoad(): Promise<void> {
    await this.page.locator(this.s.form).waitFor({ state: 'visible', timeout: 15000 });
  }

  // ============================================
  // ENTITY TOGGLE
  // ============================================

  async isEntityEnabled(entity: WorkflowEntity): Promise<boolean> {
    const toggle = this.page.locator(this.s.entityToggle(entity));
    const checkbox = toggle.locator('input[type="checkbox"]');
    return await checkbox.isChecked();
  }

  async toggleEntity(entity: WorkflowEntity): Promise<void> {
    const toggle = this.page.locator(this.s.entityToggle(entity));
    await toggle.click();
    await this.wait(500);
  }

  async enableEntity(entity: WorkflowEntity): Promise<void> {
    if (!(await this.isEntityEnabled(entity))) {
      await this.toggleEntity(entity);
    }
  }

  async disableEntity(entity: WorkflowEntity): Promise<void> {
    if (await this.isEntityEnabled(entity)) {
      await this.toggleEntity(entity);
    }
  }

  // ============================================
  // ENTITY ROW
  // ============================================

  async getEntityRowText(entity: string): Promise<string> {
    const row = this.page.locator(this.s.entityRow(entity));
    return (await row.textContent())?.trim() || '';
  }

  async shouldSeeEntityRow(entity: string): Promise<void> {
    await expect(this.page.locator(this.s.entityRow(entity))).toBeVisible();
  }

  // ============================================
  // STRUCTURE PREVIEW
  // ============================================

  async getStructurePreviewText(): Promise<string> {
    const preview = this.page.locator(this.s.structurePreview).locator('..');
    return (await preview.textContent())?.trim() || '';
  }

  async structurePreviewContains(entityName: string): Promise<boolean> {
    const text = await this.getStructurePreviewText();
    return text.includes(entityName);
  }
}
