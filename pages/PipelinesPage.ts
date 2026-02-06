/**
 * Pipelines Page Object
 *
 * Methods for interacting with pipeline settings page.
 */

import { Page, expect, Locator } from '@playwright/test';
import { BasePage } from './BasePage';
import { Selectors } from './selectors';

interface PipelineData {
  code?: string;
  name: string;
  description?: string;
  isDefault?: boolean;
}

interface StageData {
  code?: string;
  name: string;
  probability?: number;
  color?: string;
  isInitial?: boolean;
  isFinal?: boolean;
  isWon?: boolean;
}

export class PipelinesPage extends BasePage {
  readonly S = Selectors.pipelines;

  get path(): string {
    return '/ws/megatest/settings/pipelines';
  }

  // ============================================
  // Pipeline List Operations
  // ============================================

  async openCreateForm(): Promise<void> {
    await this.page.locator(this.S.createButton).click();
    await this.page.locator(this.S.form).waitFor({ state: 'visible' });
  }

  async createPipeline(data: PipelineData): Promise<boolean> {
    await this.openCreateForm();
    await this.fillPipelineForm(data);
    await this.submitPipelineForm();
    return true;
  }

  async fillPipelineForm(data: PipelineData): Promise<void> {
    if (data.code) {
      await this.page.locator(this.S.formInputCode).fill(data.code);
    }
    await this.page.locator(this.S.formInputName).fill(data.name);
    if (data.description) {
      await this.page.locator(this.S.formTextareaDescription).fill(data.description);
    }
  }

  async submitPipelineForm(): Promise<void> {
    await this.page.locator(this.S.formButtonSubmit).click();
    await this.waitForSpinner();
  }

  async cancelPipelineForm(): Promise<void> {
    await this.page.locator(this.S.formButtonCancel).click();
  }

  async shouldSeePipeline(name: string): Promise<void> {
    // Use the link with exact pipeline name to avoid matching code or description
    await expect(this.page.locator(this.S.list).getByRole('link', { name, exact: true })).toBeVisible();
  }

  async shouldNotSeePipeline(name: string): Promise<void> {
    // Use the link with exact pipeline name
    await expect(this.page.locator(this.S.list).getByRole('link', { name, exact: true })).not.toBeVisible({ timeout: 10000 });
  }

  async getPipelineByName(name: string): Promise<Locator> {
    return this.page.locator('tr').filter({ has: this.page.getByRole('link', { name, exact: true }) });
  }

  async editPipelineByName(name: string): Promise<void> {
    const row = await this.getPipelineByName(name);
    await row.locator('button[title="Edit"]').click();
    await this.page.locator(this.S.form).waitFor({ state: 'visible' });
  }

  async deletePipelineByName(name: string): Promise<void> {
    const row = await this.getPipelineByName(name);
    await row.locator('button[title="Delete"]').click();
    await this.confirmDialog();
    // Wait for delete operation to complete
    await this.page.waitForTimeout(1000);
  }

  async openPipelineByName(name: string): Promise<void> {
    await this.page.locator(this.S.list).getByRole('link', { name }).click();
    await this.page.locator(this.S.stagesList).waitFor({ state: 'visible', timeout: 10000 });
  }

  // ============================================
  // Stage Operations
  // ============================================

  async openAddStageForm(): Promise<void> {
    await this.page.locator(this.S.addStageButton).click();
    await this.page.locator(this.S.stageForm).waitFor({ state: 'visible' });
  }

  async createStage(data: StageData): Promise<boolean> {
    await this.openAddStageForm();
    await this.fillStageForm(data, true);
    await this.submitStageForm();
    return true;
  }

  async fillStageForm(data: StageData, isNew = false): Promise<void> {
    if (isNew && data.code) {
      await this.page.locator(this.S.stageFormInputCode).fill(data.code);
    }
    await this.page.locator(this.S.stageFormInputName).fill(data.name);
    if (data.probability !== undefined) {
      await this.page.locator(this.S.stageFormInputProbability).fill(String(data.probability));
    }
  }

  async submitStageForm(): Promise<void> {
    await this.page.locator(this.S.stageFormButtonSubmit).click();
    await this.waitForSpinner();
  }

  async cancelStageForm(): Promise<void> {
    await this.page.locator(this.S.stageFormButtonCancel).click();
  }

  async shouldSeeStage(name: string): Promise<void> {
    // Use exact match for the stage name in the font-medium span
    await expect(this.page.locator(this.S.stagesList).locator('span.font-medium', { hasText: name })).toBeVisible();
  }

  async shouldNotSeeStage(name: string): Promise<void> {
    await expect(this.page.locator(this.S.stagesList).locator('span.font-medium', { hasText: name })).not.toBeVisible({ timeout: 10000 });
  }

  async getStageByName(name: string): Promise<Locator> {
    return this.page.locator('[data-testid^="stage-item-"]').filter({ has: this.page.locator('span.font-medium', { hasText: name }) });
  }

  async editStageByName(name: string): Promise<void> {
    const stageItem = await this.getStageByName(name);
    await stageItem.locator('button[title="Edit"]').click();
    await this.page.locator(this.S.stageForm).waitFor({ state: 'visible' });
  }

  async deleteStageByName(name: string): Promise<void> {
    const stageItem = await this.getStageByName(name);
    await stageItem.locator('button[title="Delete"]').click();
    await this.confirmDialog();
  }

  async renameStage(oldName: string, newName: string): Promise<void> {
    await this.editStageByName(oldName);
    await this.page.locator(this.S.stageFormInputName).fill(newName);
    await this.submitStageForm();
  }

  async getStageNames(): Promise<string[]> {
    const stages = this.page.locator('[data-testid^="stage-item-"]');
    const count = await stages.count();
    const names: string[] = [];
    for (let i = 0; i < count; i++) {
      const text = await stages.nth(i).locator('span.font-medium').first().textContent();
      if (text) names.push(text);
    }
    return names;
  }

  async reorderStage(stageName: string, targetIndex: number): Promise<void> {
    const stageItem = await this.getStageByName(stageName);
    const targetItem = this.page.locator('[data-testid^="stage-item-"]').nth(targetIndex);

    // Get bounding boxes
    const sourceBox = await stageItem.boundingBox();
    const targetBox = await targetItem.boundingBox();

    if (!sourceBox || !targetBox) {
      throw new Error('Could not get bounding boxes for drag and drop');
    }

    // Perform drag
    await this.page.mouse.move(sourceBox.x + sourceBox.width / 2, sourceBox.y + sourceBox.height / 2);
    await this.page.mouse.down();
    await this.page.mouse.move(targetBox.x + targetBox.width / 2, targetBox.y + targetBox.height / 2, { steps: 10 });
    await this.page.mouse.up();

    await this.waitForSpinner();
  }

  // ============================================
  // Navigation
  // ============================================

  async goBackToList(): Promise<void> {
    await this.page.locator(this.S.backToListLink).click();
    await this.page.locator(this.S.list).waitFor({ state: 'visible' });
  }

  async gotoPipeline(pipelineId: string): Promise<void> {
    await this.page.goto(`${this.path}/${pipelineId}`);
    await this.waitForPageLoad();
  }

  // ============================================
  // Assertions
  // ============================================

  async shouldSeeList(): Promise<boolean> {
    return await this.page.locator(this.S.list).isVisible();
  }

  async shouldSeeStagesList(): Promise<boolean> {
    return await this.page.locator(this.S.stagesList).isVisible();
  }

  async shouldSeePipelineForm(): Promise<boolean> {
    return await this.page.locator(this.S.form).isVisible();
  }

  async shouldSeeStageForm(): Promise<boolean> {
    return await this.page.locator(this.S.stageForm).isVisible();
  }

  async shouldSeeFormError(message: string): Promise<void> {
    await expect(this.page.getByText(message)).toBeVisible();
  }

  async getPipelineCount(): Promise<number> {
    return await this.page.locator('tbody tr').count();
  }

  async getStageCount(): Promise<number> {
    return await this.page.locator('[data-testid^="stage-item-"]').count();
  }
}
